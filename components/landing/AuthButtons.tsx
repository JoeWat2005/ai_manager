"use client";

import Link from "next/link";

type AuthButtonsVariant = "navbar" | "hero" | "cta";

type AuthButtonsProps = {
  variant?: AuthButtonsVariant;
};

const stylesByVariant: Record<
  AuthButtonsVariant,
  {
    container: string;
    signIn: string;
    signUp: string;
  }
> = {
  navbar: {
    container: "flex items-center gap-2",
    signIn: "btn btn-ghost btn-sm md:btn-md",
    signUp: "btn btn-primary btn-sm md:btn-md",
  },
  hero: {
    container: "flex w-full flex-col gap-3 sm:flex-row sm:items-center",
    signIn: "btn btn-outline btn-primary btn-block sm:btn-wide",
    signUp: "btn btn-primary btn-block sm:btn-wide",
  },
  cta: {
    container: "flex w-full flex-col gap-3 sm:flex-row sm:justify-center",
    signIn: "btn btn-outline btn-accent btn-block sm:btn-wide",
    signUp: "btn btn-accent btn-block sm:btn-wide",
  },
};

export function AuthButtons({ variant = "navbar" }: AuthButtonsProps) {
  const styles = stylesByVariant[variant];

  return (
    <div className={styles.container}>
      <Link href="/sign-up" className={styles.signUp}>
        Start Free
      </Link>
      <Link href="/sign-in" className={styles.signIn}>
        Sign in
      </Link>
    </div>
  );
}
