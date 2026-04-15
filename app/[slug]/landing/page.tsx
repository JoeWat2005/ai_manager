import Link from "next/link";

export default async function OrgLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="max-w-xl w-full rounded-2xl border p-8 space-y-4">
        <h1 className="text-2xl font-semibold">{slug}</h1>
        <p className="opacity-80">
          Your organization workspace is ready. Continue to your dashboard.
        </p>
        <Link className="btn btn-primary" href={`/${slug}/dashboard`}>
          Open dashboard
        </Link>
      </section>
    </main>
  );
}
