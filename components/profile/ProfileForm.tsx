"use client";

import { useActionState, useState, type FocusEvent } from "react";
import { saveProfile } from "@/app/actions/profile";
import type { ProfileRow } from "@/lib/data/mappers";
import { allergenLabel, conditionLabel, dietLabel, goalLabel } from "@/lib/i18n/ar";
import { ALLERGENS, CONDITIONS, DIET_PREFS, GOALS } from "@/lib/nutrition/types";

/**
 * Health profile in 3 short steps (about 30 seconds):
 *   1. About you   2. Your health   3. Goal and diet
 *
 * All steps stay mounted (hidden ones use `hidden`), so one <form> submits
 * every field at the end. Used by onboarding and by "edit profile".
 *
 * Validation (forms skill): a field is checked when it loses focus, its
 * error clears as soon as it is edited, and "Next" is always clickable —
 * pressing it shows any errors inline and focuses the first one.
 *
 * No local draft is saved on purpose: health conditions are sensitive data.
 */

const STEPS = ["عنك", "صحتك", "هدفك"] as const;
const THIS_YEAR = new Date().getFullYear();

/** Returns an error message, or null when the value is valid. */
const VALIDATORS: Record<string, (value: string) => string | null> = {
  full_name: (v) => (v.trim() ? null : "اكتب اسمك حتى نخاطبك به."),
  birth_year: (v) => numberInRange(v, 1900, THIS_YEAR, `اكتب سنة من 4 أرقام بين 1900 و${THIS_YEAR}.`),
  height_cm: (v) => numberInRange(v, 50, 260, "اكتب الطول بالسنتيمتر، بين 50 و260."),
  weight_kg: (v) => numberInRange(v, 10, 400, "اكتب الوزن بالكيلوغرام، بين 10 و400."),
};

/** Optional numeric fields: empty is valid. */
function numberInRange(value: string, min: number, max: number, message: string): string | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? null : message;
}

/** Which fields belong to which step, for validating before "Next". */
const STEP_FIELDS: string[][] = [["full_name", "birth_year", "height_cm", "weight_kg"], [], []];

