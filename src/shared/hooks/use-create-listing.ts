"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListing } from "@/domains/listings/actions/listing-actions";
import { queryKeys } from "./query-keys";
import type { ListingWithRelations } from "@/infrastructure/supabase/types";

export function useCreateListing(profileId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createListing(formData),
    onMutate: async (formData) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.listings.owner(profileId),
      });
      const previous = queryClient.getQueryData<ListingWithRelations[]>(
        queryKeys.listings.owner(profileId)
      );

      const optimistic: ListingWithRelations = {
        id: `temp-${Date.now()}`,
        creative_id: "pending",
        category_id: String(formData.get("category_id") ?? ""),
        slug: "creating...",
        title: String(formData.get("title") ?? "New listing"),
        description: String(formData.get("description") ?? ""),
        status: "draft",
        is_trending: false,
        price_from_cents: null,
        price_label: String(formData.get("price_label") ?? "") || null,
        rejection_note: null,
        published_at: null,
        approved_at: null,
        approved_by: null,
        rejected_at: null,
        rejected_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        queryKeys.listings.owner(profileId),
        [optimistic, ...(previous ?? [])]
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.listings.owner(profileId),
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.owner(profileId),
      });
    },
  });
}
