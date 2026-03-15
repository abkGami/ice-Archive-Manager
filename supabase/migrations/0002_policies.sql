alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

-- Basic policy templates for hybrid architecture.
-- Keep permissive policies only if all data access is through trusted server-side service-role operations.
drop policy if exists users_service_role_select on public.users;
create policy users_service_role_select on public.users
for select using (auth.role() = 'service_role');

drop policy if exists users_service_role_write on public.users;
create policy users_service_role_write on public.users
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists documents_service_role_all on public.documents;
create policy documents_service_role_all on public.documents
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists audit_logs_service_role_all on public.audit_logs;
create policy audit_logs_service_role_all on public.audit_logs
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public)
values ('id-card-images', 'id-card-images', false)
on conflict (id) do nothing;

drop policy if exists id_cards_service_role_upload on storage.objects;
create policy id_cards_service_role_upload on storage.objects
for insert to authenticated
with check (bucket_id = 'id-card-images');

drop policy if exists id_cards_service_role_select on storage.objects;
create policy id_cards_service_role_select on storage.objects
for select to authenticated
using (bucket_id = 'id-card-images');
