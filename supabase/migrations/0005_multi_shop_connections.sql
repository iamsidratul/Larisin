-- Allow a seller to connect more than one shop per platform (e.g. two TikTok
-- Shop accounts). Previously unique on (user_id, platform), which meant
-- reconnecting a different shop silently overwrote the first one.

alter table public.marketplace_connections
  drop constraint marketplace_connections_user_id_platform_key;

alter table public.marketplace_connections
  add column shop_code text,
  add column shop_name text;

alter table public.marketplace_connections
  add constraint marketplace_connections_user_platform_shop_key
  unique (user_id, platform, shop_id);
