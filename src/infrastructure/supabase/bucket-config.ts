import type { StorageBucket } from "./storage";

export const STORAGE_BUCKET_DEFINITIONS = [
  {
    id: "avatars" as const satisfies StorageBucket,
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ] as string[],
  },
  {
    id: "listings" as const satisfies StorageBucket,
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ] as string[],
  },
] as const;
