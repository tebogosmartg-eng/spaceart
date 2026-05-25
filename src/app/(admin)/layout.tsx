import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import { getAuthContext, isStaffRole } from "@/infrastructure/auth/permissions";
import { logAuthEvent } from "@/infrastructure/auth/profile-resolution";
import { Container } from "@/shared/ui/container";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <Container className="py-20">
        <p className="text-muted-foreground">Supabase is not configured.</p>
      </Container>
    );
  }

  const ctx = await getAuthContext();

  if (!ctx) {
    logAuthEvent("warn", "Admin layout: no auth context", {});
    redirect("/auth/sign-in?redirect=/admin");
  }

  if (!isStaffRole(ctx.profile.role)) {
    logAuthEvent("warn", "Admin layout: insufficient role", {
      userId: ctx.userId,
      role: ctx.profile.role,
    });
    redirect("/forbidden?from=admin");
  }

  return children;
}
