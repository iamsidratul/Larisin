import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductsView } from "@/components/products/ProductsView";
import { EVENTS } from "@/lib/data/events";
import { getEventStatus } from "@/lib/status";
import type { Product } from "@/lib/types";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: products }, { data: tiktokConnections }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("marketplace_connections")
      .select("id, shop_id, shop_code, shop_name, status")
      .eq("user_id", user.id)
      .eq("platform", "tiktokshop")
      .eq("status", "connected"),
  ]);

  const availableEvents = EVENTS.filter(
    (e) => getEventStatus(e.mulai, e.selesai) !== "berakhir",
  );

  const shopLabels: Record<string, string> = {};
  for (const conn of tiktokConnections ?? []) {
    shopLabels[conn.id] = conn.shop_name || conn.shop_code || conn.shop_id || "Toko TikTok Shop";
  }

  return (
    <ProductsView
      products={(products ?? []) as Product[]}
      events={availableEvents}
      initialEventIds={event ? [event] : []}
      tiktokConnected={(tiktokConnections ?? []).length > 0}
      shopLabels={shopLabels}
    />
  );
}
