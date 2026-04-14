// app/post-auth/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PostAuthPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <main className="p-6">Logged in. Next step: load business and redirect.</main>;
}