import Link from "next/link";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-3 text-stone-700">Use the email address and password for your account.</p>
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-stone-700">
        Need an account?{" "}
        <Link
          href="/register"
          className="font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}
