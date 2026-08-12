"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard/events", label: "Event & Promo", icon: "🎟️" },
  { href: "/dashboard/products", label: "Produk Saya", icon: "📦" },
  { href: "/dashboard/history", label: "Riwayat Submit", icon: "🕘" },
  { href: "/dashboard/settings", label: "Pengaturan Akun", icon: "⚙️" },
];

const PLATFORMS: { key: string; label: string }[] = [
  { key: "shopee", label: "Shopee" },
  { key: "tokopedia", label: "Tokopedia" },
  { key: "tiktokshop", label: "TikTok Shop" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        <Image
          src="/LogoLarisin.png"
          alt="Larisin"
          width={34}
          height={34}
          className="brand-mark"
        />
        <div>
          <div className="brand-name">Papan Promo</div>
          <div className="brand-sub">Dashboard Event</div>
        </div>
      </div>

      <button
        type="button"
        className="hamburger"
        aria-label="Buka menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hamburger-bar" />
      </button>

      <div className="nav-label">Menu</div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
            >
              <span className="ic">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="sf-label">Marketplace Terhubung</div>
        <div className="sf-plats">
          {PLATFORMS.map((p) => (
            <div key={p.key} className="sf-plat" data-p={p.key}>
              <span className="swatch" />
              {p.label}
            </div>
          ))}
        </div>
        <form action={logout}>
          <button type="submit" className="sf-logout">
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
