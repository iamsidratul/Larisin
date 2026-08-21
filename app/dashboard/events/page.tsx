import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventsView } from "@/components/events/EventsView";
import { EVENTS } from "@/lib/data/events";
import type { EventItem } from "@/lib/types";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: dbEvents }, { data: connection }] = await Promise.all([
    supabase.from("events").select("*").eq("user_id", user.id).order("mulai"),
    supabase
      .from("marketplace_connections")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("platform", "tiktokshop")
      .maybeSingle(),
  ]);

  const tiktokEvents: EventItem[] = (dbEvents ?? []).map((e) => ({
    id: e.id,
    platform: e.platform,
    nama: e.nama,
    desc: e.deskripsi,
    mulai: e.mulai,
    selesai: e.selesai,
    syarat: e.syarat,
    link: e.link,
    butuh_diskon: e.butuh_diskon,
    butuh_foto: e.butuh_foto,
    source: e.source,
  }));

  const staticEvents = EVENTS.filter((e) => e.platform !== "tiktokshop");
  const events = [...staticEvents, ...tiktokEvents];

  return (
    <EventsView events={events} tiktokConnected={connection?.status === "connected"} />
  );
}
