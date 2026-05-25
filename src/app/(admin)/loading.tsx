import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/shared/ui/container";
import { ModerationTableSkeleton } from "@/domains/admin/components/moderation-table-skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/8 bg-card/50">
        <Container className="flex h-16 items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </Container>
      </header>
      <Container className="py-12">
        <div className="mb-10 flex gap-4 border-b border-white/8 pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
        <div className="mt-10">
          <ModerationTableSkeleton rows={6} />
        </div>
      </Container>
    </div>
  );
}
