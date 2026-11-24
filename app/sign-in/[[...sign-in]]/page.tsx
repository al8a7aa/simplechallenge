import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";

/** Auth form pattern: centered card, no app navigation. */
export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo size={72} />
      <SignIn />
    </main>
  );
}
