import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const featureCards = [
  {
    title: "Phone + web chat receptionist",
    description:
      "Capture inbound lead intent 24/7 and route urgent requests to your team.",
  },
  {
    title: "Qualified callback queue",
    description:
      "Collect caller name, phone, and callback details before human follow-up.",
  },
  {
    title: "Operator-friendly dashboard",
    description:
      "Run bookings, leads, analytics, and settings in a single responsive workspace.",
  },
];

const flowSteps = [
  "Customer calls or starts web chat",
  "AI receptionist gathers qualifying details",
  "Lead enters your queue with context",
  "Team follows up and closes faster",
];

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/post-auth");
  }

  return (
    <div data-theme="light" className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 bg-base-100">
        <div className="app-shell flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/deskcaptain.png"
              alt="Deskcaptain logo"
              width={44}
              height={44}
              className="rounded-lg"
              priority
            />
            <div>
              <p className="font-semibold text-base-content">Deskcaptain</p>
              <p className="text-xs text-base-content/70">AI receptionist for SMBs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="app-shell grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="space-y-5">
            <span className="badge badge-primary badge-outline">UK MVP ready</span>
            <h1 className="text-4xl font-bold tracking-tight text-base-content sm:text-5xl">
              AI receptionist that helps small businesses stop missing leads.
            </h1>
            <p className="max-w-2xl text-base text-base-content/75">
              Deskcaptain captures inbound phone and chat requests, qualifies intent,
              and queues callback-ready leads for your team.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="btn btn-primary btn-wide">
                Create workspace
              </Link>
              <Link href="/pricing" className="btn btn-outline btn-wide">
                View pricing
              </Link>
            </div>
          </div>

          <article className="app-card">
            <div className="card-body p-5 sm:p-6">
              <h2 className="card-title">Today&apos;s reception snapshot</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                  <p className="text-xs text-base-content/70">Inbound attempts</p>
                  <p className="mt-1 text-2xl font-bold">46</p>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                  <p className="text-xs text-base-content/70">Qualified leads</p>
                  <p className="mt-1 text-2xl font-bold text-primary">29</p>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                  <p className="text-xs text-base-content/70">Median response</p>
                  <p className="mt-1 text-2xl font-bold">3.1s</p>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100 p-3">
                  <p className="text-xs text-base-content/70">Queue readiness</p>
                  <p className="mt-1 text-2xl font-bold">91%</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="app-shell py-4 lg:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => (
              <article key={feature.title} className="app-card">
                <div className="card-body">
                  <h2 className="card-title text-base">{feature.title}</h2>
                  <p className="text-sm text-base-content/75">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="app-shell py-8 lg:py-12">
          <article className="app-card">
            <div className="card-body p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
              <ul className="steps steps-vertical mt-6 w-full lg:steps-horizontal">
                {flowSteps.map((step) => (
                  <li key={step} className="step step-primary text-sm">
                    {step}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="btn btn-primary">
                  Start free
                </Link>
                <Link href="/stats" className="btn btn-outline">
                  View live stats
                </Link>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
