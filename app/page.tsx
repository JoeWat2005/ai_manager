// app/page.tsx
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/post-auth");
  }

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
