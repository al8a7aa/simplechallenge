import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Card } from "@/components/ui/Card";
import { Page } from "@/components/ui/Page";
import { TRANSITION_INFO, TRANSITIONS, type TransitionType } from "@/lib/motion/transitions";

export const metadata: Metadata = { title: "انتقال تجريبي" };

/** Destination page for the transition buttons in the Motion Lab. */
export default async function TransitionDemoPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const type: TransitionType = TRANSITIONS.includes(t as TransitionType) ? (t as TransitionType) : "fade";
  const info = TRANSITION_INFO[type];

  return (
    <Page className="max-w-[640px]">
      <TransitionLink href="/motion" transition="back" className="press -my-2 flex min-h-12 items-center gap-1 self-start text-muted">
        <ChevronRight size={20} aria-hidden />
        مختبر الحركة
      </TransitionLink>
      <Card className="flex flex-col gap-3 p-6">
        <p className="text-sm text-muted" dir="ltr">
          page-enter--{type} · {info.duration}
        </p>
        <h1 className="text-3xl font-semibold">انتقال «{info.name}»</h1>
        <p className="text-muted">{info.when}</p>
      </Card>
      <Card className="h-40" aria-hidden />
      <p className="text-muted">ارجع لمختبر الحركة لترى انتقال «رجوع».</p>
    </Page>
  );
}
