import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav, SideNav } from "@/components/nav/AppNav";
import { getProfile } from "@/lib/data/queries";

/**
 * Shell for every signed-in page: side menu on medium/wide screens,
 * bottom tab bar on phones. Sign-in is enforced by middleware.ts; this
 * layout also sends users without a health profile to onboarding.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh">
      <SideNav />
      {/* Bottom padding keeps content clear of the phone tab bar. */}
      <div className="min-w-0 flex-1 pb-28 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
