import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown by Next.js for any [slug]/dashboard/** route while data is loading.
 * Matches the visual shape of the hero + stat cards so there's no layout shift.
 */
export default function DashboardLoading() {
  return (
    <main className="space-y-6">
      {/* Hero skeleton */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-96" />
      </section>

      {/* Stat cards skeleton */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-9 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Navigation cards skeleton */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
