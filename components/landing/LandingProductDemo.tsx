"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type DemoTabId = "chat" | "bookings" | "calls";

type IconProps = {
  className?: string;
};

function ChatIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 6.75A2.75 2.75 0 0 1 7.75 4h8.5A2.75 2.75 0 0 1 19 6.75v5.5A2.75 2.75 0 0 1 16.25 15H12l-3.5 3v-3H7.75A2.75 2.75 0 0 1 5 12.25v-5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 3.5V6m10-2.5V6m-11 3h12m-13 9.25A2.75 2.75 0 0 0 7.75 21h8.5A2.75 2.75 0 0 0 19 18.25V8.75A2.75 2.75 0 0 0 16.25 6h-8.5A2.75 2.75 0 0 0 5 8.75v9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6.58 4.75c.3-.38.83-.49 1.26-.24l2.2 1.28a1 1 0 0 1 .45 1.15l-.5 1.75a1 1 0 0 0 .24.95l3.05 3.05a1 1 0 0 0 .95.24l1.75-.5a1 1 0 0 1 1.15.45l1.28 2.2c.25.43.14.96-.24 1.26l-1.38 1.1a2 2 0 0 1-1.94.28 15.5 15.5 0 0 1-8.2-8.2 2 2 0 0 1 .28-1.94l1.1-1.38Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 6.5v11l9-5.5-9-5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 4.75A1.75 1.75 0 0 1 9.75 3h4.62c.46 0 .9.18 1.23.51l2.89 2.89c.33.33.51.77.51 1.23v11.62A1.75 1.75 0 0 1 17.25 21h-7.5A1.75 1.75 0 0 1 8 19.25V4.75Zm3.5 4.75h5M11.5 13h5M11.5 16.5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const demoTabs: Array<{ id: DemoTabId; label: string; icon: ReactNode }> = [
  { id: "chat", label: "AI Chat", icon: <ChatIcon /> },
  { id: "bookings", label: "Bookings", icon: <CalendarIcon /> },
  { id: "calls", label: "Recorded Calls", icon: <PhoneIcon /> },
];

const TAB_ROTATE_MS = 5000;

const bookingRows = [
  {
    customer: "Aria Bennett",
    service: "Consultation",
    slot: "Today, 2:30 PM",
    status: "Confirmed",
    badge: "badge-success",
  },
  {
    customer: "Noah Walters",
    service: "Follow-up",
    slot: "Today, 4:15 PM",
    status: "Reminder sent",
    badge: "badge-info",
  },
  {
    customer: "Priya Nair",
    service: "New client intake",
    slot: "Tomorrow, 10:00 AM",
    status: "Needs approval",
    badge: "badge-warning",
  },
  {
    customer: "Mason Price",
    service: "Rescheduled",
    slot: "Tomorrow, 1:45 PM",
    status: "Updated",
    badge: "badge-neutral",
  },
];

const callRows = [
  {
    caller: "Taylor Reed",
    duration: "04:12",
    summary: "Asked about weekend availability and booked a consult.",
    outcome: "Booked",
  },
  {
    caller: "Jordan Wu",
    duration: "02:39",
    summary: "Requested pricing details and follow-up quote by email.",
    outcome: "Follow-up",
  },
  {
    caller: "Cameron Holt",
    duration: "01:58",
    summary: "Rescheduled upcoming appointment to next Tuesday.",
    outcome: "Rescheduled",
  },
];

function tabClassName(isActive: boolean): string {
  return `tab tab-bordered gap-2 transition-colors duration-300 motion-reduce:transition-none ${
    isActive ? "tab-active text-primary" : ""
  }`.trim();
}

function panelClass(isActive: boolean): string {
  return `absolute inset-0 transition-all duration-500 ease-out motion-reduce:transition-none ${
    isActive
      ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
      : "pointer-events-none translate-y-2 scale-[0.985] opacity-0"
  }`.trim();
}

