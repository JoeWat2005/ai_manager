import dynamic from "next/dynamic";
import { ClockIcon, PhoneIcon, ZapIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/components/reception/PublicBookingForm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrCreateLinkProfile, getOrCreatePageCustomization } from "@/lib/dashboard/org-resources";
import { getOrCreateReceptionistConfig, getOrganizationBySlug } from "@/lib/reception/org";
import { cn } from "@/lib/utils";

const WebChatWidget = dynamic(
  () => import("@/components/reception/WebChatWidget").then((mod) => mod.WebChatWidget),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loading AI booking assistant…</CardTitle>
          <CardDescription>Preparing chat context and receptionist settings.</CardDescription>
        </CardHeader>
      </Card>
    ),
  }
);

export default async function OrgLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);
  if (!organization) notFound();

  const [customization, linksProfile] = await Promise.all([
    getOrCreatePageCustomization(organization.id, organization.name),
    getOrCreateLinkProfile(organization.id, `${organization.name} links`),
  ]);

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

  const hasLinks = linksProfile.items.filter((i) => i.visible).length > 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="app-shell flex items-center justify-between py-3 gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
              {organization.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasLinks && (
              <Link
                href={`/${slug}/links`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
              >
                Links page
              </Link>
            )}
            <Link
              href={`/${slug}/dashboard`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="app-shell py-10 sm:py-14">
          <Badge variant="outline" className="mb-4 text-primary">Live workspace</Badge>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {customization.landingHeroTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {customization.landingHeroSubtitle}
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section className="app-shell py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
                <ClockIcon className="size-4 text-primary" />
              </div>
              <CardDescription className="text-xs mt-2">Coverage</CardDescription>
              <CardTitle className="text-base font-black">24/7 inbound</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Timezone: {timezone}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
                <PhoneIcon className="size-4 text-primary" />
              </div>
              <CardDescription className="text-xs mt-2">Phone extension</CardDescription>
              <CardTitle className="text-base font-black">
                {phoneEnabled && phoneExtension ? phoneExtension : "Not enabled"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Shared UK number with extension routing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
                <ZapIcon className="size-4 text-primary" />
              </div>
              <CardDescription className="text-xs mt-2">AI concierge</CardDescription>
              <CardTitle className="text-base font-black">
                {chatEnabled ? "Online" : "Offline"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Lead qualification + callback capture</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main content */}
      <section className="app-shell pb-12">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            {customization.landingShowBookingForm && (
              <PublicBookingForm slug={slug} ctaLabel={customization.landingPrimaryCtaLabel} />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need something else?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You can call us and request a callback anytime. Calls may be recorded and
                  handled by AI for service quality.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Recording disclosure enabled</Badge>
                  <Badge variant="outline" className="text-xs">Callback consent capture</Badge>
                  {hasLinks && (
                    <Link href={`/${slug}/links`}>
                      <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        View our links
                        <ArrowRightIcon className="ml-1 size-3" />
                      </Badge>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:sticky xl:top-20 xl:self-start">
            {customization.landingShowChatWidget && chatEnabled ? (
              <WebChatWidget slug={slug} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI chat unavailable</CardTitle>
                  <CardDescription>
                    Chat assistant is currently disabled. Please use the booking form or phone flow.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button
                    type="button"
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    style={{ borderColor: customization.landingAccentColor }}
                  >
                    {customization.landingSecondaryCtaLabel}
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
