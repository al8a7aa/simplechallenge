import { Pencil } from "lucide-react";
import Link from "next/link";
import { BmiGauge, BMI_BAND_LABEL } from "@/components/charts/BmiGauge";
import { Donut } from "@/components/charts/Donut";
import { RangeBar } from "@/components/charts/RangeBar";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import type { ProfileRow } from "@/lib/data/mappers";
import type { WeekNutrition } from "@/lib/data/queries";
import { computeMetrics, healthyWeightRange } from "@/lib/health/metrics";
import { activityLabel, allergenLabel, categoryLabel, conditionLabel, dietLabel, goalLabel } from "@/lib/i18n/ar";
import type { Category } from "@/lib/nutrition/types";
import { THRESHOLDS } from "@/lib/nutrition/thresholds";

/**
 * My health — Pattern: Dashboard / Overview of the person, not the food:
 *   body numbers → BMI gauge + daily needs → what we take into account
 *   → what was in the food they scanned (range bars + category donut).
 *
 * Responsive: one column on phones; body numbers go 2 → 4 across from
 * 1024px (the side menu takes room at 768px); chart cards pair up from 768px.
 */
export function HealthView({ profile, nutrition }: { profile: ProfileRow; nutrition: WeekNutrition }) {

  return (
    <Page>
      <PageHeader title="صحتي" description="أرقامك واحتياجك اليومي، محسوبة من ملفك الصحي." />
      {isComplete(profile) ? (
        <Metrics profile={profile} />
      ) : (
        <Card className="flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-semibold">أكمل بيانات جسمك</h2>
          <p className="text-muted">نحتاج سنة الميلاد والجنس والطول والوزن لحساب مؤشر كتلة الجسم واحتياجك اليومي.</p>
          <Link href="/onboarding" className="press flex min-h-12 items-center rounded-full bg-fg px-6 font-semibold text-ink">
            أكمل ملفك
          </Link>
        </Card>
      )}

      <Considerations profile={profile} />
      <FoodThisWeek nutrition={nutrition} />

      <p className="text-center text-xs text-muted">أرقام إرشادية عامة، ولا تغني عن استشارة الطبيب أو أخصائي التغذية.</p>
    </Page>
  );
}

/** A profile with all the body numbers the metrics need. */
type CompleteProfile = ProfileRow & { birth_year: number; sex: "male" | "female"; height_cm: number; weight_kg: number };

function isComplete(p: ProfileRow): p is CompleteProfile {
  return p.birth_year !== null && p.sex !== null && p.height_cm !== null && p.weight_kg !== null;
}

