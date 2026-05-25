import { OnboardingWizard } from "@/domains/profiles/components/onboarding-wizard";

export const metadata = {
  title: "Welcome",
};

export default function OnboardingPage() {
  return (
    <div className="py-8">
      <OnboardingWizard />
    </div>
  );
}
