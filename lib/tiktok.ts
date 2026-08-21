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
// HMAC-SHA256: key & pesan sama-sama app_secret, dibungkus di kedua ujung
// path+params. Untuk request dengan body JSON (POST), body-nya ikut masuk
// ke tengah sebelum app_secret penutup — tanpa ini TikTok balikin "invalid
// sign" walau params & path-nya udah benar.
function signTikTokRequest(path: string, params: Record<string, string>, bodyStr = ""): string {
  const appSecret = process.env.TIKTOK_APP_SECRET!;
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  const base = `${appSecret}${path}${paramString}${bodyStr}${appSecret}`;
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

interface TikTokProductSku {
  id: string;
  seller_sku: string;
  inventory: Array<{ warehouse_id: string; quantity: number }>;
}

interface TikTokProduct {
  id: string;
  title: string;
  status: string;
  skus: TikTokProductSku[];
}

interface TikTokProductSearchResponse {
  code: number;
  message: string;
  data: {
    products: TikTokProduct[];
    next_page_token?: string;
    total_count?: number;
  };
}

export async function fetchTikTokProducts(
  accessToken: string,
  shopCipher: string,
  pageSize = 100,
  pageToken?: string,
): Promise<{ products: TikTokProduct[]; nextPageToken: string | null }> {
  const path = "/product/202309/products/search";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    app_key: process.env.TIKTOK_APP_KEY!,
    shop_cipher: shopCipher,
    timestamp,
    page_size: String(pageSize),
    ...(pageToken ? { page_token: pageToken } : {}),
  };
  const bodyStr = JSON.stringify({});
  const sign = signTikTokRequest(path, params, bodyStr);

  const url = new URL(path, API_BASE);
  Object.entries({ ...params, sign }).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "x-tts-access-token": accessToken, "content-type": "application/json" },
    body: bodyStr,
  });
  const json = (await res.json()) as TikTokProductSearchResponse;

  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || "Gagal mengambil daftar produk dari TikTok Shop.");
  }

  return {
    products: json.data.products ?? [],
    nextPageToken: json.data.next_page_token || null,
  };
}

interface TikTokPromotion {
  id: string;
  title: string;
  status: string;
  begin_time: number;
  end_time: number;
  promotion_type?: string;
}

interface TikTokPromotionSearchResponse {
  code: number;
  message: string;
  data: {
    activities: TikTokPromotion[];
    next_page_token?: string;
    total_count?: number;
  };
}

// Confirmed via Partner Center's API Testing Tool: "Search Promotion
// Activities" — note it's /activities/search, not /promotions/search, and
// the response key is "activities". Field names inside each activity
// (title, begin_time, end_time, etc.) are still a best-effort guess and may
// need adjusting once tested against a real response.
export async function fetchTikTokPromotions(
  accessToken: string,
  shopCipher: string,
  pageSize = 100,
  pageToken?: string,
): Promise<{ promotions: TikTokPromotion[]; nextPageToken: string | null }> {
  const path = "/promotion/202309/activities/search";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    app_key: process.env.TIKTOK_APP_KEY!,
    shop_cipher: shopCipher,
    timestamp,
    page_size: String(pageSize),
    ...(pageToken ? { page_token: pageToken } : {}),
  };
  const bodyStr = JSON.stringify({});
  const sign = signTikTokRequest(path, params, bodyStr);

  const url = new URL(path, API_BASE);
  Object.entries({ ...params, sign }).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "x-tts-access-token": accessToken, "content-type": "application/json" },
    body: bodyStr,
  });
  const json = (await res.json()) as TikTokPromotionSearchResponse;

  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || "Gagal mengambil daftar promosi dari TikTok Shop.");
  }

  return {
    promotions: json.data.activities ?? [],
    nextPageToken: json.data.next_page_token || null,
  };
}
