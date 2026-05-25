"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  approveCreativeAction,
  rejectCreativeAction,
} from "../actions/review-actions";
import { RejectReasonDialog } from "./reject-reason-dialog";
import { VerifyToggle } from "./verify-toggle";
import { ModerationAuditMeta } from "./moderation-audit-meta";
import { ModerationQueueCard } from "./moderation-queue-card";
import { useModerationAction } from "../hooks/use-moderation-action";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Creative } from "@/shared/types/database";

interface CreatorsModerationTableProps {
  creatives: Creative[];
  canApprove: boolean;
}

export function CreatorsModerationTable({
  creatives,
  canApprove,
}: CreatorsModerationTableProps) {
  const [items, setItems] = useState(creatives);
  const { run, isRowPending } = useModerationAction();

  useEffect(() => {
    setItems(creatives);
  }, [creatives]);

  const sorted = useMemo(() => items, [items]);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Queue is clear"
        description="No creatives match your filters. Pending submissions will appear here."
      />
    );
  }

  function optimisticApprove(id: string) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "approved" as const,
              approved_at: now,
              rejected_at: null,
              rejected_by: null,
              rejection_note: null,
            }
          : c
      )
    );
  }

  function optimisticReject(id: string, reason: string) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "rejected" as const,
              rejected_at: now,
              rejection_note: reason,
              approved_at: null,
              approved_by: null,
            }
          : c
      )
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((creative) => {
        const rowPending = isRowPending(creative.id);
        const imageUrl = creative.avatar_url ?? creative.cover_image_url;

        return (
          <ModerationQueueCard
            key={creative.id}
            title={creative.display_name}
            subtitle={[creative.city, creative.province].filter(Boolean).join(", ") || creative.slug}
            imageUrl={imageUrl}
            status={creative.status}
            note={creative.rejection_note}
            meta={
              <div className="mt-2 space-y-1">
                {creative.verified && (
                  <span className="text-xs text-accent">Verified badge active</span>
                )}
                <ModerationAuditMeta
                  approvedAt={creative.approved_at}
                  rejectedAt={creative.rejected_at}
                />
              </div>
            }
            actions={
              canApprove ? (
                <>
                  {creative.status === "pending" && (
                    <>
                      <Button
                        disabled={rowPending}
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          const snapshot = items;
                          optimisticApprove(creative.id);
                          run(
                            creative.id,
                            () => approveCreativeAction(creative.id),
                            { success: "Creator profile approved" },
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
                        title="Reject creative profile"
                        description="The creator will see this reason on their dashboard."
                        disabled={rowPending}
                        onReject={async (reason) => {
                          optimisticReject(creative.id, reason);
                          await rejectCreativeAction(creative.id, reason);
                        }}
                        successMessage="Creator profile rejected"
                      />
                    </>
                  )}
                  {creative.status === "approved" && (
                    <VerifyToggle
                      creativeId={creative.id}
                      verified={creative.verified}
                      canVerify
                      onVerifiedChange={(verified) =>
                        setItems((prev) =>
                          prev.map((c) =>
                            c.id === creative.id ? { ...c, verified } : c
                          )
                        )
                      }
                    />
                  )}
                </>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
