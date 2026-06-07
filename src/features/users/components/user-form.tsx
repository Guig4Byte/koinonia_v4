import { UserRole } from "@/generated/prisma/client";
import { InfoCard } from "@/components/shared/base-cards";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import {
  FormFieldStack,
  FormSection,
  formStackClassName,
} from "@/components/ui/form-section";
import { ToggleCardField } from "@/components/ui/toggle-card-field";
import { UserPersonPickerField } from "@/features/users/components/user-person-picker-field";
import {
  UserRoleSelectField,
  type UserRoleSelectOption,
} from "@/features/users/components/user-role-select-field";
import {
  userRoleDescriptions,
  userRoleLabels,
} from "@/features/users/user-display";
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  userFormErrorMessage,
  userFormFieldErrors,
  type UserPersonOption,
} from "@/features/users/user-form";

export type UserFormInitialValues = {
  name: string;
  email: string;
  role: UserRole;
  personId: string | null;
  isActive: boolean;
};

const roleOptions: UserRole[] = [
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.SUPERVISOR,
  UserRole.LEADER,
];

function userRoleSelectOptions(): UserRoleSelectOption[] {
  return roleOptions.map((role) => ({
    value: role,
    label: userRoleLabels[role],
    description: userRoleDescriptions[role],
  }));
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
      <ButtonLink
        href={backHref}
        variant="ghost"
        size="sm"
        density="inlineAction"
        className="mb-1"
      >
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

      <form action={action} className={formStackClassName}>
        <FormSection title="Dados de login">
          <FormFieldStack>
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
          </FormFieldStack>
        </FormSection>

        <FormSection title="Papel e vínculo">
          <FormFieldStack>
            <UserRoleSelectField
              id="user-role"
              name="role"
              label="Papel"
              defaultValue={initialValues.role}
              options={userRoleSelectOptions()}
              required
              disabled={selfEditing}
              error={fieldErrors.role}
            />
            <UserPersonPickerField
              id="user-person"
              name="personId"
              label="Pessoa vinculada"
              defaultValue={initialValues.personId ?? ""}
              people={personOptions}
              error={fieldErrors.personId}
              description="Use o vínculo para ligar o acesso ao telefone, célula e histórico pastoral da pessoa."
            />
          </FormFieldStack>
        </FormSection>

        <FormSection title="Status">
          <ToggleCardField
            name="isActive"
            title="Usuário ativo"
            description="Usuários inativos não conseguem entrar no sistema e deixam de aparecer como responsáveis ativos."
            defaultChecked={initialValues.isActive || selfEditing}
            disabled={selfEditing}
            includeHiddenWhenDisabled={selfEditing}
          />
        </FormSection>

        <Card
          padding="sm"
          radius="lg"
          tone="inset"
          className="flex flex-col gap-3 min-[420px]:flex-row"
        >
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
