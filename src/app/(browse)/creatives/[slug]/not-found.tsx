import { Container } from "@/shared/ui/container";
import { LinkButton } from "@/shared/ui/link-button";

export default function CreativeNotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-heading text-4xl font-bold">Creative not found</h1>
      <p className="mt-4 text-muted-foreground">
        This profile may be pending approval or no longer available.
      </p>
      <LinkButton href="/creatives" className="mt-8">
        Explore creatives
      </LinkButton>
    </Container>
  );
}
