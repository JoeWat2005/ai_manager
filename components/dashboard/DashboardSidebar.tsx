"use client";

import {
  BarChartIcon,
  BellIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LinkIcon,
  MessageSquareIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
    title: "Operations",
    items: [
      {
        label: "Dashboard",
        description: "Business snapshot",
        href: (slug) => `/${slug}/dashboard`,
        exact: true,
        icon: LayoutDashboardIcon,
      },
      {
        label: "Bookings",
        description: "Calendar and staff slots",
        href: (slug) => `/${slug}/dashboard/bookings`,
        icon: CalendarIcon,
      },
      {
        label: "Chats",
        description: "Web + phone transcripts",
        href: (slug) => `/${slug}/dashboard/chats`,
        icon: MessageSquareIcon,
      },
      {
        label: "Leads",
        description: "Inbound queue",
        href: (slug) => `/${slug}/dashboard/leads`,
        icon: UsersIcon,
      },
      {
        label: "Enquiries",
        description: "Contact enquiry history",
        href: (slug) => `/${slug}/dashboard/enquiries`,
        icon: InboxIcon,
      },
      {
        label: "Analytics",
        description: "Performance trends",
        href: (slug) => `/${slug}/dashboard/analytics`,
        icon: BarChartIcon,
      },
    ],
  },
  {
    title: "Growth",
    items: [
      {
        label: "Links",
        description: "Linktree-style profile",
        href: (slug) => `/${slug}/dashboard/links`,
        icon: LinkIcon,
      },
      {
        label: "Customization",
        description: "Landing and links styling",
        href: (slug) => `/${slug}/dashboard/customization`,
        icon: PaletteIcon,
      },
      {
        label: "Billing",
        description: "Plans and upgrades",
        href: (slug) => `/${slug}/dashboard/billing`,
        icon: CreditCardIcon,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Organization",
        description: "Members and invites",
        href: (slug) => `/${slug}/dashboard/organization`,
        icon: BuildingIcon,
      },
      {
        label: "Notifications",
        description: "Operational events",
        href: (slug) => `/${slug}/dashboard/notifications`,
        icon: BellIcon,
      },
      {
        label: "Audit",
        description: "Security activity log",
        href: (slug) => `/${slug}/dashboard/audit`,
        icon: ShieldIcon,
      },
      {
        label: "Settings",
        description: "Business and access",
        href: (slug) => `/${slug}/dashboard/settings`,
        icon: SettingsIcon,
      },
    ],
  },
];

function isActive(pathname: string, href: string, exact = false): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Image
          src="/deskcaptain.png"
          alt="Deskcaptain"
          width={100}
          height={100}
          className="rounded-lg"
        />
        <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/50 uppercase">
          {slug}
        </p>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const href = item.href(slug);
                const active = isActive(pathname, href, item.exact);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      tooltip={item.description}
                      size="lg"
                      className={cn(
                        active &&
                          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium leading-tight">{item.label}</span>
                        <span
                          className={cn(
                            "text-[11px] leading-tight",
                            active ? "opacity-75" : "text-sidebar-foreground/55"
                          )}
                        >
                          {item.description}
                        </span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={`/${slug}/landing`} />} tooltip="Business landing page">
              <BookOpenIcon className="size-4" />
              <span>Business landing</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={`/${slug}/links`} />} tooltip="Public links page">
              <LinkIcon className="size-4" />
              <span>Public links</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
