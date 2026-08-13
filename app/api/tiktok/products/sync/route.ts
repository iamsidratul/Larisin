import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTikTokProducts } from "@/lib/tiktok";
import { decryptToken } from "@/lib/crypto";

const MAX_PRODUCTS = 1000;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("marketplace_connections")
    .select("id, shop_cipher, access_token, status")
    .eq("user_id", user.id)
    .eq("platform", "tiktokshop")
    .maybeSingle();

  if (!connection || connection.status !== "connected") {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }
  if (!connection.shop_cipher || !connection.access_token) {
    return NextResponse.json({ error: "missing_shop_data" }, { status: 400 });
  }

  type FetchedProduct = Awaited<ReturnType<typeof fetchTikTokProducts>>["products"][number];
  const allProducts: FetchedProduct[] = [];

  try {
    const accessToken = decryptToken(connection.access_token);
    let pageToken: string | undefined;
    do {
      const { products, nextPageToken } = await fetchTikTokProducts(
        accessToken,
        connection.shop_cipher,
        100,
        pageToken,
      );
      allProducts.push(...products);
      pageToken = nextPageToken ?? undefined;
    } while (pageToken && allProducts.length < MAX_PRODUCTS);
  } catch (err) {
    return NextResponse.json(
      { error: "tiktok_api_failed", message: (err as Error).message },
      { status: 502 },
    );
  }

  if (allProducts.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const nowIso = new Date().toISOString();
  const rows = allProducts.map((p) => ({
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

  if (error) {
    return NextResponse.json(
      { error: "db_upsert_failed", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ synced: rows.length });
}
