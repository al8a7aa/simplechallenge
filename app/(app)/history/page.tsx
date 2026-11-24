import { ChevronLeft, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { VerdictBadge } from "@/components/ui/verdict";
import { getScans } from "@/lib/data/queries";
import { formatWhen } from "@/lib/i18n/ar";
import type { Verdict } from "@/lib/nutrition/types";

export const metadata: Metadata = { title: "السجل" };

const PAGE_SIZE = 20;
const FILTERS: { value: Verdict | undefined; label: string }[] = [
  { value: undefined, label: "الكل" },
  { value: "good", label: "مناسب" },
  { value: "moderate", label: "باعتدال" },
  { value: "avoid", label: "تجنّبه" },
];

/**
 * Pattern: List / Index — every product the user checked.
 * Search and verdict filter live in the URL (?q=&v=&page=), so results
 * can be shared, bookmarked and work without JavaScript.
 */
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; v?: string; page?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const verdict = FILTERS.find((f) => f.value === params.v)?.value;
  const page = Math.max(1, Number(params.page) || 1);

  // Fetch one extra row to know whether there is a next page.
  const scans = await getScans({ limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE, verdict, query });
  const hasMore = scans.length > PAGE_SIZE;
  const rows = scans.slice(0, PAGE_SIZE);

  const href = (next: { v?: Verdict; page?: number }) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (next.v) sp.set("v", next.v);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const s = sp.toString();
    return s ? `/history?${s}` : "/history";
  };

  return (
    <Page>
      <PageHeader title="السجل" description="كل المنتجات التي فحصتها، الأحدث أولاً." />

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <form role="search" className="relative md:w-80">
          <label htmlFor="q" className="sr-only md:not-sr-only md:mb-1.5 md:block md:font-semibold">
            ابحث باسم المنتج
          </label>
          <Search size={20} className="pointer-events-none absolute right-4 bottom-3.5 text-muted" aria-hidden />
          {verdict && <input type="hidden" name="v" value={verdict} />}
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="ابحث باسم المنتج"
            className="min-h-12 w-full rounded-control border border-charcoal bg-space ps-12 pe-4"
          />
        </form>
        <nav aria-label="تصفية حسب الحكم" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={href({ v: f.value })}
              aria-current={f.value === verdict ? "page" : undefined}
              className={`press flex min-h-12 items-center rounded-control px-4 font-semibold ${
                f.value === verdict ? "bg-fg text-ink" : "border border-charcoal bg-space text-fg"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-lg font-semibold">{query || verdict ? "لا توجد نتائج لهذا البحث" : "لم تفحص أي منتج بعد"}</p>
            {query || verdict ? (
              <Link href="/history" className="press flex min-h-12 items-center font-semibold underline">
                امسح البحث والتصفية
              </Link>
            ) : (
              <TransitionLink href="/scan" transition="rise" className="press flex min-h-12 items-center rounded-control bg-fg px-6 font-semibold text-ink">
                افحص أول منتج
              </TransitionLink>
            )}
          </div>
        ) : (
          <ul className="anim-stagger">
            {rows.map((scan, i) => (
              <li key={scan.id} className={i > 0 ? "border-t border-charcoal" : ""}>
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
                  <span className="hidden text-sm text-muted tabular-nums sm:inline">{scan.score}/100</span>
                  <VerdictBadge verdict={scan.verdict} className="min-w-20" />
                  <ChevronLeft size={20} className="shrink-0 text-muted" aria-hidden />
                </TransitionLink>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {(page > 1 || hasMore) && (
        <nav aria-label="الصفحات" className="flex justify-between gap-3">
          <PagerLink href={href({ v: verdict, page: page - 1 })} disabled={page <= 1}>
            الأحدث
          </PagerLink>
          <PagerLink href={href({ v: verdict, page: page + 1 })} disabled={!hasMore}>
            الأقدم
          </PagerLink>
        </nav>
      )}
    </Page>
  );
}

/** Disabled pagination keeps its readable label (list pattern rule). */
function PagerLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const cls = "flex min-h-12 items-center rounded-control border border-charcoal px-5 font-semibold";
  if (disabled) return <span className={`${cls} text-muted`} aria-disabled="true">{children}</span>;
  return (
    <Link href={href} className={`press ${cls} bg-space`}>
      {children}
    </Link>
  );
}
