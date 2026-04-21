"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChartIcon,
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LinkIcon,
  MessageSquareIcon,
  PaletteIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type SearchItem = {
  label: string;
  description: string;
  href: (slug: string) => string;
  icon: React.ElementType;
};

type SearchGroup = {
  title: string;
  items: SearchItem[];
};

const SEARCH_GROUPS: SearchGroup[] = [
  {
    title: "Operations",
    items: [
      {
        label: "Dashboard",
        description: "Business snapshot",
        href: (s) => `/${s}/dashboard`,
        icon: LayoutDashboardIcon,
      },
      {
        label: "Bookings",
        description: "Calendar and staff slots",
        href: (s) => `/${s}/dashboard/bookings`,
        icon: CalendarIcon,
      },
      {
        label: "Chats",
        description: "Web + phone transcripts",
        href: (s) => `/${s}/dashboard/chats`,
        icon: MessageSquareIcon,
      },
      {
        label: "Leads",
        description: "Inbound lead queue",
        href: (s) => `/${s}/dashboard/leads`,
        icon: UsersIcon,
      },
      {
        label: "Enquiries",
        description: "Contact enquiry history",
        href: (s) => `/${s}/dashboard/enquiries`,
        icon: InboxIcon,
      },
      {
        label: "Analytics",
        description: "Performance trends",
        href: (s) => `/${s}/dashboard/analytics`,
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
        href: (s) => `/${s}/dashboard/links`,
        icon: LinkIcon,
      },
      {
        label: "Customization",
        description: "Landing and links styling",
        href: (s) => `/${s}/dashboard/customization`,
        icon: PaletteIcon,
      },
      {
        label: "Billing",
        description: "Plans and upgrades",
        href: (s) => `/${s}/dashboard/billing`,
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
        href: (s) => `/${s}/dashboard/organization`,
        icon: BuildingIcon,
      },
      {
        label: "Notifications",
        description: "Operational events",
        href: (s) => `/${s}/dashboard/notifications`,
        icon: BellIcon,
      },
      {
        label: "Audit",
        description: "Security activity log",
        href: (s) => `/${s}/dashboard/audit`,
        icon: ShieldIcon,
      },
      {
        label: "Settings",
        description: "Business and access",
        href: (s) => `/${s}/dashboard/settings`,
        icon: SettingsIcon,
      },
    ],
  },
];

export function DashboardSearch({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden w-48 justify-between gap-2 text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-1.5">
          <SearchIcon className="size-3.5" data-icon="inline-start" />
          Search pages...
        </span>
        <kbd className="pointer-events-none font-mono text-[10px] text-muted-foreground/60">⌘K</kbd>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <SearchIcon className="size-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Navigate" description="Search dashboard pages">
        <CommandInput placeholder="Search pages and sections..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {SEARCH_GROUPS.map((group, i) => (
            <Fragment key={group.title}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.title}>
                {group.items.map((item) => {
                  const href = item.href(slug);
                  return (
                    <CommandItem
                      key={href}
                      value={`${item.label} ${item.description}`}
                      onSelect={() => navigate(href)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
