// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default function Page() {
  return (
    <AuthShell
      title="Create your account"
      description="Set up your workspace and start capturing inbound leads faster."
    >
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}
