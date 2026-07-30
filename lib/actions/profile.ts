"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string } | { success: true } | null;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const nama = String(formData.get("nama") ?? "").trim();
  const namaToko = String(formData.get("nama_toko") ?? "").trim();

  if (!nama) {
    return { error: "Nama wajib diisi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nama, nama_toko: namaToko || null })
    .eq("id", user.id);

  if (error) {
    return { error: "Gagal menyimpan perubahan." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export type PasswordFormState = { error: string } | { success: true } | null;

export async function updatePassword(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }
  if (password !== confirmPassword) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Gagal mengganti kata sandi." };
  }

  return { success: true };
}
