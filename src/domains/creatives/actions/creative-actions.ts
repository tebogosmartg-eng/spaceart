"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/database/server";
import { submitCreativeForReview, promoteToCreative } from "@/infrastructure/services/creative-service";
import {
  isAvatarPlaceholderUrl,
  resolveAvatarUrl,
} from "@/shared/lib/avatar-url";
import { formOptionalString } from "@/shared/lib/form-data";
import { slugify } from "@/shared/lib/utils";
import { creativeProfileSchema } from "../schemas/creative-schema";

export async function upsertCreativeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = creativeProfileSchema.safeParse({
    display_name: formData.get("display_name"),
    bio: formData.get("bio"),
    city: formData.get("city"),
    province: formData.get("province"),
    whatsapp_number: formData.get("whatsapp_number"),
    cover_image_url: formOptionalString(formData.get("cover_image_url")),
    avatar_url: formOptionalString(formData.get("avatar_url")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
  }

  const avatarUrl = resolveAvatarUrl(
    parsed.data.display_name,
    parsed.data.avatar_url
  );
  const usedUploadedAvatar = Boolean(
    parsed.data.avatar_url?.trim() &&
      !isAvatarPlaceholderUrl(parsed.data.avatar_url)
  );

  const payload = {
    ...parsed.data,
    avatar_url: avatarUrl,
  };

  await promoteToCreative(user.id);

  const slug = slugify(parsed.data.display_name);
  const { data: existing } = await supabase
    .from("creatives")
    .select("id, slug")
    .eq("profile_id", user.id)
    .maybeSingle();

  let creativeId = existing?.id;

  if (existing) {
    const { error } = await supabase
      .from("creatives")
      .update({ ...payload, slug: existing.slug })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("creatives")
      .insert({
        profile_id: user.id,
        slug: `${slug}-${user.id.slice(0, 8)}`,
        ...payload,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    creativeId = data.id;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.display_name,
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  if (profileError) {
    console.warn("[profile] Creative saved but profiles.avatar_url sync failed", {
      userId: user.id,
      message: profileError.message,
    });
  }

  console.info("[profile] Upserted creative", {
    userId: user.id,
    avatarSource: usedUploadedAvatar ? "upload" : "placeholder",
  });

  revalidatePath("/dashboard/profile");
  return { id: creativeId };
}

export async function submitProfileForReviewAction(creativeId: string) {
  await submitCreativeForReview(creativeId);
}
