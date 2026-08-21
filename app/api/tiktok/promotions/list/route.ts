import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTikTokPromotions } from "@/lib/tiktok";
import { decryptToken } from "@/lib/crypto";

const MAX_PROMOTIONS = 1000;

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

  type FetchedPromotion = Awaited<ReturnType<typeof fetchTikTokPromotions>>["promotions"][number];
  const allPromotions: FetchedPromotion[] = [];

  try {
    const accessToken = decryptToken(connection.access_token);
    let pageToken: string | undefined;
    do {
      const { promotions, nextPageToken } = await fetchTikTokPromotions(
        accessToken,
        connection.shop_cipher,
        100,
        pageToken,
      );
      allPromotions.push(...promotions);
      pageToken = nextPageToken ?? undefined;
    } while (pageToken && allPromotions.length < MAX_PROMOTIONS);
  } catch (err) {
    return NextResponse.json(
      { error: "tiktok_api_failed", message: (err as Error).message },
      { status: 502 },
    );
  }

  if (allPromotions.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const nowIso = new Date().toISOString();
  const rows = allPromotions.map((p) => ({
    user_id: user.id,
    platform: "tiktokshop" as const,
    nama: p.title,
    deskripsi: p.promotion_type ? `Tipe promosi: ${p.promotion_type}` : "",
    mulai: new Date(p.begin_time * 1000).toISOString(),
    selesai: new Date(p.end_time * 1000).toISOString(),
    syarat: "",
    link: "#",
    butuh_diskon: false,
    butuh_foto: false,
    source: "tiktok_api" as const,
    external_campaign_id: p.id,
    marketplace_connection_id: connection.id,
    last_synced_at: nowIso,
  }));

  const { error } = await supabase
    .from("events")
    .upsert(rows, { onConflict: "user_id,marketplace_connection_id,external_campaign_id" });

  if (error) {
    return NextResponse.json(
      { error: "db_upsert_failed", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ synced: rows.length });
}
