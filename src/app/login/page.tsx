import { HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/login/actions";
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
        <div className="login-card rounded-[24px] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-[var(--color-brand-accent)] shadow-card">
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </div>
            <ThemeToggle variant="card" />
          </div>

          <div className="mt-6 border-b border-[var(--color-border-divider)] pb-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">
              Koinonia
            </p>
            <h1 className="font-serif-display mt-2 max-w-[15ch] text-[1.82rem] font-bold leading-[0.98] tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-[2.1rem]">
              Cuidado pastoral em suas mãos.
            </h1>
            <p className="mt-3 max-w-[34rem] text-[13px] leading-[1.5] text-[var(--color-text-secondary)] sm:text-sm">
              Entre com seu e-mail e sua senha para acessar sua visão pastoral.
            </p>
          </div>

          <form action={loginAction} className="mt-6 flex flex-col gap-4">
            {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

            <label className="block">
              <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">E-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-h-[48px] w-full rounded-[16px] border border-[var(--color-border-card)] bg-[var(--color-bg-page)] px-4 text-[15px] font-medium text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="voce@igreja.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">Senha</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="min-h-[48px] w-full rounded-[16px] border border-[var(--color-border-card)] bg-[var(--color-bg-page)] px-4 text-[15px] font-medium text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Sua senha"
              />
            </label>

            {hasError ? (
              <p className="rounded-[16px] border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-4 py-3 text-sm font-medium text-[var(--color-badge-risco-text)]">
                E-mail ou senha não conferem.
              </p>
            ) : null}

            <button
              type="submit"
              className="k-primary-action mt-1 inline-flex min-h-[48px] w-full items-center justify-center rounded-[16px] px-4 text-sm font-bold transition active:scale-[0.98]"
            >
              Entrar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
