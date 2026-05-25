import { getAdminOverviewCounts } from "@/domains/admin/queries/moderation-queries";
import { canApproveContent } from "@/infrastructure/auth/permissions";
import type { UserRole } from "@/shared/types/database";
import { AdminShellClient } from "./admin-shell-client";

interface AdminShellProps {
  children: React.ReactNode;
  currentPath: string;
  role: UserRole | string;
}

export async function AdminShell({
  children,
  currentPath,
  role,
}: AdminShellProps) {
  const counts = await getAdminOverviewCounts();
  const roleLabel = canApproveContent(role) ? "Admin" : "Moderator";

  return (
    <AdminShellClient
      currentPath={currentPath}
      role={role}
      roleLabel={roleLabel}
      pendingCounts={{
        pendingCreatives: counts.pendingCreatives,
        pendingListings: counts.pendingListings,
      }}
    >
      {children}
    </AdminShellClient>
  );
}
