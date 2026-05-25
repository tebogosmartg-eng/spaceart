import type { SupabaseClient } from "@supabase/supabase-js";
import { storageErrorIndicatesMissingBucket } from "./storage-errors";
import type { Database } from "./types";

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  listings: "listings",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const EXT_TO_MIME: Record<string, AllowedImageType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export type StorageErrorCode =
  | "INVALID_TYPE"
  | "FILE_TOO_LARGE"
  | "BUCKET_NOT_FOUND"
  | "RLS_DENIED"
  | "UPLOAD_FAILED";

export class StorageUploadError extends Error {
  readonly code: StorageErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: StorageErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "StorageUploadError";
    this.code = code;
    this.details = details;
  }
}

/** Infer MIME when the browser leaves `file.type` empty (common on Windows). */
export function resolveContentType(file: File): AllowedImageType | null {
  const normalized = file.type?.toLowerCase().trim();
  if (
    normalized &&
    ALLOWED_IMAGE_TYPES.includes(normalized as AllowedImageType)
  ) {
    return normalized as AllowedImageType;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return EXT_TO_MIME[ext] ?? null;
}

export function validateUploadFile(file: File): AllowedImageType {
  const contentType = resolveContentType(file);
  if (!contentType) {
    throw new StorageUploadError(
      "Invalid file type. Use JPEG, PNG, WebP, or GIF.",
      "INVALID_TYPE",
      { fileName: file.name, reportedType: file.type || "(empty)" }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new StorageUploadError(
      "File too large. Maximum size is 5MB.",
      "FILE_TOO_LARGE",
      { sizeBytes: file.size, maxBytes: MAX_FILE_BYTES }
    );
  }
  if (file.size === 0) {
    throw new StorageUploadError("File is empty.", "INVALID_TYPE", {
      fileName: file.name,
    });
  }
  return contentType;
}

function mapSupabaseStorageError(
  message: string,
  bucket: StorageBucket,
  path: string
): StorageUploadError {
  const lower = message.toLowerCase();
  if (storageErrorIndicatesMissingBucket(message)) {
    return new StorageUploadError(
      `Storage bucket "${bucket}" is not configured. Run \`npm run storage:setup\` (requires SUPABASE_SERVICE_ROLE_KEY) or supabase/migrations/005_schema_and_storage_repair.sql in the Supabase SQL Editor.`,
      "BUCKET_NOT_FOUND",
      { bucket, supabaseMessage: message }
    );
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("policy") ||
    lower.includes("permission denied")
  ) {
    return new StorageUploadError(
      "Upload denied by storage policy. Ensure you are signed in and the file path matches your user id.",
      "RLS_DENIED",
      { bucket, path }
    );
  }
  if (lower.includes("mime") || lower.includes("content type")) {
    return new StorageUploadError(message, "INVALID_TYPE", { bucket, path });
  }
  return new StorageUploadError(message, "UPLOAD_FAILED", { bucket, path });
}

export function getPublicUrl(
  supabase: SupabaseClient<Database>,
  bucket: StorageBucket,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  bucket: StorageBucket,
  path: string,
  file: File
): Promise<{ path: string; publicUrl: string; contentType: AllowedImageType }> {
  const contentType = validateUploadFile(file);
  const body = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) {
    throw mapSupabaseStorageError(error.message, bucket, path);
  }

  return {
    path,
    publicUrl: getPublicUrl(supabase, bucket, path),
    contentType,
  };
}

export function buildAvatarPath(userId: string, ext: string): string {
  return `${userId}/avatar.${ext}`;
}

export function buildListingMediaPath(
  userId: string,
  listingId: string,
  fileName: string
): string {
  return `${userId}/${listingId}/${fileName}`;
}

export function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && EXT_TO_MIME[fromName]) return fromName;
  const mime = resolveContentType(file);
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}
