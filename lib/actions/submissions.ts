"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EVENTS } from "@/lib/data/events";
import type { Platform, SubmissionStatus } from "@/lib/types";

export type SubmitResult = {
  eventId: string;
  eventName: string;
  platform: Platform;
  status: SubmissionStatus;
};

export type SubmitState =
  | { error: string }
  | { success: true; results: SubmitResult[] }
  | null;

export async function submitPromo(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const eventIds = formData.getAll("event_ids").map(String);
  const productIds = formData.getAll("product_ids").map(String);
  const diskonTipe = String(formData.get("diskon_tipe") ?? "");
  const diskonNilai = String(formData.get("diskon_nilai") ?? "").trim();
  const fotoNama = String(formData.get("foto_nama") ?? "").trim();

  if (eventIds.length === 0) {
    return { error: "Pilih minimal 1 event." };
  }
  if (productIds.length === 0) {
    return { error: "Pilih minimal 1 produk." };
  }

  const selectedEvents = eventIds
    .map((id) => EVENTS.find((e) => e.id === id))
    .filter((e): e is (typeof EVENTS)[number] => Boolean(e));

  if (selectedEvents.length === 0) {
    return { error: "Event tidak ditemukan." };
  }
  if (selectedEvents.some((e) => e.butuh_diskon) && !diskonNilai) {
    return { error: "Isi nilai diskon." };
  }
  if (selectedEvents.some((e) => e.butuh_foto) && !fotoNama) {
    return { error: "Upload foto promo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali." };
  }

  // No real marketplace API is wired up yet, so each event's outcome is
  // simulated independently — mirrors how the original static prototype
  // demoed this flow. Each event gets its own submissions row since a
  // seller can succeed on one platform and fail on another.
  const rows = selectedEvents.map((event) => {
    const roll = Math.random();
    const status: SubmissionStatus = roll < 0.75 ? "berhasil" : roll < 0.9 ? "pending" : "gagal";
    return {
      user_id: user.id,
      event_id: event.id,
      produk_ids: productIds,
      platform: event.platform,
      status,
      diskon_tipe: event.butuh_diskon ? diskonTipe || null : null,
      diskon_nilai: event.butuh_diskon ? diskonNilai : null,
      foto_nama: event.butuh_foto ? fotoNama : null,
      alasan: status === "gagal" ? "Ditolak sistem marketplace: kuota event penuh." : null,
    };
  });

  const { error } = await supabase.from("submissions").insert(rows);

  if (error) {
    return { error: "Gagal menyimpan submission." };
  }

  revalidatePath("/dashboard/history");
  return {
    success: true,
    results: rows.map((row, i) => ({
      eventId: row.event_id,
      eventName: selectedEvents[i].nama,
      platform: row.platform,
      status: row.status,
    })),
  };
}
