"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-slate-950/90 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/deskcaptain.png"
            alt="Deskcaptain"
            width={130}
            height={130}
            className="rounded-xl"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-slate-300 hover:bg-white/10 hover:text-white"
            )}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
