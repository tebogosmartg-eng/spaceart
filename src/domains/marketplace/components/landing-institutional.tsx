import {
  Briefcase,
  Globe2,
  Users,
  TrendingUp,
  Landmark,
  Sprout,
  CalendarRange,
  Link2,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { landingContent } from "@/shared/config/landing";
import { Section } from "@/shared/ui/section";
import { SectionHeading } from "@/shared/ui/section-heading";
import { PremiumCard } from "@/shared/ui/brand";
import { MotionReveal, StaggerChildren, StaggerItem } from "@/shared/ui/motion-reveal";
import { cn } from "@/shared/lib/utils";

const pespIcons: LucideIcon[] = [
  Briefcase,
  Landmark,
  Users,
  Layers,
  Globe2,
  Sprout,
];

const sustainabilityIcons: LucideIcon[] = [
  CalendarRange,
  Link2,
  Layers,
  Wallet,
];

const impactIcons: LucideIcon[] = [
  Briefcase,
  Globe2,
  Users,
  TrendingUp,
  Landmark,
];

interface LandingImpactSectionProps {
  creatorCount?: number;
}

export function LandingPespSection() {
  const { vision } = landingContent;

  return (
    <Section id="impact-alignment" className="!py-16 md:!py-24">
      <MotionReveal>
        <SectionHeading
          eyebrow={vision.eyebrow}
          title={vision.title}
          description={vision.description}
          size="lg"
        />
      </MotionReveal>
      <StaggerChildren className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vision.pillars.map((pillar, i) => {
          const Icon = pespIcons[i] ?? Layers;
          return (
            <StaggerItem key={pillar.title}>
              <PremiumCard padding="md" className="h-full">
                <Icon
                  className="size-5 text-accent"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </PremiumCard>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </Section>
  );
}

export function LandingSustainabilitySection() {
  const { sustainability } = landingContent;

  return (
    <Section id="sustainability" className="!pt-0 !py-16 md:!py-20">
      <MotionReveal>
        <SectionHeading
          eyebrow={sustainability.eyebrow}
          title={sustainability.title}
          description={sustainability.description}
          size="lg"
        />
      </MotionReveal>
      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        {sustainability.points.map((point, i) => {
          const Icon = sustainabilityIcons[i] ?? Sprout;
          return (
            <MotionReveal key={point.title} delay={i * 0.06}>
              <div className="surface-card flex h-full gap-5 p-6 md:p-8">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/8"
                  aria-hidden
                >
                  <Icon className="size-5 text-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {point.description}
                  </p>
                </div>
              </div>
            </MotionReveal>
          );
        })}
      </div>
    </Section>
  );
}

export function LandingImpactSection({ creatorCount }: LandingImpactSectionProps) {
  const { impact } = landingContent;

  return (
    <Section id="institutional-impact" className="!pt-0">
      <MotionReveal>
        <SectionHeading
          eyebrow={impact.eyebrow}
          title={impact.title}
          description={impact.description}
          size="lg"
        />
      </MotionReveal>
      <StaggerChildren className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {impact.outcomes.map((outcome, i) => {
          const Icon = impactIcons[i] ?? TrendingUp;
          const isCreator = outcome.label === "Creator participation";
          const headline =
            isCreator && creatorCount && creatorCount > 0
              ? `${creatorCount}+ verified creators`
              : outcome.headline;

          return (
            <StaggerItem
              key={outcome.label}
              className={cn(i === 4 && "sm:col-span-2 lg:col-span-1")}
            >
              <PremiumCard glow={i === 0} padding="md" className="h-full">
                <p className="text-eyebrow text-muted-foreground">
                  {outcome.label}
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-accent"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <div>
                    <p className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
                      {headline}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {outcome.detail}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </Section>
  );
}
