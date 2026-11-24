import { ChevronRight, CircleAlert, CircleCheck, CircleX, Info, ScanBarcode } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ChooseAlternativeButton } from "@/components/result/ChooseAlternativeButton";
import { Card } from "@/components/ui/Card";
import { Page } from "@/components/ui/Page";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { VERDICT_ICON, VERDICT_TEXT, VerdictBadge } from "@/components/ui/verdict";
import { toFoodItem, toHealthProfile, type ProductRow } from "@/lib/data/mappers";
import { findAlternative, getProduct, getProfile } from "@/lib/data/queries";
import { categoryLabel, levelLabel, reasonSentence, verdictLabel } from "@/lib/i18n/ar";
import { FLAGGED_ADDITIVES } from "@/lib/nutrition/additives";
import { scoreFood, topReasons } from "@/lib/nutrition/scoring";
import type { Level, Reason } from "@/lib/nutrition/types";

export const metadata: Metadata = { title: "النتيجة" };

/**
 * Pattern: Detail / Record — one product, judged for this person.
 * Order follows importance: verdict → why → sugar in teaspoons →
 * traffic lights → better alternative → details (collapsed).
 *
 * The score is recomputed from the current profile on every view, so a
 * profile change (e.g. adding an allergy) updates old results too.
 */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, profileRow] = await Promise.all([getProduct(id), getProfile()]);
  if (!product || !profileRow) notFound();

  const profile = toHealthProfile(profileRow);
  const result = scoreFood(toFoodItem(product), profile);
  const alternative = result.verdict === "good" ? null : await findAlternative(product, result.score, profile);
  const VerdictIcon = VERDICT_ICON[result.verdict];

  return (
    <Page width="medium">
      <TransitionLink href="/history" transition="back" className="press -my-2 flex min-h-12 items-center gap-1 self-start text-muted">
        <ChevronRight size={20} aria-hidden />
        السجل
      </TransitionLink>

      {/* 1. Verdict — the answer, readable in 3 seconds. */}
      <Card className="anim-pop flex items-center gap-5 p-6" aria-labelledby="verdict">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="flex items-center gap-2 text-muted">
            <ProductIcon category={product.category} size={32} />
            <span className="truncate">{product.name_ar}</span>
          </p>
          <h1 id="verdict" className={`flex items-center gap-2 font-display text-[36px] font-normal leading-tight ${VERDICT_TEXT[result.verdict]}`}>
            <VerdictIcon size={34} aria-hidden />
            {verdictLabel[result.verdict]}
          </h1>
          {product.source === "photo" && (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Info size={16} aria-hidden />
              {product.confidence === "high" ? "القيم مقروءة من الملصق" : "القيم تقديرية من الصورة"}
            </p>
          )}
        </div>
        <ScoreRing score={result.score} size={104} />
      </Card>

      {/* 2. Why — top 3 reasons, worst first, one positive if any. */}
      {result.reasons.length > 0 && (
        <Card className="flex flex-col gap-3 p-5" aria-labelledby="why">
          <h2 id="why" className="text-lg font-semibold">
            لماذا؟
          </h2>
          <ul className="anim-stagger flex flex-col gap-3">
            {topReasons(result.reasons).map((reason) => (
              <ReasonRow key={reason.key} reason={reason} />
            ))}
          </ul>
        </Card>
      )}

      {/* 3. Sugar as teaspoons — the number people understand. */}
      <SugarTeaspoons product={product} />

      {/* 4. Traffic lights. */}
      <Card className="p-5" aria-labelledby="lights">
        <h2 id="lights" className="mb-3 text-lg font-semibold">
          لكل 100 {product.is_drink ? "مل" : "غ"}
        </h2>
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Light label="السكر" value={product.sugar_g} level={result.levels.sugar} />
          <Light label="الدهون" value={product.fat_g} level={result.levels.fat} />
          <Light label="الدهون المشبعة" value={product.sat_fat_g} level={result.levels.satFat} />
          <Light label="الملح" value={product.salt_g} level={result.levels.salt} />
        </dl>
      </Card>

      {/* 5. Better alternative. */}
      {alternative && (
        <Card className="anim-rise flex flex-col gap-4 p-5" aria-labelledby="alt">
          <h2 id="alt" className="text-lg font-semibold">
            بديل أفضل لك
          </h2>
          <div className="flex items-center gap-3">
            <ProductIcon category={alternative.product.category} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{alternative.product.name_ar}</span>
              <span className="text-sm text-muted">
                {alternative.score} من 100 · {categoryLabel[alternative.product.category]}
              </span>
            </div>
            <VerdictBadge verdict={alternative.score >= 70 ? "good" : "moderate"} />
          </div>
          <ChooseAlternativeButton fromProductId={product.id} alternativeId={alternative.product.id} />
        </Card>
      )}

      {/* 6. Details, collapsed. */}
      <Details product={product} />

      <TransitionLink href="/scan" transition="rise" className="press glass flex min-h-14 items-center justify-center gap-2 rounded-full font-semibold">
        <ScanBarcode size={20} aria-hidden />
        افحص منتجاً آخر
      </TransitionLink>

      <p className="text-center text-xs text-muted">إرشادات عامة، ولا تغني عن استشارة الطبيب أو أخصائي التغذية.</p>
    </Page>
  );
}

