-- Papan Promo: profiles, products, submissions + RLS
-- Run this once in the Supabase Dashboard SQL editor (or via `supabase db push`).

create extension if not exists pgcrypto;

-- profiles: 1:1 with auth.users, holds app-specific fields only.
-- Email + password are managed entirely by Supabase Auth (auth.users) and are
-- never duplicated here.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  nama_toko text,
  dibuat_pada timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth.users row appears, populated
-- from the metadata passed to supabase.auth.signUp().
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nama, nama_toko)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', ''),
    new.raw_user_meta_data->>'nama_toko'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nama text not null,
  sku text,
  stok integer not null default 0,
  dibuat_pada timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_select_own" on public.products
  for select using (auth.uid() = user_id);
create policy "products_insert_own" on public.products
  for insert with check (auth.uid() = user_id);
create policy "products_update_own" on public.products
  for update using (auth.uid() = user_id);
create policy "products_delete_own" on public.products
  for delete using (auth.uid() = user_id);

create index products_user_id_idx on public.products(user_id);

-- submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null,
  produk_ids uuid[] not null default '{}',
  platform text not null,
  status text not null check (status in ('berhasil', 'pending', 'gagal')),
  diskon_tipe text,
  diskon_nilai text,
  foto_nama text,
  alasan text,
  dibuat_pada timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "submissions_select_own" on public.submissions
  for select using (auth.uid() = user_id);
create policy "submissions_insert_own" on public.submissions
  for insert with check (auth.uid() = user_id);

create index submissions_user_id_idx on public.submissions(user_id);
