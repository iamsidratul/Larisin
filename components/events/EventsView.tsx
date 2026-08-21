"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventItem, EventStatus, Platform } from "@/lib/types";
import {
  formatCountdown,
  formatStubDay,
  formatStubMonth,
  getEventStatus,
  PLATFORM_LABEL,
  STATUS_LABEL,
} from "@/lib/status";
import { EventModal } from "@/components/events/EventModal";

const PLATFORM_FILTERS: { key: Platform; label: string }[] = [
  { key: "shopee", label: "Shopee" },
  { key: "tokopedia", label: "Tokopedia" },
  { key: "tiktokshop", label: "TikTok Shop" },
];

const STATUS_ORDER: EventStatus[] = ["berlangsung", "akan_datang", "berakhir"];

type SyncResult = { synced: number } | { error: string };

export function EventsView({
  events,
  tiktokConnected = false,
}: {
  events: EventItem[];
  tiktokConnected?: boolean;
}) {
  const router = useRouter();
  const [platformFilter, setPlatformFilter] = useState<Platform | "semua">("semua");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "semua">("semua");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setSyncPending(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/tiktok/promotions/list", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncResult({ error: json.message || "Gagal menarik promosi dari TikTok Shop." });
      } else {
        setSyncResult({ synced: json.synced });
        router.refresh();
      }
    } catch {
      setSyncResult({ error: "Gagal menarik promosi dari TikTok Shop." });
    } finally {
      setSyncPending(false);
    }
  }

  const now = useMemo(() => new Date(), []);

  const withStatus = useMemo(
    () => events.map((event) => ({ event, status: getEventStatus(event.mulai, event.selesai, now) })),
    [events, now],
  );

  const stats = useMemo(() => {
    const live = withStatus.filter((e) => e.status === "berlangsung");
    const upcoming = withStatus.filter((e) => e.status === "akan_datang");
    const endingSoon = live.filter((e) => {
      const days = Math.ceil((new Date(e.event.selesai).getTime() - now.getTime()) / 86400000);
      return days <= 3;
    });
    return { live: live.length, upcoming: upcoming.length, endingSoon: endingSoon.length };
  }, [withStatus, now]);

  const filtered = useMemo(
    () =>
      withStatus.filter(
        ({ event, status }) =>
          (platformFilter === "semua" || event.platform === platformFilter) &&
          (statusFilter === "semua" || status === statusFilter),
      ),
    [withStatus, platformFilter, statusFilter],
  );

  const sections = STATUS_ORDER.map((status) => ({
    status,
    items: filtered.filter((e) => e.status === status),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <div className="pagehead">
        <h1>Event & Promo</h1>
        <p className="lede">
          Pantau semua event dan promo yang tersedia di Shopee, Tokopedia, dan TikTok Shop dalam satu papan.
        </p>

        <div className="stat-row">
          <div className="stat-card st-live">
            <p className="stat-num">{stats.live}</p>
            <p className="stat-label">Sedang Berlangsung</p>
          </div>
          <div className="stat-card st-upcoming">
            <p className="stat-num">{stats.upcoming}</p>
            <p className="stat-label">Akan Datang</p>
          </div>
          <div className="stat-card st-ending">
            <p className="stat-num">{stats.endingSoon}</p>
            <p className="stat-label">Segera Berakhir</p>
          </div>
        </div>
      </div>

      {tiktokConnected && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="submit-btn"
            style={{ marginTop: 0 }}
            onClick={handleSync}
            disabled={syncPending}
          >
            {syncPending ? "Menarik promosi..." : "Tarik Campaign dari TikTok Shop"}
          </button>
          {syncResult && "error" in syncResult && (
            <div className="auth-error show">{syncResult.error}</div>
          )}
          {syncResult && "synced" in syncResult && (
            <div className="result-card">
              <div className="result-row">
                <span>{syncResult.synced} campaign berhasil ditarik dari TikTok Shop.</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="controls">
        <div className="chipset">
          <button
            type="button"
            className={`chip${platformFilter === "semua" ? " active" : ""}`}
            onClick={() => setPlatformFilter("semua")}
          >
            Semua Platform
          </button>
          {PLATFORM_FILTERS.map((p) => (
            <button
              key={p.key}
              type="button"
              data-platform={p.key}
              className={`chip${platformFilter === p.key ? " active" : ""}`}
              onClick={() => setPlatformFilter(p.key)}
            >
              <span className="swatch" />
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EventStatus | "semua")}
          aria-label="Filter status"
        >
          <option value="semua">Semua Status</option>
          <option value="berlangsung">Berlangsung</option>
          <option value="akan_datang">Akan Datang</option>
          <option value="berakhir">Berakhir</option>
        </select>
      </div>

      <p className="count">Menampilkan {filtered.length} event</p>

      {sections.length === 0 && (
        <div className="grid">
          <div className="empty">
            <strong>Tidak ada event</strong>
            Coba ubah filter platform atau status di atas.
          </div>
        </div>
      )}

      {sections.map((section) => (
        <div className="section" key={section.status}>
          <div className="section-head">
            <div className="section-title">
              <span className={`dot status-${section.status}`} />
              {STATUS_LABEL[section.status]}
            </div>
            <span className="section-count">{section.items.length}</span>
            <div className="section-line" />
          </div>
          <div className="grid">
            {section.items.map(({ event, status }) => (
              <div
                key={event.id}
                className="ticket"
                role="button"
                tabIndex={0}
                onClick={() => setSelected(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(event);
                }}
              >
                <div className="ticket-main">
                  <span className={`ticket-plat ${event.platform}`}>
                    {PLATFORM_LABEL[event.platform]}
                  </span>
                  {event.source === "tiktok_api" && (
                    <span className="prod-badge" data-platform="tiktokshop">
                      <span className="swatch" /> Live dari TikTok
                    </span>
                  )}
                  <h3 className="ticket-title">{event.nama}</h3>
                  <p className="ticket-desc">{event.desc}</p>
                  <div className={`ticket-status status-${status}`}>
                    <span className="dot" />
                    {STATUS_LABEL[status]}
                  </div>
                </div>
                <div className="ticket-stub">
                  <div className="stub-day">{formatStubDay(event.mulai)}</div>
                  <div className="stub-month">{formatStubMonth(event.mulai)}</div>
                  <div className="stub-countdown">
                    {formatCountdown(event.mulai, event.selesai, status, now)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <EventModal
          event={selected}
          status={getEventStatus(selected.mulai, selected.selesai, now)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
