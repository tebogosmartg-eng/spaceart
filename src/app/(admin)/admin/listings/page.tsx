import { Suspense } from "react";
import { getAuthContext, canApproveContent } from "@/infrastructure/auth/permissions";
import { getListingsModerationPage } from "@/domains/admin/queries/moderation-queries";
import { AdminShell } from "@/domains/admin/components/admin-shell";
import { ModerationToolbar } from "@/domains/admin/components/moderation-toolbar";
import { ListingsModerationTable } from "@/domains/admin/components/moderation-tables.dynamic";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Listings — Admin",
};

const LISTING_STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending review" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctx = await getAuthContext();
  const canApprove = canApproveContent(ctx?.profile.role);

  const result = await getListingsModerationPage({
    status: params.status ?? "pending_review",
    q: params.q,
    page: Number(params.page) || 1,
  });

  return (
    <AdminShell
      currentPath="/admin/listings"
      role={ctx?.profile.role ?? "user"}
    >
      <PageHeader
        title="Listings"
        description="Approve listings for publication on the public marketplace."
      />

      <Suspense fallback={<div className="mb-8 h-10 animate-pulse rounded-lg bg-muted" />}>
        <ModerationToolbar
          statusOptions={LISTING_STATUS_OPTIONS}
          basePath="/admin/listings"
          totalPages={result.totalPages}
          page={result.page}
        />
      </Suspense>

      <p className="mb-6 text-sm text-muted-foreground">
        {result.total} result{result.total === 1 ? "" : "s"}
      </p>

      <ListingsModerationTable
        listings={result.items}
        canApprove={canApprove}
      />
    </AdminShell>
  );
}
