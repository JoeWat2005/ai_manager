// app/pricing/page.tsx
import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <main className="min-h-screen p-8">
      <PricingTable
        for="organization"
        newSubscriptionRedirectUrl="/post-auth"
      />
    </main>
  );
}