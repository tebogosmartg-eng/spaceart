"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  clientId: string;
  id?: string;
  type: "image";
  url: string | null;
  previewUrl: string;
  path: string;
  isExisting: boolean;
  status: "queued" | "uploading" | "uploaded" | "failed";
  progress: number;
  error?: string;
  signature?: string;
  file?: File;
  localPreview?: boolean;
}

const MAX_IMAGES = 10;
const UPLOAD_PARALLELISM = 2;

function buildMediaItems(listing?: ListingWithRelations): MediaItem[] {
  if (!listing?.listing_media) return [];
  return listing.listing_media
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      clientId: `existing-${m.id}`,
      id: m.id,
      type: "image",
      url: m.url,
      previewUrl: m.url,
      path: m.storage_path ?? m.cloudinary_public_id ?? "",
      isExisting: true,
      status: "uploaded",
      progress: 100,
    }));
}

function makeFileSignature(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function createClientId() {
  return `media-${Math.random().toString(36).slice(2, 11)}-${Date.now().toString(36)}`;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function ListingForm({ categories, listing }: ListingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const createListingMutation = useCreateListing(session?.user?.id);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [categoryId, setCategoryId] = useState(listing?.category_id ?? "");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() =>
    buildMediaItems(listing)
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadQueueRef = useRef<string[]>([]);
  const mediaItemsRef = useRef<MediaItem[]>([]);
  const uploadTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map()
  );
  const uploadingRef = useRef<Set<string>>(new Set());

  const pendingUploads = useMemo(
    () => mediaItems.filter((m) => m.status === "queued" || m.status === "uploading"),
    [mediaItems]
  );
  const failedUploads = useMemo(
    () => mediaItems.filter((m) => m.status === "failed"),
    [mediaItems]
  );
  const uploadedCount = useMemo(
    () => mediaItems.filter((m) => m.status === "uploaded").length,
    [mediaItems]
  );
  const existingMedia = useMemo(
    () => mediaItems.filter((m) => m.isExisting),
    [mediaItems]
  );

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    const timersRef = uploadTimersRef;
    return () => {
      const timers = timersRef.current;
      timers.forEach((timer) => clearInterval(timer));
      timers.clear();
      mediaItemsRef.current.forEach((item) => {
        if (item.localPreview && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const clearUploadTimer = useCallback((clientId: string) => {
    const timer = uploadTimersRef.current.get(clientId);
    if (timer) {
      clearInterval(timer);
      uploadTimersRef.current.delete(clientId);
    }
  }, []);

  const kickOffUploads = useCallback(function kickOffUploads() {
    while (
      uploadingRef.current.size < UPLOAD_PARALLELISM &&
      uploadQueueRef.current.length > 0
    ) {
      const clientId = uploadQueueRef.current.shift();
      if (!clientId) return;
      const item = mediaItemsRef.current.find((m) => m.clientId === clientId);
      if (!item || item.status !== "queued" || !item.file) continue;

      uploadingRef.current.add(clientId);
      setMediaItems((prev) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, status: "uploading", progress: 5 } : m
        )
      );

      const timer = setInterval(() => {
        setMediaItems((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? { ...m, progress: Math.min(m.progress + 8, 90) }
              : m
          )
        );
      }, 240);
      uploadTimersRef.current.set(clientId, timer);

      void tryStorageUpload({
        file: item.file,
        bucket: "listings",
        listingId: listing?.id,
      })
        .then((result) => {
          clearUploadTimer(clientId);
          setMediaItems((prev) =>
            prev.map((m) =>
              m.clientId === clientId
                ? result
                  ? {
                      ...m,
                      status: "uploaded",
                      progress: 100,
                      url: result.url,
                      path: result.path,
                      error: undefined,
                    }
                  : {
                      ...m,
                      status: "failed",
                      progress: 0,
                      error: "Upload unavailable. Retry in a moment.",
                    }
                : m
            )
          );
        })
        .catch(() => {
          clearUploadTimer(clientId);
          setMediaItems((prev) =>
            prev.map((m) =>
              m.clientId === clientId
                ? {
                    ...m,
                    status: "failed",
                    progress: 0,
                    error: "Upload failed. Please retry.",
                  }
                : m
            )
          );
        })
        .finally(() => {
          uploadingRef.current.delete(clientId);
          kickOffUploads();
        });
    }
  }, [clearUploadTimer, listing?.id]);

  useEffect(() => {
    if (uploadQueueRef.current.length > 0) kickOffUploads();
  }, [kickOffUploads, mediaItems]);

  const enqueueFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      setUploadWarning(null);
      setError(null);

      const signatureSet = new Set(
        mediaItems.map((item) => item.signature).filter(Boolean) as string[]
      );
      const deduped: MediaItem[] = [];
      const blocked: string[] = [];
      const roomLeft = MAX_IMAGES - mediaItems.length;

      for (const file of files) {
        if (deduped.length >= roomLeft) {
          blocked.push(file.name);
          continue;
        }
        const signature = makeFileSignature(file);
        if (signatureSet.has(signature)) {
          blocked.push(file.name);
          continue;
        }
        signatureSet.add(signature);
        const previewUrl = URL.createObjectURL(file);
        deduped.push({
          clientId: createClientId(),
          type: "image",
          url: null,
          previewUrl,
          path: "",
          isExisting: false,
          status: "queued",
          progress: 0,
          signature,
          file,
          localPreview: true,
        });
      }

      if (blocked.length > 0) {
        setUploadWarning(
          blocked.length === 1
            ? `"${blocked[0]}" was skipped (duplicate or limit reached).`
            : `${blocked.length} files were skipped (duplicates or limit reached).`
        );
      }

      if (deduped.length === 0) return;
      setMediaItems((prev) => [...prev, ...deduped]);
      uploadQueueRef.current.push(...deduped.map((item) => item.clientId));
      kickOffUploads();
    },
    [kickOffUploads, mediaItems]
  );

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    enqueueFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (mediaItems.length >= MAX_IMAGES) {
      setUploadWarning(`Maximum ${MAX_IMAGES} images allowed per listing.`);
      return;
    }
    const files = Array.from(e.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    enqueueFiles(files);
  }

  function handleRetryUpload(item: MediaItem) {
    if (!item.file || item.status !== "failed") return;
    setMediaItems((prev) =>
      prev.map((m) =>
        m.clientId === item.clientId
          ? { ...m, status: "queued", progress: 0, error: undefined }
          : m
      )
    );
    uploadQueueRef.current.push(item.clientId);
    kickOffUploads();
  }

  function moveMedia(clientId: string, direction: "left" | "right") {
    setMediaItems((prev) => {
      const index = prev.findIndex((item) => item.clientId === clientId);
      if (index === -1) return prev;
      const nextIndex = direction === "left" ? index - 1 : index + 1;
      return moveItem(prev, index, nextIndex);
    });
  }

  function setPrimary(clientId: string) {
    setMediaItems((prev) => {
      const index = prev.findIndex((item) => item.clientId === clientId);
      if (index <= 0) return prev;
      return moveItem(prev, index, 0);
    });
  }

  async function handleRemoveMedia(item: MediaItem) {
    clearUploadTimer(item.clientId);
    uploadingRef.current.delete(item.clientId);
    uploadQueueRef.current = uploadQueueRef.current.filter((id) => id !== item.clientId);
    if (item.localPreview && item.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }

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
      setMediaItems((prev) => prev.filter((m) => m.clientId !== item.clientId));
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("category_id", categoryId);

    if (pendingUploads.length > 0) {
      setError("Please wait for uploads to finish before saving.");
      return;
    }
    if (failedUploads.length > 0) {
      setError("Resolve failed uploads before saving your listing.");
      return;
    }

    const mediaToSubmit = mediaItems.filter((m) => m.status === "uploaded" && m.url);

    mediaToSubmit.forEach((m) => {
      formData.append("media_urls", m.url!);
      formData.append("storage_paths", m.path);
      formData.append("media_record_ids", m.id ?? "");
      formData.append("media_ids", m.path);
    });

    if (listing) {
      startTransition(async () => {
        try {
          await updateListing(listing.id, formData);
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

  return (
    <div className="max-w-3xl space-y-8">
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
        <div className="space-y-4">
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
                {uploadedCount > existingMedia.length &&
                  ` · ${uploadedCount - existingMedia.length} new`}
              </span>
            )}
          </div>

          {mediaItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Drag to reorder. First image is your primary marketplace thumbnail.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {mediaItems.map((item, index) => (
                <div
                  key={item.clientId}
                  draggable
                  onDragStart={() => setDraggedId(item.clientId)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!draggedId || draggedId === item.clientId) return;
                    setMediaItems((prev) => {
                      const from = prev.findIndex((m) => m.clientId === draggedId);
                      const to = prev.findIndex((m) => m.clientId === item.clientId);
                      return moveItem(prev, from, to);
                    });
                    setDraggedId(null);
                  }}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-muted/20 shadow-sm transition-brand hover:border-white/20"
                >
                  <Image
                    src={item.previewUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={item.previewUrl.startsWith("blob:")}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                      Primary
                    </span>
                  )}
                  {item.status !== "uploaded" && (
                    <div className="absolute inset-x-2 bottom-2 rounded-md bg-black/65 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span>
                          {item.status === "uploading"
                            ? "Uploading"
                            : item.status === "queued"
                              ? "Queued"
                              : "Failed"}
                        </span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.status === "failed" ? "bg-red-400" : "bg-accent"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={removingId === item.id || item.status === "uploading"}
                    onClick={() => handleRemoveMedia(item)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-red-600 hover:ring-red-500/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
                  {item.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => handleRetryUpload(item)}
                      className="absolute left-2 top-2 rounded-full bg-amber-400/90 px-2 py-1 text-[10px] font-medium text-black"
                    >
                      Retry
                    </button>
                  )}
                  <div className="absolute inset-x-2 bottom-2 z-10 flex items-center gap-1 opacity-95">
                    <button
                      type="button"
                      onClick={() => moveMedia(item.clientId, "left")}
                      disabled={index === 0}
                      className="rounded-md bg-black/70 px-1.5 py-1 text-[10px] text-white disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(item.clientId, "right")}
                      disabled={index === mediaItems.length - 1}
                      className="rounded-md bg-black/70 px-1.5 py-1 text-[10px] text-white disabled:opacity-40"
                    >
                      Next
                    </button>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => setPrimary(item.clientId)}
                        className="rounded-md bg-accent/90 px-1.5 py-1 text-[10px] font-medium text-black"
                      >
                        Set primary
                      </button>
                    )}
                  </div>
                  {confirmRemoveId === item.id && (
                    <div className="absolute inset-x-0 bottom-0 bg-red-600/90 px-2 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
                      Tap again to remove
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* Upload input */}
          {mediaItems.length < MAX_IMAGES && (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border border-dashed p-4 transition-colors ${
                dragActive
                  ? "border-accent bg-accent/10"
                  : "border-white/15 bg-card/40 hover:border-white/30"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Drop images here or browse. Add more anytime.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add images
                </Button>
              </div>
              <Input
                ref={fileInputRef}
                id="images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="bg-card file:mr-3 file:rounded-md file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
              />
              {pendingUploads.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoadingSpinner className="h-3.5 w-3.5" />
                  <span>
                    Uploading {pendingUploads.length} image
                    {pendingUploads.length === 1 ? "" : "s"}...
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                JPEG, PNG, WebP, GIF up to 5MB each. Primary image appears on cards.
              </p>
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
              pending ||
              createListingMutation.isPending ||
              !categoryId ||
              pendingUploads.length > 0
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
