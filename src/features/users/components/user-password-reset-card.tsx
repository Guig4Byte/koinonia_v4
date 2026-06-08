import { KeyRound } from "lucide-react";
import { InfoCard } from "@/components/shared/base-cards";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { FormFieldStack, FormSection } from "@/components/ui/form-section";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import {
  userPasswordResetErrorMessage,
  userPasswordResetFieldErrors,
} from "@/features/users/user-password-reset";

export function UserPasswordResetCard({
  action,
  errorCode,
  success,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorCode?: string;
  success?: boolean;
}) {
  const errorMessage = userPasswordResetErrorMessage(errorCode);
  const fieldErrors = userPasswordResetFieldErrors(errorCode);

  return (
    <div className="space-y-3">
      {success ? <InfoCard tone="success">Senha redefinida. Entregue a nova senha temporária com cuidado.</InfoCard> : null}
      {errorMessage ? <InfoCard tone="error">{errorMessage}</InfoCard> : null}

      <form action={action}>
        <FormSection title="Redefinir senha">
          <p className="text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
            Defina uma senha temporária para este usuário. Para trocar a sua própria senha, use Minha conta.
          </p>
          <FormFieldStack>
            <InputField
              id="reset-password"
              name="password"
              label="Nova senha temporária"
              labelVariant="item"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              error={fieldErrors.password}
              surface="warm"
              startIcon={<KeyRound aria-hidden="true" />}
            />
            <InputField
              id="reset-password-confirmation"
              name="passwordConfirmation"
              label="Confirmar senha"
              labelVariant="item"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              error={fieldErrors.passwordConfirmation}
              surface="warm"
              startIcon={<KeyRound aria-hidden="true" />}
            />
          </FormFieldStack>
          <Button type="submit" variant="secondary" size="lg" fullWidth>
            Redefinir senha
          </Button>
        </FormSection>
      </form>
    </div>
  );
}
