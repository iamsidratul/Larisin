import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "@/components/settings/SettingsView";
import type { MarketplaceConnection, Profile } from "@/lib/types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok_connected?: string; tiktok_error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: tiktokConnection }, params] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("marketplace_connections")
      .select("id, user_id, platform, shop_id, status, connected_at, updated_at")
      .eq("user_id", user.id)
      .eq("platform", "tiktokshop")
      .maybeSingle(),
    searchParams,
  ]);

  return (
    <SettingsView
      profile={profile as Profile}
      email={user.email ?? ""}
      tiktokConnection={tiktokConnection as MarketplaceConnection | null}
      tiktokConnected={params.tiktok_connected === "1"}
      tiktokError={params.tiktok_error ?? null}
    />
  );
}
