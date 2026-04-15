// app/onboarding/page.tsx
import { CreateOrganization } from "@clerk/nextjs";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <CreateOrganization
        afterCreateOrganizationUrl="/post-auth"
        skipInvitationScreen={false}
      />
    </main>
  );
}