function Metrics({ profile }: { profile: CompleteProfile }) {
  const weight = Number(profile.weight_kg);
  const height = Number(profile.height_cm);
  const m = computeMetrics({
    birthYear: profile.birth_year,
    sex: profile.sex,
    heightCm: height,
    weightKg: weight,
    activity: profile.activity_level,
    goal: profile.goal,
    conditions: profile.conditions,
  });
  const [minW, maxW] = healthyWeightRange(height);

  const body = [
    { label: "الوزن", value: weight, unit: "كغ", note: profile.target_weight_kg ? `الهدف ${Number(profile.target_weight_kg)} كغ` : `الطبيعي ${minW}–${maxW} كغ` },
    { label: "الطول", value: height, unit: "سم", note: `مؤشر الكتلة ${m.bmi}` },
    { label: "العمر", value: m.age, unit: "سنة", note: profile.sex === "female" ? "أنثى" : "ذكر" },
    { label: "الحرق اليومي", value: m.tdee.toLocaleString("en"), unit: "سعرة", note: activityLabel[profile.activity_level].name },
  ];

  const limits = [
    { label: "السكر الحر", value: `≤ ${m.limits.sugarG}`, unit: "غ", note: m.stricter.sugar ? "أقل بسبب حالتك" : "أقل من 10٪ من السعرات" },
    { label: "الملح", value: `≤ ${m.limits.saltG}`, unit: "غ", note: m.stricter.salt ? "أقل بسبب حالتك" : "توصية منظمة الصحة" },
    { label: "الدهون المشبعة", value: `≤ ${m.limits.satFatG}`, unit: "غ", note: m.stricter.satFat ? "أقل بسبب حالتك" : "أقل من 10٪ من السعرات" },
    { label: "الألياف", value: `≥ ${m.limits.fiberG}`, unit: "غ", note: "تساعد على الشبع" },
    { label: "البروتين", value: `${m.limits.proteinG}`, unit: "غ", note: profile.goal === "gain_muscle" ? "لبناء العضلات" : "لكل يوم" },
    { label: "الماء", value: (m.limits.waterMl / 1000).toFixed(1), unit: "لتر", note: "تقريباً في اليوم" },
  ];

  return (
    <>
      <section aria-label="جسمك" className="anim-stagger grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {body.map((b) => (
          <Card key={b.label} className="flex flex-col gap-2 rounded-tile p-4">
            <span className="text-sm text-muted">{b.label}</span>
            <span className="flex flex-wrap items-baseline gap-x-1 leading-none">
              <span className="font-num text-[34px] font-medium">{b.value}</span>
              <span className="text-base text-muted">{b.unit}</span>
            </span>
            <span className="self-start rounded-full bg-fg/10 px-2.5 py-0.5 text-xs">{b.note}</span>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="anim-rise flex flex-col items-center gap-1 p-5 md:p-6" aria-labelledby="bmi-title">
          <h2 id="bmi-title" className="self-start text-lg font-semibold">
            مؤشر كتلة الجسم
          </h2>
          <BmiGauge bmi={m.bmi} band={m.bmiBand} />
          <span className={`font-semibold ${BMI_BAND_LABEL[m.bmiBand].color}`}>{BMI_BAND_LABEL[m.bmiBand].text}</span>
          <span className="text-sm text-muted">
            الطبيعي لطولك بين <span className="font-num">{minW}</span> و<span className="font-num">{maxW}</span> كغ
          </span>
        </Card>

        <Card className="anim-rise @container flex flex-col gap-4 p-5 md:p-6" aria-labelledby="needs-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="needs-title" className="text-lg font-semibold">
              احتياجك اليومي
            </h2>
            <span className="text-sm text-muted">{goalLabel[profile.goal]}</span>
          </div>
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="font-num text-[52px] leading-none font-medium">{m.calorieTarget.toLocaleString("en")}</span>
            <span className="text-muted">سعرة في اليوم</span>
          </p>
          {/* Columns follow the card's own width (container query), not the screen. */}
          <dl className="grid grid-cols-2 gap-2.5 @md:grid-cols-3">
            {limits.map((l) => (
              <div key={l.label} className="well flex flex-col gap-0.5 rounded-control p-3">
                <dt className="text-sm text-muted">{l.label}</dt>
                <dd className="font-num text-2xl">
                  {l.value}
                  <span className="ms-1 text-sm text-muted">{l.unit}</span>
                </dd>
                <dd className="text-xs text-muted">{l.note}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}

function Considerations({ profile }: { profile: ProfileRow }) {
  const strong = [...profile.conditions.map((c) => conditionLabel[c]), ...profile.allergies.map((a) => `حساسية ${allergenLabel[a]}`)];
  const soft = [...profile.diet_prefs.map((d) => dietLabel[d]), goalLabel[profile.goal], activityLabel[profile.activity_level].name];
  return (
    <Card className="flex flex-col gap-3 p-5 md:p-6" aria-labelledby="consider-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="consider-title" className="text-lg font-semibold">
          ما نراعيه في كل حكم
        </h2>
        <Link href="/onboarding" className="press flex min-h-12 items-center gap-1.5 rounded-full px-3 font-semibold">
          <Pencil size={18} aria-hidden />
          عدّل
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {strong.length === 0 && <li className="text-muted">لا حالات صحية أو حساسية مسجّلة.</li>}
        {strong.map((t) => (
          <li key={t} className="rounded-full bg-fg px-4 py-2 font-semibold text-ink">
            {t}
          </li>
        ))}
        {soft.map((t) => (
          <li key={t} className="rounded-full border border-fg/25 px-4 py-2">
            {t}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FoodThisWeek({ nutrition }: { nutrition: WeekNutrition }) {
  if (nutrition.total === 0) {
    return (
      <Card className="p-6 text-center text-muted">
        افحص بعض المنتجات هذا الأسبوع لترى ما في أكلك من سكر وملح ودهون.
      </Card>
    );
  }
  const a = nutrition.averages;
  return (
    <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
      <Card className="anim-rise flex flex-col gap-5 p-5 md:p-6" aria-labelledby="food-title">
        <div>
          <h2 id="food-title" className="text-lg font-semibold">
            ما في أكلك هذا الأسبوع
          </h2>
          <p className="text-sm text-muted">متوسط ما فحصته لكل 100 غ، مقارنة بحدود الملصقات الغذائية</p>
        </div>
        <RangeBar label="السكر" value={a.sugarG} low={THRESHOLDS.sugar.low} high={THRESHOLDS.sugar.high} max={30} />
        <RangeBar label="الملح" value={a.saltG} low={THRESHOLDS.salt.low} high={THRESHOLDS.salt.high} max={2.5} />
        <RangeBar label="الدهون المشبعة" value={a.satFatG} low={THRESHOLDS.satFat.low} high={THRESHOLDS.satFat.high} max={8} />
        <RangeBar label="الدهون" value={a.fatG} low={THRESHOLDS.fat.low} high={THRESHOLDS.fat.high} max={25} />
      </Card>
      <Card className="anim-rise flex flex-col gap-4 p-5 md:p-6" aria-labelledby="cat-title">
        <h2 id="cat-title" className="text-lg font-semibold">
          ماذا فحصت
        </h2>
        <Donut
          centerLabel="منتجاً"
          slices={nutrition.categories.map((c) => ({ label: categoryLabel[c.category as Category] ?? c.category, value: c.count }))}
        />
      </Card>
    </div>
  );
}
