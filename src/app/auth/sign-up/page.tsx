import { SignUpForm } from "@/domains/auth/components/sign-up-form";

export const metadata = {
  title: "Join SpaceArt",
};

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-cinematic text-3xl">Join SpaceArt</h1>
      <p className="mt-3 text-muted-foreground">
        Create your account and start building your creative profile.
      </p>
      <div className="mt-8">
        <SignUpForm />
      </div>
    </div>
  );
}
