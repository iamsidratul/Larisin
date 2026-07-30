export type Platform = "shopee" | "tokopedia" | "tiktokshop";

export type EventStatus = "akan_datang" | "berlangsung" | "berakhir";

export type SubmissionStatus = "berhasil" | "pending" | "gagal";

export interface EventItem {
  id: string;
  platform: Platform;
  nama: string;
  desc: string;
  mulai: string;
  selesai: string;
  syarat: string;
  link: string;
}

export interface EventFormField {
  key: "diskon" | "foto";
  label: string;
  type: "number" | "file";
  min?: number;
  max?: number;
}

export interface Profile {
  id: string;
  nama: string;
  nama_toko: string | null;
  dibuat_pada: string;
}

export interface Product {
  id: string;
  user_id: string;
  nama: string;
  sku: string | null;
  stok: number;
  dibuat_pada: string;
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
