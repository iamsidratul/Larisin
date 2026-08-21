export type Platform = "shopee" | "tokopedia" | "tiktokshop";

export type EventStatus = "akan_datang" | "berlangsung" | "berakhir";

export type SubmissionStatus = "berhasil" | "pending" | "gagal";

export type EventSource = "manual_curated" | "tiktok_api";

export interface EventItem {
  id: string;
  platform: Platform;
  nama: string;
  desc: string;
  mulai: string;
  selesai: string;
  syarat: string;
  link: string;
  butuh_diskon: boolean;
  butuh_foto: boolean;
  source?: EventSource;
}

export interface Profile {
  id: string;
  nama: string;
  nama_toko: string | null;
  dibuat_pada: string;
}

export type ProductSource = "manual" | "tiktok_sync" | "shopee_sync" | "tokopedia_sync";

export interface Product {
  id: string;
  user_id: string;
  nama: string;
  sku: string | null;
  stok: number;
  dibuat_pada: string;
  source: ProductSource;
  platform_product_id: string | null;
  marketplace_connection_id: string | null;
  last_synced_at: string | null;
}

export type MarketplaceConnectionStatus = "connected" | "expired" | "revoked";

export interface MarketplaceConnection {
  id: string;
  user_id: string;
  platform: Platform;
  shop_id: string | null;
  status: MarketplaceConnectionStatus;
  connected_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  event_id: string;
  produk_ids: string[];
  platform: Platform;
  status: SubmissionStatus;
  diskon_tipe: string | null;
  diskon_nilai: string | null;
  foto_nama: string | null;
  alasan: string | null;
  dibuat_pada: string;
}
