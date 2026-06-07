import { UserRole } from "@/generated/prisma/client";
import { InfoCard } from "@/components/shared/base-cards";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { InputField, SelectField } from "@/components/ui/field";
import { userRoleDescriptions, userRoleLabels } from "@/features/users/user-display";
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  userFormErrorMessage,
  userFormFieldErrors,
} from "@/features/users/user-form";

export type UserPersonOption = {
  id: string;
  fullName: string;
  phone: string | null;
  linkedUserName?: string | null;
};

export type UserFormInitialValues = {
  name: string;
  email: string;
  role: UserRole;
  personId: string | null;
  isActive: boolean;
};

const roleOptions: UserRole[] = [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPERVISOR, UserRole.LEADER];

function roleOptionLabel(role: UserRole) {
  return `${userRoleLabels[role]} — ${userRoleDescriptions[role]}`;
}

export function UserForm({
  title,
  description,
  action,
  submitLabel,
  backHref,
  backLabel,
  initialValues,
  personOptions,
  errorCode,
  requirePassword = false,
  selfEditing = false,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  backHref: string;
  backLabel: string;
  initialValues: UserFormInitialValues;
  personOptions: UserPersonOption[];
  errorCode?: string;
  requirePassword?: boolean;
  selfEditing?: boolean;
}) {
  const errorMessage = userFormErrorMessage(errorCode);
  const fieldErrors = userFormFieldErrors(errorCode);

  return (
    <div className="space-y-4">
      <ButtonLink href={backHref} variant="ghost" size="sm" density="inlineAction" className="mb-1">
        ← {backLabel}
      </ButtonLink>

      <Card padding="sm" radius="lg" surface="heroGlow">
        <p className="k-eyebrow mb-2">Acesso</p>
        <h2 className="font-serif-display text-[length:var(--text-2xl)] font-semibold leading-tight text-[color:var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
          {description}
        </p>
      </Card>

      {errorMessage ? <InfoCard tone="error">{errorMessage}</InfoCard> : null}
      {selfEditing ? (
        <InfoCard tone="warning">
          Este é o seu usuário. O papel e o status permanecem protegidos para evitar perda de acesso.
        </InfoCard>
      ) : null}

      <form action={action} className="space-y-4">
        <Card padding="md" radius="lg" className="space-y-4">
          <div>
            <p className="k-eyebrow mb-3">Dados de login</p>
            <div className="grid gap-4">
              <InputField
                id="user-name"
                name="name"
                label="Nome"
                labelVariant="item"
                defaultValue={initialValues.name}
                maxLength={USER_NAME_MAX_LENGTH}
                required
                error={fieldErrors.name}
                placeholder="Nome de quem vai acessar"
                surface="warm"
              />

              <InputField
                id="user-email"
                name="email"
                label="Login"
                labelVariant="item"
                defaultValue={initialValues.email}
                maxLength={USER_EMAIL_MAX_LENGTH}
                required
                error={fieldErrors.email}
                description="Pode ser um e-mail real ou um login técnico temporário, como nome@koinonia.local."
                placeholder="nome@koinonia.local"
                type="email"
                autoComplete="username"
                surface="warm"
              />

              {requirePassword ? (
                <InputField
                  id="user-password"
                  name="password"
                  label="Senha inicial"
                  labelVariant="item"
                  required
                  minLength={USER_PASSWORD_MIN_LENGTH}
                  error={fieldErrors.password}
                  description="A pessoa usará esta senha no primeiro acesso. A troca de senha entra na próxima etapa."
                  type="password"
                  autoComplete="new-password"
                  surface="warm"
                />
              ) : null}
            </div>
          </div>

          <div>
            <p className="k-eyebrow mb-3">Papel e vínculo</p>
            <div className="grid gap-4">
              <SelectField
                id="user-role"
                name="role"
                label="Papel"
                labelVariant="item"
                defaultValue={initialValues.role}
                required
                disabled={selfEditing}
                error={fieldErrors.role}
                surface="warm"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {roleOptionLabel(role)}
                  </option>
                ))}
              </SelectField>
              {selfEditing ? <input type="hidden" name="role" value={initialValues.role} /> : null}

              <SelectField
                id="user-person"
                name="personId"
                label="Pessoa vinculada"
                labelVariant="item"
                defaultValue={initialValues.personId ?? ""}
                error={fieldErrors.personId}
                description="Use o vínculo para ligar o acesso ao telefone, célula e histórico pastoral da pessoa."
                surface="warm"
              >
                <option value="">Sem vínculo por enquanto</option>
                {personOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}{person.phone ? ` · ${person.phone}` : ""}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <Card padding="sm" radius="sm" tone="inset" elevation="none">
            <label className="flex items-start gap-3 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={initialValues.isActive || selfEditing}
                disabled={selfEditing}
                className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
              />
              {selfEditing ? <input type="hidden" name="isActive" value="on" /> : null}
              <span>
                <span className="block font-semibold text-[color:var(--color-text-primary)]">Usuário ativo</span>
                <span className="mt-1 block leading-relaxed">
                  Usuários inativos não conseguem entrar no sistema e deixam de aparecer como responsáveis ativos.
                </span>
              </span>
            </label>
          </Card>
        </Card>

        <Card padding="sm" radius="lg" tone="inset" className="flex flex-col gap-3 min-[420px]:flex-row">
          <ButtonLink href={backHref} variant="secondary" size="lg" fullWidth>
            Cancelar
          </ButtonLink>
          <Button type="submit" size="lg" fullWidth>
            {submitLabel}
          </Button>
        </Card>
      </form>
    </div>
  );
}
