"use client";

import {
  BarChart3Icon,
  BellIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LinkIcon,
  MessageSquareIcon,
  PaletteIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  description: string;
  href: (slug: string) => string;
  icon: React.ElementType;
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
        icon: LayoutDashboardIcon,
      },
      {
        label: "Analytics",
        description: "Performance trends and lead funnel",
        href: (slug) => `/${slug}/dashboard/analytics`,
        icon: BarChart3Icon,
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
        icon: CalendarIcon,
      },
      {
        label: "Chats",
        description: "Web and phone transcripts",
        href: (slug) => `/${slug}/dashboard/chats`,
        icon: MessageSquareIcon,
      },
      {
        label: "Leads",
        description: "Inbound lead queue",
        href: (slug) => `/${slug}/dashboard/leads`,
        icon: UsersIcon,
      },
      {
        label: "Enquiries",
        description: "Contact enquiry history",
        href: (slug) => `/${slug}/dashboard/enquiries`,
        icon: InboxIcon,
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
        icon: LinkIcon,
      },
      {
        label: "Landing page",
        description: "Landing page copy and styling",
        href: (slug) => `/${slug}/dashboard/customization`,
        icon: PaletteIcon,
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
        icon: BuildingIcon,
      },
      {
        label: "Notifications",
        description: "Operational event log",
        href: (slug) => `/${slug}/dashboard/notifications`,
        icon: BellIcon,
      },
      {
        label: "Audit log",
        description: "Security and access activity",
        href: (slug) => `/${slug}/dashboard/audit`,
        icon: ShieldIcon,
      },
      {
        label: "Settings",
        description: "Workspace and receptionist config",
        href: (slug) => `/${slug}/dashboard/settings`,
        icon: SettingsIcon,
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        label: "Billing",
        description: "Plan, subscription and upgrades",
        href: (slug) => `/${slug}/dashboard/billing`,
        exact: true,
        icon: CreditCardIcon,
      },
      {
        label: "Invoices",
        description: "Billing history and payment records",
        href: (slug) => `/${slug}/dashboard/billing/invoices`,
        icon: ReceiptIcon,
      },
    ],
  },
];

function isActive(pathname: string, href: string, exact = false): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function matchesQuery(item: NavItem, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  );
}

export function DashboardSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => matchesQuery(i, query)) })).filter(
        (g) => g.items.length > 0
      )
    : NAV_GROUPS;

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-3 pb-2 pt-4">
        <Link
          href={`/${slug}/dashboard`}
          className="mb-3 flex items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-80"
        >
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent">
            <Image
              src="/deskcaptain.png"
              alt="DeskCaptain"
              width={32}
              height={32}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
              DeskCaptain
            </p>
            <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
              /{slug}
            </p>
          </div>
        </Link>

        <SidebarGroup className="p-0">
          <SidebarGroupContent className="relative">
            <Label htmlFor="sidebar-search" className="sr-only">
              Search navigation
            </Label>
            <SidebarInput
              id="sidebar-search"
              placeholder="Search..."
              className="h-8 pl-8 text-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 select-none text-sidebar-foreground/40" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-sidebar-foreground/50">No pages match &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          filtered.map((group, gi) => (
            <div key={group.title}>
              {gi > 0 && <SidebarSeparator className="mx-3 my-1" />}
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const href = item.href(slug);
                    const active = isActive(pathname, href, item.exact);
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          render={<Link href={href} onClick={() => setQuery("")} />}
                          isActive={active}
                          tooltip={item.description}
                          className={cn(
                            "h-8 rounded-md px-3 text-sm",
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "size-4 shrink-0",
                              active
                                ? "text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/50"
                            )}
                          />
                          <span className="font-medium">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            </div>
          ))
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 pt-2">
        <SidebarSeparator className="mb-3" />
        <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
          Public pages
        </p>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={`/${slug}/landing`} target="_blank" />}
              tooltip="View your business landing page"
              className="h-8 rounded-md px-3 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <BookOpenIcon className="size-4 shrink-0 text-sidebar-foreground/40" />
              <span className="font-medium">Landing page</span>
              <ExternalLinkIcon className="ml-auto size-3 shrink-0 text-sidebar-foreground/30" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={`/${slug}/links`} target="_blank" />}
              tooltip="View your public links page"
              className="h-8 rounded-md px-3 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LinkIcon className="size-4 shrink-0 text-sidebar-foreground/40" />
              <span className="font-medium">Links page</span>
              <ExternalLinkIcon className="ml-auto size-3 shrink-0 text-sidebar-foreground/30" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
