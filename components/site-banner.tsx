import Link from "next/link";

export function SiteBanner() {
  return (
    <header className="border-b border-sand bg-sand">
      <div className="mx-auto flex max-w-lg flex-col items-start px-6 py-5 text-left">
        <Link
          href="/"
          className="font-display text-3xl font-semibold tracking-tight text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Tripster
        </Link>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">A shared place to plan a trip.</p>
      </div>
    </header>
  );
}
