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
    <main className="safe-page flex min-h-screen items-center">
      <section className="w-full space-y-5">
        <div className="rounded-[28px] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-[var(--color-brand-accent)] shadow-card">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <ThemeToggle variant="card" showLabel />
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">
              Koinonia
            </p>
            <h1 className="font-serif-display mt-3 text-[2.1rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-text-primary)]">
              Cuidado pastoral em suas mãos.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Entre com seu e-mail e sua senha para abrir sua visão e cuidar apenas do que está sob sua responsabilidade.
            </p>
          </div>

          <form action={loginAction} className="mt-6 space-y-4">
            {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">E-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-h-12 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-page)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand-accent)]"
                placeholder="voce@igreja.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Senha</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="min-h-12 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-page)] px-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand-accent)]"
                placeholder="Sua senha"
              />
            </label>

            {hasError ? (
              <p className="rounded-2xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-4 py-3 text-sm font-medium text-[var(--color-badge-risco-text)]">
                E-mail ou senha não conferem.
              </p>
            ) : null}

            <button
              type="submit"
              className="k-primary-action inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold transition active:scale-[0.98]"
            >
              Entrar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
