import { ArrowUpLeft, ChevronLeft, CircleCheck, Lightbulb, ScanBarcode, Target, TrendingDown, TrendingUp, User } from "lucide-react";
import { BubbleSplit } from "@/components/charts/BubbleSplit";
import { ScoreBars } from "@/components/charts/ScoreBars";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Card } from "@/components/ui/Card";
import { Page } from "@/components/ui/Page";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { VERDICT_ICON, VERDICT_TEXT, VerdictBadge } from "@/components/ui/verdict";
import type { ScanWithProduct, WeekSummary } from "@/lib/data/queries";
import { formatWhen, scoreLabel } from "@/lib/i18n/ar";
import { verdictFor } from "@/lib/nutrition/scoring";

/**
 * Home — Pattern: Dashboard / Overview. A read-only glance at the week:
 *   greeting → score ring → verdict split (bubbles) → daily scores (bars)
 *   → tip and goal → recent scans.
 * Every action links out.
 *
 * Responsive: one column on phones; from 768px (tablets, full width with
 * the floating tab bar) the cards pair up; capped at 1040px on wide screens.
 *
 * Pure display: the page (or /preview) passes the data in.
 */
export interface DashboardData {
  fullName: string;
  week: WeekSummary;
  recent: ScanWithProduct[];
  maxAvoid: number;
  /** Base path for links, "" in the app and "/preview" in the demo. */
  base?: string;
}

