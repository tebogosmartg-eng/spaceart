import { LinkButton } from "@/shared/ui/link-button";
import { UserMenu } from "@/shared/ui/user-menu";
import { MobileNav } from "@/shared/ui/mobile-nav";
import { getHeaderSession } from "@/shared/ui/site-header-session";

/** Resolves session in parallel with page content (streamed via Suspense). */
export async function SiteHeaderAuth() {
  const { user, isStaff, isAdmin, role } = await getHeaderSession();

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="hidden md:flex md:items-center md:gap-3">
        {user ? (
          <UserMenu isStaff={isStaff} isAdmin={isAdmin} role={role} />
        ) : (
          <>
            <LinkButton
              href="/auth/sign-in"
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Sign in
            </LinkButton>
            <LinkButton href="/auth/sign-up" size="sm" variant="accent">
              Join SpaceArt
            </LinkButton>
          </>
        )}
      </div>
      <MobileNav
        isAuthenticated={!!user}
        isStaff={isStaff}
        isAdmin={isAdmin}
      />
    </div>
  );
}
