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
  if (!organization) notFound();

  const [profile, customization] = await Promise.all([
    getOrCreateLinkProfile(organization.id, `${organization.name} links`),
    getOrCreatePageCustomization(organization.id, organization.name),
  ]);

  const visibleItems = profile.items
    .filter((item) => item.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        {/* Profile card */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={`${organization.name} avatar`}
              width={80}
              height={80}
              unoptimized
              className="rounded-full border-2 border-border object-cover shadow-sm"
            />
          ) : (
            <div
              className="flex size-20 items-center justify-center rounded-full text-2xl font-black text-white shadow-sm"
              style={{ backgroundColor: customization.linksAccentColor }}
            >
              {organization.name.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {customization.linksTitle || profile.title}
            </h1>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {customization.linksBio ?? profile.bio ?? "Find all our official channels below."}
            </p>
          </div>
        </div>

        {/* Links */}
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
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No public links have been published yet.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <Link
            href={`/${slug}/landing`}
            className="text-xs text-muted-foreground transition-colors hover:text-primary hover:underline underline-offset-4"
          >
            ← Back to {organization.name}
          </Link>
          {profile.showBranding && (
            <p className="text-xs text-muted-foreground/50">Powered by Deskcaptain</p>
          )}
        </div>
      </div>
    </main>
  );
}
