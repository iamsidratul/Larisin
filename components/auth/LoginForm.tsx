"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction}>
      <h1 className="auth-title">Masuk</h1>
      <p className="auth-sub">Pantau event & promo lintas marketplace kamu.</p>

      <div className={`auth-error${state?.error ? " show" : ""}`}>
        {state?.error}
      </div>

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
        autoComplete="current-password"
        required
      />

      <button className="auth-btn" type="submit" disabled={pending}>
        {pending ? "Memproses..." : "Masuk"}
      </button>

      <p className="auth-switch">
        Belum punya akun? <Link href="/register">Daftar</Link>
      </p>
    </form>
  );
}
