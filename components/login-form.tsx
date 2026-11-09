"use client";

import { CredentialsForm } from "@/components/credentials-form";

export function LoginForm() {
  return (
    <CredentialsForm
      endpoint="/api/auth/login"
      submitLabel="Log in"
      pendingLabel="Logging in..."
      fallbackError="Could not log in. Try again."
      passwordAutoComplete="current-password"
    />
  );
}
