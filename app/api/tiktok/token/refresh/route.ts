import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshTikTokToken } from "@/lib/tiktok";
import { decryptToken, encryptToken } from "@/lib/crypto";

// Cron runs at most daily (Vercel Hobby plan limit), so tokens are refreshed
// well before expiry rather than right before — buffer covers the gap.
const REFRESH_BUFFER_MS = 48 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const threshold = new Date(Date.now() + REFRESH_BUFFER_MS).toISOString();

  const { data: connections, error } = await supabase
    .from("marketplace_connections")
    .select("id, refresh_token")
    .eq("platform", "tiktokshop")
    .eq("status", "connected")
    .lte("token_expires_at", threshold);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let refreshed = 0;
  let failed = 0;

  for (const connection of connections ?? []) {
    if (!connection.refresh_token) {
      failed++;
      continue;
    }

    try {
      const tokenData = await refreshTikTokToken(decryptToken(connection.refresh_token));
      await supabase
        .from("marketplace_connections")
        .update({
          access_token: encryptToken(tokenData.access_token),
          refresh_token: encryptToken(tokenData.refresh_token),
          token_expires_at: new Date(
            Date.now() + tokenData.access_token_expire_in * 1000,
          ).toISOString(),
          status: "connected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);
      refreshed++;
    } catch {
      await supabase
        .from("marketplace_connections")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", connection.id);
      failed++;
    }
  }

  return NextResponse.json({ checked: connections?.length ?? 0, refreshed, failed });
}
