import { isSupabaseConfigured } from "@/infrastructure/database/env";
import { useDemoFallback } from "@/shared/lib/demo";

/** True when the app is likely showing demo fallback content */
export function shouldShowDemoBanner(): boolean {
  return useDemoFallback() && !isSupabaseConfigured();
}
