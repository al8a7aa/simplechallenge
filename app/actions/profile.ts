"use server";

/**
 * Server Actions for the health profile (onboarding and the profile page).
 */

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ALLERGENS, CONDITIONS, DIET_PREFS, GOALS } from "@/lib/nutrition/types";
import { createServerSupabase } from "@/lib/supabase/server";

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(min).max(max).nullable());

const ProfileInput = z.object({
  full_name: z.string().trim().min(1).max(80),
  birth_year: optionalInt(1900, new Date().getFullYear()),
  sex: z.enum(["male", "female"]).nullable().catch(null),
  height_cm: optionalInt(50, 260),
  weight_kg: optionalInt(10, 400),
  goal: z.enum(GOALS),
  conditions: z.array(z.enum(CONDITIONS)),
  allergies: z.array(z.enum(ALLERGENS)),
  diet_prefs: z.array(z.enum(DIET_PREFS)),
});

export type SaveProfileState = { error?: string } | undefined;

/** Used with useActionState in the onboarding form. Redirects on success. */
export async function saveProfile(_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> {
  const { userId } = await auth.protect();

  const parsed = ProfileInput.safeParse({
    full_name: formData.get("full_name"),
    birth_year: formData.get("birth_year"),
    sex: formData.get("sex") || null,
    height_cm: formData.get("height_cm"),
    weight_kg: formData.get("weight_kg"),
    goal: formData.get("goal") || "eat_healthier",
    conditions: formData.getAll("conditions"),
    allergies: formData.getAll("allergies"),
    diet_prefs: formData.getAll("diet_prefs"),
  });
  if (!parsed.success) return { error: "تحقق من الاسم والأرقام ثم حاول مرة أخرى." };

  const db = await createServerSupabase();
  const { error } = await db.from("profiles").upsert({ user_id: userId, ...parsed.data });
  if (error) return { error: "لم نتمكن من حفظ ملفك. حاول مرة أخرى بعد قليل." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Deletes everything this user stored: profile, scans and favorites. */
export async function deleteMyData(): Promise<void> {
  await auth.protect();
  const db = await createServerSupabase();
  // RLS limits each delete to the signed-in user's own rows.
  await db.from("favorites").delete().not("product_id", "is", null);
  await db.from("scans").delete().not("id", "is", null);
  await db.from("profiles").delete().not("user_id", "is", null);
  revalidatePath("/", "layout");
  redirect("/onboarding");
}
