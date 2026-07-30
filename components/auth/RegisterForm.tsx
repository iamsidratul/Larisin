"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = null;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <form action={formAction}>
      <h1 className="auth-title">Daftar</h1>
      <p className="auth-sub">Buat akun untuk mulai kelola promo tokomu.</p>

      <div className={`auth-error${state?.error ? " show" : ""}`}>
        {state?.error}
      </div>

      <label className="auth-field-label" htmlFor="nama">
        Nama
      </label>
      <input
        className="auth-input"
        id="nama"
        name="nama"
        type="text"
        autoComplete="name"
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
        autoComplete="organization"
      />

      <label className="auth-field-label" htmlFor="email">
        Email
      </label>
      <input
        className="auth-input"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <label className="auth-field-label" htmlFor="password">
        Kata Sandi
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

      <button className="auth-btn" type="submit" disabled={pending}>
        {pending ? "Memproses..." : "Daftar"}
      </button>

      <p className="auth-switch">
        Sudah punya akun? <Link href="/login">Masuk</Link>
      </p>
    </form>
  );
}
