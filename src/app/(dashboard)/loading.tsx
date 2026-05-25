import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/shared/ui/container";

export default function DashboardLoading() {
  return (
    <Container>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-4 h-6 w-72" />
      <div className="mt-12 space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </Container>
  );
}
