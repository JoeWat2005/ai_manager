import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthButtons } from "@/components/landing/AuthButtons";
import { CompanyCarousel } from "@/components/landing/CompanyCarousel";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingProductDemo } from "@/components/landing/LandingProductDemo";
import { SocialLinks } from "@/components/landing/SocialLinks";

type IconProps = {
  className?: string;
};

function ArrowRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12h14m0 0-5.5-5.5M19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 6.5v11l9-5.5-9-5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 19.25h16M7.25 16v-4.5m4.75 4.5v-8m4.75 8v-2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navLinks = [
  { href: "#demo", label: "Demo" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#stats", label: "Stats" },
];

const featureList = [
  {
    title: "Booking email confirmations",
    description:
      "Automatically confirms appointments and keeps customers informed before every booking.",
  },
  {
    title: "Booking SMS updates",
    description:
      "Sends real-time texts for confirmations, reminders, and schedule changes.",
  },
  {
    title: "AI receptionist chatbot",
    description:
      "Answers common customer questions and captures booking intent 24/7.",
  },
  {
    title: "AI receptionist phone caller",
    description:
      "Handles inbound call flows with booking context for higher conversion.",
    isPro: true,
  },
  {
    title: "Lead tracking",
    description:
      "Tracks where inquiries come from so you can see which channels drive customers.",
  },
  {
    title: "Booking tracking",
    description:
      "Monitors booking progress from first inquiry to confirmed appointment.",
  },
  {
    title: "Business customization",
    description:
      "Define opening hours, desks, and capacity rules that match your operations.",
  },
  {
    title: "Landing and links pages",
    description:
      "Publish a branded booking-first web presence tailored to your business.",
  },
  {
    title: "Business page editor",
    description:
      "Edit layout, copy, and calls to action without rebuilding your website.",
  },
  {
    title: "Calendar sync",
    description:
      "Keeps your team calendar aligned so availability always reflects reality.",
  },
  {
    title: "SEO tooling",
    description:
      "Improve local discoverability with index-ready content and page structure.",
  },
  {
    title: "Custom domain",
    description:
      "Connect your own domain for a fully branded booking and links experience.",
    isPro: true,
  },
  {
    title: "Automated reminders",
    description:
      "Reduces no-shows with scheduled reminders across email and SMS channels.",
  },
  {
    title: "Availability rules",
    description:
      "Set buffers, booking windows, and slot logic to protect your schedule.",
  },
  {
    title: "Rescheduling flows",
    description:
      "Lets customers move appointments while keeping your team notified.",
  },
];

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/post-auth");
  }

  return (
    <div data-theme="corporate" className="relative min-h-screen bg-base-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-orb absolute -top-28 -left-14 h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
        <div className="landing-orb absolute top-44 right-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-base-300/70 bg-base-100/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-content">
                <span className="text-sm font-bold">DC</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide uppercase">
                Deskcaptain.tech
              </p>
              <p className="text-xs opacity-70">
                Automated front desk for local businesses
              </p>
            </div>
          </div>

          <nav className="hidden lg:block">
            <ul className="menu menu-horizontal gap-1 p-0">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm font-medium">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <AuthButtons variant="navbar" />
          </div>
        </div>

        <nav className="border-t border-base-300/70 lg:hidden">
          <div className="mx-auto w-full max-w-7xl overflow-x-auto px-4 sm:px-6">
            <div className="flex w-max items-center gap-2 py-2">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="btn btn-ghost btn-sm">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 pt-14 pb-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-20 lg:pb-16">
          <div className="space-y-8">
            <div className="landing-fade-up space-y-5">
              <div className="badge badge-primary badge-outline gap-2 py-3">
                Full Auto Front Desk
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Your receptionist, booking manager, and calendar organizer in one
                system.
              </h1>
              <p className="max-w-2xl text-lg text-base-content/75">
                Deskcaptain helps small business owners capture leads, confirm
                appointments, and keep staff calendars in sync without manual
                admin work.
              </p>
            </div>

            <div className="landing-fade-up-delay space-y-3">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/sign-up" className="btn btn-primary btn-block sm:btn-wide">
                  <ArrowRightIcon />
                  Start Free
                </Link>
                <a href="#demo" className="btn btn-outline btn-primary btn-block sm:btn-wide">
                  <PlayIcon />
                  See Demo
                </a>
              </div>
              <p className="text-sm text-base-content/70">
                Already using Deskcaptain?{" "}
                <Link href="/sign-in" className="link link-primary">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="landing-fade-up-delay-2 stats stats-vertical w-full border border-base-300 bg-base-100 shadow sm:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Free Tier Capacity</div>
                <div className="stat-value text-primary">5 Staff</div>
                <div className="stat-desc">All features, limited usage, no AI phone</div>
              </div>
              <div className="stat">
                <div className="stat-title">Pro Tier Capacity</div>
                <div className="stat-value text-accent">15 Staff</div>
                <div className="stat-desc">Limits cut + AI phone + custom domain</div>
              </div>
            </div>
          </div>

          <div className="landing-fade-up-delay">
            <div className="mockup-window border border-base-300 bg-base-200/60 shadow-2xl">
              <div className="grid gap-4 bg-base-100 p-5 sm:p-6">
                <div className="card border border-base-300 bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="card-title text-base">Front Desk Queue</h2>
                      <span className="badge badge-success badge-outline">
                        24/7 Live
                      </span>
                    </div>
                    <p className="text-sm opacity-70">
                      AI is handling booking requests while your team stays focused.
                    </p>
                  </div>
                </div>
                <div className="card border border-base-300 bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <h3 className="card-title text-base">Today&apos;s Activity</h3>
                    <ul className="space-y-2 text-sm opacity-80">
                      <li>8 new leads captured</li>
                      <li>13 bookings confirmed</li>
                      <li>4 appointments rescheduled</li>
                    </ul>
                  </div>
                </div>
                <div className="card border border-base-300 bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <h3 className="card-title text-base">Calendar Sync Status</h3>
                    <progress
                      className="progress progress-primary w-full"
                      value={96}
                      max="100"
                    />
                    <p className="text-sm opacity-70">
                      Availability updated for all active staff desks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-base-300 bg-base-100/85 p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold sm:text-xl">
                Trusted by local teams
              </h2>
              <span className="badge badge-neutral badge-outline">
                Sample brand placeholders
              </span>
            </div>
            <CompanyCarousel />
          </div>
        </section>

        <section
          id="demo"
          className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Interactive product demo</h2>
              <p className="mt-2 max-w-2xl text-base-content/70">
                Explore how AI chat, bookings, and recorded call workflows run
                inside Deskcaptain.
              </p>
            </div>
          </div>
          <LandingProductDemo />
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Feature set built for busy owners</h2>
              <p className="mt-2 max-w-2xl text-base-content/70">
                Everything you need to run booking operations, communication, and
                front-desk flow from one place.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featureList.map((feature) => (
              <article
                key={feature.title}
                className="card border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="card-body gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="card-title text-base leading-snug">
                      {feature.title}
                    </h3>
                    {feature.isPro ? (
                      <span className="badge badge-primary badge-outline">Pro</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-base-content/70">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-bold tracking-tight">How Deskcaptain works</h2>
            <p className="mt-2 text-base-content/70">
              Launch in minutes, automate your front desk, and scale without
              hiring extra admin staff.
            </p>
            <ul className="steps steps-vertical mt-8 w-full lg:steps-horizontal">
              <li className="step step-primary">Set business profile and opening hours</li>
              <li className="step step-primary">Connect calendar and booking channels</li>
              <li className="step step-primary">Automate confirmations, follow-ups, and lead flow</li>
            </ul>
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Simple plans for growing businesses</h2>
              <p className="mt-2 text-base-content/70">
                Start free, then upgrade when your volume and team grow.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body p-6 sm:p-8">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="card-title text-2xl">Free</h3>
                  <span className="badge badge-neutral badge-outline">Starter</span>
                </div>
                <p className="text-base-content/75">
                  All core features with practical limits for early-stage operations.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-base-content/80">
                  <li>Up to 5 staff per business</li>
                  <li>Booking email and SMS workflows</li>
                  <li>AI chatbot receptionist, lead and booking tracking</li>
                  <li>No AI receptionist phone caller</li>
                </ul>
                <div className="card-actions mt-6">
                  <Link href="/pricing" className="btn btn-outline btn-primary">
                    Compare Plans
                  </Link>
                </div>
              </div>
            </article>

            <article className="card border-2 border-primary/70 bg-base-100 shadow-lg shadow-primary/10">
              <div className="card-body p-6 sm:p-8">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="card-title text-2xl">Pro</h3>
                  <span className="badge badge-primary">Most Popular</span>
                </div>
                <p className="text-base-content/75">
                  Full power plan with higher capacity and advanced automation.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-base-content/80">
                  <li>Up to 15 staff per business</li>
                  <li>Limits cut across core workflows</li>
                  <li>AI receptionist phone caller enabled</li>
                  <li>Custom domain support for branded booking pages</li>
                </ul>
                <div className="card-actions mt-6">
                  <Link href="/pricing" className="btn btn-primary">
                    See Pro Pricing
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-2 max-w-2xl text-base-content/70">
              Everything teams usually ask before automating their front desk.
            </p>
          </div>
          <LandingFaq />
        </section>

        <section
          id="stats"
          className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="rounded-2xl border border-base-300 bg-base-100 p-7 shadow-sm sm:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">
                  Real-time platform stats
                </h2>
                <p className="max-w-2xl text-base-content/70">
                  View live totals for signups, organizations, memberships, and
                  paid adoption directly from the current database snapshot.
                </p>
              </div>
              <Link href="/stats" className="btn btn-primary btn-wide">
                <ChartIcon />
                Open Stats Page
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="rounded-2xl border border-base-300 bg-linear-to-r from-primary/10 via-base-100 to-accent/10 p-7 sm:p-10">
            <div className="mx-auto max-w-3xl space-y-5 text-center">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Let Deskcaptain run your front desk while you run your business.
              </h2>
              <p className="text-base-content/75">
                Launch your automated receptionist workflow and booking stack in
                one setup.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" className="btn btn-accent btn-block sm:btn-wide">
                  <ArrowRightIcon />
                  Start Free
                </Link>
                <Link href="/pricing" className="btn btn-outline btn-accent btn-block sm:btn-wide">
                  <ChartIcon />
                  Explore Pricing
                </Link>
              </div>
              <p className="text-sm text-base-content/65">
                Have an account already?{" "}
                <Link href="/sign-in" className="link link-hover">
                  Sign in
                </Link>
              </p>
              <div className="pt-2">
                <SocialLinks className="justify-center" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer footer-center border-t border-base-300 bg-base-200/50 p-8 text-base-content">
        <aside className="space-y-2">
          <p className="font-semibold">Deskcaptain.tech</p>
          <p className="text-sm opacity-70">
            Automated receptionist and booking manager for small business owners.
          </p>
          <SocialLinks variant="ghost" className="justify-center" />
        </aside>
      </footer>
    </div>
  );
}
