import Link from "next/link";
import { Container } from "./container";

export function DemoBanner() {
  return (
    <div className="border-b border-accent/20 bg-accent/10">
      <Container className="py-2 text-center text-xs text-muted-foreground md:text-sm">
        Viewing curated demo content.{" "}
        <Link href="/auth/sign-up" className="text-accent hover:underline">
          Join SpaceArt
        </Link>{" "}
        or connect Supabase to show live creatives.
      </Container>
    </div>
  );
}
