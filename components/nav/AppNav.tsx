"use client";

import { HeartPulse, History, House, ScanBarcode, User, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { TransitionLink } from "@/components/motion/TransitionLink";
import type { TransitionType } from "@/lib/motion/transitions";

/**
 * App navigation. One list of destinations, two layouts:
 *   - phones and tablets (< 1024px): a floating liquid-glass tab bar with a
 *     raised Scan button in the middle (iOS / iPadOS style),
 *   - wide (≥ 1024px): a glass side menu.
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
  { href: "/health", label: "صحتي", icon: HeartPulse, transition: "fade" },
  { href: "/scan", label: "افحص منتج", icon: ScanBarcode, transition: "rise" },
  { href: "/history", label: "السجل", icon: History, transition: "fade" },
  { href: "/profile", label: "حسابي", icon: User, transition: "fade" },
];

/**
 * `base` prefixes the routes that have a demo version ("/preview"), so the
 * public preview can navigate between its own pages.
 */
const PREVIEWABLE = ["/dashboard", "/health", "/scan"];
const withBase = (href: string, base?: string) => (base && PREVIEWABLE.includes(href) ? base + href : href);

export function SideNav({ base }: { base?: string }) {
  const active = useActive();
  return (
    <aside className="glass-strong sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 rounded-none border-y-0 border-s-0 px-5 py-8 lg:flex">
      <TransitionLink href={withBase("/dashboard", base)} className="flex min-h-12 items-center gap-3">
        <LogoMark size={44} />
        <span className="font-display text-[24px]">اختياري</span>
      </TransitionLink>
      <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1">
        {DESTINATIONS.map(({ href, label, icon: Icon, transition }) => (
          <TransitionLink
            key={href}
            href={withBase(href, base)}
            transition={transition}
            aria-current={active(withBase(href, base)) ? "page" : undefined}
            className={`press flex min-h-12 items-center gap-3 rounded-full px-4 ${
              active(withBase(href, base)) ? "bg-fg font-semibold text-ink" : "text-muted hover:bg-fg/5 hover:text-fg"
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

export function BottomNav({ base }: { base?: string }) {
  const active = useActive();
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="glass-strong fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[calc(100%-24px)] max-w-[560px] -translate-x-1/2 grid-cols-5 items-center rounded-full p-1.5 lg:hidden"
    >
      {DESTINATIONS.map(({ href: route, label, icon: Icon, transition }) => {
        const href = withBase(route, base);
        const isActive = active(href);
        if (route === "/scan") {
          return (
            <TransitionLink
              key={href}
              href={href}
              transition={transition}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="press flex size-[60px] items-center justify-center justify-self-center rounded-full bg-fg text-ink"
            >
              <Icon size={26} aria-hidden />
            </TransitionLink>
          );
        }
        return (
          <TransitionLink
            key={href}
            href={href}
            transition={transition}
            aria-current={isActive ? "page" : undefined}
            className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold ${
              isActive ? "bg-fg/15 text-fg" : "text-muted"
            }`}
          >
            <Icon size={22} aria-hidden />
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
