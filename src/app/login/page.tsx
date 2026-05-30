import { HeartHandshake } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { LoginFormControls } from "@/app/login/login-form-controls";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getAuthenticatedUser } from "@/lib/auth/current-user";
import { homeForRole } from "@/lib/auth/redirects";
import { ROUTES } from "@/lib/routes";
import styles from "./login.module.css";

function safeNextParam(value: string | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith(ROUTES.login) || value.startsWith(ROUTES.logout)) return null;
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
    <main data-page="login" className={`${styles.page} safe-page flex min-h-screen items-center`}>
      <section className="w-full">
        <div className={styles.card}>
          <div className="k-card-header-row">
            <div className={styles.logo}>
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </div>
            <ThemeToggle variant="card" />
          </div>

          <div className={styles.intro}>
            <p className={styles.brandKicker}>
              Koinonia
            </p>
            <h1 className={styles.title}>
              Cuidado pastoral em suas mãos.
            </h1>
            <p className={styles.subtitle}>
              Entre com seu e-mail e sua senha para acessar sua visão pastoral.
            </p>
          </div>

          <form action={loginAction} className={`${styles.form} mt-6`}>
            {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

            <LoginFormControls hasError={hasError} />
          </form>
        </div>
      </section>
    </main>
  );
}