function ReasonRow({ reason }: { reason: Reason }) {
  const Icon = reason.positive ? CircleCheck : reason.impact >= 20 ? CircleX : CircleAlert;
  const color = reason.positive ? "text-good" : reason.impact >= 20 ? "text-avoid" : "text-moderate";
  return (
    <li className="flex items-start gap-3">
      <Icon size={22} className={`mt-0.5 shrink-0 ${color}`} aria-hidden />
      <span>{reasonSentence(reason)}</span>
    </li>
  );
}

const LEVEL_STYLE: Record<Level, { text: string; Icon: typeof CircleCheck }> = {
  low: { text: "text-good", Icon: CircleCheck },
  medium: { text: "text-moderate", Icon: CircleAlert },
  high: { text: "text-avoid", Icon: CircleX },
};

function Light({ label, value, level }: { label: string; value: number | null; level: Level | null }) {
  const style = level ? LEVEL_STYLE[level] : null;
  return (
    <div className="flex flex-col gap-1 well rounded-control p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-num text-2xl">{value === null ? "—" : Number(value)}<span className="ms-1 text-sm text-muted">{value === null ? "" : "غ"}</span></dd>
      <dd className={`inline-flex items-center gap-1 text-sm font-semibold ${style?.text ?? "text-muted"}`}>
        {style && <style.Icon size={16} aria-hidden />}
        {level ? levelLabel[level] : "غير معروف"}
      </dd>
    </div>
  );
}

/** "≈ 9 teaspoons of sugar in the whole 330 ml can" (1 teaspoon = 4 g). */
function SugarTeaspoons({ product }: { product: ProductRow }) {
  const sugar = product.sugar_g === null ? null : Number(product.sugar_g);
  const portion = product.portion_g === null ? null : Number(product.portion_g);
  if (!sugar || sugar < 1) return null;

  const grams = portion ? (sugar * portion) / 100 : sugar;
  const spoons = Math.round(grams / 4);
  if (spoons < 1) return null;
  const unit = product.is_drink ? "مل" : "غ";

  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="text-lg">
        <span className="font-num text-[40px] leading-none">≈ {spoons}</span> ملاعق صغيرة من السكر
        <span className="text-muted"> {portion ? `في ${kind(product)} كاملة (${portion} ${unit})` : `في كل 100 ${unit}`}</span>
      </p>
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: Math.min(spoons, 20) }, (_, i) => (
          <span key={i} className="anim-fade size-4 rounded-full bg-fg" style={{ animationDelay: `${i * 30}ms` }} />
        ))}
      </div>
    </Card>
  );
}

const kind = (p: ProductRow) => (p.kind === "meal" ? "الطبق" : "العبوة");

function Details({ product }: { product: ProductRow }) {
  const flagged = product.additives.filter((a) => a in FLAGGED_ADDITIVES);
  const rows: [string, number | null, string][] = [
    ["السعرات", product.energy_kcal, "سعرة"],
    ["البروتين", product.protein_g, "غ"],
    ["الكربوهيدرات", product.carbs_g, "غ"],
    ["السكر", product.sugar_g, "غ"],
    ["الدهون", product.fat_g, "غ"],
    ["الدهون المشبعة", product.sat_fat_g, "غ"],
    ["الألياف", product.fiber_g, "غ"],
    ["الملح", product.salt_g, "غ"],
  ];
  return (
    <Card className="p-5">
      <details>
        <summary className="flex min-h-12 cursor-pointer items-center text-lg font-semibold">القيم الغذائية والمكونات</summary>
        <table className="mt-2 w-full text-start">
          <caption className="sr-only">القيم الغذائية لكل 100 {product.is_drink ? "مل" : "غ"}</caption>
          <tbody>
            {rows.map(([label, value, unit]) => (
              <tr key={label} className="border-t border-fg/10">
                <th scope="row" className="py-2.5 text-start font-normal text-muted">
                  {label}
                </th>
                <td className="py-2.5 text-start font-semibold tabular-nums">{value === null ? "—" : `${Number(value)} ${unit}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {product.ingredients_text && (
          <>
            <h3 className="mt-4 mb-1 font-semibold">المكونات</h3>
            <p className="text-muted">{product.ingredients_text}</p>
          </>
        )}
        {flagged.length > 0 && (
          <>
            <h3 className="mt-4 mb-1 font-semibold">مضافات يُنصح بالحد منها</h3>
            <ul className="flex flex-col gap-1 text-muted">
              {flagged.map((code) => (
                <li key={code}>
                  <span dir="ltr" className="font-semibold text-fg">
                    {code.toUpperCase()}
                  </span>{" "}
                  {FLAGGED_ADDITIVES[code].ar}
                </li>
              ))}
            </ul>
          </>
        )}
      </details>
    </Card>
  );
}
