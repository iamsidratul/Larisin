"use client";

import Link from "next/link";
import type { EventItem, EventStatus } from "@/lib/types";
import { PLATFORM_LABEL, STATUS_LABEL } from "@/lib/status";

export function EventModal({
  event,
  status,
  onClose,
}: {
  event: EventItem;
  status: EventStatus;
  onClose: () => void;
}) {
  const mulaiLabel = new Date(event.mulai).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const selesaiLabel = new Date(event.selesai).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">
          ✕
        </button>
        <span className={`ticket-plat ${event.platform}`}>
          {PLATFORM_LABEL[event.platform]}
        </span>
        <h2 className="modal-title">{event.nama}</h2>
        <p className="modal-desc">{event.desc}</p>

        <div className="modal-meta">
          <div className="modal-meta-row">
            <span className="modal-meta-label">Status</span>
            <span className="modal-meta-val">{STATUS_LABEL[status]}</span>
          </div>
          <div className="modal-meta-row">
            <span className="modal-meta-label">Mulai</span>
            <span className="modal-meta-val">{mulaiLabel}</span>
          </div>
          <div className="modal-meta-row">
            <span className="modal-meta-label">Selesai</span>
            <span className="modal-meta-val">{selesaiLabel}</span>
          </div>
          <div className="modal-meta-row">
            <span className="modal-meta-label">Syarat & Ketentuan</span>
            <span className="modal-meta-val">{event.syarat}</span>
          </div>
        </div>

        {status !== "berakhir" ? (
          <>
            <Link href={`/dashboard/products?event=${event.id}`} className="modal-cta">
              Ikut Promo Ini
            </Link>
            <p className="modal-note">
              Kamu akan diarahkan ke halaman Produk Saya untuk memilih produk yang ikut promo ini.
            </p>
          </>
        ) : (
          <p className="modal-note">Event ini sudah berakhir dan tidak menerima submit baru.</p>
        )}
      </div>
    </div>
  );
}
