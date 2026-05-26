"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  updateListing,
  submitListingAction,
  archiveListing,
  deleteListingMedia,
} from "../actions/listing-actions";
import { useCreateListing } from "@/shared/hooks/use-create-listing";
import { tryStorageUpload } from "@/shared/hooks/use-storage-upload";
import { useSession } from "@/shared/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/shared/ui/status-badge";
import type {
  Category,
  ListingWithRelations,
} from "@/shared/types/database";

interface ListingFormProps {
  categories: Category[];
  listing?: ListingWithRelations;
}

interface MediaItem {
  id?: string;
  url: string;
  path: string;
  isExisting: boolean;
}

const MAX_IMAGES = 10;

function buildMediaItems(listing?: ListingWithRelations): MediaItem[] {
  if (!listing?.listing_media) return [];
  return listing.listing_media
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      id: m.id,
      url: m.url,
      path: m.storage_path ?? m.cloudinary_public_id ?? "",
      isExisting: true,
    }));
}

export function ListingForm({ categories, listing }: ListingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const createListingMutation = useCreateListing(session?.user?.id);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [categoryId, setCategoryId] = useState(listing?.category_id ?? "");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() =>
    buildMediaItems(listing)
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const newMediaItems = mediaItems.filter((m) => !m.isExisting);

  const isDuplicateUrl = useCallback(
    (url: string) => mediaItems.some((m) => m.url === url),
    [mediaItems]
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaItems.length >= MAX_IMAGES) {
      setUploadWarning(`Maximum ${MAX_IMAGES} images allowed per listing.`);
      e.target.value = "";
      return;
    }

    setUploadWarning(null);
    setImageUploading(true);

    const result = await tryStorageUpload({
      file,
      bucket: "listings",
      listingId: listing?.id,
    });

    setImageUploading(false);
    e.target.value = "";

    if (result) {
      if (isDuplicateUrl(result.url)) {
        setUploadWarning("This image has already been added.");
        return;
      }
      setMediaItems((prev) => [
        ...prev,
        { url: result.url, path: result.path, isExisting: false },
      ]);
      return;
    }

    setUploadWarning(
      listing
        ? "Image upload is temporarily unavailable. Please try again."
        : "Image upload is temporarily unavailable. You can still create the listing and add photos later."
    );
  }

  async function handleRemoveMedia(item: MediaItem) {
    if (item.isExisting && item.id) {
      if (confirmRemoveId !== item.id) {
        setConfirmRemoveId(item.id);
        return;
      }

      setRemovingId(item.id);
      setConfirmRemoveId(null);
      try {
        await deleteListingMedia(item.id);
        setMediaItems((prev) => prev.filter((m) => m.id !== item.id));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to remove image"
        );
      } finally {
        setRemovingId(null);
      }
    } else {
      setMediaItems((prev) =>
        prev.filter((m) => m.url !== item.url || m.path !== item.path)
      );
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("category_id", categoryId);

    const mediaToSubmit = listing ? newMediaItems : mediaItems;

    mediaToSubmit.forEach((m) => {
      formData.append("media_urls", m.url);
      formData.append("storage_paths", m.path);
      formData.append("media_ids", m.path);
    });

    if (listing) {
      startTransition(async () => {
        try {
          await updateListing(listing.id, formData);
          setMediaItems((prev) =>
            prev.map((m) => (m.isExisting ? m : { ...m, isExisting: true }))
          );
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to save");
        }
      });
      return;
    }

    createListingMutation.mutate(formData, {
      onSuccess: (result) => {
        router.push(`/dashboard/listings/${result.id}/edit`);
      },
      onError: (e) => {
        setError(e instanceof Error ? e.message : "Failed to create listing");
      },
    });
  }

  function handleSubmitForReview() {
    if (!listing?.id) return;
    startTransition(async () => {
      try {
        await submitListingAction(listing.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit");
      }
    });
  }

  function handleArchive() {
    if (!listing?.id) return;
    startTransition(async () => {
      try {
        await archiveListing(listing.id);
        router.push("/dashboard/listings");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to archive");
      }
    });
  }

  const existingMedia = mediaItems.filter((m) => m.isExisting);

  return (
    <div className="space-y-8 max-w-xl">
      {listing && <StatusBadge status={listing.status} />}

      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={listing?.title ?? ""}
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={listing?.description ?? ""}
            rows={5}
            className="bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? "")}
            required
          >
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_label">Price label</Label>
          <Input
            id="price_label"
            name="price_label"
            defaultValue={listing?.price_label ?? ""}
            placeholder="From R2,500 / project"
            className="bg-card"
          />
        </div>

        {/* Media management section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="images">
              Images{" "}
              <span className="font-normal text-muted-foreground">
                ({mediaItems.length}/{MAX_IMAGES})
              </span>
            </Label>
            {listing && existingMedia.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {existingMedia.length} saved
                {newMediaItems.length > 0 &&
                  ` · ${newMediaItems.length} new`}
              </span>
            )}
          </div>

          {/* Existing media gallery */}
          {existingMedia.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {existingMedia.map((item) => (
                <div
                  key={item.id ?? item.url}
                  className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-white/10 bg-muted/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <button
                    type="button"
                    disabled={removingId === item.id}
                    onClick={() => handleRemoveMedia(item)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-red-600 hover:ring-red-500/50 group-hover:opacity-100 active:scale-95 disabled:opacity-50 sm:h-6 sm:w-6"
                    aria-label={
                      confirmRemoveId === item.id
                        ? "Confirm remove"
                        : "Remove image"
                    }
                  >
                    {removingId === item.id ? (
                      <LoadingSpinner className="h-3 w-3" />
                    ) : confirmRemoveId === item.id ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      <XIcon className="h-3 w-3" />
                    )}
                  </button>
                  {confirmRemoveId === item.id && (
                    <div className="absolute inset-x-0 bottom-0 bg-red-600/90 px-2 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
                      Tap again to remove
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Newly uploaded (unsaved) previews */}
          {newMediaItems.length > 0 && (
            <div className="space-y-1.5">
              {listing && (
                <p className="text-xs font-medium text-accent">
                  New — save to keep
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {newMediaItems.map((item) => (
                  <div
                    key={item.path}
                    className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-accent/30 bg-muted/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(item)}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-red-600 hover:ring-red-500/50 group-hover:opacity-100 active:scale-95 sm:h-6 sm:w-6"
                      aria-label="Remove image"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload input */}
          {mediaItems.length < MAX_IMAGES && (
            <div className="space-y-2">
              <Input
                id="images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={imageUploading}
                className="bg-card file:mr-3 file:rounded-md file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
              />
              {imageUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoadingSpinner className="h-3.5 w-3.5" />
                  <span>Uploading image…</span>
                </div>
              )}
            </div>
          )}

          {uploadWarning && (
            <p className="text-sm text-amber-400" role="status">
              {uploadWarning}
            </p>
          )}

          {mediaItems.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add images to showcase your work. JPEG, PNG, WebP, or GIF up to
              5MB each.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={
              pending || createListingMutation.isPending || !categoryId
            }
            variant="accent"
          >
            {pending || createListingMutation.isPending
              ? "Saving..."
              : listing
                ? "Update listing"
                : "Create listing"}
          </Button>
          {listing &&
            ["draft", "rejected"].includes(listing.status) && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={handleSubmitForReview}
              >
                Submit for review
              </Button>
            )}
          {listing && listing.status === "published" && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={handleArchive}
            >
              Archive
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
