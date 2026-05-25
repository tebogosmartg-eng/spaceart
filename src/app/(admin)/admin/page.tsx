import { getAuthContext, canApproveContent } from "@/infrastructure/auth/permissions";
import { getAdminDashboardSnapshot } from "@/domains/admin/queries/moderation-queries";
import { AdminShell } from "@/domains/admin/components/admin-shell";
import { AdminOverviewSections } from "@/domains/admin/components/admin-overview-sections";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Admin Console",
  description: "SPACEART platform operations and moderation",
};

export default async function AdminOverviewPage() {
  const ctx = await getAuthContext();
  const snapshot = await getAdminDashboardSnapshot();
  const isAdmin = canApproveContent(ctx?.profile.role);

  return (
    <AdminShell
      currentPath="/admin"
      role={ctx?.profile.role ?? "user"}
    >
      <PageHeader
        title="Operations overview"
        description={
          isAdmin
            ? "Executive view of moderation queues, platform health, and recent activity."
            : "Moderation queues and platform metrics. Approval actions require admin."
        }
      />
      <AdminOverviewSections snapshot={snapshot} canApprove={isAdmin} />
    </AdminShell>
  );
}
