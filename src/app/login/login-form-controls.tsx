"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./login.module.css";

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
    <p className={styles.errorMessage} role="alert">
      E-mail ou senha não conferem.
    </p>
  );
}

export function PasswordField() {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;
  const label = isVisible ? "Ocultar senha" : "Mostrar senha";

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="login-password">
        Senha
      </label>
      <div className={styles.inputShell}>
        <Lock className={styles.inputIcon} aria-hidden="true" />
        <input
          id="login-password"
          name="password"
          type={isVisible ? "text" : "password"}
          autoComplete="current-password"
          required
          className={styles.input}
          placeholder="Digite sua senha"
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={label}
          aria-pressed={isVisible}
          title={label}
          onClick={() => setIsVisible((current) => !current)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
