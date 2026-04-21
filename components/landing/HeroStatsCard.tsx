"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

const stats = [
  { label: "Inbound attempts", value: 128, suffix: "", isDecimal: false, trend: "+18%" },
  { label: "Qualified leads", value: 83, suffix: "", isDecimal: false, trend: "+11%" },
  { label: "Median response", value: 2.9, suffix: "s", isDecimal: true, trend: "−0.4s" },
  { label: "Booking confirms", value: 57, suffix: "", isDecimal: false, trend: "+22%" },
];

// Deterministic bar heights for the sparkline (avoids SSR/client hydration mismatch)
const BAR_HEIGHTS = [
  38, 55, 42, 68, 50, 75, 48, 60, 72, 44, 58, 80, 65, 45, 70, 55, 62, 85, 50,
  73, 40, 67, 78, 52, 88, 60, 45, 72, 65, 90,
];

export function HeroStatsCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: 0.4,
        ease: "power3.out",
      });

      const statEls = cardRef.current?.querySelectorAll<HTMLElement>(".stat-number");
      statEls?.forEach((el, i) => {
        const stat = stats[i];
        if (!stat) return;
        const counter = { value: 0 };
        gsap.to(counter, {
          value: stat.value,
          duration: 1.4,
          delay: 0.9 + i * 0.1,
          ease: "power2.out",
          onUpdate() {
            el.textContent = stat.isDecimal
              ? counter.value.toFixed(1)
              : Math.round(counter.value).toString();
          },
        });
      });
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl" />

      {/* Live badge */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Live statistics</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <span className="relative inline-flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/8 bg-white/5 p-3"
          >
            <p className="text-xs text-slate-400">{stat.label}</p>
            <div className="mt-1.5 flex items-end justify-between gap-1">
              <p className="text-xl font-black tabular-nums text-white">
                <span className="stat-number">
                  {stat.isDecimal ? stat.value.toFixed(1) : stat.value}
                </span>
                {stat.suffix}
              </p>
              <span className="text-xs font-semibold text-emerald-400">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div className="mt-4 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Inbound activity</span>
          <span>Last 60 min</span>
        </div>
        <div className="flex h-12 items-end gap-0.5">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-blue-500/60"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
