import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLinkButtons } from "@/components/links/PublicLinkButtons";
import { getOrCreateLinkProfile, getOrCreatePageCustomization } from "@/lib/dashboard/org-resources";
import { getOrganizationBySlug } from "@/lib/reception/org";

export default async function PublicLinksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const [profile, customization] = await Promise.all([
    getOrCreateLinkProfile(organization.id, `${organization.name} links`),
    getOrCreatePageCustomization(organization.id, organization.name),
  ]);

  const visibleItems = profile.items
    .filter((item) => item.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="min-h-screen bg-base-200/40 py-8">
      <div className="app-shell">
        <section className="mx-auto w-full max-w-2xl space-y-6">
          <article className="app-card">
            <div className="card-body items-center text-center">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={`${organization.name} avatar`}
                  width={92}
                  height={92}
                  unoptimized
                  className="rounded-full border border-base-300 object-cover"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white"
                  style={{ backgroundColor: customization.linksAccentColor }}
                >
                  {organization.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <h1 className="text-3xl font-black tracking-tight">{customization.linksTitle || profile.title}</h1>
              <p className="max-w-xl text-sm text-base-content/70">
                {customization.linksBio ?? profile.bio ?? "Find all our official channels below."}
              </p>
            </div>
          </article>

          {visibleItems.length > 0 ? (
            <PublicLinkButtons
              items={visibleItems.map((item) => ({
                id: item.id,
                label: item.label,
                url: item.url,
                platform: item.platform,
              }))}
              accentColor={customization.linksAccentColor}
              buttonStyle={customization.linksButtonStyle}
              slug={slug}
            />
          ) : (
            <article className="app-card">
              <div className="card-body">
                <p className="text-sm text-base-content/70">No public links have been published yet.</p>
              </div>
            </article>
          )}

          <div className="text-center text-sm text-base-content/70">
            <Link href={`/${slug}/landing`} className="link link-primary">
              Back to {organization.name} landing page
            </Link>
          </div>

          {profile.showBranding && (
            <p className="text-center text-xs text-base-content/60">
              Powered by Deskcaptain
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
