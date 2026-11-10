"use client";

import { CredentialsForm } from "@/components/credentials-form";

export function RegisterForm() {
  return (
    <CredentialsForm
      endpoint="/api/auth/register"
      submitLabel="Create account"
      pendingLabel="Creating account..."
      fallbackError="Could not create your account. Try again."
      passwordAutoComplete="new-password"
      passwordHint="At least 8 characters."
    />
  );
}
