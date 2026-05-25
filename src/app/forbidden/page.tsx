import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Container } from "@/shared/ui/container";
import { LinkButton } from "@/shared/ui/link-button";

export const metadata = {
  title: "Access denied",
};

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function ForbiddenPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  const isAdminGate = from === "admin";

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <div className="surface-elevated mx-auto max-w-md p-10">
        <ShieldOff className="mx-auto size-12 text-amber-400" />
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
          {isAdminGate ? "Admin access required" : "Permission denied"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isAdminGate
            ? "This area is restricted to SPACEART staff with moderator or admin role. Contact a platform administrator if you need access."
            : "You do not have permission to view this resource."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <LinkButton href="/dashboard" variant="accent">
            Go to dashboard
          </LinkButton>
          <LinkButton href="/" variant="outline">
            Marketplace
          </LinkButton>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Error code:{" "}
          <span className="font-mono text-foreground">403</span>
          {isAdminGate && (
            <>
              {" "}
              ·{" "}
              <Link href="/auth/sign-in?redirect=/admin" className="text-accent hover:underline">
                Sign in with staff account
              </Link>
            </>
          )}
        </p>
      </div>
    </Container>
  );
}
