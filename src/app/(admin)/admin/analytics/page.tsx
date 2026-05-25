import { getAuthContext } from "@/infrastructure/auth/permissions";
import { getAdminDashboardSnapshot } from "@/domains/admin/queries/moderation-queries";
import { AdminShell } from "@/domains/admin/components/admin-shell";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Platform Analytics — Admin",
};

export default async function AdminAnalyticsPage() {
  const ctx = await getAuthContext();
  const { counts, health } = await getAdminDashboardSnapshot();

  const approvalRate =
    counts.totalListings > 0
      ? Math.round((counts.publishedListings / counts.totalListings) * 100)
      : 0;

  return (
    <AdminShell
      currentPath="/admin/analytics"
      role={ctx?.profile.role ?? "user"}
    >
      <PageHeader
        title="Platform analytics"
        description="Inventory, moderation load, and publishing velocity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatBlock label="Registered profiles" value={counts.totalProfiles} />
        <StatBlock label="Creator profiles" value={counts.totalCreatives} />
        <StatBlock label="Total listings" value={counts.totalListings} />
        <StatBlock label="Published listings" value={counts.publishedListings} />
        <StatBlock label="Pending creators" value={counts.pendingCreatives} highlight />
        <StatBlock label="Pending listings" value={counts.pendingListings} highlight />
      </div>

      <section className="surface-elevated mt-8 p-6 md:p-8">
        <h2 className="font-heading text-lg font-semibold">Publishing rate</h2>
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-accent">
          {approvalRate}%
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Share of listings currently published ({counts.publishedListings} of{" "}
          {counts.totalListings}).
        </p>
      </section>

      <section className="surface-elevated mt-6 p-6 md:p-8">
        <h2 className="font-heading text-lg font-semibold">System status</h2>
        <p className="mt-2 text-sm capitalize text-muted-foreground">
          {health.status} — {health.message}
        </p>
      </section>
    </AdminShell>
  );
}

function StatBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "surface-elevated ring-1 ring-accent/20 p-6"
          : "surface-elevated p-6"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
