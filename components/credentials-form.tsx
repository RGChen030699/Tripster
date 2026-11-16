"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { parseCredentials } from "@/lib/auth/validation";

const inputClassName =
  "mt-1 w-full rounded-md border border-sand bg-panel px-3 py-2 font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type CredentialsFormProps = {
  endpoint: "/api/auth/register" | "/api/auth/login";
  submitLabel: string;
  pendingLabel: string;
  fallbackError: string;
  passwordAutoComplete: "new-password" | "current-password";
  passwordHint?: string;
};

export function CredentialsForm({
  endpoint,
  submitLabel,
  pendingLabel,
  fallbackError,
  passwordAutoComplete,
  passwordHint,
}: CredentialsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const parsed = parseCredentials({ email, password });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const payload: unknown = await readJson(response);
      if (!response.ok) {
        setError(errorMessage(payload, fallbackError));
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(fallbackError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-sm font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-bold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          minLength={8}
          className={inputClassName}
        />
        {passwordHint ? <p className="mt-1 text-sm text-ink-muted">{passwordHint}</p> : null}
      </div>
      {error ? (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-sage bg-sage px-4 py-2 font-bold text-ink outline-none hover:bg-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}
