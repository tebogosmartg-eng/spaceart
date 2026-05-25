"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/infrastructure/supabase/client";
import { queryKeys } from "./query-keys";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: 5 * 60 * 1000,
  });
}
