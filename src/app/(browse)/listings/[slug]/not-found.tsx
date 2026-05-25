import { Container } from "@/shared/ui/container";
import { LinkButton } from "@/shared/ui/link-button";

export default function ListingNotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-heading text-4xl font-bold">Listing not found</h1>
      <p className="mt-4 text-muted-foreground">
        This listing may be pending approval or no longer available.
      </p>
      <LinkButton href="/listings" className="mt-8">
        Browse listings
      </LinkButton>
    </Container>
  );
}
