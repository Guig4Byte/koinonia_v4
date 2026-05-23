"use client";

import { Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import styles from "./login.module.css";

const LOGIN_ERROR_ID = "login-error";

function clearLoginErrorFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("erro")) return;

  url.searchParams.delete("erro");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function LoginErrorMessage({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <p id={LOGIN_ERROR_ID} className={styles.errorMessage} role="alert" aria-live="assertive">
      E-mail ou senha não conferem.
    </p>
  );
}

function EmailField({
  hasError,
  onValueChange,
}: {
  hasError: boolean;
  onValueChange: () => void;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="login-email">
        E-mail
      </label>
      <div className={styles.inputShell} data-invalid={hasError ? "true" : undefined}>
        <Mail className={styles.inputIcon} aria-hidden="true" />
        <input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={hasError}
          aria-describedby={hasError ? LOGIN_ERROR_ID : undefined}
          className={styles.input}
          placeholder="Digite seu e-mail"
          onChange={onValueChange}
        />
      </div>
    </div>
  );
}

function PasswordField({
  hasError,
  onValueChange,
}: {
  hasError: boolean;
  onValueChange: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;
  const label = isVisible ? "Ocultar senha" : "Mostrar senha";

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="login-password">
        Senha
      </label>
      <div className={styles.inputShell} data-invalid={hasError ? "true" : undefined}>
        <Lock className={styles.inputIcon} aria-hidden="true" />
        <input
          id="login-password"
          name="password"
          type={isVisible ? "text" : "password"}
          autoComplete="current-password"
          required
          aria-invalid={hasError}
          aria-describedby={hasError ? LOGIN_ERROR_ID : undefined}
          className={styles.input}
          placeholder="Digite sua senha"
          onChange={onValueChange}
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

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
      <span className={styles.submitContent}>
        {pending ? <LoaderCircle className={styles.submitSpinner} aria-hidden="true" /> : null}
        {pending ? "Entrando..." : "Entrar"}
      </span>
    </button>
  );
}

export function LoginFormControls({ hasError }: { hasError: boolean }) {
  const [isErrorVisible, setIsErrorVisible] = useState(hasError);
  const [lastHasError, setLastHasError] = useState(hasError);

  if (lastHasError !== hasError) {
    setLastHasError(hasError);
    setIsErrorVisible(hasError);
  }

  useEffect(() => {
    if (hasError) {
      clearLoginErrorFromUrl();
    }
  }, [hasError]);

  function clearVisibleError() {
    if (!isErrorVisible) return;
    setIsErrorVisible(false);
  }

  return (
    <>
      <EmailField hasError={isErrorVisible} onValueChange={clearVisibleError} />
      <PasswordField hasError={isErrorVisible} onValueChange={clearVisibleError} />

      <LoginErrorMessage show={isErrorVisible} />

      <p className={styles.supportNote}>
        Esqueceu a senha? Procure a liderança responsável pelo seu acesso.
      </p>

      <LoginSubmitButton />
    </>
  );
}
