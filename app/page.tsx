import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LiveActivityChart } from "@/components/charts/LiveActivityChart";
import { TrackedCtaLink } from "@/components/landing/TrackedCtaLink";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Static data ───────────────────────────────────────────────────────────

const liveStats = [
  { label: "Inbound attempts", value: "128", trend: "+18%" },
  { label: "Qualified leads", value: "83", trend: "+11%" },
  { label: "Median response", value: "2.9s", trend: "−0.4s" },
  { label: "Booking confirms", value: "57", trend: "+22%" },
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path d="M2.5 6.5A2.5 2.5 0 0 1 5 4h14a2.5 2.5 0 0 1 2.5 2.5v11A2.5 2.5 0 0 1 19 20H5a2.5 2.5 0 0 1-2.5-2.5v-11ZM2.5 9h19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Phone + web AI receptionist",
    description: "Capture inbound calls and chat requests 24/7 with qualification-first flows that never miss an opportunity.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path d="M8 2.75V5m8-2.25V5m-11.5 4h15M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Zm4 5.5h3m-3 3h5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Instant booking confirmations",
    description: "Auto-assign the best available staff slot and confirm in seconds — no manual back-and-forth.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path d="M5 19V9m7 10V5m7 14v-7M4 19h16" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Unified operations dashboard",
    description: "Manage leads, chats, bookings, analytics, links, and settings in one clean workspace.",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "£0",
    period: "forever",
    description: "Test Deskcaptain workflows before go-live.",
    features: ["Landing page", "Basic dashboard", "Manual bookings"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "£79",
    period: "/ month",
    description: "Built for live AI receptionist operations.",
    features: [
      "Phone + web AI receptionist",
      "Leads + chat transcript inbox",
      "Multi-staff booking auto-assignment",
      "Notifications + audit log",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    description: "For larger multi-location operations.",
    features: [
      "Higher usage limits",
      "Priority onboarding",
      "Custom workflow support",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/post-auth");

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/deskcaptain.png"
                alt="Deskcaptain logo"
                width={150}
                height={150}
                className="rounded-xl cursor-pointer"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <TrackedCtaLink
              href="/sign-up"
              className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              eventData={{ placement: "header" }}
            >
              Start free
            </TrackedCtaLink>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="mx-auto w-full max-w-7xl grid gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <div className="space-y-6 desk-rise">
            <Badge variant="outline" className="w-fit">
              UK MVP ready
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Premium AI receptionist for businesses that want{" "}
              <span className="text-primary">zero missed opportunities.</span>
            </h1>
            <p className="max-w-lg text-base text-muted-foreground">
              Deskcaptain captures inbound phone + chat demand, qualifies intent, confirms bookings,
              and queues actionable follow-up for your team.
            </p>
            <div className="flex flex-wrap gap-3">
              <TrackedCtaLink
                href="/sign-up"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                eventData={{ placement: "hero-primary" }}
              >
                Create workspace
              </TrackedCtaLink>
              <a
                href="#pricing"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                View plans
              </a>
            </div>
          </div>

          {/* ── Live stats card ── */}
          <Card className="relative overflow-hidden desk-rise-delay shadow-lg">
            {/* Subtle ambient blob */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Live statistics</CardTitle>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="relative inline-flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-65" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2.5">
                {liveStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-xl font-black tabular-nums text-foreground">{stat.value}</p>
                      <span className="text-xs font-semibold text-emerald-600">{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live ApexChart sparkline */}
              <div className="rounded-xl border border-border bg-muted/30 px-2 pb-1 pt-2">
                <div className="mb-1 flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <span>Inbound activity</span>
                  <span>Last 60 min</span>
                </div>
                <LiveActivityChart />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-3 text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl" />

        {/* ── Pricing ── */}
        <section id="pricing" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Pricing</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">
              One page. One clear plan path.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Start free, validate demand, then upgrade when you are ready for live receptionist automation.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlight
                    ? "relative overflow-hidden border-primary/60 shadow-md"
                    : ""
                }
              >
                {plan.highlight && (
                  <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.highlight && (
                      <Badge className="text-[10px]">Most popular</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <ul className="flex flex-col gap-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                        <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-primary" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <TrackedCtaLink
                    href="/sign-up"
                    className={
                      plan.highlight
                        ? "inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        : "inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    }
                    eventData={{ placement: `pricing-${plan.name.toLowerCase()}` }}
                  >
                    {plan.cta}
                  </TrackedCtaLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/deskcaptain.png" alt="" width={150} height={150} className="rounded-lg opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Deskcaptain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
