"use client";

import { useActionState } from "react";
import type { MarketplaceConnection, Profile } from "@/lib/types";
import {
  updateProfile,
  updatePassword,
  type ProfileFormState,
  type PasswordFormState,
} from "@/lib/actions/profile";
import { disconnectTikTokShop } from "@/lib/actions/marketplace";

const profileInitialState: ProfileFormState = null;
const passwordInitialState: PasswordFormState = null;

const TIKTOK_ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: "Sesi otorisasi tidak valid atau kedaluwarsa. Coba hubungkan lagi.",
  unauthenticated: "Sesi berakhir, silakan masuk kembali lalu coba hubungkan lagi.",
  token_exchange_failed: "Gagal menukar kode otorisasi dari TikTok Shop.",
  save_failed: "Gagal menyimpan koneksi ke database.",
  config_missing: "Integrasi TikTok Shop belum dikonfigurasi (env var App Key/Redirect URI kosong).",
};

export function SettingsView({
  profile,
  email,
  tiktokConnections,
  tiktokConnected,
  tiktokError,
}: {
  profile: Profile;
  email: string;
  tiktokConnections: MarketplaceConnection[];
  tiktokConnected: boolean;
  tiktokError: string | null;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    profileInitialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    passwordInitialState,
  );

  return (
    <>
      <div className="pagehead">
        <h1>Pengaturan Akun</h1>
        <p className="lede">Kelola informasi akun dan kata sandi kamu.</p>
      </div>

      <div style={{ maxWidth: 480, marginBottom: 28 }}>
        <div className="panel-label">Koneksi Marketplace</div>

        {tiktokConnected && (
          <div className="result-card">
            <div className="result-row">
              <span>TikTok Shop berhasil terhubung.</span>
            </div>
          </div>
        )}
        {tiktokError && (
          <div className="auth-error show">
            {TIKTOK_ERROR_MESSAGES[tiktokError] ?? "Gagal menghubungkan TikTok Shop."}
          </div>
        )}

        {tiktokConnections.length === 0 ? (
          <div className="result-card">
            <div className="result-row">
              <span>TikTok Shop</span>
              <span>Belum terhubung</span>
            </div>
          </div>
        ) : (
          tiktokConnections.map((conn) => (
            <div className="result-card" key={conn.id}>
              <div className="result-row">
                <span>{conn.shop_name || conn.shop_code || conn.shop_id || "Toko TikTok Shop"}</span>
                <span>
                  Terhubung sejak{" "}
                  {new Date(conn.connected_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <form action={disconnectTikTokShop} style={{ marginTop: 10 }}>
                <input type="hidden" name="connection_id" value={conn.id} />
                <button
                  className="submit-btn"
                  type="submit"
                  style={{ background: "#C0392B", marginTop: 0, padding: "8px 14px", fontSize: 12.5 }}
                >
                  Putuskan Koneksi
                </button>
              </form>
            </div>
          ))
        )}

        <a
          className="submit-btn"
          href="/api/auth/tiktok/connect"
          style={{ display: "inline-block", textDecoration: "none" }}
        >
          {tiktokConnections.length === 0 ? "Hubungkan TikTok Shop" : "Hubungkan Toko Lain"}
        </a>
      </div>

      <div className="submit-layout">
        <div>
          <div className="panel-label">Informasi Akun</div>
          <form action={profileAction}>
            <label className="auth-field-label" htmlFor="email">
              Email
            </label>
            <input className="auth-input" id="email" type="email" value={email} disabled />

            <label className="auth-field-label" htmlFor="nama">
              Nama
            </label>
            <input
              className="auth-input"
              id="nama"
              name="nama"
              type="text"
              defaultValue={profile.nama}
              required
            />

            <label className="auth-field-label" htmlFor="nama_toko">
              Nama Toko
            </label>
            <input
              className="auth-input"
              id="nama_toko"
              name="nama_toko"
              type="text"
              defaultValue={profile.nama_toko ?? ""}
            />

            {profileState && "error" in profileState && (
              <div className="auth-error show">{profileState.error}</div>
            )}
            {profileState && "success" in profileState && (
              <div className="result-card">
                <div className="result-row">
                  <span>Perubahan tersimpan.</span>
                </div>
              </div>
            )}

            <button className="submit-btn" type="submit" disabled={profilePending}>
              {profilePending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        <div>
          <div className="panel-label">Ganti Kata Sandi</div>
          <form action={passwordAction}>
            <label className="auth-field-label" htmlFor="password">
              Kata Sandi Baru
            </label>
            <input
              className="auth-input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />

            <label className="auth-field-label" htmlFor="confirm_password">
              Konfirmasi Kata Sandi
            </label>
            <input
              className="auth-input"
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />

            {passwordState && "error" in passwordState && (
              <div className="auth-error show">{passwordState.error}</div>
            )}
            {passwordState && "success" in passwordState && (
              <div className="result-card">
                <div className="result-row">
                  <span>Kata sandi berhasil diganti.</span>
                </div>
              </div>
            )}

            <button className="submit-btn" type="submit" disabled={passwordPending}>
              {passwordPending ? "Menyimpan..." : "Ganti Kata Sandi"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
