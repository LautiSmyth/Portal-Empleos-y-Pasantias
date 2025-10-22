-- Enable required extensions
create extension if not exists pgcrypto;

-- PROFILES: mirrors auth.users (id) and stores app roles and profile data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('STUDENT','COMPANY','ADMIN')),
  first_name text,
  last_name text,
  university text,
  profile_image_url text,
  company_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMPANIES: organizations that post jobs
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists companies_owner_idx on public.companies(owner_id);

-- JOBS: listings posted by companies
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  area text not null,
  location text not null,
  experience_min int not null,
  salary_min int,
  salary_max int,
  modality text not null check (modality in ('Remote','Hybrid','On-site')),
  company_id uuid not null references public.companies(id) on delete cascade,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_company_idx on public.jobs(company_id);
create index if not exists jobs_area_idx on public.jobs(area);
create index if not exists jobs_location_idx on public.jobs(location);
create index if not exists jobs_modality_idx on public.jobs(modality);
create index if not exists jobs_experience_idx on public.jobs(experience_min);
create index if not exists jobs_created_idx on public.jobs(created_at);

-- APPLICATIONS: job applications submitted by students
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending','Reviewed','Interview','Rejected','Hired')),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);
create index if not exists applications_student_idx on public.applications(student_id);
create index if not exists applications_job_idx on public.applications(job_id);
create index if not exists applications_status_idx on public.applications(status);

-- CVS: structured CV JSON and optional PDF URL
create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cvs_owner_idx on public.cvs(owner_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

-- Attach updated_at trigger to mutable tables
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_companies
before update on public.companies
for each row execute function public.set_updated_at();

create trigger set_updated_at_jobs
before update on public.jobs
for each row execute function public.set_updated_at();

create trigger set_updated_at_applications
before update on public.applications
for each row execute function public.set_updated_at();

create trigger set_updated_at_cvs
before update on public.cvs
for each row execute function public.set_updated_at();

-- Auto-profile on new user (default role STUDENT)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  meta_role text := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'STUDENT');
  valid_role text := case when meta_role in ('STUDENT','COMPANY','ADMIN') then meta_role else 'STUDENT' end;
  meta_first text := nullif(new.raw_user_meta_data->>'name','');
begin
  insert into public.profiles (id, role, first_name)
  values (new.id, valid_role, meta_first)
  on conflict (id) do nothing;
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Moderación: columnas para ocultar/suspender
alter table public.jobs add column if not exists is_active boolean not null default true;
alter table public.companies add column if not exists suspended boolean not null default false;

-- Auditoría: tabla de logs de administración
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_logs_actor_idx on public.admin_logs(actor_id);
create index if not exists admin_logs_entity_idx on public.admin_logs(entity, entity_id);
create index if not exists admin_logs_created_idx on public.admin_logs(created_at);

-- RPC: actualizar estado de postulaciones con log
create or replace function public.admin_update_application_status(app_id uuid, new_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN') then
    raise exception 'not authorized';
  end if;
  perform 1 from public.applications where id = app_id;
  if not found then raise exception 'application not found'; end if;
  update public.applications set status = new_status where id = app_id;
  insert into public.admin_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'update_status', 'applications', app_id, jsonb_build_object('new_status', new_status));
end; $$;

-- RPC: activar/desactivar job con log
create or replace function public.admin_toggle_job_active(job_id uuid, active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN') then
    raise exception 'not authorized';
  end if;
  perform 1 from public.jobs where id = job_id;
  if not found then raise exception 'job not found'; end if;
  update public.jobs set is_active = active where id = job_id;
  insert into public.admin_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'toggle_active', 'jobs', job_id, jsonb_build_object('active', active));
end; $$;

-- RPC: suspender/rehabilitar empresa con log
create or replace function public.admin_toggle_company_suspended(company_id uuid, suspended boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN') then
    raise exception 'not authorized';
  end if;
  perform 1 from public.companies where id = company_id;
  if not found then raise exception 'company not found'; end if;
  update public.companies set suspended = suspended where id = company_id;
  insert into public.admin_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'toggle_suspended', 'companies', company_id, jsonb_build_object('suspended', suspended));
end; $$;

-- SECURITY TRIGGER: evitar cambios de campos privilegiados en profiles por no-admin
create or replace function public.enforce_admin_profile_guards()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Permitir cambios hechos por Service Role (auth.uid() = null)
  if auth.uid() is null then
    return new;
  end if;
  -- Bloquear cambios de 'role' o 'company_verified' si no es ADMIN
  if (new.role is distinct from old.role)
     or (coalesce(new.company_verified,false) is distinct from coalesce(old.company_verified,false)) then
    if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN') then
      raise exception 'not authorized to change privileged profile fields';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists guard_profile_admin_fields on public.profiles;
create trigger guard_profile_admin_fields
before update on public.profiles
for each row execute function public.enforce_admin_profile_guards();

-- RPC: actualizar perfil con log
create or replace function public.admin_update_profile(user_id uuid, first_name text, university text, role text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN') then
    raise exception 'not authorized';
  end if;
  update public.profiles p
  set first_name = coalesce(first_name, p.first_name),
      university = coalesce(university, p.university),
      role = coalesce(role, p.role)
  where id = user_id;
  if not found then raise exception 'profile not found'; end if;
  insert into public.admin_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'update_profile', 'profiles', user_id, jsonb_build_object('first_name', first_name, 'university', university, 'role', role));
end; $$;