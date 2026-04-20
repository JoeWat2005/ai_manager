"use client";

import Link from "next/link";
import { trackGaEvent } from "@/lib/analytics/ga";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  eventName?: string;
  eventData?: Record<string, unknown>;
};

export function TrackedCtaLink({
  href,
  className,
  children,
  eventName = "upgrade_clicked",
  eventData,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackGaEvent(eventName, eventData ?? {})}
    >
      {children}
    </Link>
  );
}
