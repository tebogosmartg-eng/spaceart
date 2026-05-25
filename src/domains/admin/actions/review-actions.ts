"use server";

import { requireAdmin } from "@/infrastructure/auth/permissions";
import {
  approveCreative,
  rejectCreative,
  setCreativeVerified,
} from "@/infrastructure/services/creative-service";
import {
  approveListing,
  rejectListing,
} from "@/infrastructure/services/listing-service";

export async function approveCreativeAction(creativeId: string) {
  await requireAdmin();
  await approveCreative(creativeId);
}

export async function rejectCreativeAction(creativeId: string, reason: string) {
  await requireAdmin();
  if (!reason?.trim()) {
    throw new Error("Rejection reason is required");
  }
  await rejectCreative(creativeId, reason.trim());
}

export async function approveListingAction(listingId: string) {
  await requireAdmin();
  await approveListing(listingId);
}

export async function rejectListingAction(listingId: string, reason: string) {
  await requireAdmin();
  if (!reason?.trim()) {
    throw new Error("Rejection reason is required");
  }
  await rejectListing(listingId, reason.trim());
}

export async function setCreativeVerifiedAction(
  creativeId: string,
  verified: boolean
) {
  await requireAdmin();
  await setCreativeVerified(creativeId, verified);
}
