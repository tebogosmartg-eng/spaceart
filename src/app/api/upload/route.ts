/**
 * Image upload API (Supabase Storage).
 *
 * TODO: Harden storage provisioning and monitoring before making uploads required
 * in onboarding/profile flows. Onboarding must not depend on this route succeeding.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { ensureStorageBuckets } from "@/infrastructure/supabase/ensure-storage-buckets";
import { validateStorageBuckets } from "@/infrastructure/supabase/validate-storage-buckets";
import {
  STORAGE_BUCKETS,
  StorageUploadError,
  buildAvatarPath,
  buildListingMediaPath,
  extensionFromFile,
  uploadImage,
  type StorageBucket,
} from "@/infrastructure/supabase/storage";
import { checkUploadRateLimit } from "@/infrastructure/storage/rate-limit";

type UploadErrorBody = {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

function errorResponse(
  message: string,
  status: number,
  extra?: Omit<UploadErrorBody, "error">
) {
  const body: UploadErrorBody = { error: message, ...extra };
  return NextResponse.json(body, { status });
}

function logUploadFailure(
  context: Record<string, unknown>,
  err: unknown
): void {
  if (err instanceof StorageUploadError) {
    console.error("[upload] Storage error", {
      ...context,
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }
  console.error("[upload] Unexpected error", {
    ...context,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[upload] Auth session error", { message: authError.message });
    return errorResponse("Authentication failed", 401, {
      code: "AUTH_ERROR",
    });
  }

  if (!user) {
    return errorResponse("Unauthorized", 401, { code: "UNAUTHORIZED" });
  }

  const rateLimit = checkUploadRateLimit(user.id);
  if (!rateLimit.allowed) {
    return errorResponse("Too many uploads. Try again later.", 429, {
      code: "RATE_LIMITED",
      details: { retryAfter: rateLimit.retryAfter ?? 60 },
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    logUploadFailure({ userId: user.id, stage: "formData" }, err);
    return errorResponse("Invalid multipart form data", 400, {
      code: "INVALID_FORM",
    });
  }

  const fileEntry = formData.get("file");
  const bucketRaw = formData.get("bucket");
  const listingId = formData.get("listingId");

  if (!(fileEntry instanceof File)) {
    return errorResponse("Missing or invalid file field", 400, {
      code: "MISSING_FILE",
    });
  }
  const file = fileEntry;

  if (
    typeof bucketRaw !== "string" ||
    !Object.values(STORAGE_BUCKETS).includes(bucketRaw as StorageBucket)
  ) {
    return errorResponse("Missing or invalid bucket", 400, {
      code: "INVALID_BUCKET",
      details: { bucket: bucketRaw },
    });
  }
  const bucket = bucketRaw as StorageBucket;

  const ext = extensionFromFile(file);
  const fileId = crypto.randomUUID();

  let path: string;
  if (bucket === STORAGE_BUCKETS.avatars) {
    path = buildAvatarPath(user.id, ext);
  } else {
    const lid =
      typeof listingId === "string" && listingId.length > 0
        ? listingId
        : "draft";
    path = buildListingMediaPath(user.id, lid, `${fileId}.${ext}`);
  }

  const context = {
    userId: user.id,
    bucket,
    path,
    fileName: file.name,
    fileSize: file.size,
    reportedType: file.type || "(empty)",
  };

  async function performUpload() {
    return uploadImage(supabase, bucket, path, file);
  }

  try {
    const validation = await validateStorageBuckets(supabase);
    if (!validation.ok && validation.missing.length > 0) {
      const provision = await ensureStorageBuckets();
      console.warn("[upload] Missing buckets; provision attempt", {
        ...context,
        validation,
        provision,
      });
      const revalidate = await validateStorageBuckets(supabase);
      if (!revalidate.ok && revalidate.missing.length > 0) {
        throw new StorageUploadError(
          `Storage bucket "${revalidate.missing[0]}" is not configured. Run supabase/migrations/005_schema_and_storage_repair.sql in the Supabase SQL Editor.`,
          "BUCKET_NOT_FOUND",
          { missing: revalidate.missing, validation: revalidate, provision }
        );
      }
    }

    const preflight = await ensureStorageBuckets();
    if (preflight.created.length > 0) {
      console.info("[upload] Provisioned storage buckets", preflight);
    }

    let uploadResult: Awaited<ReturnType<typeof performUpload>>;
    try {
      uploadResult = await performUpload();
    } catch (firstErr) {
      if (
        firstErr instanceof StorageUploadError &&
        firstErr.code === "BUCKET_NOT_FOUND"
      ) {
        const provision = await ensureStorageBuckets();
        console.warn("[upload] Bucket missing; provision attempt", {
          ...context,
          provision,
        });
        if (provision.created.length > 0) {
          uploadResult = await performUpload();
        } else {
          throw firstErr;
        }
      } else {
        throw firstErr;
      }
    }

    const { path: storagePath, publicUrl } = uploadResult;

    // Best-effort profile sync; failures must not break the upload response.
    // TODO: Move avatar profile sync to a background job when storage infra is stable.
    if (bucket === STORAGE_BUCKETS.avatars) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (profileError) {
        console.warn("[upload] Avatar stored but profile update failed (non-fatal)", {
          userId: user.id,
          path: storagePath,
          message: profileError.message,
        });
      }
    }

    console.info("[upload] Success", {
      userId: user.id,
      bucket,
      path: storagePath,
      bytes: file.size,
    });

    return NextResponse.json({
      url: publicUrl,
      path: storagePath,
      publicId: storagePath,
      bucket,
    });
  } catch (err) {
    logUploadFailure(context, err);

    if (err instanceof StorageUploadError) {
      const status =
        err.code === "INVALID_TYPE" || err.code === "FILE_TOO_LARGE"
          ? 400
          : err.code === "BUCKET_NOT_FOUND"
            ? 503
            : err.code === "RLS_DENIED"
              ? 403
              : 500;

      return errorResponse(err.message, status, {
        code: err.code,
        details: err.details,
      });
    }

    return errorResponse(
      err instanceof Error ? err.message : "Upload failed",
      500,
      { code: "UPLOAD_FAILED" }
    );
  }
}
