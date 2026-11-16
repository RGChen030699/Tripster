import Link from "next/link";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Log in</h1>
      <p className="mt-3 text-ink-muted">Use the email address and password for your account.</p>
      <div className="mt-6 rounded-lg border border-sand bg-panel p-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-ink-muted">
        Need an account?{" "}
        <Link
          href="/register"
          className="font-medium text-ink underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}
