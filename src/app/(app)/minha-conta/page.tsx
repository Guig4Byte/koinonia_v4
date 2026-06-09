import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FormHero } from "@/components/ui/form-hero";
import { AccountAccessHeroIcon } from "@/components/ui/form-hero-icons";
import { PasswordChangeForm } from "@/features/account/password-change-form";
import { changeOwnPasswordAction } from "@/app/(app)/minha-conta/actions";
import { appNavForRole, homeHrefForRole } from "@/features/navigation/app-nav";
import { userRoleLabels } from "@/features/users/user-display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";
import { firstParam } from "@/lib/search-params";
import pageStyles from "@/components/shared/consultation-page.module.css";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const saved = firstParam(params.salvo);
  const error = firstParam(params.erro);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "none" })}
      headerVariant="compact"
      hideBottomNav
    >
      <div className={`${pageStyles.page} space-y-4`}>
        <ButtonLink
          href={homeHrefForRole(user.role)}
          variant="ghost"
          size="sm"
          density="inlineAction"
          className="mb-1"
        >
          ← Voltar para visão
        </ButtonLink>

        <FormHero
          eyebrow="Minha conta"
          title="Seu acesso"
          description="Confira seus dados de acesso e troque sua senha quando necessário."
          icon={<AccountAccessHeroIcon />}
        />

        <Card padding="md" radius="lg" surface="summaryGlow" className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar name={user.name} size="lg" className="mt-0.5" />
            <div className="min-w-0 space-y-1">
              <p className="text-[length:var(--text-base)] font-extrabold text-[color:var(--color-text-primary)]">
                {user.name}
              </p>
              <p className="truncate text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
                {user.email}
              </p>
              <p className="text-[length:var(--text-xs)] font-bold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                {userRoleLabels[user.role]}
              </p>
            </div>
          </div>
        </Card>

        <PasswordChangeForm
          action={changeOwnPasswordAction}
          errorCode={error}
          success={saved === "senha-alterada"}
        />

        <Card padding="sm" radius="lg" tone="inset">
          <form action={ROUTES.logout} method="post">
            <Button type="submit" variant="secondary" size="lg" fullWidth>
              Sair
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
