"use client";

import { useEffect } from "react";

import { primaryButtonClassName, secondaryButtonClassName } from "@/components/button-styles";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-stone-700">
        The page hit a client error. This can happen right after a deploy if the browser still has an old
        script cached. Reload to pick up the latest app.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => reset()} className={primaryButtonClassName}>
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.assign("/");
          }}
          className={secondaryButtonClassName}
        >
          Go home
        </button>
      </div>
    </main>
  );
}
