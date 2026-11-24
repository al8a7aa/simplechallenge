import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getProfile } from "@/lib/data/queries";

export const metadata: Metadata = { title: "ملفك الصحي" };

/**
 * Pattern: Form — builds the health profile behind every verdict.
 * Lives outside the (app) group so the profile guard there can send
 * new users here. Also used to edit an existing profile.
 */
export default async function OnboardingPage() {
  const profile = await getProfile();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-8 px-4 py-8">
      <Logo size={48} wordmark={false} className="self-start" />
      <ProfileForm initial={profile} />
    </main>
  );
}
