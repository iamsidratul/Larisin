import Image from "next/image";
import type { CSSProperties } from "react";

const TICKETS: {
  platform: string;
  name: string;
  color: string;
  rotate: string;
  delay: string;
}[] = [
  { platform: "Shopee", name: "Flash Sale 9.9", color: "var(--shopee)", rotate: "-6deg", delay: "0s" },
  { platform: "Tokopedia", name: "WIB Payday Sale", color: "var(--tokped)", rotate: "3deg", delay: "0.4s" },
  { platform: "TikTok Shop", name: "Live Mega Sale", color: "var(--tiktok-accent)", rotate: "-2deg", delay: "0.8s" },
];

export function AuthVisual() {
  return (
    <div className="auth-visual">
      <div className="brand">
        <Image
          src="/LogoLarisin.png"
          alt="Larisin"
          width={28}
          height={28}
          className="brand-mark"
        />
        <div>
          <div className="brand-name">Papan Promo</div>
        </div>
      </div>

      <div className="auth-cards">
        {TICKETS.map((t) => (
          <div
            key={t.platform}
            className="auth-ticket"
            style={{ "--r": t.rotate, animationDelay: t.delay } as CSSProperties}
          >
            <div className="auth-ticket-body">
              <div className="auth-ticket-plat" style={{ color: t.color }}>
                {t.platform}
              </div>
              <div className="auth-ticket-name">{t.name}</div>
            </div>
            <div className="auth-ticket-stub" />
          </div>
        ))}
      </div>

      <div className="auth-tagline">Satu papan, semua lapak.</div>
    </div>
  );
}
