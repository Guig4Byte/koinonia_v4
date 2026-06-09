import { KeyRound } from "lucide-react";
import { InfoCard } from "@/components/shared/base-cards";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { FormFieldStack, FormSection } from "@/components/ui/form-section";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import {
  passwordChangeErrorMessage,
  passwordChangeFieldErrors,
} from "@/features/account/password-form";

export function PasswordChangeForm({
  action,
  errorCode,
  success,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorCode?: string;
  success?: boolean;
}) {
  const errorMessage = passwordChangeErrorMessage(errorCode);
  const fieldErrors = passwordChangeFieldErrors(errorCode);

  return (
    <div className="space-y-3">
      {success ? <InfoCard tone="success">Senha alterada com segurança.</InfoCard> : null}
      {errorMessage ? <InfoCard tone="error">{errorMessage}</InfoCard> : null}

      <form action={action}>
        <FormSection title="Trocar senha">
          <p className="text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
            Use sua senha atual para confirmar a alteração.
          </p>
          <FormFieldStack>
            <InputField
              id="current-password"
              name="currentPassword"
              label="Senha atual"
              labelVariant="item"
              type="password"
              autoComplete="current-password"
              required
              error={fieldErrors.currentPassword}
              surface="warm"
              startIcon={<KeyRound aria-hidden="true" />}
            />
            <InputField
              id="new-password"
              name="newPassword"
              label="Nova senha"
              labelVariant="item"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              error={fieldErrors.newPassword}
              surface="warm"
              startIcon={<KeyRound aria-hidden="true" />}
            />
            <InputField
              id="new-password-confirmation"
              name="newPasswordConfirmation"
              label="Confirmar nova senha"
              labelVariant="item"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              error={fieldErrors.newPasswordConfirmation}
              surface="warm"
              startIcon={<KeyRound aria-hidden="true" />}
            />
          </FormFieldStack>
          <Button type="submit" size="lg" fullWidth>
            Salvar nova senha
          </Button>
        </FormSection>
      </form>
    </div>
  );
}
