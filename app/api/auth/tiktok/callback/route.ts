import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeTikTokAuthCode, fetchAuthorizedShops } from "@/lib/tiktok";
import { encryptToken } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/dashboard/settings", request.url);

  function fail(reason: string) {
    settingsUrl.searchParams.set("tiktok_error", reason);
    const response = NextResponse.redirect(settingsUrl);
    response.cookies.delete("tiktok_oauth_state");
    return response;
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("tiktok_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("state_mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fail("unauthenticated");
  }

  let tokenData;
  try {
    tokenData = await exchangeTikTokAuthCode(code);
  } catch {
    return fail("token_exchange_failed");
  }

  let shopId: string | null = null;
  let shopCipher: string | null = null;
  try {
    const shops = await fetchAuthorizedShops(tokenData.access_token);
    if (shops[0]) {
      shopId = shops[0].id;
      shopCipher = shops[0].cipher;
    }
  } catch {
    // Koneksi tetap disimpan tanpa shop_id/shop_cipher; product/promotion sync
    // (langkah berikutnya) akan butuh ini dan bisa coba ambil ulang saat itu.
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("marketplace_connections").upsert(
    {
      user_id: user.id,
      platform: "tiktokshop",
      shop_id: shopId,
      shop_cipher: shopCipher,
      access_token: encryptToken(tokenData.access_token),
      refresh_token: encryptToken(tokenData.refresh_token),
      token_expires_at: new Date(
        Date.now() + tokenData.access_token_expire_in * 1000,
      ).toISOString(),
      scope: tokenData.scope ?? null,
      status: "connected",
      connected_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id,platform" },
  );

  if (error) {
    return fail("save_failed");
  }

  settingsUrl.searchParams.set("tiktok_connected", "1");
  const response = NextResponse.redirect(settingsUrl);
  response.cookies.delete("tiktok_oauth_state");
  return response;
}
