"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type DashboardNavItem = {
  label: string;
  description: string;
  href: (slug: string) => string;
  icon: ReactNode;
  exact?: boolean;
};

const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Dashboard",
    description: "Business snapshot",
    href: (slug) => `/${slug}/dashboard`,
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M3 4.5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 12 4.5v6A1.5 1.5 0 0 1 10.5 12h-6A1.5 1.5 0 0 1 3 10.5v-6ZM12 13.5a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 12 19.5v-6ZM3 13.5A1.5 1.5 0 0 1 4.5 12h6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 19.5v-6ZM12 4.5A1.5 1.5 0 0 1 13.5 3h6A1.5 1.5 0 0 1 21 4.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 12 10.5v-6Z"
          className="stroke-current"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    label: "Bookings",
    description: "Calendar pipeline",
    href: (slug) => `/${slug}/dashboard/bookings`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M8 2.75V5m8-2.25V5m-11.5 4h15M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Zm4 5.5h3m-3 3h5"
          className="stroke-current"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Leads",
    description: "Inbound queue",
    href: (slug) => `/${slug}/dashboard/leads`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 19a5.5 5.5 0 0 1 11 0m2.5-7h2.75m-1.375-1.375v2.75"
          className="stroke-current"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Analytics",
    description: "Performance trends",
    href: (slug) => `/${slug}/dashboard/analytics`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M5 19V9m7 10V5m7 14v-7M4 19h16"
          className="stroke-current"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    description: "Profile + policies",
    href: (slug) => `/${slug}/dashboard/settings`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M10.5 4.75h3l.7 1.9a1 1 0 0 0 .86.65l2.03.17 1.5 2.6-1.34 1.54a1 1 0 0 0-.22 1.03l.64 1.96-2.14 1.8-1.82-.95a1 1 0 0 0-1.05.08L12 16.78l-1.66-1.2a1 1 0 0 0-1.04-.08l-1.82.95-2.15-1.8.65-1.96a1 1 0 0 0-.22-1.03L4.4 10.1l1.5-2.6 2.03-.17a1 1 0 0 0 .86-.65l.71-1.9Z"
          className="stroke-current"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" className="stroke-current" strokeWidth="1.5" />
      </svg>
    ),
  },
];

function isActivePath(pathname: string, href: string, exact = false): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebarNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1.5">
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const href = item.href(slug);
        const active = isActivePath(pathname, href, item.exact);

        return (
          <li key={item.label}>
            <Link
              href={href}
              className={[
                "group flex items-start gap-3 rounded-2xl px-3 py-3 transition-all",
                active
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/80 hover:bg-base-200 hover:text-base-content",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 transition-colors",
                  active
                    ? "text-primary-content"
                    : "text-base-content/60 group-hover:text-base-content/80",
                ].join(" ")}
              >
                {item.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-tight">
                  {item.label}
                </span>
                <span
                  className={[
                    "block text-xs",
                    active ? "text-primary-content/80" : "text-base-content/60",
                  ].join(" ")}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
