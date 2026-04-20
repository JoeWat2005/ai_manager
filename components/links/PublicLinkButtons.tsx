"use client";

import { trackGaEvent } from "@/lib/analytics/ga";

type LinkItem = {
  id: string;
  label: string;
  url: string;
  platform: string;
};

type Props = {
  items: LinkItem[];
  accentColor: string;
  buttonStyle: string;
  slug: string;
};

export function PublicLinkButtons({ items, accentColor, buttonStyle, slug }: Props) {
  return (
    <section className="space-y-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className={`btn w-full justify-between ${buttonStyle === "outline" ? "btn-outline" : "btn-primary"}`}
          style={
            buttonStyle === "outline"
              ? { borderColor: accentColor, color: accentColor }
              : { backgroundColor: accentColor, borderColor: accentColor, color: "#ffffff" }
          }
          onClick={() =>
            trackGaEvent("link_clicked", {
              slug,
              platform: item.platform,
            })
          }
        >
          <span>{item.label}</span>
          <span className="badge badge-ghost text-[10px] uppercase">{item.platform}</span>
        </a>
      ))}
    </section>
  );
}
