import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import { verdictLabel, verdictShort } from "@/lib/i18n/ar";
import type { Verdict } from "@/lib/nutrition/types";

/**
 * Verdict visuals. A verdict is ALWAYS shown as icon + word + color,
 * never color alone (color-blind users, WCAG 1.4.1).
 */

export const VERDICT_ICON: Record<Verdict, LucideIcon> = {
  good: CircleCheck,
  moderate: CircleAlert,
  avoid: CircleX,
};

/** Tailwind text color class per verdict. */
export const VERDICT_TEXT: Record<Verdict, string> = {
  good: "text-good",
  moderate: "text-moderate",
  avoid: "text-avoid",
};

export function VerdictBadge({
  verdict,
  long = false,
  size = "sm",
  className = "",
}: {
  verdict: Verdict;
  long?: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const Icon = VERDICT_ICON[verdict];
  const text = size === "lg" ? "text-2xl" : "text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 font-semibold ${text} ${VERDICT_TEXT[verdict]} ${className}`}>
      <Icon size={size === "lg" ? 28 : 18} strokeWidth={2} aria-hidden />
      {long ? verdictLabel[verdict] : verdictShort[verdict]}
    </span>
  );
}
