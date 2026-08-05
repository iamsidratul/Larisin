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

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("dibuat_pada", { ascending: false });

  const availableEvents = EVENTS.filter(
    (e) => getEventStatus(e.mulai, e.selesai) !== "berakhir",
  );

  return (
    <ProductsView
      products={(products ?? []) as Product[]}
      events={availableEvents}
      initialEventIds={event ? [event] : []}
    />
  );
}
