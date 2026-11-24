"use client";

import { Check, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/brand/Logo";
import { SplashScreen } from "@/components/brand/SplashScreen";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { VerdictBadge } from "@/components/ui/verdict";
import { WeeklyChart } from "@/components/ui/WeeklyChart";
import { SAMPLE_DAYS } from "@/lib/demo/sample";
import { TRANSITION_INFO, TRANSITIONS } from "@/lib/motion/transitions";
import { TransitionLink } from "./TransitionLink";
import { useReplay } from "./useReplay";

/**
 * Motion Lab: a play button for every animation and page transition in
 * the app, with where each one is used and how long it takes.
 * The animations themselves live in app/globals.css (section 3–5).
 */


export function MotionLab() {
  const reducedMotion = useReducedMotion();
  const [splashKey, replaySplash] = useReplay();

  return (
    <div className="flex flex-col gap-10">
      {reducedMotion && (
        <p role="status" className="glass rounded-card border-moderate/60 p-4">
          جهازك يطلب تقليل الحركة، لذلك تظهر الحركات هنا بحالتها النهائية مباشرة. أوقف «تقليل الحركة» في إعدادات الجهاز لمشاهدتها.
        </p>
      )}

      {/* ── Logo launch ─────────────────────────────────────────── */}
      <Section title="شاشة البداية" description="تظهر مرة واحدة عند فتح التطبيق في كل جلسة.">
        <Demo
          title="حركة الشعار"
          when="عند فتح التطبيق: ترسم العربة نفسها، تظهر العجلات والورقة، ثم علامة الصح والاسم."
          duration="1.9s"
          extra={
            <button type="button" onClick={replaySplash} className="press flex min-h-12 items-center gap-2 glass rounded-full px-4 font-semibold">
              <Play size={18} aria-hidden />
              شغّل بملء الشاشة
            </button>
          }
          render={(key) => (
            <div key={key} className="logo-anim flex h-56 items-center justify-center">
              <Logo size={112} />
            </div>
          )}
        />
        {/* Portal to <body> so no animated ancestor can affect `position: fixed`. */}
        {splashKey > 0 && createPortal(<SplashScreen key={splashKey} replay />, document.body)}
      </Section>

      {/* ── Page transitions ────────────────────────────────────── */}
      <Section title="الانتقال بين الصفحات" description="كل زر يفتح صفحة تجريبية بنوع الانتقال المكتوب عليه.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRANSITIONS.map((t) => (
            <TransitionLink
              key={t}
              href={`/motion/demo?t=${t}`}
              transition={t}
              className="press flex min-h-24 flex-col justify-center gap-1 glass rounded-card p-4 hover:border-fg"
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                {TRANSITION_INFO[t].name}
                <span dir="ltr" className="text-sm text-muted">
                  {t} · {TRANSITION_INFO[t].duration}
                </span>
              </span>
              <span className="text-sm text-muted">{TRANSITION_INFO[t].when}</span>
            </TransitionLink>
          ))}
        </div>
      </Section>

      {/* ── Component animations ────────────────────────────────── */}
      <Section title="حركات العناصر" description="اضغط «شغّل» لإعادة أي حركة.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo
            title="كشف الحكم"
            className="anim-pop"
            when="بطاقة النتيجة بعد الفحص"
            duration="300ms"
            render={(key) => (
              <div key={key} className="anim-pop flex h-36 items-center justify-center well rounded-control">
                <VerdictBadge verdict="good" long size="lg" />
              </div>
            )}
          />
          <Demo
            title="امتلاء النتيجة"
            className="anim-ring"
            when="حلقة نتيجة الأسبوع والمنتج"
            duration="300ms"
            render={(key) => (
              <div key={key} className="flex h-36 items-center justify-center">
                <ScoreRing score={78} size={120} />
              </div>
            )}
          />
          <Demo
            title="نمو الأعمدة"
            className="anim-grow-y"
            when="رسم آخر 7 أيام في الرئيسية"
            duration="300ms + 40ms لكل عمود"
            render={(key) => (
              <div key={key}>
                <WeeklyChart days={SAMPLE_DAYS} height={96} />
              </div>
            )}
          />
          <Demo
            title="ظهور متتابع"
            className="anim-stagger"
            when="القوائم: آخر الفحوصات، السجل، الأسباب"
            duration="200ms، بفارق 30ms"
            render={(key) => (
              <ul key={key} className="anim-stagger flex flex-col gap-2">
                {["لبن قليل الدسم", "مشروب غازي", "بسكويت بالشوكولاتة"].map((name) => (
                  <li key={name} className="well rounded-control px-4 py-3">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          />
          <Demo
            title="شريط الهدف"
            className="anim-grow-x"
            when="هدف الأسبوع في الرئيسية"
            duration="300ms"
            render={(key) => (
              <div key={key} className="flex h-24 flex-col justify-center gap-2">
                <span className="text-sm text-muted">3 من 4</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-fg/10">
                  <div className="anim-grow-x h-full w-3/4 rounded-full bg-fg" />
                </div>
              </div>
            )}
          />
          <Demo
            title="رسم علامة الصح"
            className="anim-draw"
            when="تأكيد الحفظ وعلامة الشعار"
            duration="300ms"
            render={(key) => (
              <div key={key} className="flex h-24 items-center justify-center">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="var(--color-good)" strokeWidth="1.5" pathLength={1} className="anim-draw" />
                  <path d="m8 12 3 3 5-6" stroke="var(--color-good)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="anim-draw" style={{ ["--delay" as string]: "300ms" }} />
                </svg>
              </div>
            )}
          />
          <Demo
            title="اهتزاز الخطأ"
            className="anim-shake"
            when="صورة غير مقروءة أو باركود غير صحيح"
            duration="300ms"
            render={(key) => (
              <p key={key} className={`${key ? "anim-shake" : ""} well rounded-control border border-avoid/60 p-4`}>
                لم نتمكن من قراءة الصورة. صوّر من جديد في إضاءة أفضل.
              </p>
            )}
          />
          <Demo
            title="خط المسح"
            className="anim-scanline"
            when="أثناء تحليل الصورة وقراءة الباركود"
            duration="1.6s متكرر"
            render={() => (
              <div className="relative h-36 overflow-hidden well rounded-control [container-type:size]">
                <div className="anim-scanline absolute inset-x-[12%] top-[10%] h-0.5 bg-fg" style={{ ["--travel" as string]: "80cqh" }} />
              </div>
            )}
          />
          <Demo
            title="هيكل التحميل"
            className="anim-shimmer"
            when="المحتوى الذي يتأخر أكثر من ثانية"
            duration="1.4s متكرر"
            render={() => (
              <div className="flex flex-col gap-2" aria-hidden>
                <div className="anim-shimmer h-5 w-2/3 rounded" />
                <div className="anim-shimmer h-5 w-full rounded" />
                <div className="anim-shimmer h-5 w-1/2 rounded" />
              </div>
            )}
          />
          <ToastDemo />
          <SheetDemo />
          <Demo
            title="ضغط الزر"
            className="press"
            when="كل الأزرار والروابط القابلة للضغط"
            duration="100ms"
            render={() => (
              <div className="flex h-24 items-center justify-center">
                <button type="button" className="press min-h-12 rounded-full bg-fg px-6 font-semibold text-ink">
                  اضغط مطوّلاً
                </button>
              </div>
            )}
          />
        </div>
      </Section>
    </div>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** One animation card: preview, where it is used, duration and a Play button. */
function Demo({
  title,
  when,
  duration,
  className,
  extra,
  render,
}: {
  title: string;
  when: string;
  duration: string;
  /** The CSS class this demo shows, displayed for developers. */
  className?: string;
  extra?: ReactNode;
  render: (key: number) => ReactNode;
}) {
  const [key, replay] = useReplay();
  return (
    <article className="flex flex-col gap-4 glass rounded-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted">{when}</p>
        </div>
        <span dir="ltr" className="text-sm text-muted">
          {className && <code className="me-2 text-fg">.{className}</code>}
          {duration}
        </span>
      </header>
      <div>{render(key)}</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={replay} className="press flex min-h-12 items-center gap-2 rounded-full bg-fg px-4 font-semibold text-ink">
          <RotateCcw size={18} aria-hidden />
          شغّل
        </button>
        {extra}
      </div>
    </article>
  );
}

function ToastDemo() {
  return (
    <Demo
      title="الإشعار"
      className="anim-toast"
      when="تأكيد قصير: «تم حفظ البديل»"
      duration="3.2s"
      render={(key) => (
        <div className="flex h-28 items-end justify-center overflow-hidden well rounded-control pb-3">
          {key > 0 ? (
            <p key={key} role="status" className="anim-toast flex items-center gap-2 glass rounded-full px-4 py-3 font-semibold">
              <Check size={18} className="text-good" aria-hidden />
              تم حفظ البديل
            </p>
          ) : (
            <p className="pb-6 text-sm text-muted">اضغط «شغّل» لإظهار الإشعار</p>
          )}
        </div>
      )}
    />
  );
}

function SheetDemo() {
  return (
    <Demo
      title="اللوحة السفلية"
      className="anim-sheet"
      when="خيارات على الجوال: التصفية وطرق الفحص"
      duration="200ms"
      render={(key) => <SheetPreview key={key} initiallyOpen={key > 0} />}
    />
  );
}

/** A bottom sheet inside the preview box. Re-mounted (open) by each Play. */
function SheetPreview({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <div className="relative flex h-48 items-start overflow-hidden well rounded-control p-4">
      <p className="text-sm text-muted">اضغط «شغّل» لفتح اللوحة</p>
      {open && (
        <>
          <div className="anim-fade absolute inset-0 bg-ink/70" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-label="لوحة تجريبية" className="anim-sheet absolute inset-x-0 bottom-0 glass-strong rounded-t-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">تصفية حسب الحكم</span>
              <button type="button" onClick={() => setOpen(false)} className="press flex min-h-12 items-center gap-1.5 rounded-control px-3 font-semibold">
                <X size={18} aria-hidden />
                أغلق اللوحة
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
