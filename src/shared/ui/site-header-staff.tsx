import Link from "next/link";
import { getHeaderSession } from "@/shared/ui/site-header-session";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export async function SiteHeaderStaffLink() {
  const { isStaff, isAdmin } = await getHeaderSession();
  if (!isStaff) return null;

  return (
    <div className="flex items-center gap-3">
      {isAdmin && (
        <Badge variant="accent" className="hidden gap-1 lg:inline-flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          Admin Mode
        </Badge>
      )}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-brand hover:underline"
      >
        <Shield className="size-3.5" />
        Admin Console
      </Link>
    </div>
  );
}
