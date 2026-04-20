// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default function Page() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your bookings, leads, and receptionist settings."
    >
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
