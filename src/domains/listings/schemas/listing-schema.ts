import { z } from "zod";

export const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().max(3000).optional().nullable(),
  category_id: z.string().uuid("Select a category"),
  price_label: z.string().max(100).optional().nullable(),
  price_from_cents: z.number().int().positive().optional().nullable(),
});
