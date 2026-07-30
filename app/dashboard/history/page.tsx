import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVENTS } from "@/lib/data/events";
import { PLATFORM_LABEL } from "@/lib/status";
import type { Product, Submission } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  berhasil: "Berhasil",
  pending: "Pending",
  gagal: "Gagal",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: submissions }, { data: products }] = await Promise.all([
    supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("dibuat_pada", { ascending: false }),
    supabase.from("products").select("*").eq("user_id", user.id),
  ]);

  const productMap = new Map(
    ((products ?? []) as Product[]).map((p) => [p.id, p.nama]),
  );
  const list = (submissions ?? []) as Submission[];

  return (
    <>
      <div className="pagehead">
        <h1>Riwayat Submit</h1>
        <p className="lede">Riwayat submit produk ke event promo marketplace.</p>
      </div>

      <div className="history-table">
        <div className="history-row head">
          <span>Tanggal</span>
          <span>Event</span>
          <span>Produk</span>
          <span>Platform</span>
          <span>Status</span>
          <span>Diskon</span>
        </div>

        {list.length === 0 && <p className="lede">Belum ada riwayat submit.</p>}

        {list.map((s) => {
          const event = EVENTS.find((e) => e.id === s.event_id);
          const produkNames = s.produk_ids
            .map((id) => productMap.get(id) ?? "Produk dihapus")
            .join(", ");
          const dateLabel = new Date(s.dibuat_pada).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const diskonLabel = s.diskon_nilai
            ? `${s.diskon_nilai}${s.diskon_tipe === "persen" ? "%" : ""}`
            : "-";

          return (
            <div className="history-row" key={s.id}>
              <span className="hist-date">{dateLabel}</span>
              <span>{event?.nama ?? s.event_id}</span>
              <span>{produkNames}</span>
              <span>{PLATFORM_LABEL[s.platform]}</span>
              <span>{STATUS_LABEL[s.status]}</span>
              <span>{diskonLabel}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
