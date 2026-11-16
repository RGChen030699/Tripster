import Link from "next/link";

import { CreateTripForm } from "@/components/create-trip-form";

export default function NewTripPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Create a trip</h1>
      <p className="mt-3 text-stone-700">
        Give the trip a name, a destination, and the dates you are traveling.
      </p>
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
        <CreateTripForm />
      </div>
      <p className="mt-6">
        <Link
          href="/"
          className="font-medium text-teal-900 underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          Back to trips
        </Link>
      </p>
    </main>
  );
}
