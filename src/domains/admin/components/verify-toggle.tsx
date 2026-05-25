"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setCreativeVerifiedAction } from "../actions/review-actions";
import { useModerationToast } from "./moderation-toast";
import { BadgeCheck, Loader2 } from "lucide-react";

interface VerifyToggleProps {
  creativeId: string;
  verified: boolean;
  canVerify: boolean;
  onVerifiedChange?: (verified: boolean) => void;
}

export function VerifyToggle({
  creativeId,
  verified,
  canVerify,
  onVerifiedChange,
}: VerifyToggleProps) {
  const router = useRouter();
  const toast = useModerationToast();
  const [pending, startTransition] = useTransition();

  if (!canVerify) return null;

  return (
    <Button
      type="button"
      variant={verified ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() => {
        const next = !verified;
        onVerifiedChange?.(next);
        startTransition(async () => {
          try {
            await setCreativeVerifiedAction(creativeId, next);
            toast.success(
              next ? "Creator marked as verified" : "Verification removed"
            );
            router.refresh();
          } catch (e) {
            onVerifiedChange?.(verified);
            toast.error(
              e instanceof Error ? e.message : "Could not update verification"
            );
          }
        });
      }}
    >
      {pending ? (
        <Loader2 className="mr-1 size-4 animate-spin" />
      ) : (
        <BadgeCheck className="mr-1 size-4" />
      )}
      {verified ? "Verified" : "Mark verified"}
    </Button>
  );
}
