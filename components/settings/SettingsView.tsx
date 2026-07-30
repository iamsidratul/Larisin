"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/types";
import {
  updateProfile,
  updatePassword,
  type ProfileFormState,
  type PasswordFormState,
} from "@/lib/actions/profile";

const profileInitialState: ProfileFormState = null;
const passwordInitialState: PasswordFormState = null;

export function SettingsView({ profile, email }: { profile: Profile; email: string }) {
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
