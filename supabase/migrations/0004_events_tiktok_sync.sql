-- events: sebelumnya cuma data statis di kode (lib/data/events.ts). Tabel ini
-- nampung campaign/promo yang ditarik otomatis dari TikTok Shop Promotion
-- API per seller — beda dari event Shopee/Tokopedia yang masih manual_curated
-- statis buat sekarang.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('shopee', 'tokopedia', 'tiktokshop')),
  nama text not null,
  deskripsi text not null default '',
  mulai timestamptz not null,
  selesai timestamptz not null,
  syarat text not null default '',
  link text not null default '#',
  butuh_diskon boolean not null default false,
  butuh_foto boolean not null default false,
  source text not null default 'tiktok_api' check (source in ('manual_curated', 'tiktok_api')),
  external_campaign_id text,
  marketplace_connection_id uuid references public.marketplace_connections(id) on delete set null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, marketplace_connection_id, external_campaign_id)
);

alter table public.events enable row level security;

create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);
create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id);
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);

create index events_user_id_idx on public.events(user_id);
