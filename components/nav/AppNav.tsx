"use client";

import { History, House, ScanBarcode, User, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { TransitionLink } from "@/components/motion/TransitionLink";
import type { TransitionType } from "@/lib/motion/transitions";

/**
 * App navigation. One list of destinations, two layouts:
 *   - narrow (< 768px): bottom tab bar with a raised Scan button,
 *   - medium and wide:  side menu.
 * Tabs use the "fade" transition; Scan uses "rise" because it opens a task.
 */

interface Destination {
  href: string;
  label: string;
  icon: LucideIcon;
  transition: TransitionType;
}

const DESTINATIONS: Destination[] = [
  { href: "/dashboard", label: "الرئيسية", icon: House, transition: "fade" },
  { href: "/scan", label: "افحص منتج", icon: ScanBarcode, transition: "rise" },
  { href: "/history", label: "السجل", icon: History, transition: "fade" },
  { href: "/profile", label: "حسابي", icon: User, transition: "fade" },
];

export function SideNav() {
  const active = useActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-l border-charcoal bg-space px-5 py-8 md:flex">
      <TransitionLink href="/dashboard" className="flex min-h-12 items-center gap-3 font-semibold">
        <LogoMark size={44} />
        <span className="text-[22px]">اختياري</span>
      </TransitionLink>
      <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1">
        {DESTINATIONS.map(({ href, label, icon: Icon, transition }) => (
          <TransitionLink
            key={href}
            href={href}
            transition={transition}
            aria-current={active(href) ? "page" : undefined}
            className={`press flex min-h-12 items-center gap-3 rounded-control px-4 ${
              active(href) ? "bg-charcoal font-semibold text-fg" : "text-muted hover:text-fg"
            }`}
          >
            <Icon size={22} aria-hidden />
            {label}
          </TransitionLink>
        ))}
      </nav>
      <p className="mt-auto text-xs text-muted">إرشادات عامة، ولا تغني عن استشارة الطبيب أو أخصائي التغذية.</p>
    </aside>
  );
}

export function BottomNav() {
  const active = useActive();
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 items-end gap-1 border-t border-charcoal bg-space px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      {DESTINATIONS.map(({ href, label, icon: Icon, transition }) => {
        const isScan = href === "/scan";
        const isActive = active(href);
        return (
          <TransitionLink
            key={href}
            href={href}
            transition={transition}
            aria-current={isActive ? "page" : undefined}
            className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-control text-xs font-semibold ${
              isActive && !isScan ? "bg-charcoal text-fg" : isScan ? "text-fg" : "text-muted"
            }`}
          >
            {isScan ? (
              <span className="-mt-7 flex size-14 items-center justify-center rounded-full border-4 border-ink bg-fg text-ink">
                <Icon size={26} aria-hidden />
              </span>
            ) : (
              <Icon size={24} aria-hidden />
            )}
            {label}
          </TransitionLink>
        );
      })}
    </nav>
  );
}

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}
