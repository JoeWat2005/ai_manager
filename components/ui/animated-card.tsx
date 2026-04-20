"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Register the plugin once at module level (safe in client-only code)
gsap.registerPlugin(useGSAP);

type AnimatedCardProps = React.ComponentProps<typeof Card> & {
  /** Stagger delay in seconds before the animation starts. Default: 0 */
  delay?: number;
};

/**
 * Wraps shadcn Card with a GSAP fade-rise entrance animation on mount.
 * Respects `prefers-reduced-motion` via the global CSS rule in globals.css
 * (animation-duration: 0.01ms when data-a11y-motion="reduce").
 */
export function AnimatedCard({ delay = 0, className, children, ...props }: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 14,
        duration: 0.42,
        delay,
        ease: "power2.out",
        clearProps: "all",
      });
    },
    { scope: ref }
  );

  return (
    <Card ref={ref} className={cn(className)} {...props}>
      {children}
    </Card>
  );
}
