import Link from "next/link";
import { AuthVisual } from "@/components/auth/AuthVisual";

const FEATURES = [
  "Pantau semua event & promo Shopee, Tokopedia, dan TikTok Shop dalam satu papan.",
  "Kelola daftar produk tokomu, manual atau tarik otomatis dari TikTok Shop.",
  "Submit produk ke event promo langsung dari dashboard, lihat riwayatnya kapan saja.",
];

export default function Home() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <AuthVisual />
        <div className="auth-form">
          <h1 className="auth-title">Larisin</h1>
          <p className="auth-sub">
            Dashboard buat seller marketplace memantau event/promo dan mendaftarkan produk ke
            program promo Shopee, Tokopedia, dan TikTok Shop — tanpa bolak-balik buka Seller
            Center satu-satu.
          </p>

          <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none" }}>
            {FEATURES.map((feature) => (
              <li
                key={feature}
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-soft)",
                  marginBottom: 10,
                  paddingLeft: 16,
                  position: "relative",
                }}
              >
                <span style={{ position: "absolute", left: 0, color: "var(--accent)" }}>•</span>
                {feature}
              </li>
            ))}
          </ul>

          <Link href="/login" className="auth-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            Masuk
          </Link>
          <p className="auth-switch">
            Belum punya akun? <Link href="/register">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
