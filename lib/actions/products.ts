"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState = { error: string } | null;

export async function addProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const nama = String(formData.get("nama") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const stok = Number(formData.get("stok") ?? 0);

  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir, silakan masuk kembali." };
  }

  const { error } = await supabase.from("products").insert({
    user_id: user.id,
    nama,
    sku: sku || null,
    stok: Number.isFinite(stok) ? stok : 0,
  });

  if (error) {
    return { error: "Gagal menambah produk." };
  }

  revalidatePath("/dashboard/products");
  return null;
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/dashboard/products");
}