export function LandingProductDemo() {
  const [activeTab, setActiveTab] = useState<DemoTabId>("chat");
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const panelRefs = useRef<Record<DemoTabId, HTMLDivElement | null>>({
    chat: null,
    bookings: null,
    calls: null,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveTab((currentTab) => {
        const currentIndex = demoTabs.findIndex((tab) => tab.id === currentTab);
        const nextIndex = (currentIndex + 1) % demoTabs.length;
        return demoTabs[nextIndex].id;
      });
    }, TAB_ROTATE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      const nextHeight = panelRefs.current[activeTab]?.offsetHeight ?? 0;
      if (nextHeight > 0) {
        setContainerHeight(nextHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [activeTab]);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-lg sm:p-6">
      <div
        role="tablist"
        aria-label="Deskcaptain product demo tabs"
        className="tabs tabs-box mb-5 w-fit bg-base-200 p-1"
      >
        {demoTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={tabClassName(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mb-5 text-xs text-base-content/60">Auto-swaps every 5 seconds.</p>

      <div
        className="relative min-h-[22rem] overflow-hidden transition-[height] duration-500 ease-in-out motion-reduce:transition-none md:min-h-[20rem]"
        style={containerHeight ? { height: `${containerHeight}px` } : undefined}
      >
        <div
          ref={(element) => {
            panelRefs.current.chat = element;
          }}
          className={panelClass(activeTab === "chat")}
          aria-hidden={activeTab !== "chat"}
        >
          <div className="space-y-3">
            <div className="chat chat-start">
              <div className="chat-header text-xs opacity-60">Customer 10:14</div>
              <div className="chat-bubble chat-bubble-primary">
                I need a booking tomorrow after 3 PM. Do you have any slots?
              </div>
              <div className="chat-footer text-xs opacity-60">Lead captured</div>
            </div>
            <div className="chat chat-end">
              <div className="chat-header text-xs opacity-60">Deskcaptain AI 10:14</div>
              <div className="chat-bubble">
                Yes, we have 3:30 PM and 4:15 PM available. Want me to confirm one
                and send reminders by SMS and email?
              </div>
              <div className="chat-footer text-xs opacity-60">
                Auto response in 1.2s
              </div>
            </div>
            <div className="chat chat-start">
              <div className="chat-header text-xs opacity-60">Customer 10:15</div>
              <div className="chat-bubble chat-bubble-primary">
                4:15 PM works. Please book it.
              </div>
              <div className="chat-footer text-xs opacity-60">Booking completed</div>
            </div>
          </div>
        </div>

        <div
          ref={(element) => {
            panelRefs.current.bookings = element;
          }}
          className={panelClass(activeTab === "bookings")}
          aria-hidden={activeTab !== "bookings"}
        >
          <div className="space-y-4">
            <div className="stats stats-vertical w-full border border-base-300 bg-base-100 sm:stats-horizontal">
              <div className="stat py-3">
                <div className="stat-title">Today Confirmed</div>
                <div className="stat-value text-primary">13</div>
              </div>
              <div className="stat py-3">
                <div className="stat-title">Reminders Sent</div>
                <div className="stat-value text-accent">21</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Slot</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingRows.map((booking) => (
                    <tr key={`${booking.customer}-${booking.slot}`}>
                      <td>{booking.customer}</td>
                      <td>{booking.service}</td>
                      <td>{booking.slot}</td>
                      <td>
                        <span className={`badge ${booking.badge}`.trim()}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          ref={(element) => {
            panelRefs.current.calls = element;
          }}
          className={panelClass(activeTab === "calls")}
          aria-hidden={activeTab !== "calls"}
        >
          <div className="space-y-3">
            {callRows.map((call) => (
              <article
                key={`${call.caller}-${call.duration}`}
                className="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{call.caller}</p>
                    <span className="badge badge-outline">{call.duration}</span>
                    <span className="badge badge-primary">{call.outcome}</span>
                  </div>
                  <p className="text-sm text-base-content/70">{call.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-circle btn-sm btn-primary"
                    aria-label={`Play call from ${call.caller}`}
                  >
                    <PlayIcon />
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm">
                    <DocumentIcon />
                    View transcript
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
