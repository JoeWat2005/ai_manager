"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  analytics: "Analytics",
  audit: "Audit log",
  billing: "Billing",
  bookings: "Bookings",
  chats: "Chats",
  customization: "Landing page",
  enquiries: "Enquiries",
  invoices: "Invoices",
  leads: "Leads",
  links: "Links page",
  notifications: "Notifications",
  organization: "Organisation",
  receptionist: "Receptionist",
  settings: "Settings",
};

export function DashboardBreadcrumb({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/${slug}/dashboard`;
  const segments = pathname.slice(base.length).split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage className="font-medium">Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href={base} className="text-muted-foreground hover:text-foreground">
              Dashboard
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          const href = `${base}/${segments.slice(0, i + 1).join("/")}`;
          const label = SEGMENT_LABELS[segment] ?? segment;

          return (
            <span key={segment} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="text-muted-foreground hover:text-foreground">
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
