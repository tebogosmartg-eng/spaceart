"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModerationToast } from "../components/moderation-toast";

export function useModerationAction() {
  const router = useRouter();
  const toast = useModerationToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = useCallback(
    (
      id: string,
      action: () => Promise<void>,
      messages: { success: string; error?: string },
      onError?: () => void
    ) => {
      setPendingId(id);
      startTransition(async () => {
        try {
          await action();
          toast.success(messages.success);
          router.refresh();
        } catch (e) {
          onError?.();
          toast.error(
            messages.error ??
              (e instanceof Error ? e.message : "Moderation action failed")
          );
        } finally {
          setPendingId(null);
        }
      });
    },
    [router, toast]
  );

  const isRowPending = useCallback(
    (id: string) => isPending && pendingId === id,
    [isPending, pendingId]
  );

  return { run, isRowPending, isPending };
}
