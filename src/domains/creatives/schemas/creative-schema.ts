import { z } from "zod";

export const creativeProfileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  whatsapp_number: z
    .string()
    .min(10, "Valid WhatsApp number required")
    .regex(/^\+?[\d\s-]+$/, "Invalid phone number format"),
  cover_image_url: z.string().url().optional().nullable(),
  // Optional: onboarding resolves a placeholder server-side when upload is skipped.
  avatar_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional().nullable()
  ),
});
