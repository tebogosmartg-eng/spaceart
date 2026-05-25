import Link from "next/link";
import { Logo } from "@/shared/brand";
import { siteConfig } from "@/shared/config/site";
import { footerNav } from "@/shared/config/navigation";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 py-20 md:py-24">
      <Container>
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo variant="full" wordmarkSize="lg" showTagline />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer">
            {footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-brand hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-white/6 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-tagline text-muted-foreground/80">
            {siteConfig.tagline}
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. Creative economy infrastructure for Africa.
          </p>
        </div>
      </Container>
    </footer>
  );
}
