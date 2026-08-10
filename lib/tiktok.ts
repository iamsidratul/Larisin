import { createHmac } from "crypto";

const AUTH_BASE = "https://auth.tiktok-shops.com";
const API_BASE = "https://open-api.tiktokglobalshop.com";

export function getTikTokAuthorizationUrl(state: string): string {
  const url = new URL("/api/v2/authorization", AUTH_BASE);
  url.searchParams.set("app_key", process.env.TIKTOK_APP_KEY!);
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", process.env.TIKTOK_REDIRECT_URI!);
  return url.toString();
}

interface TikTokTokenData {
  access_token: string;
  access_token_expire_in: number;
  refresh_token: string;
  refresh_token_expire_in: number;
  open_id: string;
  scope?: string;
}

interface TikTokTokenResponse {
  code: number;
  message: string;
  data: TikTokTokenData;
}

export async function exchangeTikTokAuthCode(code: string): Promise<TikTokTokenData> {
  const url = new URL("/api/v2/token/get", AUTH_BASE);
  url.searchParams.set("app_key", process.env.TIKTOK_APP_KEY!);
  url.searchParams.set("app_secret", process.env.TIKTOK_APP_SECRET!);
  url.searchParams.set("auth_code", code);
  url.searchParams.set("grant_type", "authorized_code");

  const res = await fetch(url.toString(), { method: "GET" });
  const json = (await res.json()) as TikTokTokenResponse;

  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || "Gagal menukar authorization code ke access token.");
  }

  return json.data;
}

interface TikTokRefreshResponse {
  code: number;
  message: string;
  data: TikTokTokenData;
}

export async function refreshTikTokToken(refreshToken: string): Promise<TikTokTokenData> {
  const url = new URL("/api/v2/token/refresh", AUTH_BASE);
  url.searchParams.set("app_key", process.env.TIKTOK_APP_KEY!);
  url.searchParams.set("app_secret", process.env.TIKTOK_APP_SECRET!);
  url.searchParams.set("refresh_token", refreshToken);
  url.searchParams.set("grant_type", "refresh_token");

  const res = await fetch(url.toString(), { method: "GET" });
  const json = (await res.json()) as TikTokRefreshResponse;

  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || "Gagal refresh access token.");
  }

  return json.data;
}

// TikTok Shop menandatangani tiap request API (selain endpoint token) dengan
// HMAC-SHA256: key & pesan sama-sama app_secret, dibungkus di kedua ujung path+params.
function signTikTokRequest(path: string, params: Record<string, string>): string {
  const appSecret = process.env.TIKTOK_APP_SECRET!;
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  const base = `${appSecret}${path}${paramString}${appSecret}`;
  return createHmac("sha256", appSecret).update(base).digest("hex");
}

interface TikTokShop {
  id: string;
  cipher: string;
  code: string;
  name: string;
}

interface TikTokShopsResponse {
  code: number;
  message: string;
  data: { shops: TikTokShop[] };
}

export async function fetchAuthorizedShops(accessToken: string): Promise<TikTokShop[]> {
  const path = "/authorization/202309/shops";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { app_key: process.env.TIKTOK_APP_KEY!, timestamp };
  const sign = signTikTokRequest(path, params);

  const url = new URL(path, API_BASE);
  url.searchParams.set("app_key", params.app_key);
  url.searchParams.set("timestamp", timestamp);
  url.searchParams.set("sign", sign);

  const res = await fetch(url.toString(), {
    headers: { "x-tts-access-token": accessToken, "content-type": "application/json" },
  });
  const json = (await res.json()) as TikTokShopsResponse;

  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || "Gagal mengambil daftar toko yang terhubung.");
  }

  return json.data.shops;
}
