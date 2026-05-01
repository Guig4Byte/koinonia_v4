"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

export function LoginErrorMessage({ show }: { show: boolean }) {
  useEffect(() => {
    if (!show) return;

    const url = new URL(window.location.href);
    if (!url.searchParams.has("erro")) return;

    url.searchParams.delete("erro");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [show]);

  if (!show) return null;

  return (
    <p
      className="rounded-[16px] border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-4 py-3 text-sm font-medium text-[var(--color-badge-risco-text)]"
      role="alert"
    >
      E-mail ou senha não conferem.
    </p>
  );
}

export function PasswordField() {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;
  const label = isVisible ? "Ocultar senha" : "Mostrar senha";

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--login-muted)]">
        Senha
      </span>
      <div className="relative">
        <input
          name="password"
          type={isVisible ? "text" : "password"}
          autoComplete="current-password"
          required
          className="login-input min-h-[48px] w-full rounded-[16px] border px-4 pr-14 text-[15px] font-medium outline-none transition"
          placeholder="Sua senha"
        />
        <button
          type="button"
          className="login-password-toggle"
          aria-label={label}
          aria-pressed={isVisible}
          title={label}
          onClick={() => setIsVisible((current) => !current)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </label>
  );
}
