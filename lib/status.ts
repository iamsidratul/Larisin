import type { EventStatus } from "@/lib/types";

const MONTH_ABBR_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function getEventStatus(mulai: string, selesai: string, now: Date = new Date()): EventStatus {
  const start = new Date(mulai);
  const end = new Date(selesai);
  if (now < start) return "akan_datang";
  if (now > end) return "berakhir";
  return "berlangsung";
}

export function daysUntil(dateStr: string, now: Date = new Date()): number {
  return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / DAY_MS);
}

export function formatCountdown(
  mulai: string,
  selesai: string,
  status: EventStatus,
  now: Date = new Date(),
): string {
  if (status === "akan_datang") {
    const days = daysUntil(mulai, now);
    return days <= 1 ? "Mulai besok" : `${days} hari lagi`;
  }
  if (status === "berlangsung") {
    const days = daysUntil(selesai, now);
    return days <= 0 ? "Berakhir hari ini" : `${days} hari tersisa`;
  }
  return "Telah berakhir";
}

export function formatStubDay(dateStr: string): string {
  return String(new Date(dateStr).getDate());
}

export function formatStubMonth(dateStr: string): string {
  return MONTH_ABBR_ID[new Date(dateStr).getMonth()];
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  akan_datang: "Akan Datang",
  berlangsung: "Berlangsung",
  berakhir: "Berakhir",
};

export const PLATFORM_LABEL: Record<string, string> = {
  shopee: "Shopee",
  tokopedia: "Tokopedia",
  tiktokshop: "TikTok Shop",
};
