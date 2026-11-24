"use client";

import { useActionState, useState, type FocusEvent, type ReactNode } from "react";
import { saveProfile } from "@/app/actions/profile";
import type { ProfileRow } from "@/lib/data/mappers";
import { activityLabel, allergenLabel, conditionLabel, dietLabel, goalLabel } from "@/lib/i18n/ar";
import { ACTIVITY_LEVELS, ALLERGENS, CONDITIONS, DIET_PREFS, GOALS } from "@/lib/nutrition/types";

/**
 * The health profile, collected as part of sign-up (and reused to edit it).
 * Four short steps:
 *   1. You        name, birth year, sex
 *   2. Your body  height, weight, target weight, activity level
 *   3. Health     conditions and allergies
 *   4. Goal       goal and diet
 *
 * All steps stay mounted (hidden ones use `hidden`), so one <form> submits
 * every field at the end.
 *
 * Validation (forms skill): a field is checked when it loses focus, its
 * error clears as soon as it is edited, and "Next" is always clickable —
 * pressing it shows the step's errors inline and focuses the first one.
 *
 * No local draft is saved on purpose: health data is sensitive.
 */

const STEPS = ["عنك", "جسمك", "صحتك", "هدفك"] as const;
const THIS_YEAR = new Date().getFullYear();

/** Returns an error message, or null when the value is valid. */
const VALIDATORS: Record<string, (value: string) => string | null> = {
  full_name: (v) => (v.trim() ? null : "اكتب اسمك حتى نخاطبك به."),
  birth_year: (v) => numberInRange(v, 1900, THIS_YEAR - 5, `اكتب سنة ميلادك بأربعة أرقام، مثل 1995.`, true),
  sex: (v) => (v ? null : "اختر أحد الخيارين، فهو يغيّر حساب احتياجك اليومي."),
  height_cm: (v) => numberInRange(v, 50, 260, "اكتب طولك بالسنتيمتر، بين 50 و260.", true),
  weight_kg: (v) => numberInRange(v, 10, 400, "اكتب وزنك بالكيلوغرام، بين 10 و400.", true),
  target_weight_kg: (v) => numberInRange(v, 10, 400, "اكتب الوزن المستهدف بالكيلوغرام، أو اتركه فارغاً.", false),
};

function numberInRange(value: string, min: number, max: number, message: string, required: boolean): string | null {
  if (!value.trim()) return required ? message : null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? null : message;
}

/** Which validated fields belong to which step. */
const STEP_FIELDS: string[][] = [["full_name", "birth_year", "sex"], ["height_cm", "weight_kg", "target_weight_kg"], [], []];

