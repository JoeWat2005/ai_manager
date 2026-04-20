// app/pricing/page.tsx
import { PricingTable } from "@clerk/nextjs";
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-base-200/50 py-8">
      <div className="app-shell space-y-6">
        <section className="app-card">
          <div className="card-body gap-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Pricing
            </p>
            <h1 className="app-title">Choose the plan that fits your front desk</h1>
            <p className="app-subtitle">
              Start free, then upgrade when your inbound volume grows.
            </p>
            <div>
              <Link href="/" className="btn btn-outline btn-sm">
                Back to landing
              </Link>
            </div>
          </div>
        </section>

        <section className="app-card">
          <div className="card-body">
            <PricingTable for="organization" newSubscriptionRedirectUrl="/post-auth" />
          </div>
        </section>
      </div>
    </main>
  );
}
