import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

const FEATURES = [
  {
    title: "Pantau Event & Promo",
    desc: "Semua event dan promo yang berlangsung di Shopee, Tokopedia, dan TikTok Shop terkumpul dalam satu papan, lengkap dengan status dan tenggat waktunya.",
  },
  {
    title: "Kelola Produk",
    desc: "Tambahkan produk secara manual, atau tarik otomatis dari TikTok Shop lewat integrasi resmi — lengkap dengan badge yang menunjukkan asal datanya.",
  },
  {
    title: "Submit ke Marketplace",
    desc: "Pilih produk dan event, submit langsung dari dashboard. Untuk TikTok Shop, pendaftaran benar-benar terhubung ke API resmi, bukan simulasi.",
  },
  {
    title: "Riwayat Submit",
    desc: "Setiap pendaftaran produk ke event promo tercatat rapi, lengkap dengan status asli dari masing-masing platform.",
  },
];

const PLATFORMS = [
  { name: "Shopee", platform: "shopee" },
  { name: "Tokopedia", platform: "tokopedia" },
  { name: "TikTok Shop", platform: "tiktokshop" },
];

export function LandingPage() {
  return (
    <div className="lp-shell">
      <header className="lp-nav">
        <div className="lp-nav-brand">
          <Image
            src="/LogoLarisin.png"
            alt="Larisin"
            width={34}
            height={34}
            className="brand-mark"
          />
          <div className="brand-name" style={{ color: "var(--ink)" }}>
            Larisin
          </div>
        </div>
        <nav className="lp-nav-actions">
          <Link href="/login" className="lp-nav-link">
            Masuk
          </Link>
          <Link href="/register" className="lp-nav-cta">
            Daftar Gratis
          </Link>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <h1 className="lp-hero-title">Satu papan buat semua event & promo tokomu.</h1>
          <p className="lp-hero-sub">
            Larisin adalah dashboard buat seller marketplace memantau event/promo dan mendaftarkan
            produk ke program promo Shopee, Tokopedia, dan TikTok Shop — tanpa bolak-balik buka
            Seller Center satu per satu.
          </p>
          <div className="lp-hero-actions">
            <Link href="/register" className="lp-nav-cta">
              Mulai Gratis
            </Link>
            <Link href="/login" className="lp-hero-link">
              Sudah punya akun? Masuk →
            </Link>
          </div>
        </div>

        <div className="lp-hero-cards">
          <div className="lp-ticket" style={{ "--r": "-6deg" } as CSSProperties}>
            <div className="auth-ticket-body">
              <div className="auth-ticket-plat" style={{ color: "var(--shopee)" }}>
                Shopee
              </div>
              <div className="auth-ticket-name">Flash Sale 9.9</div>
            </div>
            <div className="auth-ticket-stub" />
          </div>
          <div className="lp-ticket" style={{ "--r": "3deg" } as CSSProperties}>
            <div className="auth-ticket-body">
              <div className="auth-ticket-plat" style={{ color: "var(--tokped)" }}>
                Tokopedia
              </div>
              <div className="auth-ticket-name">WIB Payday Sale</div>
            </div>
            <div className="auth-ticket-stub" />
          </div>
          <div className="lp-ticket" style={{ "--r": "-2deg" } as CSSProperties}>
            <div className="auth-ticket-body">
              <div className="auth-ticket-plat" style={{ color: "var(--tiktok-accent)" }}>
                TikTok Shop
              </div>
              <div className="auth-ticket-name">Live Mega Sale</div>
            </div>
            <div className="auth-ticket-stub" />
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <div className="panel-label">Tentang Larisin</div>
        </div>
        <p className="lp-about">
          Larisin dibangun buat seller marketplace kecil-menengah yang jualan di banyak platform
          sekaligus. Daripada mantengin Seller Center Shopee, Tokopedia, dan TikTok Shop
          satu-satu tiap hari cuma buat cek event promo apa yang lagi jalan, Larisin
          merangkumnya jadi satu papan yang bisa dipantau kapan saja — dan buat TikTok Shop,
          prosesnya benar-benar terhubung ke data dan aksi asli di platform lewat API resmi.
        </p>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <div className="panel-label">Fitur Utama</div>
        </div>
        <div className="lp-feature-grid">
          {FEATURES.map((f) => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-title">{f.title}</div>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <div className="panel-label">Platform yang Didukung</div>
        </div>
        <div className="lp-platform-row">
          {PLATFORMS.map((p) => (
            <div className="chip" data-platform={p.platform} key={p.platform}>
              <span className="swatch" />
              {p.name}
            </div>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <Image
          src="/LogoLarisin.png"
          alt="Larisin"
          width={34}
          height={34}
          className="brand-mark"
          style={{ margin: "0 auto 10px" }}
        />
        <div style={{ fontWeight: 700, color: "var(--ink)" }}>Larisin</div>
        <p>Satu papan, semua lapak.</p>
      </footer>
    </div>
  );
}
