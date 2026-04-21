"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

gsap.registerPlugin(useGSAP);

export function DashboardStatCard({
  label,
  value,
  description,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: number;
  description: string;
  accent?: boolean;
  delay?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      gsap.from(wrapRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.55,
        delay,
        ease: "power3.out",
      });

      if (value > 0 && numRef.current) {
        const counter = { count: 0 };
        gsap.to(counter, {
          count: value,
          duration: 1.2,
          delay: delay + 0.15,
          ease: "power2.out",
          onUpdate() {
            if (numRef.current) {
              numRef.current.textContent = Math.round(counter.count).toString();
            }
          },
        });
      }
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef}>
      <Card className="relative overflow-hidden">
        {accent && (
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />
        )}
        <CardHeader className="pb-1">
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle
            className={`relative text-3xl font-black tabular-nums ${accent ? "text-primary" : ""}`}
          >
            <span ref={numRef}>{value}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
