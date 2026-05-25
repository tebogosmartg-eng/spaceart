"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateListing,
  submitListingAction,
  archiveListing,
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
import type { Category, ListingWithRelations } from "@/shared/types/database";

interface ListingFormProps {
  categories: Category[];
  listing?: ListingWithRelations;
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
  const [uploadedMedia, setUploadedMedia] = useState<
    { url: string; path: string }[]
  >(
    listing?.listing_media?.map((m) => ({
      url: m.url,
      path: m.storage_path ?? m.cloudinary_public_id ?? "",
    })) ?? []
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadWarning(null);
    setImageUploading(true);
    const result = await tryStorageUpload({
      file,
      bucket: "listings",
      listingId: listing?.id,
    });
    setImageUploading(false);

    if (result) {
      setUploadedMedia((prev) => [
        ...prev,
        { url: result.url, path: result.path },
      ]);
      return;
    }

    setUploadWarning(
      "Image upload is temporarily unavailable. You can still create the listing and add photos later."
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("category_id", categoryId);
    uploadedMedia.forEach((m) => {
      formData.append("media_urls", m.url);
      formData.append("storage_paths", m.path);
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

        {!listing && (
          <div className="space-y-2">
            <Label htmlFor="images">
              Images{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={imageUploading}
              className="bg-card"
            />
            {imageUploading && (
              <p className="text-sm text-muted-foreground">Uploading image…</p>
            )}
            {uploadWarning && (
              <p className="text-sm text-amber-400" role="status">
                {uploadWarning}
              </p>
            )}
            {uploadedMedia.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uploadedMedia.map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.path}
                    src={m.url}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10"
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
