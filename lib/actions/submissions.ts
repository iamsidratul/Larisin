"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EVENTS } from "@/lib/data/events";
import type { SubmissionStatus } from "@/lib/types";

export type SubmitState =
  | { error: string }
  | { success: true; status: SubmissionStatus }
  | null;

export async function submitPromo(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const eventId = String(formData.get("event_id") ?? "");
  const productIds = formData.getAll("product_ids").map(String);
  const diskonTipe = String(formData.get("diskon_tipe") ?? "");
  const diskonNilai = String(formData.get("diskon_nilai") ?? "").trim();
  const fotoNama = String(formData.get("foto_nama") ?? "").trim() || null;

  const event = EVENTS.find((e) => e.id === eventId);
  if (!event) {
    return { error: "Pilih event terlebih dahulu." };
  }
  if (productIds.length === 0) {
    return { error: "Pilih minimal 1 produk." };
  }
  if (!diskonNilai) {
    return { error: "Isi nilai diskon." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali." };
  }

  // No real marketplace API is wired up yet, so the outcome is simulated —
  // mirrors how the original static prototype demoed this flow.
  const roll = Math.random();
  const status: SubmissionStatus = roll < 0.75 ? "berhasil" : roll < 0.9 ? "pending" : "gagal";
  const alasan = status === "gagal" ? "Ditolak sistem marketplace: kuota event penuh." : null;

  const { error } = await supabase.from("submissions").insert({
    user_id: user.id,
    event_id: eventId,
    produk_ids: productIds,
    platform: event.platform,
    status,
    diskon_tipe: diskonTipe || null,
    diskon_nilai: diskonNilai,
    foto_nama: fotoNama,
    alasan,
  });

  if (error) {
    return { error: "Gagal menyimpan submission." };
  }

  revalidatePath("/dashboard/history");
  return { success: true, status };
}
