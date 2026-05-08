-- Bucket privado para fotos de importación
insert into storage.buckets (id, name, public)
values ('agenda-imports', 'agenda-imports', false)
on conflict (id) do nothing;

-- RLS policies en storage.objects para el bucket agenda-imports
create policy "Tenant admins can upload import photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'agenda-imports'
    and exists (
      select 1 from public.tenant_admins ta
      where ta.user_id = auth.uid()
        and ta.tenant_id::text = (storage.foldername(name))[1]
    )
  );

create policy "Tenant admins can read their import photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'agenda-imports'
    and exists (
      select 1 from public.tenant_admins ta
      where ta.user_id = auth.uid()
        and ta.tenant_id::text = (storage.foldername(name))[1]
    )
  );

create policy "Tenant admins can delete their import photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'agenda-imports'
    and exists (
      select 1 from public.tenant_admins ta
      where ta.user_id = auth.uid()
        and ta.tenant_id::text = (storage.foldername(name))[1]
    )
  );

-- Tabla de auditoría
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  mode text not null check (mode in ('bookings','services')),
  image_count int not null default 0,
  rows_extracted int not null default 0,
  rows_committed int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_import_jobs_tenant on public.import_jobs(tenant_id, created_at desc);

alter table public.import_jobs enable row level security;

create policy "Tenant admins can view their import jobs"
  on public.import_jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.tenant_admins ta
      where ta.user_id = auth.uid() and ta.tenant_id = import_jobs.tenant_id
    )
    or public.is_superadmin()
  );

create policy "Tenant admins can create import jobs"
  on public.import_jobs for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tenant_admins ta
      where ta.user_id = auth.uid() and ta.tenant_id = import_jobs.tenant_id
    )
  );