import { redirect } from "next/navigation";
import {
  getAuthContext,
  isStaffRole,
} from "@/infrastructure/auth/permissions";
import { getCreativeByProfileId } from "@/domains/creatives/queries/get-creatives";
import { CreativeProfileForm } from "@/domains/creatives/components/creative-profile-form";
import { PageHeader } from "@/shared/ui/page-header";
import { LinkButton } from "@/shared/ui/link-button";

export const metadata = {
  title: "Creative Profile",
};

export default async function DashboardProfilePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/auth/sign-in");

  if (isStaffRole(ctx.profile.role)) {
    return (
      <div>
        <PageHeader
          title="Platform account"
          description="Staff accounts manage the marketplace from the admin console. A public creative profile is optional."
        />
        <div className="rounded-xl border border-white/8 p-8">
          <p className="text-sm text-muted-foreground">
            Signed in as {ctx.email} ({ctx.profile.role}).
          </p>
          <LinkButton href="/admin" variant="accent" className="mt-6">
            Open admin console
          </LinkButton>
        </div>
      </div>
    );
  }

  const creative = await getCreativeByProfileId(ctx.userId);

  return (
    <div>
      <PageHeader
        title="Creative Profile"
        description="Your public presence after curation approval."
      />
      <CreativeProfileForm creative={creative} />
    </div>
  );
}
