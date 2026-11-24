/**
 * Additives that cost points in the score, with a one-line plain-language
 * explanation shown on the Result page. The list is intentionally short:
 * it flags additives with real public-health discussion, not every E-number.
 *
 * Keys are lower-case E-numbers as returned by Open Food Facts ("e621").
 */
export const FLAGGED_ADDITIVES: Record<string, { ar: string; en: string }> = {
  e102: { ar: "تارترازين: ملوّن أصفر قد يسبب فرط النشاط لدى بعض الأطفال.", en: "Tartrazine: yellow dye linked to hyperactivity in some children." },
  e110: { ar: "أصفر الغروب: ملوّن صناعي قد يسبب فرط النشاط لدى بعض الأطفال.", en: "Sunset yellow: dye linked to hyperactivity in some children." },
  e122: { ar: "كارموازين: ملوّن أحمر صناعي.", en: "Carmoisine: artificial red dye." },
  e124: { ar: "بونسو 4R: ملوّن أحمر صناعي.", en: "Ponceau 4R: artificial red dye." },
  e129: { ar: "أحمر ألورا: ملوّن أحمر صناعي.", en: "Allura red: artificial red dye." },
  e150d: { ar: "كراميل الأمونيا والكبريتيت: ملوّن شائع في المشروبات الغازية.", en: "Sulphite ammonia caramel: colour common in colas." },
  e171: { ar: "ثاني أكسيد التيتانيوم: ممنوع في الاتحاد الأوروبي منذ 2022.", en: "Titanium dioxide: banned in the EU since 2022." },
  e211: { ar: "بنزوات الصوديوم: مادة حافظة.", en: "Sodium benzoate: preservative." },
  e250: { ar: "نتريت الصوديوم: مادة حافظة في اللحوم المصنّعة.", en: "Sodium nitrite: preservative in processed meat." },
  e320: { ar: "BHA: مضاد أكسدة صناعي.", en: "BHA: synthetic antioxidant." },
  e621: { ar: "غلوتامات أحادي الصوديوم: معزّز نكهة يرفع الصوديوم.", en: "MSG: flavour enhancer that adds sodium." },
  e951: { ar: "أسبارتام: مُحلٍّ صناعي.", en: "Aspartame: artificial sweetener." },
  e950: { ar: "أسيسلفام البوتاسيوم: مُحلٍّ صناعي.", en: "Acesulfame K: artificial sweetener." },
};

export function isFlaggedAdditive(code: string): boolean {
  return code.toLowerCase() in FLAGGED_ADDITIVES;
}
