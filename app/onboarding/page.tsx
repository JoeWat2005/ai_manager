// app/onboarding/page.tsx
import { CreateOrganization } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default function OnboardingPage() {
  return (
    <AuthShell
      title="Set up your organization"
      description="Create your Deskcaptain workspace and invite your team."
    >
      <CreateOrganization
        afterCreateOrganizationUrl="/post-auth"
        skipInvitationScreen={false}
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
