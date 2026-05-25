"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { tryCreateAdminClient } from "@/infrastructure/supabase/admin";
import { promoteToCreative } from "@/infrastructure/services/creative-service";
import { creativeProfileSchema } from "@/domains/creatives/schemas/creative-schema";
import {
  isAvatarPlaceholderUrl,
  resolveAvatarUrl,
} from "@/shared/lib/avatar-url";
import { formOptionalString } from "@/shared/lib/form-data";
import { slugify } from "@/shared/lib/utils";

function onboardingError(message: string, context: Record<string, unknown>): never {
  console.error("[onboarding] Failed", { message, ...context });
  throw new Error(message);
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    onboardingError("Authentication failed. Sign in again.", {
      stage: "auth",
      message: authError.message,
    });
  }

  if (!user) {
    onboardingError("Unauthorized", { stage: "auth" });
  }

  const parsed = creativeProfileSchema.safeParse({
    display_name: formData.get("display_name"),
    bio: formOptionalString(formData.get("bio")),
    city: formOptionalString(formData.get("city")),
    province: formOptionalString(formData.get("province")),
    whatsapp_number: formData.get("whatsapp_number"),
    avatar_url: formOptionalString(formData.get("avatar_url")),
    cover_image_url: formOptionalString(formData.get("cover_image_url")),
  });

  if (!parsed.success) {
    onboardingError(parsed.error.issues[0]?.message ?? "Invalid profile data", {
      stage: "validation",
      userId: user.id,
      issues: parsed.error.issues.map((i) => i.message),
    });
  }

  const avatarUrl = resolveAvatarUrl(
    parsed.data.display_name,
    parsed.data.avatar_url
  );
  const usedUploadedAvatar = Boolean(
    parsed.data.avatar_url?.trim() &&
      !isAvatarPlaceholderUrl(parsed.data.avatar_url)
  );

  console.info("[onboarding] Starting", {
    userId: user.id,
    hasUploadedAvatar: usedUploadedAvatar,
    usingPlaceholder: !usedUploadedAvatar,
  });

  const db = tryCreateAdminClient() ?? supabase;

  const { data: profileRow, error: profileSelectError } = await db
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileSelectError) {
    onboardingError(
      "Could not load your profile. Run supabase/migrations/005_schema_and_storage_repair.sql.",
      { stage: "profile_select", userId: user.id, message: profileSelectError.message }
    );
  }

  if (!profileRow) {
    const { error: profileInsertError } = await db.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      full_name: parsed.data.display_name,
    });

    if (profileInsertError) {
      onboardingError(profileInsertError.message, {
        stage: "profile_insert",
        userId: user.id,
      });
    }
    console.info("[onboarding] Created missing profile row", { userId: user.id });
  }

  try {
    await promoteToCreative(user.id);
  } catch (err) {
    onboardingError(
      err instanceof Error ? err.message : "Could not update account role",
      { stage: "promote_role", userId: user.id }
    );
  }

  const { data: existing, error: creativeSelectError } = await db
    .from("creatives")
    .select("id, slug")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (creativeSelectError) {
    onboardingError(creativeSelectError.message, {
      stage: "creative_select",
      userId: user.id,
    });
  }

  const creativePayload = {
    ...parsed.data,
    avatar_url: avatarUrl,
    status: "pending" as const,
  };

  if (existing) {
    const { error: creativeUpdateError } = await db
      .from("creatives")
      .update(creativePayload)
      .eq("id", existing.id);

    if (creativeUpdateError) {
      onboardingError(creativeUpdateError.message, {
        stage: "creative_update",
        userId: user.id,
        creativeId: existing.id,
      });
    }
    console.info("[onboarding] Updated creative", {
      userId: user.id,
      creativeId: existing.id,
    });
  } else {
    const slug = `${slugify(parsed.data.display_name)}-${user.id.slice(0, 8)}`;
    const { data: inserted, error: creativeInsertError } = await db
      .from("creatives")
      .insert({
        profile_id: user.id,
        slug,
        ...creativePayload,
      })
      .select("id")
      .single();

    if (creativeInsertError) {
      onboardingError(creativeInsertError.message, {
        stage: "creative_insert",
        userId: user.id,
        slug,
      });
    }
    console.info("[onboarding] Created creative", {
      userId: user.id,
      creativeId: inserted?.id,
      slug,
    });
  }

  const { error: profileUpdateError } = await db
    .from("profiles")
    .update({
      onboarding_completed: true,
      full_name: parsed.data.display_name,
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    const hint = profileUpdateError.message.includes("onboarding_completed")
      ? "Database is missing profiles.onboarding_completed. Run supabase/migrations/005_schema_and_storage_repair.sql."
      : profileUpdateError.message;
    onboardingError(hint, {
      stage: "profile_complete",
      userId: user.id,
      message: profileUpdateError.message,
    });
  }

  console.info("[onboarding] Completed", {
    userId: user.id,
    avatarSource: usedUploadedAvatar ? "upload" : "placeholder",
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
