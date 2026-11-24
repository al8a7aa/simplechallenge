import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";

/**
 * Auth form pattern: centered card, no app navigation.
 * Sign-up has two parts: the account (Clerk), then the health profile
 * (/onboarding), which every new user is sent to right away.
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo size={72} />
      <p className="text-center text-muted">الخطوة 1 من 2: أنشئ حسابك. بعدها نسألك عن صحتك.</p>
      <SignUp forceRedirectUrl="/onboarding" />
    </main>
  );
}
