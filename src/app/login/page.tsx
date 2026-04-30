import { redirect } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { homeForRole } from "@/lib/auth/redirects";

const seedUsers = [
  { label: "Pastor", email: "pastor@koinonia.local" },
  { label: "Supervisor", email: "ana@koinonia.local" },
  { label: "Líder", email: "bruno@koinonia.local" },
];

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
  const showSeedAccess = process.env.NODE_ENV !== "production";

  return (
    <main className="safe-page flex min-h-screen items-center">
      <section className="w-full space-y-5">
        <div className="rounded-[28px] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Koinonia</p>
          <h1 className="font-serif-display mt-4 text-[2.45rem] font-semibold leading-none tracking-[-0.04em] text-[var(--color-text-primary)]">
            Entrar.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Acesse com seu e-mail para ver apenas o cuidado que está sob sua responsabilidade.
          </p>

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

        {showSeedAccess ? (
          <div className="rounded-[24px] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm shadow-card">
            <p className="font-semibold text-[var(--color-text-primary)]">Acesso de desenvolvimento</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Usuários criados pela seed local. Senha:{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">koinonia123</span>
            </p>
            <div className="mt-3 space-y-2">
              {seedUsers.map((seedUser) => (
                <p key={seedUser.email} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{seedUser.label}</span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{seedUser.email}</span>
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
