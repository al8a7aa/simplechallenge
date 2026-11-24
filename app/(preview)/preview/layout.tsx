import { Info } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav, SideNav } from "@/components/nav/AppNav";

/**
 * Public demo of the signed-in screens with sample data (lib/demo/sample.ts).
 * Same shell as the real app, so the layout can be reviewed at any width
 * without an account. Listed as public in middleware.ts.
 */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SideNav base="/preview" />
      <div className="min-w-0 flex-1 pb-28 lg:pb-0">
        <p className="glass mx-4 mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm sm:mx-6 md:mx-10">
          <Info size={18} className="shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">معاينة ببيانات تجريبية.</span>
          <Link href="/sign-up" className="shrink-0 font-semibold underline underline-offset-4">
            أنشئ حسابك
          </Link>
        </p>
        {children}
      </div>
      <BottomNav base="/preview" />
    </div>
  );
}

/** Render on each request so dates ("today", "2 hours ago") stay current. */
export const dynamic = "force-dynamic";
