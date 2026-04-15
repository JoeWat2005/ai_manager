import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getEffectivePlan, isPaidPlan } from "@/lib/billing/effective-plan";
import { prisma } from "@/lib/prisma";
import { BookingsByDayChart } from "@/components/dashboard/charts/BookingsByDayChart";
import { BookingsSourceDonutChart } from "@/components/dashboard/charts/BookingsSourceDonutChart";
import { BookingsVolumeChart } from "@/components/dashboard/charts/BookingsVolumeChart";

const bookingsByMonth = [
  { month: "Jan", newBookings: 48, completed: 42 },
  { month: "Feb", newBookings: 56, completed: 49 },
  { month: "Mar", newBookings: 63, completed: 55 },
  { month: "Apr", newBookings: 58, completed: 50 },
  { month: "May", newBookings: 72, completed: 65 },
  { month: "Jun", newBookings: 81, completed: 73 },
  { month: "Jul", newBookings: 86, completed: 76 },
  { month: "Aug", newBookings: 79, completed: 69 },
  { month: "Sep", newBookings: 92, completed: 81 },
  { month: "Oct", newBookings: 98, completed: 88 },
  { month: "Nov", newBookings: 104, completed: 95 },
  { month: "Dec", newBookings: 110, completed: 99 },
];

const bookingWeekPerformance = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  confirmed: [18, 20, 16, 22, 25, 19, 14],
  noShows: [3, 2, 4, 3, 5, 3, 2],
};

const bookingSourceSplit = [
  { label: "Website", value: 124 },
  { label: "Chatbot", value: 93 },
  { label: "Phone AI", value: 58 },
  { label: "Manual", value: 27 },
];

const upcomingBookings = [
  {
    customer: "Amelia Jones",
    service: "Initial consultation",
    time: "Today, 3:00 PM",
    status: "confirmed",
  },
  {
    customer: "Ethan Clarke",
    service: "Follow-up",
    time: "Today, 5:30 PM",
    status: "reminder sent",
  },
  {
    customer: "Sofia Patel",
    service: "New booking intake",
    time: "Tomorrow, 9:15 AM",
    status: "pending",
  },
  {
    customer: "Liam Turner",
    service: "Rescheduled check-in",
    time: "Tomorrow, 1:45 PM",
    status: "updated",
  },
];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { orgId } = await auth();
  const { slug } = await params;

  const timelineItems = orgId
    ? await prisma.subscriptionItem.findMany({
        where: {
          subscription: {
            organization: {
              clerkOrgId: orgId,
            },
          },
        },
        select: {
          plan: true,
          status: true,
          periodEnd: true,
        },
        orderBy: [{ periodStart: "asc" }, { id: "asc" }],
      })
    : [];

  const effectivePlan = getEffectivePlan(timelineItems);
  const hasPaidPlan = isPaidPlan(effectivePlan);
  const totalNewBookings = bookingsByMonth.reduce(
    (sum, item) => sum + item.newBookings,
    0
  );
  const totalCompletedBookings = bookingsByMonth.reduce(
    (sum, item) => sum + item.completed,
    0
  );
  const completionRate =
    totalNewBookings > 0
      ? Math.round((totalCompletedBookings / totalNewBookings) * 100)
      : 0;

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-xl border bg-base-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard for {slug}</h1>
            <p className="text-sm opacity-70">
              Booking and front-desk activity snapshot
            </p>
          </div>
          <span className="badge badge-outline">Plan: {effectivePlan}</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <p className="text-sm opacity-70">Total new bookings</p>
          <p className="mt-2 text-3xl font-bold text-primary">{totalNewBookings}</p>
        </article>
        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <p className="text-sm opacity-70">Completed bookings</p>
          <p className="mt-2 text-3xl font-bold text-accent">{totalCompletedBookings}</p>
        </article>
        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <p className="text-sm opacity-70">Completion rate</p>
          <p className="mt-2 text-3xl font-bold">{completionRate}%</p>
        </article>
        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <p className="text-sm opacity-70">Upcoming today</p>
          <p className="mt-2 text-3xl font-bold">{upcomingBookings.length}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Booking Volume</h2>
          <p className="text-sm opacity-70">
            New vs completed bookings over the last 12 months
          </p>
          <div className="mt-3">
            <BookingsVolumeChart
              labels={bookingsByMonth.map((item) => item.month)}
              newBookings={bookingsByMonth.map((item) => item.newBookings)}
              completedBookings={bookingsByMonth.map((item) => item.completed)}
            />
          </div>
        </article>

        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Weekly Performance</h2>
          <p className="text-sm opacity-70">
            Confirmed bookings versus no-shows by day
          </p>
          <div className="mt-3">
            <BookingsByDayChart
              days={bookingWeekPerformance.days}
              confirmed={bookingWeekPerformance.confirmed}
              noShows={bookingWeekPerformance.noShows}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Upcoming Bookings</h2>
          <p className="text-sm opacity-70">
            Next appointments and current status
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingBookings.map((booking) => (
                  <tr key={`${booking.customer}-${booking.time}`}>
                    <td>{booking.customer}</td>
                    <td>{booking.service}</td>
                    <td>{booking.time}</td>
                    <td>
                      <span className="badge badge-outline capitalize">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border bg-base-100 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Booking Sources</h2>
          <p className="text-sm opacity-70">
            Where appointments are coming from
          </p>
          <div className="mt-3">
            <BookingsSourceDonutChart items={bookingSourceSplit} />
          </div>
        </article>
      </section>

      {!hasPaidPlan && (
        <section className="space-y-4 rounded-xl border bg-base-100 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
            <p className="text-sm opacity-80">
              You are on the free plan. Upgrade to remove limits and unlock the
              AI receptionist phone workflow.
            </p>
          </div>
          <PricingTable
            for="organization"
            newSubscriptionRedirectUrl={`/${slug}/dashboard`}
          />
        </section>
      )}
    </main>
  );
}
