import { HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { LoginErrorMessage, PasswordField } from "@/app/login/login-form-controls";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { homeForRole } from "@/lib/auth/redirects";

function safeNextParam(value: string | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/logout")) return null;
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>;
}) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(homeForRole(user.role));
  }

  const params = await searchParams;
  const hasError = params.erro === "credenciais";
  const nextPath = safeNextParam(params.next);

  return (
    <main className="safe-page login-page flex min-h-screen items-center">
      <section className="w-full">
        <div className="login-card rounded-[24px] border p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="login-logo inline-flex h-10 w-10 items-center justify-center rounded-[12px] border">
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </div>
            <ThemeToggle variant="card" />
          </div>

          <div className="mt-6 border-b border-[var(--login-divider)] pb-5">
            <p className="login-brand-kicker text-[11px] font-extrabold uppercase tracking-[0.18em]">
              Koinonia
            </p>
            <h1 className="font-serif-display mt-2 max-w-[15ch] text-[1.82rem] font-bold leading-[0.98] tracking-normal text-[var(--login-title)] sm:text-[2.1rem]">
              Cuidado pastoral em suas mãos.
            </h1>
            <p className="mt-3 max-w-[34rem] text-[13px] leading-[1.5] text-[var(--login-text)] sm:text-sm">
              Entre com seu e-mail e sua senha para acessar sua visão pastoral.
            </p>
          </div>

          <form action={loginAction} className="mt-6 flex flex-col gap-4">
            {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

            <label className="block">
              <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--login-muted)]">E-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="login-input min-h-[48px] w-full rounded-[16px] border px-4 text-[15px] font-medium outline-none transition"
                placeholder="nome@igreja.com"
              />
            </label>

            <PasswordField />

            <LoginErrorMessage show={hasError} />

            <button
              type="submit"
              className="login-submit mt-1 inline-flex min-h-[48px] w-full items-center justify-center rounded-[16px] px-4 text-sm font-bold transition"
            >
              Entrar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
