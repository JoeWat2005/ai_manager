"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

export function HeroAnimation({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const words = containerRef.current?.querySelectorAll(".hero-word");
      const sub = containerRef.current?.querySelector(".hero-sub");
      const ctas = containerRef.current?.querySelector(".hero-ctas");
      const badge = containerRef.current?.querySelector(".hero-badge");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (badge) {
        tl.from(badge, { y: 16, opacity: 0, duration: 0.5 });
      }
      if (words && words.length) {
        tl.from(
          words,
          { y: 40, opacity: 0, stagger: 0.04, duration: 0.75 },
          "-=0.2"
        );
      }
      if (sub) {
        tl.from(sub, { y: 20, opacity: 0, duration: 0.6 }, "-=0.3");
      }
      if (ctas) {
        tl.from(ctas, { y: 16, opacity: 0, duration: 0.5 }, "-=0.25");
      }
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
