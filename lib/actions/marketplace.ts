"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function disconnectTikTokShop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("marketplace_connections")
    .update({
      status: "revoked",
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("platform", "tiktokshop");

  revalidatePath("/dashboard/settings");
}
