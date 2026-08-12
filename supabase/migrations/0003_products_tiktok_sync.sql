-- Adds marketplace-sync metadata to products, enabling idempotent upserts
-- from TikTok (and later Shopee/Tokopedia) product sync.

alter table public.products
  add column source text not null default 'manual'
    check (source in ('manual', 'tiktok_sync', 'shopee_sync', 'tokopedia_sync')),
  add column platform_product_id text,
  add column marketplace_connection_id uuid references public.marketplace_connections(id) on delete set null,
  add column last_synced_at timestamptz;

-- Plain (non-partial) unique constraint: NULL is distinct-from-NULL under a
-- standard unique constraint, so manual products (both columns NULL) never
-- collide with each other. Only two syncs of the same TikTok product collide
-- — exactly the idempotency behavior the sync upsert needs. Must stay
-- non-partial: supabase-js's `.upsert(rows, { onConflict: "col1,col2,col3" })`
-- emits a plain `ON CONFLICT (...)` with no WHERE clause, which only a
-- non-partial unique constraint/index can serve as arbiter for.
alter table public.products
  add constraint products_platform_product_unique
  unique (user_id, marketplace_connection_id, platform_product_id);

create index products_marketplace_connection_id_idx
  on public.products(marketplace_connection_id);
