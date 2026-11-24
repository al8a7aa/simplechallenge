"use client";

import { ArrowLeftRight } from "lucide-react";
import { useTransition } from "react";
import { chooseAlternative } from "@/app/actions/scan";
import { useTransitionRouter } from "@/components/motion/TransitionLink";

/** Records a healthy swap, then shows the alternative's own result. */
export function ChooseAlternativeButton({ fromProductId, alternativeId }: { fromProductId: string; alternativeId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useTransitionRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await chooseAlternative(fromProductId, alternativeId);
          if (result.ok) router.push(`/product/${result.productId}`, "zoom");
        })
      }
      className="press flex min-h-12 items-center justify-center gap-2 rounded-control bg-fg px-5 font-semibold text-ink disabled:opacity-60"
    >
      <ArrowLeftRight size={20} aria-hidden />
      {pending ? "جارٍ الحفظ…" : "اختر هذا البديل"}
    </button>
  );
}
