import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTikTokPromotions } from "@/lib/tiktok";
import { decryptToken } from "@/lib/crypto";

const MAX_PROMOTIONS_PER_SHOP = 1000;

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

  const now = Date.now();
  let synced = 0;
  let failedShops = 0;

  for (const connection of usable) {
    type FetchedPromotion = Awaited<ReturnType<typeof fetchTikTokPromotions>>["promotions"][number];
    const shopPromotions: FetchedPromotion[] = [];

    try {
      const accessToken = decryptToken(connection.access_token!);
      let pageToken: string | undefined;
      do {
        const { promotions, nextPageToken } = await fetchTikTokPromotions(
          accessToken,
          connection.shop_cipher!,
          100,
          pageToken,
        );
        shopPromotions.push(...promotions);
        pageToken = nextPageToken ?? undefined;
      } while (pageToken && shopPromotions.length < MAX_PROMOTIONS_PER_SHOP);
    } catch {
      failedShops++;
      continue;
    }

    // Only ongoing/upcoming campaigns are worth showing — a seller can't act
    // on one that's already over, and TikTok returns large volumes of
    // expired flash-sale style activities that would otherwise flood the list.
    const activePromotions = shopPromotions.filter((p) => p.end_time * 1000 >= now);

    // Clean up previously-synced campaigns for this shop that have since
    // ended, so a re-sync always reflects current reality rather than
    // accumulating stale rows indefinitely.
    await supabase
      .from("events")
      .delete()
      .eq("user_id", user.id)
      .eq("marketplace_connection_id", connection.id)
      .lt("selesai", new Date(now).toISOString());

    if (activePromotions.length === 0) continue;

    const nowIso = new Date(now).toISOString();
    const rows = activePromotions.map((p) => ({
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

    if (!error) synced += rows.length;
  }

  return NextResponse.json({ synced, failedShops, shops: usable.length });
}
