import { BookingsWorkspace } from "@/components/dashboard/BookingsWorkspace";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { getOrCreateBookingSettings, syncBookableStaffProfiles } from "@/lib/bookings/service";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const [settings, staffProfiles, bookings] = await Promise.all([
    getOrCreateBookingSettings(organization.id),
    syncBookableStaffProfiles(organization.id),
    prisma.booking.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
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
      orderBy: {
        startAt: "desc",
      },
      take: 250,
    }),
  ]);

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

