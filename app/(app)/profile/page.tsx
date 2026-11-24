import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { LogOut, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DeleteDataButton } from "@/components/profile/DeleteDataButton";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { getProfile } from "@/lib/data/queries";
import { allergenLabel, conditionLabel, dietLabel, goalLabel } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: "حسابي" };

/**
 * Pattern: Settings — the health profile that drives every verdict,
 * the account, and data deletion. Editing reuses the onboarding form.
 */
export default async function ProfilePage() {
  const [profile, user] = await Promise.all([getProfile(), currentUser()]);
  if (!profile) return null;

  const list = (items: string[]) => (items.length ? items.join("، ") : "لا شيء");

  return (
    <Page className="max-w-[720px]">
      <PageHeader title="حسابي" description={user?.primaryEmailAddress?.emailAddress} />

      <Card className="flex flex-col gap-1 p-5" aria-labelledby="health">
        <div className="flex items-center justify-between gap-3">
          <h2 id="health" className="text-lg font-semibold">
            ملفك الصحي
          </h2>
          <Link href="/onboarding" className="press flex min-h-12 items-center gap-1.5 px-3 font-semibold">
            <Pencil size={18} aria-hidden />
            عدّل الملف
          </Link>
        </div>
        <dl className="divide-y divide-charcoal">
          <Row label="الاسم" value={profile.full_name} />
          <Row label="الحالات الصحية" value={list(profile.conditions.map((c) => conditionLabel[c]))} />
          <Row label="الحساسية" value={list(profile.allergies.map((a) => allergenLabel[a]))} />
          <Row label="الهدف" value={goalLabel[profile.goal]} />
          <Row label="النظام الغذائي" value={list(profile.diet_prefs.map((d) => dietLabel[d]))} />
        </dl>
        <p className="pt-2 text-sm text-muted">أي تعديل هنا يغيّر الحكم على كل منتجاتك، حتى القديمة.</p>
      </Card>

      <Card className="flex flex-col gap-4 p-5" aria-labelledby="account">
        <h2 id="account" className="text-lg font-semibold">
          الحساب
        </h2>
        <SignOutButton redirectUrl="/">
          <button type="button" className="press flex min-h-12 items-center gap-2 self-start rounded-control border border-charcoal px-5 font-semibold">
            <LogOut size={20} aria-hidden />
            سجّل الخروج
          </button>
        </SignOutButton>
        <DeleteDataButton />
      </Card>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-6">
      <dt className="text-muted sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