export function ProfileForm({ initial }: { initial: ProfileRow | null }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, saving] = useActionState(saveProfile, undefined);
  const last = step === STEPS.length - 1;

  const validate = (name: string, value: string) => {
    const message = VALIDATORS[name]?.(value) ?? null;
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
    return message;
  };
  const clear = (name: string) =>
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  /** Shared props for every validated text input. */
  const fieldProps = (name: string) => ({
    onBlur: (e: FocusEvent<HTMLInputElement>) => validate(name, e.currentTarget.value),
    onInput: () => clear(name),
    error: errors[name],
  });

  const goNext = (form: HTMLFormElement | null) => {
    if (!form) return;
    const invalid = STEP_FIELDS[step].filter((name) => {
      const input = form.elements.namedItem(name) as HTMLInputElement | null;
      return input && validate(name, input.value);
    });
    if (invalid.length > 0) {
      (form.elements.namedItem(invalid[0]) as HTMLInputElement | null)?.focus();
      return;
    }
    setStep(step + 1);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Progress step={step} />

      <fieldset hidden={step !== 0} className="anim-rise flex flex-col gap-4">
        <legend className="mb-4 text-2xl font-semibold">عرّفنا بك</legend>
        <TextField name="full_name" label="الاسم" autoComplete="given-name" defaultValue={initial?.full_name} {...fieldProps("full_name")} />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="birth_year" label="سنة الميلاد" hint="اختياري" numeric defaultValue={initial?.birth_year} {...fieldProps("birth_year")} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sex" className="font-semibold">
              الجنس <span className="text-sm font-normal text-muted">(اختياري)</span>
            </label>
            <select id="sex" name="sex" defaultValue={initial?.sex ?? ""} className={inputClass}>
              <option value="">أفضّل ألا أذكر</option>
              <option value="female">أنثى</option>
              <option value="male">ذكر</option>
            </select>
          </div>
          <TextField name="height_cm" label="الطول (سم)" hint="اختياري" numeric defaultValue={initial?.height_cm} {...fieldProps("height_cm")} />
          <TextField name="weight_kg" label="الوزن (كغ)" hint="اختياري" numeric defaultValue={initial?.weight_kg} {...fieldProps("weight_kg")} />
        </div>
      </fieldset>

      <fieldset hidden={step !== 1} className="anim-rise flex flex-col gap-6">
        <legend className="mb-4 text-2xl font-semibold">صحتك</legend>
        <ChipGroup title="هل لديك أي من هذه الحالات؟" name="conditions" options={CONDITIONS} labels={conditionLabel} selected={initial?.conditions ?? []} />
        <ChipGroup title="هل لديك حساسية من أي من هذه؟" name="allergies" options={ALLERGENS} labels={allergenLabel} selected={initial?.allergies ?? []} />
        <p className="text-sm text-muted">اترك الخيارات فارغة إذا لم يكن لديك أي منها.</p>
      </fieldset>

      <fieldset hidden={step !== 2} className="anim-rise flex flex-col gap-6">
        <legend className="mb-4 text-2xl font-semibold">هدفك ونظامك</legend>
        <ChipGroup title="ما هدفك الأساسي؟" name="goal" type="radio" options={GOALS} labels={goalLabel} selected={[initial?.goal ?? "eat_healthier"]} />
        <ChipGroup title="نظامك الغذائي" name="diet_prefs" options={DIET_PREFS} labels={dietLabel} selected={initial?.diet_prefs ?? ["halal_only"]} />
      </fieldset>

      {state?.error && (
        <p role="alert" className="anim-shake rounded-control border border-avoid/60 bg-space p-3">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="press min-h-12 rounded-control border border-charcoal bg-space px-6 font-semibold">
            رجوع
          </button>
        )}
        {last ? (
          <button type="submit" disabled={saving} className="press min-h-12 flex-1 rounded-control bg-fg px-6 font-semibold text-ink disabled:opacity-60">
            {saving ? "جارٍ الحفظ…" : "احفظ وابدأ"}
          </button>
        ) : (
          <button type="button" onClick={(e) => goNext(e.currentTarget.form)} className="press min-h-12 flex-1 rounded-control bg-fg px-6 font-semibold text-ink">
            التالي
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass = "min-h-12 w-full rounded-control border border-charcoal bg-ink px-4 text-lg";

function Progress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        الخطوة {step + 1} من {STEPS.length}: {STEPS[step]}
      </p>
      <div className="grid grid-cols-3 gap-2" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-fg" : "bg-charcoal"}`} />
        ))}
      </div>
    </div>
  );
}

/** Labelled text input with an inline error linked by aria-describedby. */
function TextField({
  name,
  label,
  hint,
  numeric = false,
  autoComplete,
  defaultValue,
  error,
  onBlur,
  onInput,
}: {
  name: string;
  label: string;
  hint?: string;
  numeric?: boolean;
  autoComplete?: string;
  defaultValue?: string | number | null;
  error?: string;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  onInput: () => void;
}) {
  const errorId = `${name}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-semibold">
        {label} {hint && <span className="text-sm font-normal text-muted">({hint})</span>}
      </label>
      <input
        id={name}
        name={name}
        inputMode={numeric ? "numeric" : undefined}
        dir={numeric ? "ltr" : undefined}
        autoComplete={autoComplete ?? "off"}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onBlur={onBlur}
        onInput={onInput}
        className={`${inputClass} ${error ? "border-avoid" : ""}`}
      />
      {error && (
        <p id={errorId} className="text-sm text-avoid">
          {error}
        </p>
      )}
    </div>
  );
}

/** Big tappable chips backed by real checkboxes / radios (keyboard + screen reader friendly). */
function ChipGroup<T extends string>({
  title,
  name,
  options,
  labels,
  selected,
  type = "checkbox",
}: {
  title: string;
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: string[];
  type?: "checkbox" | "radio";
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="press flex min-h-12 cursor-pointer items-center rounded-full border border-charcoal bg-space px-5 has-[:checked]:border-fg has-[:checked]:bg-fg has-[:checked]:font-semibold has-[:checked]:text-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg"
          >
            <input type={type} name={name} value={option} defaultChecked={selected.includes(option)} className="sr-only" />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
