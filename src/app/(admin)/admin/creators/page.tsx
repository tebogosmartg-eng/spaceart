import { Suspense } from "react";
import { getAuthContext, canApproveContent } from "@/infrastructure/auth/permissions";
import { getCreativesModerationPage } from "@/domains/admin/queries/moderation-queries";
import { AdminShell } from "@/domains/admin/components/admin-shell";
import { ModerationToolbar } from "@/domains/admin/components/moderation-toolbar";
import { CreatorsModerationTable } from "@/domains/admin/components/moderation-tables.dynamic";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Creators — Admin",
};

const CREATIVE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function AdminCreatorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctx = await getAuthContext();
  const canApprove = canApproveContent(ctx?.profile.role);

  const result = await getCreativesModerationPage({
    status: params.status ?? "pending",
    q: params.q,
    page: Number(params.page) || 1,
  });

  return (
    <AdminShell
      currentPath="/admin/creators"
      role={ctx?.profile.role ?? "user"}
    >
      <PageHeader
        title="Creators"
        description="Approve or reject creative profiles before they appear publicly."
      />

      <Suspense fallback={<div className="mb-8 h-10 animate-pulse rounded-lg bg-muted" />}>
        <ModerationToolbar
          statusOptions={CREATIVE_STATUS_OPTIONS}
          basePath="/admin/creators"
          totalPages={result.totalPages}
          page={result.page}
        />
      </Suspense>

      <p className="mb-6 text-sm text-muted-foreground">
        {result.total} result{result.total === 1 ? "" : "s"}
      </p>

      <CreatorsModerationTable
        creatives={result.items}
        canApprove={canApprove}
      />
    </AdminShell>
  );
}
