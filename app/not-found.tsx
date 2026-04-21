"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const REDIRECT_SECONDS = 5;
const REDIRECT_MS = REDIRECT_SECONDS * 1000;

export default function NotFoundPage() {
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState(REDIRECT_MS);
  const [cancelled, setCancelled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });
      tl.from(".not-found-num", { scale: 0.6, opacity: 0, duration: 0.7 })
        .from(".not-found-content", { y: 20, opacity: 0, duration: 0.5 }, "-=0.3");
    },
    { scope: containerRef }
  );

  useEffect(() => {
    if (cancelled) return;
    const startedAt = Date.now();
    const reduceMotion =
      document.documentElement.dataset.a11yMotion === "reduce" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tickMs = reduceMotion ? 1000 : 100;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(REDIRECT_MS - elapsed, 0);
      setRemainingMs(next);
      if (next <= 0) {
        window.clearInterval(timer);
        router.replace("/");
      }
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [cancelled, router]);

  const progress = useMemo(() => REDIRECT_MS - remainingMs, [remainingMs]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div ref={containerRef} className="mx-auto w-full max-w-lg text-center">
        {/* 404 number */}
        <div className="not-found-num mb-6 flex items-center justify-center">
          <span className="select-none text-[8rem] font-black leading-none tracking-tighter text-foreground/10 sm:text-[10rem]">
            404
          </span>
        </div>

        <div className="not-found-content space-y-4">
          <Badge variant="outline">Page not found</Badge>

          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            This page doesn't exist
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            The page you requested does not exist or may have moved.
            {!cancelled && (
              <> Redirecting you home in{" "}
                <strong className="text-foreground">
                  {Math.max(1, Math.ceil(remainingMs / 1000))}s
                </strong>.
              </>
            )}
          </p>

          {!cancelled && (
            <Progress value={(progress / REDIRECT_MS) * 100} className="mx-auto h-1.5 max-w-xs" />
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {!cancelled && (
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() => setCancelled(true)}
              >
                Cancel redirect
              </button>
            )}
            <Link href="/" className={cn(buttonVariants({ size: "sm" }))}>
              Go home
            </Link>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              onClick={() => router.back()}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
