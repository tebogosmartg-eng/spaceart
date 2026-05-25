import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/shared/brand";
import { mainNav } from "@/shared/config/navigation";
import { Container } from "./container";
import { SearchInput } from "@/shared/ui/search-input";
import { DemoBanner } from "@/shared/ui/demo-banner";
import { shouldShowDemoBanner } from "@/shared/lib/should-show-demo";
import { SiteHeaderAuth } from "@/shared/ui/site-header-auth";
import { SiteHeaderStaffLink } from "@/shared/ui/site-header-staff";
import { SiteHeaderAuthSkeleton } from "@/shared/ui/site-header-skeleton";

export function SiteHeader() {
  const showDemo = shouldShowDemoBanner();

  return (
    <>
      {showDemo && <DemoBanner />}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" style={{ contain: "layout style" }}>
        <Container className="flex h-16 items-center justify-between gap-4 md:h-[4.75rem] md:gap-10">
          <Logo href="/" variant="full" compact markSize={36} wordmarkSize="sm" className="shrink-0" />

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[0.8125rem] font-medium text-muted-foreground transition-brand hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Suspense fallback={null}>
              <SiteHeaderStaffLink />
            </Suspense>
          </nav>

          <div className="hidden max-w-[10rem] flex-1 lg:block">
            <SearchInput className="w-full" compact />
          </div>

          <Suspense fallback={<SiteHeaderAuthSkeleton />}>
            <SiteHeaderAuth />
          </Suspense>
        </Container>
      </header>
    </>
  );
}
