import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import { Logo } from "@/shared/brand";
import {
  isAdminRole,
  isStaffRole,
} from "@/infrastructure/auth/permissions";
import { Container } from "@/shared/ui/container";
import { SignOutButton } from "@/shared/ui/sign-out-button";
import { LinkButton } from "@/shared/ui/link-button";
import { DashboardStudioNav } from "@/shared/ui/dashboard-studio-nav";
import { AdminDeniedBanner } from "@/domains/admin/components/admin-denied-banner";
import { AdminModeSwitcher } from "@/domains/admin/components/admin-mode-switcher";
import { AdminRoleBadge } from "@/domains/admin/components/admin-role-badge";
import type { UserRole } from "@/shared/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <Container className="py-20">
        <p className="text-muted-foreground">
          Configure Supabase environment variables to use the dashboard.
        </p>
      </Container>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as UserRole | undefined) ?? "user";
  const isStaff = isStaffRole(role);
  const isAdmin = isAdminRole(role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/70 backdrop-blur-2xl">
        <Container className="flex h-16 flex-col gap-3 py-3 sm:h-auto sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:min-h-16">
          <div className="flex items-center justify-between gap-4 sm:justify-start">
            <Logo href="/dashboard" variant="full" compact markSize={24} wordmarkSize="sm" />
            {isStaff && (
              <div className="sm:hidden">
                <AdminRoleBadge role={role} showAdminMode={isAdmin} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isStaff && (
              <>
                <div className="hidden sm:block">
                  <AdminRoleBadge role={role} showAdminMode={isAdmin} />
                </div>
                <AdminModeSwitcher compact className="max-w-full overflow-x-auto" />
                <LinkButton href="/admin" size="sm" variant="accent">
                  Admin Console
                </LinkButton>
              </>
            )}
            <SignOutButton variant="outline" />
          </div>
        </Container>
      </header>

      <Container className="py-8 md:py-12">
        <Suspense fallback={null}>
          <AdminDeniedBanner />
        </Suspense>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <aside className="lg:w-56 lg:shrink-0">
            <DashboardStudioNav isStaff={isStaff} />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </Container>
    </div>
  );
}
