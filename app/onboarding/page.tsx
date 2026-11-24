import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getProfile } from "@/lib/data/queries";

export const metadata: Metadata = { title: "ملفك الصحي" };

/**
 * Pattern: Form — the second half of sign-up. Clerk creates the account,
 * then sends new users here (forceRedirectUrl on <SignUp />) to enter
 * their health information. Also used to edit an existing profile.
 */
export default async function OnboardingPage() {
  const profile = await getProfile();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-8 px-4 py-8">
      <div className="flex items-center gap-3">
        <Logo size={44} wordmark={false} />
        <p className="text-muted">{profile ? "عدّل ملفك الصحي" : "أنشأت حسابك. بقي ملفك الصحي."}</p>
      </div>
      <ProfileForm initial={profile} />
    </main>
  );
}
