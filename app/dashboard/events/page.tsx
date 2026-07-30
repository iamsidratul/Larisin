import { EventsView } from "@/components/events/EventsView";
import { EVENTS } from "@/lib/data/events";

export default function EventsPage() {
  return <EventsView events={EVENTS} />;
}
