"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setError("Could not log out.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not log out.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        className="rounded-md border border-stone-300 bg-white px-4 py-2 font-medium text-stone-900 outline-none hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:opacity-60"
      >
        {pending ? "Logging out..." : "Log out"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-950">
          {error}
        </p>
      ) : null}
    </div>
  );
}
