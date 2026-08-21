import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTikTokProducts } from "@/lib/tiktok";
import { decryptToken } from "@/lib/crypto";

const MAX_PRODUCTS_PER_SHOP = 1000;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: connections } = await supabase
    .from("marketplace_connections")
    .select("id, shop_cipher, access_token, status")
    .eq("user_id", user.id)
    .eq("platform", "tiktokshop")
    .eq("status", "connected");

  const usable = (connections ?? []).filter((c) => c.shop_cipher && c.access_token);

  if (usable.length === 0) {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }

  let synced = 0;
  let failedShops = 0;

  for (const connection of usable) {
    type FetchedProduct = Awaited<ReturnType<typeof fetchTikTokProducts>>["products"][number];
    const shopProducts: FetchedProduct[] = [];

    try {
      const accessToken = decryptToken(connection.access_token!);
      let pageToken: string | undefined;
      do {
        const { products, nextPageToken } = await fetchTikTokProducts(
          accessToken,
          connection.shop_cipher!,
          100,
          pageToken,
        );
        shopProducts.push(...products);
        pageToken = nextPageToken ?? undefined;
      } while (pageToken && shopProducts.length < MAX_PRODUCTS_PER_SHOP);
    } catch {
      failedShops++;
      continue;
    }

    if (shopProducts.length === 0) continue;

    const nowIso = new Date().toISOString();
    const rows = shopProducts.map((p) => ({
      user_id: user.id,
      nama: p.title,
      sku: p.skus[0]?.seller_sku ?? null,
      stok: p.skus.reduce((sum, sku) => sum + (sku.inventory?.[0]?.quantity ?? 0), 0),
      source: "tiktok_sync" as const,
      platform_product_id: p.id,
      marketplace_connection_id: connection.id,
      last_synced_at: nowIso,
    }));

    const { error } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "user_id,marketplace_connection_id,platform_product_id" });

    if (!error) synced += rows.length;
  }

  return NextResponse.json({ synced, failedShops, shops: usable.length });
}
