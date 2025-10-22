-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.cvs enable row level security;

-- PROFILES
-- Users can select and update ONLY their own profile
create policy profiles_select_own on public.profiles
for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

-- COMPANIES
-- Everyone can read companies (public catalog)
create policy companies_select_public on public.companies
for select using (
  (suspended = false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

-- Only COMPANY/ADMIN can create companies; owner_id must be self (or admin bypass)
create policy companies_insert_owner on public.companies
for insert with check (
  (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('COMPANY','ADMIN')))
  and (owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN'))
);

-- Owner (or admin) can update/delete their own company
create policy companies_update_owner on public.companies
for update using (
  owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
)
with check (
  owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

create policy companies_delete_owner on public.companies
for delete using (
  owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

-- JOBS
-- Public read of jobs (jobs board)
create policy jobs_select_public on public.jobs
for select using (
  (
    jobs.is_active = true and exists (
      select 1 from public.companies c where c.id = jobs.company_id and c.suspended = false
    )
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

-- Only the company owner can insert jobs for their company
create policy jobs_insert_company_owner on public.jobs
for insert with check (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = auth.uid()
  )
);

-- Company owner can update/delete their own jobs
create policy jobs_update_company_owner on public.jobs
for update using (
  exists (
    select 1 from public.companies c
    where c.id = jobs.company_id and c.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.companies c
    where c.id = jobs.company_id and c.owner_id = auth.uid()
  )
);

create policy jobs_delete_company_owner on public.jobs
for delete using (
  exists (
    select 1 from public.companies c
    where c.id = jobs.company_id and c.owner_id = auth.uid()
  )
);

-- APPLICATIONS
-- Students can see/insert their own applications
create policy apps_select_own on public.applications
for select using (auth.uid() = student_id);

create policy apps_insert_own on public.applications
for insert with check (auth.uid() = student_id);

-- Company owners can see and update applications for their jobs
create policy apps_select_company on public.applications
for select using (
  exists (
    select 1 from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = applications.job_id and c.owner_id = auth.uid()
  )
);

create policy apps_update_company on public.applications
for update using (
  exists (
    select 1 from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = applications.job_id and c.owner_id = auth.uid()
  )
)
with check (true);

-- CVS
-- Only owner can read/write/delete their CV
create policy cvs_select_own on public.cvs
for select using (auth.uid() = owner_id);

create policy cvs_insert_own on public.cvs
for insert with check (auth.uid() = owner_id);

create policy cvs_update_own on public.cvs
for update using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy cvs_delete_own on public.cvs
for delete using (auth.uid() = owner_id);

-- ADMIN: full read/update access where appropriate
-- Allow ADMIN to select and update any profile
create policy profiles_select_admin on public.profiles
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

create policy profiles_update_admin on public.profiles
for update to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

-- Allow ADMIN to read any CV
create policy cvs_select_admin on public.cvs
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);

-- Allow ADMIN to select and update any application
create policy apps_select_admin on public.applications
for select to authenticated
using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

create policy apps_update_admin on public.applications
for update to authenticated
using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (true);

-- ADMIN LOGS
alter table public.admin_logs enable row level security;
create policy admin_logs_select_admin on public.admin_logs
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);
create policy admin_logs_insert_admin on public.admin_logs
for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN')
);