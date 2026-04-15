// sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <SignIn forceRedirectUrl="/post-auth" />
    </main>
  );
}