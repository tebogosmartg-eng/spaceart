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
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <Container size="narrow" className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo href="/" variant="full" compact markSize={32} wordmarkSize="md" />
          <p className="text-tagline mt-4 text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>
        <PremiumCard padding="lg" glow className="w-full">
          {children}
        </PremiumCard>
      </Container>
    </div>
  );
}
