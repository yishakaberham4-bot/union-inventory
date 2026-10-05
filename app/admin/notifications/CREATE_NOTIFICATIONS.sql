-- Run once in Supabase SQL Editor to enable admin notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null default '',
  entity_id text,
  entity_name text,
  actor text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create index if not exists notifications_is_read_idx
  on public.notifications (is_read);

-- Optional: allow service role full access (usually already true)
-- alter table public.notifications enable row level security;
