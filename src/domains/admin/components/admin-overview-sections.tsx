import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { AdminDashboardSnapshot } from "@/domains/admin/queries/moderation-queries";
import { adminQuickActions } from "@/shared/config/admin-navigation";
import { LinkButton } from "@/shared/ui/link-button";
import { cn } from "@/lib/utils";

function HealthIcon({ status }: { status: AdminDashboardSnapshot["health"]["status"] }) {
  if (status === "healthy") return <CheckCircle2 className="size-5 text-emerald-400" />;
  if (status === "attention") return <AlertTriangle className="size-5 text-amber-400" />;
  return <XCircle className="size-5 text-red-400" />;
}

interface AdminOverviewSectionsProps {
  snapshot: AdminDashboardSnapshot;
  canApprove: boolean;
}

export function AdminOverviewSections({
  snapshot,
  canApprove,
}: AdminOverviewSectionsProps) {
  const { counts, recentActivity, health } = snapshot;

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending creators" value={counts.pendingCreatives} href="/admin/creators?status=pending" accent />
        <MetricCard label="Pending listings" value={counts.pendingListings} href="/admin/listings?status=pending_review" accent />
        <MetricCard label="Published listings" value={counts.publishedListings} href="/admin/listings?status=published" />
        <MetricCard label="Creators on platform" value={counts.totalCreatives} href="/admin/creators" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-elevated lg:col-span-2 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Recent activity
            </h2>
            <Activity className="size-5 text-muted-foreground" />
          </div>
          {recentActivity.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No recent moderation activity yet.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-white/6">
              {recentActivity.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-4 py-3 transition-brand hover:text-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.type} · {item.status.replace("_", " ")}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-elevated p-6 md:p-8">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Platform health
          </h2>
          <div className="mt-6 flex items-start gap-3">
            <HealthIcon status={health.status} />
            <div>
              <p className="text-sm font-medium capitalize">{health.status}</p>
              <p className="mt-1 text-sm text-muted-foreground">{health.message}</p>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Moderation backlog</dt>
              <dd className="font-medium tabular-nums">{health.moderationBacklog}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total profiles</dt>
              <dd className="font-medium tabular-nums">{counts.totalProfiles}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total listings</dt>
              <dd className="font-medium tabular-nums">{counts.totalListings}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="surface-elevated p-6 md:p-8">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Quick actions
        </h2>
        {!canApprove && (
          <p className="mt-2 text-sm text-muted-foreground">
            Your moderator account can view queues. Approval requires an admin.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {adminQuickActions
            .filter((a) => a.href !== "#command")
            .map((action) => (
              <LinkButton
                key={action.href}
                href={action.href}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {action.label}
                <ArrowRight className="size-3.5" />
              </LinkButton>
            ))}
          <LinkButton href="/admin/analytics" variant="ghost" size="sm">
            View analytics
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "surface-elevated group block p-6 transition-brand hover:ring-1 hover:ring-accent/25 md:p-7",
        accent && "ring-1 ring-accent/15"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-4xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs text-accent opacity-0 transition-brand group-hover:opacity-100">
        Open queue <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}
