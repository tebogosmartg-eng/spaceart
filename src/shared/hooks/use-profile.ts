"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/infrastructure/supabase/client";
import type { Profile } from "@/infrastructure/supabase/types";
import { queryKeys } from "./query-keys";

async function fetchProfileClient(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => (userId ? fetchProfileClient(userId) : null),
    enabled: Boolean(userId),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Pick<Profile, "full_name" | "avatar_url">>;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async ({ userId, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile(userId) });
      const previous = queryClient.getQueryData<Profile | null>(
        queryKeys.profile(userId)
      );
      if (previous) {
        queryClient.setQueryData(queryKeys.profile(userId), {
          ...previous,
          ...updates,
        });
      }
      return { previous, userId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.profile(context.userId),
          context.previous
        );
      }
    },
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}
