create table if not exists public.users (
  id serial primary key,
  auth_user_id uuid unique,
  unique_id text not null unique,
  password text not null default 'SUPABASE_AUTH',
  name text not null,
  role text not null check (role in ('Administrator', 'Lecturer', 'Student')),
  department text not null,
  level text,
  id_card_image text,
  status text not null default 'Active',
  created_at timestamptz default now()
);

create table if not exists public.documents (
  id serial primary key,
  title text not null,
  category text not null,
  uploaded_by integer not null references public.users(id),
  uploaded_by_name text not null,
  date timestamptz default now(),
  file_type text not null,
  size text not null,
  status text not null,
  description text
);

create table if not exists public.audit_logs (
  id serial primary key,
  user_id integer not null references public.users(id),
  user_name text not null,
  action text not null,
  document_id integer,
  document_title text,
  ip_address text,
  date timestamptz default now()
);

create index if not exists idx_users_unique_id on public.users (unique_id);
create index if not exists idx_users_auth_user_id on public.users (auth_user_id);
create index if not exists idx_documents_status on public.documents (status);
create index if not exists idx_audit_logs_date on public.audit_logs (date desc);
