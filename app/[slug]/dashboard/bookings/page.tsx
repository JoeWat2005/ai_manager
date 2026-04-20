import Link from "next/link";
import { BookingsByDayChart } from "@/components/dashboard/charts/BookingsByDayChart";
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

const weeklyVolume = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  confirmed: [18, 20, 16, 22, 25, 19, 14],
  noShows: [3, 2, 4, 3, 5, 3, 2],
};

const todaysSchedule = [
  {
    customer: "Amelia Jones",
    service: "Initial consultation",
    time: "10:30",
    channel: "Website",
  },
  {
    customer: "Oliver Reed",
    service: "Follow-up call",
    time: "12:00",
    channel: "Phone AI",
  },
  {
    customer: "Sofia Patel",
    service: "Treatment booking",
    time: "14:30",
    channel: "Web chat",
  },
  {
    customer: "Noah Wilson",
    service: "Urgent callback",
    time: "17:00",
    channel: "Manual",
  },
];

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-base-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Bookings
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Booking operations for {slug}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage appointment load, no-show risk, and same-day scheduling.
            </p>
          </div>
          <Link href={`/${slug}/dashboard/leads`} className="btn btn-primary">
            View lead queue
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">New bookings (12mo)</p>
          <p className="mt-2 text-3xl font-black text-primary">{totalNewBookings}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Completed (12mo)</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{totalCompletedBookings}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Completion rate</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{completionRate}%</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Today scheduled</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{todaysSchedule.length}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Monthly booking trend</h2>
          <p className="text-sm text-slate-500">New vs completed bookings across 12 months</p>
          <div className="mt-3">
            <BookingsVolumeChart
              labels={bookingsByMonth.map((item) => item.month)}
              newBookings={bookingsByMonth.map((item) => item.newBookings)}
              completedBookings={bookingsByMonth.map((item) => item.completed)}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Weekly no-show risk</h2>
          <p className="text-sm text-slate-500">Confirmed sessions and no-shows by weekday</p>
          <div className="mt-3">
            <BookingsByDayChart
              days={weeklyVolume.days}
              confirmed={weeklyVolume.confirmed}
              noShows={weeklyVolume.noShows}
            />
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Today&apos;s booking run sheet</h2>
          <span className="badge badge-outline">Operational view</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {todaysSchedule.map((slot) => (
                <tr key={`${slot.time}-${slot.customer}`}>
                  <td className="font-semibold">{slot.time}</td>
                  <td>{slot.customer}</td>
                  <td>{slot.service}</td>
                  <td>{slot.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
