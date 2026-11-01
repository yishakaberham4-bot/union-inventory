-- ============================================================
-- WebAuthn / Biometric Login tables
-- Run this once in Supabase SQL Editor
-- ============================================================

-- 1. Credentials table (stores public keys)
create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  device_type text,
  transports text[],
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists idx_webauthn_user_id
  on public.webauthn_credentials(user_id);

create index if not exists idx_webauthn_credential_id
  on public.webauthn_credentials(credential_id);

alter table public.webauthn_credentials enable row level security;

-- 2. Temporary challenges table (for registration & authentication)
create table if not exists public.webauthn_challenges (
  user_id text primary key,          -- can be uuid or temporary key
  challenge text not null,
  created_at timestamptz not null default now()
);

-- Auto-clean old challenges (optional, run occasionally)
-- delete from public.webauthn_challenges where created_at < now() - interval '10 minutes';

-- Note: We use the service_role key for all WebAuthn operations,
-- so no additional RLS policies are required for normal users.
