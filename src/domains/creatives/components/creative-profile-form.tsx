"use client";

import { useState, useTransition } from "react";
import { upsertCreativeProfile, submitProfileForReviewAction } from "../actions/creative-actions";
import { tryStorageUpload } from "@/shared/hooks/use-storage-upload";
import {
  buildAvatarPlaceholderUrl,
  isAvatarPlaceholderUrl,
} from "@/shared/lib/avatar-url";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { Creative } from "@/shared/types/database";

interface CreativeProfileFormProps {
  creative: Creative | null;
}

export function CreativeProfileForm({ creative }: CreativeProfileFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [displayName, setDisplayName] = useState(creative?.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => {
    const url = creative?.avatar_url ?? "";
    return url && !isAvatarPlaceholderUrl(url) ? url : "";
  });

  const avatarPreview =
    avatarUrl ||
    (displayName.trim() ? buildAvatarPlaceholderUrl(displayName) : null) ||
    (creative?.avatar_url && isAvatarPlaceholderUrl(creative.avatar_url)
      ? creative.avatar_url
      : null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadWarning(null);
    setAvatarUploading(true);
    const result = await tryStorageUpload({ file, bucket: "avatars" });
    setAvatarUploading(false);

    if (result) {
      setAvatarUrl(result.url);
      return;
    }

    setUploadWarning(
      "Photo upload is temporarily unavailable. Save your profile to keep a placeholder, or try again later."
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    if (avatarUrl) formData.set("avatar_url", avatarUrl);
    startTransition(async () => {
      try {
        await upsertCreativeProfile(formData);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  function handleSubmitForReview() {
    if (!creative?.id) return;
    startTransition(async () => {
      try {
        await submitProfileForReviewAction(creative.id);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit");
      }
    });
  }

  return (
    <div className="space-y-8">
      {creative && (
        <div className="flex items-center gap-3">
          <StatusBadge status={creative.status} />
          {creative.rejection_note && (
            <p className="text-sm text-red-400">{creative.rejection_note}</p>
          )}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={creative?.bio ?? ""}
            rows={4}
            className="bg-card"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={creative?.city ?? ""}
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              name="province"
              defaultValue={creative?.province ?? ""}
              className="bg-card"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp_number">WhatsApp number</Label>
          <Input
            id="whatsapp_number"
            name="whatsapp_number"
            defaultValue={creative?.whatsapp_number ?? ""}
            placeholder="+27..."
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar_file">
            Profile photo{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="avatar_file"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={avatarUploading}
            className="bg-card"
          />
          {avatarUploading && <Skeleton className="h-4 w-24" />}
          {avatarPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white/10"
            />
          )}
          {uploadWarning && (
            <p className="text-xs text-amber-400" role="status">
              {uploadWarning}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover_image_url">Cover image URL</Label>
          <Input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            defaultValue={creative?.cover_image_url ?? ""}
            className="bg-card"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Profile saved.</p>}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
            variant="accent"
          >
            {pending ? "Saving..." : "Save profile"}
          </Button>
          {creative && creative.status !== "approved" && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={handleSubmitForReview}
            >
              Submit for review
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