export function ProfileForm({ initial }: { initial: ProfileRow | null }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, saving] = useActionState(saveProfile, undefined);
  const last = step === STEPS.length - 1;

  const setError = (name: string, message: string | null) =>
    setErrors((prev) => {
      if (!message && !(name in prev)) return prev;
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });

  const validate = (name: string, value: string) => {
    const message = VALIDATORS[name]?.(value) ?? null;
    setError(name, message);
    return message;
  };

  /** Shared props for every validated text input. */
  const fieldProps = (name: string) => ({
    onBlur: (e: FocusEvent<HTMLInputElement>) => validate(name, e.currentTarget.value),
    onInput: () => setError(name, null),
    error: errors[name],
  });

  const goNext = (form: HTMLFormElement | null) => {
    if (!form) return;
    const data = new FormData(form);
    const invalid = STEP_FIELDS[step].filter((name) => validate(name, String(data.get(name) ?? "")));
    if (invalid.length > 0) {
      const first = form.querySelector<HTMLElement>(`[name="${invalid[0]}"]`);
      first?.focus();
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Progress step={step} />

      <Step show={step === 0} title="عرّفنا بك">
        <TextField name="full_name" label="الاسم" autoComplete="given-name" defaultValue={initial?.full_name} {...fieldProps("full_name")} />
        <TextField name="birth_year" label="سنة الميلاد" numeric placeholder="1995" defaultValue={initial?.birth_year} {...fieldProps("birth_year")} />
        <ChoiceGroup
          title="الجنس"
          name="sex"
          type="radio"
          options={["female", "male"] as const}
          labels={{ female: "أنثى", male: "ذكر" }}
          selected={initial?.sex ? [initial.sex] : []}
          error={errors.sex}
          onChange={() => setError("sex", null)}
        />
      </Step>

      <Step show={step === 1} title="جسمك" description="نحسب منها مؤشر كتلة الجسم واحتياجك اليومي من السعرات.">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="height_cm" label="الطول (سم)" numeric placeholder="165" defaultValue={initial?.height_cm} {...fieldProps("height_cm")} />
          <TextField name="weight_kg" label="الوزن (كغ)" numeric placeholder="70" defaultValue={initial?.weight_kg} {...fieldProps("weight_kg")} />
        </div>
        <TextField name="target_weight_kg" label="الوزن المستهدف (كغ)" hint="اختياري" numeric defaultValue={initial?.target_weight_kg} {...fieldProps("target_weight_kg")} />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold">مستوى نشاطك</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIVITY_LEVELS.map((level) => (
              <label
                key={level}
                className="press glass flex min-h-16 cursor-pointer flex-col justify-center rounded-tile px-4 py-3 has-[:checked]:border-fg has-[:checked]:bg-fg has-[:checked]:text-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg [&:has(:checked)_.hint]:text-charcoal"
              >
                <input type="radio" name="activity_level" value={level} defaultChecked={(initial?.activity_level ?? "moderate") === level} className="sr-only" />
                <span className="font-semibold">{activityLabel[level].name}</span>
                <span className="hint text-sm text-muted">{activityLabel[level].hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Step>

      <Step show={step === 2} title="صحتك" description="نراعي هذه المعلومات في كل حكم على أي منتج.">
        <ChoiceGroup title="هل لديك أي من هذه الحالات؟" name="conditions" options={CONDITIONS} labels={conditionLabel} selected={initial?.conditions ?? []} />
        <ChoiceGroup title="هل لديك حساسية من أي من هذه؟" name="allergies" options={ALLERGENS} labels={allergenLabel} selected={initial?.allergies ?? []} />
        <p className="text-sm text-muted">اترك الخيارات فارغة إذا لم يكن لديك أي منها.</p>
      </Step>

      <Step show={step === 3} title="هدفك ونظامك">
        <ChoiceGroup title="ما هدفك الأساسي؟" name="goal" type="radio" options={GOALS} labels={goalLabel} selected={[initial?.goal ?? "eat_healthier"]} />
        <ChoiceGroup title="نظامك الغذائي" name="diet_prefs" options={DIET_PREFS} labels={dietLabel} selected={initial?.diet_prefs ?? ["halal_only"]} />
      </Step>

      {state?.error && (
        <p role="alert" className="anim-shake glass rounded-tile border-avoid/60 p-4">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="press glass min-h-14 rounded-full px-6 font-semibold">
            رجوع
          </button>
        )}
        {last ? (
          <button type="submit" disabled={saving} className="press min-h-14 flex-1 rounded-full bg-fg px-6 font-semibold text-ink disabled:opacity-60">
            {saving ? "جارٍ الحفظ…" : "احفظ ملفي وابدأ"}
          </button>
        ) : (
          <button type="button" onClick={(e) => goNext(e.currentTarget.form)} className="press min-h-14 flex-1 rounded-full bg-fg px-6 font-semibold text-ink">
            التالي
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass = "well min-h-12 w-full rounded-control border border-fg/15 px-4 text-lg";

function Step({ show, title, description, children }: { show: boolean; title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset hidden={!show} className="anim-rise flex flex-col gap-5">
      <legend className="mb-1 font-display text-[34px] leading-tight font-normal">{title}</legend>
      {description && <p className="-mt-3 text-muted">{description}</p>}
      {children}
    </fieldset>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        أكمل تسجيلك · الخطوة <span className="font-num">{step + 1}</span> من <span className="font-num">{STEPS.length}</span>: {STEPS[step]}
      </p>
      <div className="grid grid-cols-4 gap-2" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-fg" : "bg-fg/15"}`} />
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
  placeholder,
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
  placeholder?: string;
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
        inputMode={numeric ? "decimal" : undefined}
        dir={numeric ? "ltr" : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onBlur={onBlur}
        onInput={onInput}
        className={`${inputClass} ${numeric ? "font-num" : ""} ${error ? "border-avoid" : ""}`}
      />
      {error && (
        <p id={errorId} className="text-sm text-avoid">
          {error}
        </p>
      )}
    </div>
  );
}

/** Big tappable glass chips backed by real checkboxes / radios. */
function ChoiceGroup<T extends string>({
  title,
  name,
  options,
  labels,
  selected,
  type = "checkbox",
  error,
  onChange,
}: {
  title: string;
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: string[];
  type?: "checkbox" | "radio";
  error?: string;
  onChange?: () => void;
}) {
  const errorId = `${name}-error`;
  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-3 font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="press glass flex min-h-12 cursor-pointer items-center rounded-full px-5 has-[:checked]:border-fg has-[:checked]:bg-fg has-[:checked]:font-semibold has-[:checked]:text-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg"
          >
            <input type={type} name={name} value={option} defaultChecked={selected.includes(option)} onChange={onChange} className="sr-only" />
            {labels[option]}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-avoid">
          {error}
        </p>
      )}
    </fieldset>
  );
}
