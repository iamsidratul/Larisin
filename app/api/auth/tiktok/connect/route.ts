import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTikTokAuthorizationUrl } from "@/lib/tiktok";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!process.env.TIKTOK_APP_KEY || !process.env.TIKTOK_REDIRECT_URI) {
    const settingsUrl = new URL("/dashboard/settings", request.url);
    settingsUrl.searchParams.set("tiktok_error", "config_missing");
    return NextResponse.redirect(settingsUrl);
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(getTikTokAuthorizationUrl(state));
  response.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
