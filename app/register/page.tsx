import Link from "next/link";

import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Create your account</h1>
      <p className="mt-3 text-ink-muted">
        Use your email address as your username. You can sign in with it after you create an account.
        If that email already has an account, you will see a clear message instead of creating a
        duplicate.
      </p>
      <div className="mt-6 rounded-lg border border-sand bg-panel p-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-ink-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-ink underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Log in
        </Link>
      </p>
    </main>
  );
}
