"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const REDIRECT_SECONDS = 5;
const REDIRECT_MS = REDIRECT_SECONDS * 1000;

export default function NotFoundPage() {
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState(REDIRECT_MS);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (cancelled) return;

    const startedAt = Date.now();
    const reduceMotion =
      document.documentElement.dataset.a11yMotion === "reduce" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tickMs = reduceMotion ? 1000 : 100;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextRemaining = Math.max(REDIRECT_MS - elapsed, 0);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(timer);
        router.replace("/");
      }
    }, tickMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [cancelled, router]);

  const progressValue = useMemo(
    () => REDIRECT_MS - remainingMs,
    [remainingMs]
  );

  return (
    <main className="min-h-screen bg-base-200/50 py-10">
      <div className="app-shell">
        <section className="mx-auto w-full max-w-2xl card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-5 p-6 sm:p-8">
            <span className="badge badge-outline">404</span>
            <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
            <p className="text-base-content/70">
              The page you requested does not exist or may have moved.
            </p>

            {!cancelled ? (
              <div className="space-y-2">
                <p className="text-sm text-base-content/70">
                  Redirecting to the homepage in{" "}
                  <span className="font-semibold">
                    {Math.max(1, Math.ceil(remainingMs / 1000))}
                  </span>{" "}
                  second(s).
                </p>
                <progress
                  className="progress progress-primary w-full"
                  value={progressValue}
                  max={REDIRECT_MS}
                />
              </div>
            ) : (
              <div className="alert alert-info">
                <span>Auto-redirect cancelled. You can navigate manually below.</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!cancelled && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setCancelled(true)}
                >
                  Cancel redirect
                </button>
              )}
              <Link href="/" className="btn btn-primary btn-sm">
                Go home now
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => router.back()}
              >
                Go back
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
