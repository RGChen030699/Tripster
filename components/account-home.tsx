import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

const primaryLinkClassName =
  "inline-flex rounded-md bg-teal-800 px-4 py-2 font-medium text-white outline-none hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

const secondaryLinkClassName =
  "inline-flex rounded-md border border-stone-300 bg-white px-4 py-2 font-medium text-stone-900 outline-none hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800";

export function AccountHome({ email }: { email: string | null }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tripster</h1>
        <p className="mt-3 text-stone-700">A shared place to plan a trip.</p>
      </div>
      {email ? (
        <section className="rounded-lg border border-stone-200 bg-white p-6" aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-lg font-semibold">
            Your account
          </h2>
          <p className="mt-2">
            Signed in as <span className="font-medium">{email}</span>
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-stone-200 bg-white p-6" aria-labelledby="welcome-heading">
          <h2 id="welcome-heading" className="text-lg font-semibold">
            Create an account or log in
          </h2>
          <p className="mt-2 text-stone-700">
            Use your email address and a password. Accounts stay on this server only until it restarts.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/register" className={primaryLinkClassName}>
              Create an account
            </Link>
            <Link href="/login" className={secondaryLinkClassName}>
              Log in
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
