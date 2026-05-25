"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import {
  approveListingAction,
  rejectListingAction,
} from "../actions/review-actions";
import { RejectReasonDialog } from "./reject-reason-dialog";
import { ModerationAuditMeta } from "./moderation-audit-meta";
import { ModerationQueueCard } from "./moderation-queue-card";
import { useModerationAction } from "../hooks/use-moderation-action";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ListingWithRelations } from "@/shared/types/database";

interface ListingsModerationTableProps {
  listings: ListingWithRelations[];
  canApprove: boolean;
}

export function ListingsModerationTable({
  listings,
  canApprove,
}: ListingsModerationTableProps) {
  const [items, setItems] = useState(listings);
  const { run, isRowPending } = useModerationAction();

  useEffect(() => {
    setItems(listings);
  }, [listings]);

  const sorted = useMemo(() => items, [items]);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Queue is clear"
        description="No listings match your filters."
      />
    );
  }

  function optimisticApprove(id: string) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: "published" as const,
              published_at: now,
              approved_at: now,
              rejected_at: null,
              rejected_by: null,
              rejection_note: null,
            }
          : l
      )
    );
  }

  function optimisticReject(id: string, reason: string) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: "rejected" as const,
              rejected_at: now,
              rejection_note: reason,
              approved_at: null,
              approved_by: null,
              published_at: null,
            }
          : l
      )
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((listing) => {
        const rowPending = isRowPending(listing.id);
        const media = listing.listing_media?.sort(
          (a, b) => a.sort_order - b.sort_order
        )[0];

        return (
          <ModerationQueueCard
            key={listing.id}
            title={listing.title}
            subtitle={`${listing.creatives?.display_name ?? "—"} · ${listing.categories?.name ?? "Uncategorized"}`}
            imageUrl={media?.url}
            status={listing.status}
            note={listing.rejection_note}
            meta={
              <ModerationAuditMeta
                approvedAt={listing.approved_at}
                rejectedAt={listing.rejected_at}
                publishedAt={listing.published_at}
              />
            }
            actions={
              canApprove && listing.status === "pending_review" ? (
                <>
                  <Button
                    disabled={rowPending}
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      const snapshot = items;
                      optimisticApprove(listing.id);
                      run(
                        listing.id,
                        () => approveListingAction(listing.id),
                        { success: "Listing approved and published" },
                        () => setItems(snapshot)
                      );
                    }}
                  >
                    {rowPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Approve"
                    )}
                  </Button>
                  <RejectReasonDialog
                    title="Reject listing"
                    description="The creator will see this reason on their listings page."
                    disabled={rowPending}
                    onReject={async (reason) => {
                      optimisticReject(listing.id, reason);
                      await rejectListingAction(listing.id, reason);
                    }}
                    successMessage="Listing rejected"
                  />
                </>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
