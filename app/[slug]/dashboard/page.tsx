import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
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

  let timelineItems: Array<{
    plan: string;
    status: string;
    periodEnd: Date | null;
  }> = [];
  let newLeadCount = 0;

  if (orgId) {
    try {
      const [timeline, leadCount] = await Promise.all([
        prisma.subscriptionItem.findMany({
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
        }),
        prisma.receptionLead.count({
          where: {
            status: "new",
            organization: {
              clerkOrgId: orgId,
            },
          },
        }),
      ]);
      timelineItems = timeline;
      newLeadCount = leadCount;
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  }

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
  const averageMonthlyBookings = Math.round(totalNewBookings / bookingsByMonth.length);

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-base-100 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -top-28 right-0 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Ops Command Center
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Dashboard for {slug}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Real-time pulse for bookings, receptionist leads, and follow-up workload.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link className="btn btn-primary btn-sm sm:btn-md" href={`/${slug}/dashboard/leads`}>
              Open Lead Queue
            </Link>
            <Link
              className="btn btn-outline btn-sm sm:btn-md"
              href={`/${slug}/dashboard/settings`}
            >
              Settings
            </Link>
            <span className="badge badge-outline sm:col-span-2">Plan: {effectivePlan}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total new bookings</p>
          <p className="mt-2 text-3xl font-black text-primary">{totalNewBookings}</p>
          <p className="text-xs text-slate-500">+14% vs prior period</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed bookings</p>
          <p className="mt-2 text-3xl font-black text-accent">{totalCompletedBookings}</p>
          <p className="text-xs text-slate-500">Follow-through quality</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completion rate</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{completionRate}%</p>
          <p className="text-xs text-slate-500">Target is 85%+</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">New leads to contact</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{newLeadCount}</p>
          <p className="text-xs text-slate-500">Avg {averageMonthlyBookings}/mo new bookings</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Booking Volume</h2>
          <p className="text-sm text-slate-500">
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

        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Weekly Performance</h2>
          <p className="text-sm text-slate-500">
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
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Upcoming Bookings</h2>
          <p className="text-sm text-slate-500">
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

        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Booking Sources</h2>
          <p className="text-sm text-slate-500">
            Where appointments are coming from
          </p>
          <div className="mt-3">
            <BookingsSourceDonutChart items={bookingSourceSplit} />
          </div>
        </article>
      </section>

      {hasPaidPlan && (
        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href={`/${slug}/dashboard/bookings`}
            className="group rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <p className="text-sm text-slate-500">Ops Workflow</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Bookings Board</h3>
            <p className="mt-1 text-sm text-slate-600">
              Track booking load and same-day actions.
            </p>
            <span className="mt-3 inline-flex text-sm font-semibold text-primary">
              Open bookings
            </span>
          </Link>

          <Link
            href={`/${slug}/dashboard/leads`}
            className="group rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <p className="text-sm text-slate-500">Front Desk</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Leads Queue</h3>
            <p className="mt-1 text-sm text-slate-600">
              Follow up on inbound calls and chat callbacks.
            </p>
            <span className="mt-3 inline-flex text-sm font-semibold text-primary">
              Open leads
            </span>
          </Link>

          <Link
            href={`/${slug}/dashboard/analytics`}
            className="group rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <p className="text-sm text-slate-500">Growth</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Analytics</h3>
            <p className="mt-1 text-sm text-slate-600">
              Watch conversion trends and lead quality.
            </p>
            <span className="mt-3 inline-flex text-sm font-semibold text-primary">
              View analytics
            </span>
          </Link>
        </section>
      )}

      {!hasPaidPlan && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-base-100 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
            <p className="text-sm text-slate-600">
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
