"use client";

import { useMutation } from "@tanstack/react-query";
import { devInfo, devWarn } from "@/shared/lib/dev-log";

export type UploadBucket = "avatars" | "listings";

interface UploadParams {
  file: File;
  bucket: UploadBucket;
  listingId?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  bucket?: UploadBucket;
}

interface UploadErrorPayload {
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

function retryDelayMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

async function parseUploadError(res: Response): Promise<Error> {
  let payload: UploadErrorPayload = {};
  try {
    payload = (await res.json()) as UploadErrorPayload;
  } catch {
    /* non-JSON body */
  }

  const message =
    payload.error ??
    (res.status === 503
      ? "Storage is not configured. Ask an admin to run the Supabase storage migration."
      : "Upload failed");

  const err = new Error(message) as Error & {
    code?: string;
    status?: number;
    details?: Record<string, unknown>;
  };
  err.code = payload.code;
  err.status = res.status;
  err.details = payload.details;
  return err;
}

async function uploadOnce(params: UploadParams): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("bucket", params.bucket);
  if (params.listingId) formData.append("listingId", params.listingId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw await parseUploadError(res);
  return (await res.json()) as UploadResult;
}

/**
 * Non-throwing upload for optional flows (e.g. onboarding).
 * Logs failures without propagating errors to profile/onboarding actions.
 *
 * TODO: Prefer required uploads here once storage infrastructure is production-ready.
 */
export async function tryStorageUpload(
  params: UploadParams
): Promise<UploadResult | null> {
  try {
    const result = await uploadWithRetry(params);
    devInfo("[upload] Client upload success", {
      bucket: params.bucket,
      path: result.path,
      fileName: params.file.name,
    });
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Upload failed");
    devWarn("[upload] Optional upload failed (non-blocking)", {
      bucket: params.bucket,
      fileName: params.file.name,
      fileSize: params.file.size,
      message: error.message,
      code: (error as Error & { code?: string }).code,
      status: (error as Error & { status?: number }).status,
    });
    return null;
  }
}

async function uploadWithRetry(params: UploadParams): Promise<UploadResult> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await uploadOnce(params);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Upload failed");
      const status = (lastError as Error & { status?: number }).status;
      const retryable =
        status != null && RETRYABLE_STATUS.has(status) && attempt < MAX_ATTEMPTS - 1;

      if (!retryable) throw lastError;

      await new Promise((r) => setTimeout(r, retryDelayMs(attempt)));
    }
  }

  throw lastError ?? new Error("Upload failed");
}

export function useStorageUpload() {
  return useMutation({
    mutationFn: uploadWithRetry,
    retry: false,
  });
}
