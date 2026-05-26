"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { motion, AnimatePresence } from "framer-motion";
import { completeOnboarding } from "../actions/onboarding-actions";
import { tryStorageUpload } from "@/shared/hooks/use-storage-upload";
import { buildAvatarPlaceholderUrl } from "@/shared/lib/avatar-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SA_PROVINCES } from "@/shared/config/provinces";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = ["Welcome", "Profile", "Contact", "Review"] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const placeholderPreview = displayName.trim()
    ? buildAvatarPlaceholderUrl(displayName)
    : null;

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadWarning(null);
    setAvatarUrl("");

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return localPreview;
    });

    setAvatarUploading(true);
    const result = await tryStorageUpload({ file, bucket: "avatars" });
    setAvatarUploading(false);

    if (result) {
      setAvatarUrl(result.url);
      setAvatarPreview(result.url);
      return;
    }

    setUploadWarning(
      "Photo upload is temporarily unavailable. You can continue \u2014 we\u2019ll use a placeholder until storage is ready."
    );
  }

  function handleSubmit() {
    if (pending) return;
    setError(null);
    const formData = new FormData();
    formData.set("display_name", displayName);
    formData.set("bio", bio);
    formData.set("city", city);
    formData.set("province", province);
    formData.set("whatsapp_number", whatsapp);
    if (avatarUrl) {
      formData.set("avatar_url", avatarUrl);
    } else if (displayName.trim()) {
      formData.set("avatar_url", buildAvatarPlaceholderUrl(displayName));
    }

    startTransition(async () => {
      try {
        await completeOnboarding(formData);
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(
          "Something went wrong while saving your profile. Please try again."
        );
      }
    });
  }

  const reviewAvatarSrc = avatarUrl || avatarPreview || placeholderPreview;

  return (
    <div className="mx-auto max-w-lg px-1" ref={scrollRef}>
      {/* Step progress indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-accent" : "bg-muted"
              }`}
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                  Welcome to SPACEART
                </h1>
                <p className="mt-4 text-sm text-muted-foreground sm:text-base">
                  Let&apos;s set up your creative profile. This takes about 2 minutes.
                  After submission, our team will review your profile before it appears publicly.
                </p>
              </div>
              <Button
                variant="accent"
                className="w-full sm:w-auto"
                onClick={() => setStep(1)}
              >
                Get started
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold sm:text-2xl">
                Your creative identity
              </h2>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display name</Label>
                <Input
                  id="display_name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="bg-card"
                  autoComplete="name"
                  placeholder="How you want to be known"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="bg-card"
                  placeholder="Tell us about your creative work\u2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">
                  Profile photo{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="bg-card"
                  disabled={avatarUploading}
                />
                {(reviewAvatarSrc || avatarUploading) && (
                  <div className="flex items-center gap-3">
                    {reviewAvatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reviewAvatarSrc}
                        alt="Avatar preview"
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10 sm:h-20 sm:w-20"
                      />
                    ) : (
                      <Skeleton className="h-16 w-16 rounded-full sm:h-20 sm:w-20" />
                    )}
                    {avatarUploading && (
                      <p className="text-xs text-muted-foreground">Uploading\u2026</p>
                    )}
                  </div>
                )}
                {avatarUrl && !avatarUploading && (
                  <p className="text-xs text-emerald-400">Photo uploaded</p>
                )}
                {uploadWarning && (
                  <p className="text-xs text-amber-400" role="status">
                    {uploadWarning}
                  </p>
                )}
                {!avatarUrl && !avatarUploading && displayName.trim() && (
                  <p className="text-xs text-muted-foreground">
                    No photo? A placeholder with your initials will be used.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button
                  variant="accent"
                  onClick={() => setStep(2)}
                  disabled={!displayName.trim()}
                  className="flex-1 sm:flex-none"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold sm:text-2xl">
                Location & contact
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-card"
                    placeholder="e.g. Soweto"
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Select value={province} onValueChange={(v) => setProvince(v ?? "")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {SA_PROVINCES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp number</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+27..."
                  required
                  className="bg-card"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Used for buyer enquiries only. Not shown publicly until you choose to.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="accent"
                  onClick={() => setStep(3)}
                  disabled={!whatsapp.trim()}
                  className="flex-1 sm:flex-none"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold sm:text-2xl">
                Review & submit
              </h2>
              <dl className="space-y-3 rounded-xl border border-white/8 p-4 text-sm sm:p-6">
                <div className="flex items-center gap-4">
                  {reviewAvatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reviewAvatarSrc}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/10 sm:h-14 sm:w-14"
                    />
                  ) : null}
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{displayName}</dd>
                  </div>
                </div>
                {bio && (
                  <div>
                    <dt className="text-muted-foreground">Bio</dt>
                    <dd className="line-clamp-3">{bio}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Photo</dt>
                  <dd>
                    {avatarUrl
                      ? "Uploaded"
                      : "Placeholder (upload optional)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd>
                    {[city, province].filter(Boolean).join(", ") || "\u2014"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd>{whatsapp}</dd>
                </div>
              </dl>
              {uploadWarning && (
                <p className="text-sm text-amber-400" role="status">
                  {uploadWarning}
                </p>
              )}
              {error && (
                <p className="text-sm text-amber-400" role="alert">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} disabled={pending}>
                  Back
                </Button>
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={pending}
                  className="flex-1 sm:flex-none"
                >
                  {pending ? "Submitting\u2026" : "Submit for review"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
