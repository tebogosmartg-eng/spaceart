import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/supabase/server";
import type { ApprovalStatus } from "@/shared/types/database";

export async function submitCreativeForReview(creativeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("creatives")
    .update({ status: "pending" as ApprovalStatus, rejection_note: null })
    .eq("id", creativeId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/creators");
}

export async function approveCreative(creativeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_approve_creative", {
    p_creative_id: creativeId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/creatives");
  revalidatePath("/admin");
  revalidatePath("/admin/creators");
}

export async function rejectCreative(creativeId: string, note?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reject_creative", {
    p_creative_id: creativeId,
    p_reason: note ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/creators");
}

export async function setCreativeVerified(creativeId: string, verified: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_creative_verified", {
    p_creative_id: creativeId,
    p_verified: verified,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/creatives");
  revalidatePath("/admin/creators");
}

/** @deprecated Creators are identified by creatives row; role stays `user`. */
export async function promoteToCreative(_profileId: string) {
  // No-op after RBAC migration: profile role is `user` by default.
}
