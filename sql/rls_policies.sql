begin;

-- 1) Función is_admin basada en JWT user_metadata.role
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN', false)
$$;

-- 2) Columnas necesarias
alter table public.companies add column if not exists suspended boolean default false;
alter table public.jobs add column if not exists is_active boolean default true;

-- 3) Habilitar RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.cvs enable row level security;

-- 4) Limpiar policies existentes (evita 500 por expresiones inválidas)
do $$
declare r record;
begin
  for r in (select policyname from pg_policies where schemaname='public' and tablename='profiles') loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;

  for r in (select policyname from pg_policies where schemaname='public' and tablename='companies') loop
    execute format('drop policy %I on public.companies', r.policyname);
  end loop;

  for r in (select policyname from pg_policies where schemaname='public' and tablename='jobs') loop
    execute format('drop policy %I on public.jobs', r.policyname);
  end loop;

  for r in (select policyname from pg_policies where schemaname='public' and tablename='applications') loop
    execute format('drop policy %I on public.applications', r.policyname);
  end loop;

  for r in (select policyname from pg_policies where schemaname='public' and tablename='cvs') loop
    execute format('drop policy %I on public.cvs', r.policyname);
  end loop;
end$$;

-- 5) Profiles
create policy profiles_select_self on public.profiles
for select to authenticated
using (id = auth.uid());

create policy profiles_select_admin on public.profiles
for select to authenticated
using (is_admin());

create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
for update to authenticated
using (is_admin())
with check (is_admin());

create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (is_admin());

-- 6) Companies
create policy companies_select_public on public.companies
for select to anon
using (coalesce(suspended, false) = false);

create policy companies_select_owner on public.companies
for select to authenticated
using (owner_id = auth.uid());

create policy companies_select_admin on public.companies
for select to authenticated
using (is_admin());

create policy companies_insert_owner on public.companies
for insert to authenticated
with check (owner_id = auth.uid());

create policy companies_update_owner_admin on public.companies
for update to authenticated
using (owner_id = auth.uid() or is_admin())
with check (owner_id = auth.uid() or is_admin());

create policy companies_delete_owner_admin on public.companies
for delete to authenticated
using (owner_id = auth.uid() or is_admin());

-- 7) Jobs
create policy jobs_select_public_active on public.jobs
for select to anon
using (coalesce(is_active, true));

create policy jobs_select_owner on public.jobs
for select to authenticated
using (exists (
  select 1 from public.companies c
  where c.id = public.jobs.company_id
    and c.owner_id = auth.uid()
));

create policy jobs_select_admin on public.jobs
for select to authenticated
using (is_admin());

create policy jobs_insert_owner on public.jobs
for insert to authenticated
with check (exists (
  select 1 from public.companies c
  where c.id = public.jobs.company_id
    and c.owner_id = auth.uid()
));

create policy jobs_update_owner_admin on public.jobs
for update to authenticated
using (exists (
  select 1 from public.companies c
  where c.id = public.jobs.company_id
    and c.owner_id = auth.uid()
) or is_admin())
with check (exists (
  select 1 from public.companies c
  where c.id = public.jobs.company_id
    and c.owner_id = auth.uid()
) or is_admin());

create policy jobs_delete_owner_admin on public.jobs
for delete to authenticated
using (exists (
  select 1 from public.companies c
  where c.id = public.jobs.company_id
    and c.owner_id = auth.uid()
) or is_admin());

-- 8) Applications
create policy applications_select_student on public.applications
for select to authenticated
using (student_id = auth.uid());

create policy applications_select_company_owner on public.applications
for select to authenticated
using (exists (
  select 1
  from public.jobs j
  join public.companies c on c.id = j.company_id
  where j.id = public.applications.job_id
    and c.owner_id = auth.uid()
));

create policy applications_select_admin on public.applications
for select to authenticated
using (is_admin());

create policy applications_insert_student on public.applications
for insert to authenticated
with check (student_id = auth.uid());

create policy applications_update_owner_company_admin on public.applications
for update to authenticated
using (
  (student_id = auth.uid())
  or exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = public.applications.job_id
      and c.owner_id = auth.uid()
  )
  or is_admin()
)
with check (
  (student_id = auth.uid())
  or exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = public.applications.job_id
      and c.owner_id = auth.uid()
  )
  or is_admin()
);

create policy applications_delete_owner_company_admin on public.applications
for delete to authenticated
using (
  (student_id = auth.uid())
  or exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = public.applications.job_id
      and c.owner_id = auth.uid()
  )
  or is_admin()
);

-- 9) CVs
create policy cvs_select_owner_admin on public.cvs
for select to authenticated
using (owner_id = auth.uid() or is_admin());

create policy cvs_insert_owner on public.cvs
for insert to authenticated
with check (owner_id = auth.uid());

create policy cvs_update_owner_admin on public.cvs
for update to authenticated
using (owner_id = auth.uid() or is_admin())
with check (owner_id = auth.uid() or is_admin());

create policy cvs_delete_owner_admin on public.cvs
for delete to authenticated
using (owner_id = auth.uid() or is_admin());

commit;