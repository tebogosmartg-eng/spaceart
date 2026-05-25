"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTriggerButton,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModerationToast } from "./moderation-toast";

interface RejectReasonDialogProps {
  label?: string;
  title: string;
  description: string;
  disabled?: boolean;
  onReject: (reason: string) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
}

export function RejectReasonDialog({
  label = "Reject",
  title,
  description,
  disabled = false,
  onReject,
  onSuccess,
  successMessage = "Rejected successfully",
}: RejectReasonDialogProps) {
  const router = useRouter();
  const toast = useModerationToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReject() {
    if (!reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await onReject(reason.trim());
        onSuccess?.();
        toast.success(successMessage);
        setOpen(false);
        setReason("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Rejection failed");
        toast.error(e instanceof Error ? e.message : "Rejection failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTriggerButton
        variant="outline"
        disabled={disabled || pending}
      >
        {label}
      </DialogTriggerButton>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (visible to the creator)"
          rows={4}
          disabled={pending}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <DialogFooter>
          <DialogCloseButton variant="outline" disabled={pending}>
            Cancel
          </DialogCloseButton>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleReject}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              "Confirm reject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
