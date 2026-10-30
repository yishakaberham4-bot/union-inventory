-- Run once in Supabase SQL Editor
create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  staff_id text not null,
  credential_id text not null unique,
  public_key text,
  device_name text,
  created_at timestamptz not null default now()
);

create index if not exists webauthn_staff_id_idx on public.webauthn_credentials (staff_id);
create index if not exists webauthn_user_id_idx on public.webauthn_credentials (user_id);
