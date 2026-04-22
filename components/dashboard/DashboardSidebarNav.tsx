"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  description: string;
  href: (slug: string) => string;
  icon: ReactNode;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "General",
    items: [
      {
        label: "Dashboard",
        description: "Business snapshot",
        href: (slug) => `/${slug}/dashboard`,
        exact: true,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h6A1.5 1.5 0 0 1 12 4.5v6A1.5 1.5 0 0 1 10.5 12h-6A1.5 1.5 0 0 1 3 10.5v-6ZM12 13.5a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 12 19.5v-6ZM3 13.5A1.5 1.5 0 0 1 4.5 12h6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 19.5v-6ZM12 4.5A1.5 1.5 0 0 1 13.5 3h6A1.5 1.5 0 0 1 21 4.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 12 10.5v-6Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
      {
        label: "Analytics",
        description: "Performance trends and lead funnel",
        href: (slug) => `/${slug}/dashboard/analytics`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M5 19V9m7 10V5m7 14v-7M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Bookings",
        description: "Calendar and staff slots",
        href: (slug) => `/${slug}/dashboard/bookings`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M8 2.75V5m8-2.25V5m-11.5 4h15M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10Zm4 5.5h3m-3 3h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: "Chats",
        description: "Web and phone transcripts",
        href: (slug) => `/${slug}/dashboard/chats`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M8 10h8m-8 4h5M6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H12l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7A2.5 2.5 0 0 1 6.5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        label: "Leads",
        description: "Inbound lead queue",
        href: (slug) => `/${slug}/dashboard/leads`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 19a5.5 5.5 0 0 1 11 0m2.5-7h2.75m-1.375-1.375v2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: "Enquiries",
        description: "Contact enquiry history",
        href: (slug) => `/${slug}/dashboard/enquiries`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M4 7l8-4 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: "Customisation",
    items: [
      {
        label: "Links page",
        description: "Linktree-style public profile builder",
        href: (slug) => `/${slug}/dashboard/links`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M10 13a4 4 0 0 1 0-6l1.5-1.5a4 4 0 0 1 5.66 5.66L16 12m-2 1a4 4 0 0 1 0 6l-1.5 1.5a4 4 0 1 1-5.66-5.66L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: "Landing page",
        description: "Landing page copy and styling",
        href: (slug) => `/${slug}/dashboard/customization`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M12 3.5a8.5 8.5 0 1 0 0 17 2.5 2.5 0 0 0 0-5h-.5a2 2 0 0 1 0-4h3A3.5 3.5 0 0 0 18 8a4.5 4.5 0 0 0-6-4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Organisation",
        description: "Team members and invites",
        href: (slug) => `/${slug}/dashboard/organization`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M7.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm9 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4 19a3.5 3.5 0 0 1 7 0m2 0a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: "Notifications",
        description: "Operational event log",
        href: (slug) => `/${slug}/dashboard/notifications`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M12 4a4 4 0 0 0-4 4v2.5c0 .9-.3 1.8-.9 2.5l-1.1 1.3a1 1 0 0 0 .8 1.7h10.4a1 1 0 0 0 .8-1.7l-1.1-1.3a3.9 3.9 0 0 1-.9-2.5V8a4 4 0 0 0-4-4Zm-1.5 14.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        label: "Audit log",
        description: "Security and access activity",
        href: (slug) => `/${slug}/dashboard/audit`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M12 3 4.5 6v6.5c0 4.2 3 8 7.5 8.5 4.5-.5 7.5-4.3 7.5-8.5V6L12 3Zm-2 8 1.5 1.5L14.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        label: "Settings",
        description: "Workspace and receptionist config",
        href: (slug) => `/${slug}/dashboard/settings`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M10.5 4.75h3l.7 1.9a1 1 0 0 0 .86.65l2.03.17 1.5 2.6-1.34 1.54a1 1 0 0 0-.22 1.03l.64 1.96-2.14 1.8-1.82-.95a1 1 0 0 0-1.05.08L12 16.78l-1.66-1.2a1 1 0 0 0-1.04-.08l-1.82.95-2.15-1.8.65-1.96a1 1 0 0 0-.22-1.03L4.4 10.1l1.5-2.6 2.03-.17a1 1 0 0 0 .86-.65l.71-1.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        label: "Billing",
        description: "Plan and subscription management",
        href: (slug) => `/${slug}/dashboard/billing`,
        exact: true,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9ZM3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: "Invoices",
        description: "Billing history and payment records",
        href: (slug) => `/${slug}/dashboard/billing/invoices`,
        icon: (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path d="M9 7h6m-6 4h6m-6 4h4M6 3h12a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
];

function isActive(pathname: string, href: string, exact = false): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebarNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const href = item.href(slug);
              const active = isActive(pathname, href, item.exact);
              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    className={[
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "shrink-0 transition-colors",
                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                    <span className="font-medium leading-tight">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
