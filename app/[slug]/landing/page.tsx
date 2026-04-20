import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateReceptionistConfig, getOrganizationBySlug } from "@/lib/reception/org";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const WebChatWidget = dynamic(
  () => import("@/components/reception/WebChatWidget").then((mod) => mod.WebChatWidget),
  {
    loading: () => (
      <section className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Loading receptionist chat...</h2>
        <p className="mt-2 text-sm text-slate-600">
          Preparing secure session and conversation context.
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
        </div>
      </section>
    ),
  }
);

const valueProps = [
  {
    title: "Immediate response",
    copy: "Customers get answers now, even when your team is busy or after-hours.",
  },
  {
    title: "Qualified callbacks",
    copy: "We collect clear callback context so your follow-up is fast and focused.",
  },
  {
    title: "Consistent handoff",
    copy: "Every lead lands in a structured queue for reliable next actions.",
  },
];

const helpTopics = [
  "General service questions",
  "Pricing and package overview",
  "Availability and callback scheduling",
  "Urgent request escalation path",
];

export default async function OrgLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  let phoneExtension: string | null = null;
  let phoneEnabled = false;
  let chatEnabled = false;
  let timezone = "Europe/London";

  if (organization.hasPaidPlan) {
    const config = await getOrCreateReceptionistConfig(
      organization.id,
      "missing-email@deskcaptain.local"
    );
    phoneExtension = config.phoneExtension;
    phoneEnabled = config.phoneEnabled;
    chatEnabled = config.chatEnabled;
    timezone = config.timezone;
  }

  return (
    <main className={`${bodyFont.className} min-h-screen bg-slate-50`}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.17em] text-primary uppercase">
                {organization.name}
              </p>
              <h1 className={`${headingFont.className} mt-1 text-3xl font-bold tracking-tight text-slate-900`}>
                Welcome to {organization.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                AI receptionist support for quick answers and callback requests.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${organization.hasPaidPlan ? "badge-primary" : "badge-outline"}`}>
                {organization.hasPaidPlan ? "Receptionist active" : "Receptionist inactive"}
              </span>
              <Link className="btn btn-outline btn-sm" href={`/${slug}/dashboard`}>
                Business portal
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold tracking-[0.17em] text-primary uppercase">
              Customer support desk
            </p>
            <h2 className={`${headingFont.className} mt-2 text-4xl font-bold tracking-tight text-slate-900`}>
              Get help now, not later.
            </h2>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Tell us what you need and our AI receptionist will answer common questions,
              collect details, and arrange a callback from the team.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {valueProps.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className={`${headingFont.className} text-sm font-semibold text-slate-900`}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Phone line
                </p>
                {organization.hasPaidPlan && phoneEnabled && phoneExtension ? (
                  <>
                    <p className="mt-2 text-sm text-slate-700">
                      Call our UK receptionist line and enter extension:
                    </p>
                    <p className={`${headingFont.className} mt-1 text-2xl font-bold text-slate-900`}>
                      Ext {phoneExtension}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    Phone receptionist is not currently enabled for this business.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Coverage
                </p>
                <p className={`${headingFont.className} mt-1 text-2xl font-bold text-slate-900`}>
                  24/7 inbound capture
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Timezone default: {timezone}. Human follow-up is handled by the business team.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className={`${headingFont.className} text-lg font-semibold text-slate-900`}>
                Common request topics
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {helpTopics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <div className="lg:sticky lg:top-6 lg:self-start">
            {chatEnabled ? (
              <WebChatWidget slug={slug} />
            ) : (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className={`${headingFont.className} text-xl font-semibold text-slate-900`}>
                  Web receptionist unavailable
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Chat support is currently offline for this business. Please leave a callback
                  request through the listed phone flow.
                </p>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