export function DashboardView({ fullName, week, recent, maxAvoid, base = "" }: DashboardData) {
  const firstName = fullName.split(" ")[0];
  const today = new Date().toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long", numberingSystem: "latn" });
  const link = (href: string) => (base && ["/dashboard", "/health", "/scan"].includes(href) ? base + href : href);

  return (
    <Page>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="glass flex size-12 shrink-0 items-center justify-center rounded-full font-semibold" aria-hidden>
            {firstName.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm text-muted">{greeting()}</span>
            <span className="truncate font-semibold">{fullName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TransitionLink href={link("/scan")} transition="rise" className="press hidden min-h-12 items-center gap-2 rounded-full bg-fg px-6 font-semibold text-ink lg:inline-flex">
            <ScanBarcode size={20} aria-hidden />
            افحص منتج
          </TransitionLink>
          <TransitionLink href="/profile" aria-label="حسابي" className="press glass flex size-12 items-center justify-center rounded-full lg:hidden">
            <User size={22} aria-hidden />
          </TransitionLink>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <span className="glass self-start rounded-full px-4 py-1.5 text-sm">{today}</span>
        <h1 className="font-display text-[44px] leading-[1.05] font-normal sm:text-[56px]">
          أسبوعك،
          <br />
          باختصار
        </h1>
      </div>

      {week.total === 0 ? (
        <EmptyWeek scanHref={link("/scan")} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <ScoreCard week={week} />
            <Card className="anim-rise flex flex-col gap-4 p-5 md:row-span-2 md:p-6" aria-labelledby="split-title">
              <div className="flex items-baseline justify-between">
                <h2 id="split-title" className="text-lg font-semibold">
                  توزيع اختياراتك
                </h2>
                <span className="text-sm text-muted">
                  <span className="font-num">{week.total}</span> منتجاً
                </span>
              </div>
              <BubbleSplit counts={{ good: week.good, moderate: week.moderate, avoid: week.avoid }} />
            </Card>
            <Card className="anim-rise flex flex-col gap-4 p-5 md:p-6" aria-labelledby="days-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="days-title" className="text-lg font-semibold">
                  آخر 7 أيام
                </h2>
                <span className="rounded-full bg-fg/10 px-3 py-1 text-sm">متوسط النتيجة</span>
              </div>
              <ScoreBars days={week.days} />
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <TipCard category={week.topAvoidCategory} />
            <GoalCard avoid={week.avoid} max={maxAvoid} />
          </div>
        </>
      )}

      {recent.length > 0 && (
        <Card className="py-2" aria-labelledby="recent-title">
          <div className="flex items-center justify-between ps-5 pe-2">
            <h2 id="recent-title" className="text-lg font-semibold">
              آخر الفحوصات
            </h2>
            <TransitionLink href="/history" className="press flex min-h-12 items-center gap-1 rounded-full px-3 font-medium">
              اعرض الكل
              <ChevronLeft size={20} aria-hidden />
            </TransitionLink>
          </div>
          <ul className="anim-stagger">
            {recent.map((scan) => (
              <li key={scan.id} className="border-t border-fg/10">
                <TransitionLink href={`/product/${scan.product.id}`} transition="forward" className="flex min-h-[72px] items-center gap-3 px-5 py-3 hover:bg-fg/5">
                  <ProductIcon category={scan.product.category} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{scan.product.name_ar}</span>
                    <span className="text-sm text-muted">{formatWhen(scan.created_at)}</span>
                  </span>
                  <VerdictBadge verdict={scan.verdict} />
                </TransitionLink>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}

function greeting(hour = new Date().getHours()): string {
  if (hour < 12) return "صباح الخير";
  return "مساء الخير";
}

function ScoreCard({ week }: { week: WeekSummary }) {
  const score = week.score ?? 0;
  const verdict = verdictFor(score);
  const Icon = VERDICT_ICON[verdict];
  const delta = week.scoreDelta;
  return (
    <Card className="anim-rise flex items-center gap-5 p-5 md:p-6">
      <ScoreRing score={score} size={120} label="نتيجة الأسبوع" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm text-muted">نتيجة الأسبوع</span>
        <span className={`flex items-center gap-1.5 text-[22px] font-semibold ${VERDICT_TEXT[verdict]}`}>
          <Icon size={22} aria-hidden />
          {scoreLabel(score)}
        </span>
        {delta !== null && delta !== 0 && (
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-fg/10 px-3 py-0.5 text-xs whitespace-nowrap">
            {delta > 0 ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
            <span className="font-num">{delta > 0 ? `+${delta}` : delta}</span> عن الأسبوع الماضي
          </span>
        )}
      </div>
    </Card>
  );
}

/** One personal tip, chosen from the category the user avoided most. */
const TIPS: Record<string, string> = {
  drinks: "أغلب منتجاتك الحمراء مشروبات محلّاة. الماء أو اللبن قليل الدسم بديل بسكر أقل.",
  snacks: "أغلب منتجاتك الحمراء سناكات مالحة. الفشار بدون زبدة بديل أخف.",
  sweets: "أغلب منتجاتك الحمراء حلويات. التمر بكمية معتدلة بديل أفضل.",
  bakery: "أغلب منتجاتك الحمراء مخبوزات. خبز البر غني بالألياف ويشبع أكثر.",
  dairy: "أغلب منتجاتك الحمراء ألبان محلّاة. اختر الزبادي أو اللبن السادة.",
  cereals: "أغلب منتجاتك الحمراء حبوب إفطار محلّاة. الشوفان بديل غني بالألياف.",
  meat_fish: "أغلب منتجاتك الحمراء لحوم مصنّعة. الطازجة أقل ملحاً.",
};

function TipCard({ category }: { category: string | null }) {
  return (
    <Card className="anim-rise flex min-h-44 flex-col gap-2 rounded-tile p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <Lightbulb size={24} className="text-moderate" aria-hidden />
        <TransitionLink href="/history?v=avoid" aria-label="اعرض المنتجات الحمراء" className="press flex size-10 items-center justify-center rounded-full bg-fg text-ink">
          <ArrowUpLeft size={18} aria-hidden />
        </TransitionLink>
      </div>
      <span className="font-semibold">نصيحة اليوم</span>
      <p className="text-sm text-muted">{(category && TIPS[category]) || "اقرأ أول 3 مكونات في الملصق: هي الأكثر كمية."}</p>
    </Card>
  );
}

function GoalCard({ avoid, max }: { avoid: number; max: number }) {
  const ratio = Math.min(1, max === 0 ? 1 : avoid / max);
  return (
    <Card className="anim-rise flex min-h-44 flex-col gap-2 rounded-tile p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <Target size={24} aria-hidden />
        <span className="rounded-full bg-fg/10 px-2.5 py-0.5 text-xs">هدف الأسبوع</span>
      </div>
      <span className="font-num text-[40px] leading-none">
        {avoid}
        <span className="text-lg text-muted">/{max}</span>
      </span>
      <span className="text-sm text-muted">منتجات حمراء كحد أقصى</span>
      <div role="progressbar" aria-label="هدف الأسبوع" aria-valuemin={0} aria-valuemax={max} aria-valuenow={avoid} className="mt-auto h-2 overflow-hidden rounded-full bg-fg/10">
        <div className="anim-grow-x h-full rounded-full bg-fg" style={{ width: `${ratio * 100}%` }} />
      </div>
    </Card>
  );
}

/** Empty state keeps the dashboard frame and offers the one next action. */
function EmptyWeek({ scanHref }: { scanHref: string }) {
  return (
    <Card className="anim-rise flex flex-col items-center gap-4 px-6 py-12 text-center">
      <CircleCheck size={48} className="text-muted" aria-hidden />
      <h2 className="text-xl font-semibold">لم تفحص أي منتج هذا الأسبوع</h2>
      <p className="max-w-sm text-muted">صوّر طبقك أو ملصق منتج، وستظهر نتيجة أسبوعك ورسومك هنا.</p>
      <TransitionLink href={scanHref} transition="rise" className="press flex min-h-12 items-center gap-2 rounded-full bg-fg px-6 font-semibold text-ink">
        <ScanBarcode size={22} aria-hidden />
        افحص أول منتج
      </TransitionLink>
    </Card>
  );
}
