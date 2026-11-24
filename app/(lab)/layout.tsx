import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";

/**
 * The Motion Lab sits outside the signed-in app so animations can be
 * reviewed without an account (see the public routes in middleware.ts).
 */
export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-charcoal bg-space">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-4 px-4 py-2 md:px-12">
          <Link href="/" className="flex min-h-12 items-center gap-3 font-semibold">
            <LogoMark size={40} />
            اختياري
          </Link>
          <Link href="/dashboard" className="flex min-h-12 items-center px-3 font-semibold">
            افتح التطبيق
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
