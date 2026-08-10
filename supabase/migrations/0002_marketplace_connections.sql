-- marketplace_connections: OAuth koneksi per seller per platform.
-- Generic dari awal: TikTok Shop dulu, Shopee/Tokopedia nanti tinggal baris platform baru.

create table public.marketplace_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('tiktokshop', 'shopee', 'tokopedia')),
  shop_id text,
  shop_cipher text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked')),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.marketplace_connections enable row level security;

create policy "marketplace_connections_select_own" on public.marketplace_connections
  for select using (auth.uid() = user_id);
create policy "marketplace_connections_insert_own" on public.marketplace_connections
  for insert with check (auth.uid() = user_id);
create policy "marketplace_connections_update_own" on public.marketplace_connections
  for update using (auth.uid() = user_id);
create policy "marketplace_connections_delete_own" on public.marketplace_connections
  for delete using (auth.uid() = user_id);

create index marketplace_connections_user_id_idx on public.marketplace_connections(user_id);
