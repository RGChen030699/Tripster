"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 px-6 py-16 text-stone-900 antialiased">
        <main className="mx-auto flex max-w-lg flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-stone-700">
            Tripster could not finish loading. Reload the page to recover after a deploy or network
            glitch.
          </p>
          <p className="text-sm text-stone-600">{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center self-start rounded-md bg-teal-800 px-3 py-1.5 text-sm font-medium text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
