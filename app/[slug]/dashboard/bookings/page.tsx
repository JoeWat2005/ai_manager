import { BookingsWorkspace } from "@/components/dashboard/BookingsWorkspace";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { getBookableStaffProfiles, getOrCreateBookingSettings } from "@/lib/bookings/service";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { startTimer } from "@/lib/perf";
import { prisma } from "@/lib/prisma";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  // Show bookings from 60 days ago through 60 days ahead — avoids loading the
  // entire booking history for orgs that have been running for months.
  const windowStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const tData = startTimer(`bookings data [org=${organization.id}]`);
  const [settings, staffProfiles, bookings] = await Promise.all([
    getOrCreateBookingSettings(organization.id),
    getBookableStaffProfiles(organization.id),
    prisma.booking.findMany({
      where: {
        organizationId: organization.id,
        startAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        source: true,
        status: true,
        service: true,
        startAt: true,
        endAt: true,
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { startAt: "desc" },
      take: 200,
    }),
  ]);
  tData();

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Bookings"
        title="Booking operations"
        description="Multi-staff auto-assigned bookings with instant confirmation."
      />

      <BookingsWorkspace
        slug={slug}
        initialBookings={bookings.map((booking) => ({
          ...booking,
          startAt: booking.startAt.toISOString(),
          endAt: booking.endAt.toISOString(),
        }))}
        initialSettings={settings}
        initialStaffProfiles={staffProfiles}
      />
    </main>
  );
}
