import Link from "next/link";
import { secondaryButtonClassName } from "@/components/button-styles";

import { CreateTripForm } from "@/components/create-trip-form";

export default function NewTripPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Create a trip</h1>
      <p className="mt-3 text-ink-muted">
        Give the trip a name, a destination, and the dates you are traveling.
      </p>
      <div className="mt-6 rounded-lg border border-sand bg-panel p-6">
        <CreateTripForm />
      </div>
      <p className="mt-6">
        <Link
          href="/"
          className={`${secondaryButtonClassName} self-start`}
        >
          Back to trips
        </Link>
      </p>
    </main>
  );
}
