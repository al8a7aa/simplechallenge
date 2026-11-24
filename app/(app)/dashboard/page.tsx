import { ArrowLeftRight, ChevronLeft, CircleCheck, CircleX, Lightbulb, ScanBarcode, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Card, CardTitle, StatTile } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { VerdictBadge, VERDICT_TEXT } from "@/components/ui/verdict";
import { WeeklyChart } from "@/components/ui/WeeklyChart";
import { formatWhen, scoreLabel } from "@/lib/i18n/ar";
import { getProfile, getScans, getWeekSummary, type WeekSummary } from "@/lib/data/queries";
import { verdictFor } from "@/lib/nutrition/scoring";

export const metadata: Metadata = { title: "الرئيسية" };

/**
 * Pattern: Dashboard / Overview — a read-only glance at the last 7 days.
 * Summary (score ring + 3 tiles) → one chart → tip and goal → recent scans.
 * Every action links out; nothing is edited here.
 */
export default async function DashboardPage() {
  const [profile, week, recent] = await Promise.all([getProfile(), getWeekSummary(), getScans({ limit: 5 })]);
  const firstName = profile?.full_name.split(" ")[0] ?? "";

  return (
    <Page>
      <PageHeader
        title={`مرحباً، ${firstName}`}
        description={
          week.total > 0 ? `${week.good} من ${week.total} منتجاً فحصتها هذا الأسبوع مناسبة لك.` : "افحص أول منتج لترى ملخص أسبوعك هنا."
        }
        action={
          <TransitionLink href="/scan" transition="rise" className="press hidden min-h-12 items-center gap-2 rounded-control bg-fg px-6 font-semibold text-ink md:inline-flex">
            <ScanBarcode size={22} aria-hidden />
            افحص منتج
          </TransitionLink>
        }
      />

      {week.total === 0 ? (
        <EmptyWeek />
      ) : (
        <>
          <section aria-label="ملخص الأسبوع" className="anim-stagger grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-4">
            <WeeklyScore week={week} />
            <StatTile icon={<CircleCheck size={24} className="text-good" aria-hidden />} value={week.good} label="مناسبة" />
            <StatTile icon={<CircleX size={24} className="text-avoid" aria-hidden />} value={week.avoid} label="تجنّبها" />
            <StatTile icon={<ArrowLeftRight size={24} aria-hidden />} value={week.swaps} label="بدائل صحية" />
          </section>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="anim-rise flex flex-col gap-4 p-5 md:p-6" aria-labelledby="chart-title">
              <h2 id="chart-title" className="text-lg font-semibold">
                آخر 7 أيام
              </h2>
              <WeeklyChart days={week.days} height={160} />
            </Card>
            <div className="flex flex-col gap-4">
              <DailyTip category={week.topAvoidCategory} />
              <WeeklyGoal avoid={week.avoid} max={profile?.max_avoid_per_week ?? 4} />
            </div>
          </div>
        </>
      )}

      {recent.length > 0 && (
        <Card className="py-2" aria-labelledby="recent-title">
          <div className="flex items-center justify-between ps-5 pe-2">
            <h2 id="recent-title" className="text-lg font-semibold">
              آخر الفحوصات
            </h2>
            <TransitionLink href="/history" className="press flex min-h-12 items-center gap-1 px-3 font-medium">
              اعرض الكل
              <ChevronLeft size={20} aria-hidden />
            </TransitionLink>
          </div>
          <ul className="anim-stagger">
            {recent.map((scan) => (
              <li key={scan.id} className="border-t border-charcoal">
                <TransitionLink
                  href={`/product/${scan.product.id}`}
                  transition="forward"
                  className="flex min-h-[72px] items-center gap-3 px-5 py-3 hover:bg-charcoal/40"
                >
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

function WeeklyScore({ week }: { week: WeekSummary }) {
  const score = week.score ?? 0;
  const delta = week.scoreDelta;
  return (
    <Card className="col-span-3 flex items-center gap-5 p-5 md:col-span-1 md:gap-4 md:p-4">
      <ScoreRing score={score} size={112} label="نتيجة الأسبوع" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm text-muted">نتيجة الأسبوع</span>
        <span className={`text-xl font-semibold ${VERDICT_TEXT[verdictFor(score)]}`}>{scoreLabel(score)}</span>
        {delta !== null && delta !== 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            {delta > 0 ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
            {delta > 0 ? `+${delta}` : delta} عن الأسبوع الماضي
          </span>
        )}
      </div>
    </Card>
  );
}

/** One personal tip, chosen from the category the user avoided most. */
const TIPS: Record<string, string> = {
  drinks: "أغلب منتجاتك الحمراء هذا الأسبوع مشروبات محلّاة. الماء أو اللبن قليل الدسم بديل بسكر أقل.",
  snacks: "أغلب منتجاتك الحمراء سناكات مالحة. الفشار بدون زبدة أو المكسرات غير المملحة بديل أفضل.",
  sweets: "أغلب منتجاتك الحمراء حلويات. التمر بكمية معتدلة أو الشوكولاتة الداكنة بديل أفضل.",
  bakery: "أغلب منتجاتك الحمراء مخبوزات. خبز البر غني بالألياف ويشبع أكثر.",
  dairy: "أغلب منتجاتك الحمراء ألبان محلّاة. اختر الزبادي أو اللبن السادة.",
  cereals: "أغلب منتجاتك الحمراء حبوب إفطار محلّاة. الشوفان بديل غني بالألياف.",
  meat_fish: "أغلب منتجاتك الحمراء لحوم مصنّعة. اللحوم والأسماك الطازجة أقل ملحاً.",
};
const DEFAULT_TIP = "اقرأ أول 3 مكونات في الملصق: هي الأكثر كمية في المنتج.";

function DailyTip({ category }: { category: string | null }) {
  return (
    <Card className="anim-rise flex flex-col gap-3 p-5">
      <CardTitle icon={<Lightbulb size={22} className="text-moderate" aria-hidden />}>نصيحة اليوم</CardTitle>
      <p className="text-muted">{(category && TIPS[category]) || DEFAULT_TIP}</p>
    </Card>
  );
}

function WeeklyGoal({ avoid, max }: { avoid: number; max: number }) {
  const ratio = Math.min(1, max === 0 ? 1 : avoid / max);
  return (
    <Card className="anim-rise flex flex-col gap-3 p-5">
      <CardTitle icon={<Target size={20} aria-hidden />} action={<span className="font-semibold">{`${avoid} من ${max}`}</span>}>
        هدف الأسبوع
      </CardTitle>
      <p className="text-sm text-muted">{max} منتجات حمراء كحد أقصى</p>
      <div
        role="progressbar"
        aria-label="هدف الأسبوع"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={avoid}
        className="h-2.5 overflow-hidden rounded-full bg-charcoal"
      >
        <div className="anim-grow-x h-full rounded-full bg-fg" style={{ width: `${ratio * 100}%` }} />
      </div>
    </Card>
  );
}

/** Empty state keeps the dashboard frame and offers the one next action. */
function EmptyWeek() {
  return (
    <Card className="anim-rise flex flex-col items-center gap-4 px-6 py-12 text-center">
      <ProductIcon category="other" size={64} />
      <h2 className="text-xl font-semibold">لم تفحص أي منتج هذا الأسبوع</h2>
      <p className="max-w-sm text-muted">صوّر طبقك أو ملصق منتج، وستظهر نتيجة أسبوعك ورسم أيامك هنا.</p>
      <TransitionLink href="/scan" transition="rise" className="press flex min-h-12 items-center gap-2 rounded-control bg-fg px-6 font-semibold text-ink">
        <ScanBarcode size={22} aria-hidden />
        افحص أول منتج
      </TransitionLink>
    </Card>
  );
}
