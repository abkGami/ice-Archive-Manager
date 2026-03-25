-- Optimize case-insensitive unique_id lookups
-- This index improves performance for ILIKE queries on unique_id

-- Drop old index if exists
drop index if exists idx_users_unique_id;

-- Create case-insensitive index using LOWER()
create index if not exists idx_users_unique_id_lower on public.users (lower(unique_id));

-- This index will be used automatically when querying with ILIKE or lower(unique_id)
