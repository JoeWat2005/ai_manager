// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center gap-4">
      <Link href="/sign-in" className="btn">
        Sign in
      </Link>
      <Link href="/sign-up" className="btn">
        Sign up
      </Link>
    </main>
  );
}