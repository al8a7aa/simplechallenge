import { auth } from "@clerk/nextjs/server";
import { Camera, CircleCheck, Lightbulb } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/Card";
import { VerdictBadge } from "@/components/ui/verdict";

/**
 * Landing page (public). Marketing route: hero → how it works → example
 * result → footer. Signed-in users go straight to their dashboard.
 */
export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <Logo size={44} wordmark={false} />
        <Link href="/sign-in" className="press flex min-h-12 items-center px-3 font-semibold">
          سجّل الدخول
        </Link>
      </header>

      <section className="anim-rise flex flex-col items-center gap-6 text-center">
        <Logo size={120} />
        <h1 className="max-w-xl text-3xl font-semibold leading-snug text-balance sm:text-4xl">
          صوّر أكلك، واعرف إذا كان مناسباً لصحتك
        </h1>
        <p className="max-w-lg text-lg text-muted">
          اختياري يقرأ الملصق أو يتعرّف على الطبق، ويقارنه بحالتك الصحية وحساسيتك وأهدافك، ثم يقترح بديلاً أفضل.
        </p>
        <Link href="/sign-up" className="press flex min-h-12 items-center rounded-control bg-fg px-8 text-lg font-semibold text-ink">
          ابدأ مجاناً
        </Link>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-4">
        <h2 id="how" className="text-xl font-semibold">
          كيف يعمل
        </h2>
        <ol className="anim-stagger grid gap-4 sm:grid-cols-3">
          <Step icon={<Camera size={24} aria-hidden />} title="صوّر" text="الطبق، أو الملصق الغذائي، أو الباركود." />
          <Step icon={<CircleCheck size={24} aria-hidden />} title="افهم" text="حكم شخصي لك مع أهم 3 أسباب بلغة بسيطة." />
          <Step icon={<Lightbulb size={24} aria-hidden />} title="اختر أفضل" text="بديل من نفس النوع يناسب حالتك أكثر." />
        </ol>
      </section>

      <section aria-labelledby="example" className="flex flex-col gap-4">
        <h2 id="example" className="text-xl font-semibold">
          مثال: مشروب غازي لشخص لديه سكري
        </h2>
        <Card className="flex flex-col gap-3 p-6 sm:max-w-md">
          <VerdictBadge verdict="avoid" long size="lg" />
          <p className="text-muted">سكر 10.6 غ لكل 100 مل، ولديك سكري</p>
          <p className="text-muted">مشروب محلّى يرفع السكر في الدم بسرعة</p>
          <p className="border-t border-charcoal pt-3">البديل: ماء أو لبن قليل الدسم</p>
        </Card>
      </section>

      <footer className="border-t border-charcoal pt-6 text-sm text-muted">
        إرشادات عامة، ولا تغني عن استشارة الطبيب أو أخصائي التغذية.
      </footer>
    </main>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-card border border-charcoal bg-space p-5">
      {icon}
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-muted">{text}</span>
    </li>
  );
}
