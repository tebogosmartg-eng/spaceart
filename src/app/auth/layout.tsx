import { Logo } from "@/shared/brand";
import { siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";
import { PremiumCard } from "@/shared/ui/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-start px-4 pt-12 sm:justify-center sm:px-6 sm:py-16" style={{ paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}>
      <Container size="narrow" className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <Logo href="/" variant="full" compact markSize={32} wordmarkSize="md" />
          <p className="text-tagline mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            {siteConfig.tagline}
          </p>
        </div>
        <PremiumCard padding="lg" glow className="w-full">
          {children}
        </PremiumCard>
        <div className="h-8 sm:h-0" aria-hidden="true" />
      </Container>
    </div>
  );
}
