"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LinkButton } from "@/shared/ui/link-button";
import { landingContent } from "@/shared/config/landing";

const ROTATING_WORDS = [
  "Opportunity",
  "Discovery",
  "Visibility",
  "Income",
  "Legacy",
  "Ownership",
] as const;

const ROTATION_INTERVAL_MS = 3500;

const wordTransition = {
  enter: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  exit: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
};

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const { hero } = landingContent;
  const [wordIndex, setWordIndex] = useState(0);

  const advance = useCallback(() => {
    setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(advance, ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [advance, prefersReducedMotion]);

  return (
    <div className="relative flex min-h-[85vh] flex-col justify-center py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-[20%] -top-[30%] size-[min(80vw,640px)] rounded-full bg-accent/12 blur-[100px]" />
        <div className="absolute -left-[10%] bottom-0 size-[min(50vw,400px)] rounded-full bg-white/[0.03] blur-[80px]" />
      </div>

      <p className="text-eyebrow text-accent animate-[fadeIn_0.5s_ease-out_both]">
        {hero.eyebrow}
      </p>

      <h1 className="text-cinematic mt-6 max-w-5xl text-5xl tracking-tight md:text-7xl lg:text-[5.5rem] animate-[fadeSlideUp_0.6s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        <span className="block">Where Creativity Becomes</span>
        <span className="relative block h-[1.2em] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={ROTATING_WORDS[wordIndex]}
              className="absolute inset-x-0 top-0 block bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent will-change-[transform,opacity]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -24 }}
              transition={wordTransition.enter}
              aria-live="polite"
            >
              {ROTATING_WORDS[wordIndex]}
            </motion.span>
          </AnimatePresence>
          <span className="invisible" aria-hidden>
            {ROTATING_WORDS[0]}
          </span>
        </span>
      </h1>

      <p className="mt-7 max-w-3xl text-base font-medium leading-snug text-foreground/90 md:mt-8 md:text-xl md:leading-relaxed animate-[fadeSlideUp_0.55s_cubic-bezier(0.16,1,0.3,1)_0.12s_both]">
        {hero.subhead}
      </p>

      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:mt-6 md:max-w-3xl md:text-lg md:leading-[1.65] animate-[fadeSlideUp_0.55s_cubic-bezier(0.16,1,0.3,1)_0.18s_both]">
        {hero.description}
      </p>

      <ul
        className="mt-10 flex flex-wrap gap-2.5 animate-[fadeIn_0.5s_ease-out_0.24s_both]"
        aria-label="Platform continuity signals"
      >
        {hero.trustSignals.map((signal) => (
          <li
            key={signal}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground"
          >
            {signal}
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap gap-4 animate-[fadeSlideUp_0.55s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
        <LinkButton href={hero.primaryCta.href} size="lg" variant="accent">
          {hero.primaryCta.label}
        </LinkButton>
        <LinkButton href={hero.secondaryCta.href} size="lg" variant="outline">
          {hero.secondaryCta.label}
        </LinkButton>
      </div>
    </div>
  );
}
