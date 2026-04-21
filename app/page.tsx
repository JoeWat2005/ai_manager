import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BotIcon,
  CalendarCheckIcon,
  CheckIcon,
  LayoutDashboardIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FeatureReveal } from "@/components/landing/FeatureReveal";
import { HeroAnimation } from "@/components/landing/HeroAnimation";
import { HeroStatsCard } from "@/components/landing/HeroStatsCard";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Static data ──────────────────────────────────────────────────────────────

const features = [
  {
    icon: PhoneCallIcon,
    title: "24/7 AI phone receptionist",
    description:
      "Never miss an inbound call. Our AI answers, qualifies intent, and captures leads even when your team is offline.",
  },
  {
    icon: BotIcon,
    title: "Intelligent web chat",
    description:
      "Deploy a qualification-first web chat widget that routes hot leads instantly and books appointments automatically.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Instant booking confirmation",
    description:
      "Auto-assign the best available staff slot, confirm in seconds, and send reminders — zero manual back-and-forth.",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Unified operations dashboard",
    description:
      "Manage leads, chat transcripts, bookings, analytics, notifications, and team in one clean workspace.",
  },
  {
    icon: ZapIcon,
    title: "Lead qualification engine",
    description:
      "Score and route every inbound contact by intent. Hot leads surface immediately; cold ones queue for follow-up.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Audit log and compliance",
    description:
      "Full activity trail for every booking, chat, and team action. Built for businesses that need accountability.",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "£0",
    period: "forever",
    description: "Test workflows and validate demand before go-live.",
    features: ["Landing page", "Basic dashboard", "Manual bookings"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "£79",
    period: "/ month",
    description: "Full AI receptionist for live operations.",
    features: [
      "Phone + web AI receptionist",
      "Leads + chat transcript inbox",
      "Multi-staff booking auto-assignment",
      "Operational notifications",
      "Audit log",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    description: "Multi-location operations with dedicated support.",
    features: [
      "Everything in Pro",
      "Higher usage limits",
      "Priority onboarding",
      "Custom workflow support",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/post-auth");

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] overflow-hidden bg-slate-950">
        {/* Grid bg */}
        <div className="hero-grid-bg pointer-events-none absolute inset-0 opacity-100" />

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[600px] w-[600px] translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-24 lg:pt-32">
          {/* ── Left: headline ── */}
          <HeroAnimation>
            <span className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-blue-400" />
              </span>
              UK MVP ready — AI receptionist
            </span>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              {"Premium AI receptionist for businesses that want".split(" ").map((w, i) => (
                <span key={i} className="hero-word inline-block">
                  {w}&nbsp;
                </span>
              ))}
              <span className="hero-word inline-block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                zero missed opportunities.
              </span>
            </h1>

            <p className="hero-sub mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Deskcaptain captures inbound phone and web demand, qualifies
              intent, confirms bookings, and queues actionable follow-up for
              your team — 24/7.
            </p>

            <div className="hero-ctas mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/25"
              >
                Create workspace
                <ArrowRightIcon className="size-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
              >
                View plans
              </a>
            </div>
          </HeroAnimation>

          {/* ── Right: stats card ── */}
          <div className="mt-14 lg:mt-0">
            <HeroStatsCard />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-background py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <Badge variant="outline" className="mb-3 text-primary">
              Features
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Everything your front desk needs
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              From first contact to confirmed booking, Deskcaptain handles the
              entire inbound journey.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FeatureReveal key={feature.title} index={i}>
                <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-muted/50">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </FeatureReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-muted/30 py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <Badge variant="outline" className="mb-3 text-primary">
              Pricing
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              One clear path from free to live
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Start free, validate your inbound demand, then upgrade when you
              are ready for live AI receptionist automation.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl border bg-card p-7",
                  plan.highlight
                    ? "border-primary/50 shadow-xl shadow-primary/10"
                    : "border-border"
                )}
              >
                {plan.highlight && (
                  <>
                    <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/12 blur-2xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                  </>
                )}

                <div className="relative flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  {plan.highlight && (
                    <Badge className="text-[10px]">Most popular</Badge>
                  )}
                </div>

                <div className="relative mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>

                <p className="relative mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <ul className="relative mt-5 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <CheckIcon className="size-2.5 text-primary" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/sign-up"
                  className={cn(
                    "relative mt-7 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all",
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to capture every opportunity?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Start free today. No credit card required. Set up your AI
            receptionist in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/25"
            >
              Create your workspace
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-slate-950 py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/deskcaptain.png"
                alt="Deskcaptain"
                width={110}
                height={110}
                className="rounded-xl opacity-70"
              />
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                Features
              </a>
              <a href="#pricing" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                Pricing
              </a>
              <Link href="/sign-in" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
                Sign in
              </Link>
            </div>
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Deskcaptain. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
