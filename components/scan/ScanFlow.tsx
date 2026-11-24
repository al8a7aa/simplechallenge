"use client";

import { Camera, Check, ImageUp, ListChecks, Package, ScanBarcode, Table, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { analyzePhoto, scanBarcode, type ScanResult } from "@/app/actions/scan";
import { useTransitionRouter } from "@/components/motion/TransitionLink";
import { resizeImage } from "@/lib/image/resize";
import { BarcodeCamera, ScanFrame } from "./BarcodeCamera";

/**
 * The scan screen. The user picks how to scan:
 *
 *   Barcode       live camera or typed number → Open Food Facts
 *   Whole product one photo of the pack or a plated meal → Claude
 *   Label         nutrition table and/or ingredients (up to 2 photos) → Claude
 *   Ingredients   one photo of the ingredients list → Claude
 *
 * Single-photo modes analyze as soon as the photo is taken (Cal AI style);
 * Label mode collects its photos first, then "Analyze".
 *
 * On success the result opens with the "zoom" transition. Errors stay on
 * this screen, shake once, and say what to do next.
 */

type Mode = "barcode" | "product" | "label" | "ingredients";
type Role = "product" | "nutrition" | "ingredients";
type ScanError = Extract<ScanResult, { ok: false }>["error"];

const MODES: { id: Mode; title: string; hint: string; icon: LucideIcon }[] = [
  { id: "barcode", title: "باركود", hint: "الأسرع للمنتجات المعروفة", icon: ScanBarcode },
  { id: "product", title: "المنتج كاملاً", hint: "واجهة العبوة أو الطبق", icon: Package },
  { id: "label", title: "الملصق", hint: "القيم الغذائية والمكونات", icon: Table },
  { id: "ingredients", title: "المكونات فقط", hint: "للحساسية والحلال", icon: ListChecks },
];

const ERROR_TEXT: Record<ScanError, string> = {
  not_found: "لا نعرف هذا الباركود بعد. صوّر الملصق بدلاً منه.",
  not_food: "لم نجد أكلاً في الصورة. صوّر المنتج أو الطبق من قريب.",
  unreadable: "لم نتمكن من قراءة الصورة. صوّر من جديد في إضاءة أفضل.",
  too_many: "تم بلوغ حد الفحص بالصور لهذا اليوم. افحص بالباركود بدلاً من ذلك.",
  invalid: "الصورة غير صالحة. استخدم صورة JPG أو PNG، أو باركوداً من 8 إلى 14 رقماً.",
  service: "خدمة التحليل مشغولة الآن. حاول مرة أخرى بعد دقيقة.",
  no_profile: "أكمل ملفك الصحي أولاً حتى نعطيك حكماً يناسبك.",
};

export function ScanFlow() {
  const [mode, setMode] = useState<Mode>("product");
  const [error, setError] = useState<ScanError | null>(null);
  const [errorKey, setErrorKey] = useState(0); // bumped so the shake replays
  const [pending, startTransition] = useTransition();
  const router = useTransitionRouter();

  /** Runs a scan action and handles its result in one place. */
  function run(action: () => Promise<ScanResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        router.push(`/product/${result.productId}`, "zoom");
      } else {
        setError(result.error);
        setErrorKey((k) => k + 1);
      }
    });
  }

  /** Resizes the photos and sends them, each under its role's field name. */
  async function analyze(photos: Partial<Record<Role, File>>) {
    const form = new FormData();
    for (const [role, file] of Object.entries(photos)) {
      if (file) form.set(`photo_${role}`, await resizeImage(file));
    }
    run(() => analyzePhoto(form));
  }

  return (
    <div className="flex flex-col gap-5">
      <ModePicker
        mode={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
      />

      {mode === "barcode" && <BarcodePanel pending={pending} onCode={(code) => run(() => scanBarcode(code))} />}
      {mode === "product" && (
        <SinglePhotoPanel key="product" hint="صوّر واجهة العبوة كاملة، أو الطبق من الأعلى" analyzing={pending} onPhoto={(f) => analyze({ product: f })} />
      )}
      {mode === "ingredients" && (
        <SinglePhotoPanel key="ingredients" hint="صوّر قائمة المكونات بحيث تظهر كل الأسطر" analyzing={pending} onPhoto={(f) => analyze({ ingredients: f })} />
      )}
      {mode === "label" && <LabelPanel analyzing={pending} onAnalyze={analyze} />}

      <div aria-live="polite">
        {error && (
          <div key={errorKey} className="anim-shake glass flex flex-col gap-3 rounded-tile border-avoid/60 p-4" role="alert">
            <p>{ERROR_TEXT[error]}</p>
            {error === "not_found" && (
              <button type="button" onClick={() => { setMode("label"); setError(null); }} className="press min-h-12 self-start rounded-full bg-fg px-5 font-semibold text-ink">
                صوّر الملصق
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Four big toggle tiles (aria-pressed), two per row. */
function ModePicker({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="group" aria-label="طريقة الفحص" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {MODES.map(({ id, title, hint, icon: Icon }) => {
        const on = mode === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={`press flex min-h-24 flex-col items-start gap-1 rounded-tile p-3.5 text-start ${on ? "border border-fg bg-fg text-ink" : "glass"}`}
          >
            <Icon size={22} aria-hidden />
            <span className="font-semibold">{title}</span>
            <span className={`text-xs ${on ? "text-charcoal" : "text-muted"}`}>{hint}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Viewfinder with corner brackets; shows the photo and a scan line while analyzing. */
function Viewfinder({ preview, analyzing, hint }: { preview: string | null; analyzing: boolean; hint: string }) {
  return (
    <div className="glass relative aspect-[4/3] overflow-hidden rounded-card [container-type:size]">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview
        <img src={preview} alt="الصورة التي التقطتها" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-10 text-center text-muted">
          <Camera size={40} aria-hidden />
          <p>{hint}</p>
        </div>
      )}
      <ScanFrame />
      {analyzing && (
        <>
          <div className="anim-scanline absolute inset-x-[12%] top-[12%] h-0.5 bg-fg" style={{ ["--travel" as string]: "76cqh" }} aria-hidden />
          <p className="anim-fade glass absolute inset-x-6 bottom-4 rounded-full py-2 text-center font-semibold" role="status">
            جارٍ التحليل…
          </p>
        </>
      )}
    </div>
  );
}

/** "Take photo" (camera on phones) and "Choose from photos" buttons. */
function PhotoButtons({ disabled, onFile, primaryLabel = "التقط صورة" }: { disabled: boolean; onFile: (f: File) => void; primaryLabel?: string }) {
  const cameraId = useId();
  const galleryId = useId();
  const off = disabled ? "pointer-events-none opacity-60" : "";
  const pick = (files: FileList | null) => files?.[0] && onFile(files[0]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* `capture` opens the rear camera on phones; desktops get a file picker. */}
      <label htmlFor={cameraId} className={`press flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-fg text-lg font-semibold text-ink ${off}`}>
        <Camera size={22} aria-hidden />
        {primaryLabel}
      </label>
      <input id={cameraId} type="file" accept="image/*" capture="environment" className="sr-only" disabled={disabled} onChange={(e) => pick(e.target.files)} />
      <label htmlFor={galleryId} className={`press glass flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold ${off}`}>
        <ImageUp size={22} aria-hidden />
        اختر من الصور
      </label>
      <input id={galleryId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled} onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

function SinglePhotoPanel({ hint, analyzing, onPhoto }: { hint: string; analyzing: boolean; onPhoto: (f: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <>
      <Viewfinder preview={preview} analyzing={analyzing} hint={hint} />
      <PhotoButtons
        disabled={analyzing}
        onFile={(file) => {
          setPreview(URL.createObjectURL(file));
          onPhoto(file);
        }}
      />
    </>
  );
}

/** Label mode: collect a nutrition-table photo and/or an ingredients photo, then analyze. */
function LabelPanel({ analyzing, onAnalyze }: { analyzing: boolean; onAnalyze: (photos: Partial<Record<Role, File>>) => void }) {
  const [photos, setPhotos] = useState<Partial<Record<"nutrition" | "ingredients", File>>>({});
  const [target, setTarget] = useState<"nutrition" | "ingredients">("nutrition");
  const shown = photos[target] ?? photos.nutrition ?? photos.ingredients;
  // One object URL per photo, released when the photo changes.
  const preview = useMemo(() => (shown ? URL.createObjectURL(shown) : null), [shown]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const count = Object.values(photos).filter(Boolean).length;

  const slots: { role: "nutrition" | "ingredients"; title: string }[] = [
    { role: "nutrition", title: "القيم الغذائية" },
    { role: "ingredients", title: "المكونات" },
  ];

  return (
    <>
      <Viewfinder preview={preview} analyzing={analyzing} hint="صوّر جدول القيم الغذائية بوضوح، ثم المكونات إن وُجدت" />

      <section aria-label="صور الملصق" className="glass flex flex-col gap-3 rounded-tile p-4">
        <p className="font-semibold">صور الملصق</p>
        <div className="grid grid-cols-2 gap-2.5">
          {slots.map(({ role, title }) => {
            const has = Boolean(photos[role]);
            return (
              <div key={role} className={`flex min-h-16 items-center gap-2.5 rounded-control p-2.5 ${has ? "well" : "border border-dashed border-fg/30"} ${target === role ? "ring-2 ring-fg" : ""}`}>
                <button
                  type="button"
                  onClick={() => setTarget(role)}
                  aria-pressed={target === role}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 text-start"
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${has ? "bg-good text-ink" : "bg-fg/10"}`}>
                    {has ? <Check size={20} aria-hidden /> : <Camera size={18} aria-hidden />}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate font-semibold">{title}</span>
                    <span className="text-xs text-muted">{has ? "تمت الإضافة" : target === role ? "التالي" : "اختياري"}</span>
                  </span>
                </button>
                {has && (
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => ({ ...p, [role]: undefined }))}
                    className="press flex size-12 shrink-0 items-center justify-center rounded-full text-muted hover:text-fg"
                  >
                    <X size={18} aria-hidden />
                    <span className="sr-only">احذف صورة {title}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <PhotoButtons
        disabled={analyzing}
        primaryLabel={target === "nutrition" ? "صوّر القيم الغذائية" : "صوّر المكونات"}
        onFile={(file) => {
          setPhotos((p) => ({ ...p, [target]: file }));
          // After the nutrition table, suggest the ingredients next.
          if (target === "nutrition" && !photos.ingredients) setTarget("ingredients");
        }}
      />
      <button
        type="button"
        disabled={analyzing}
        onClick={() => (count > 0 ? onAnalyze(photos) : setTarget("nutrition"))}
        className="press glass min-h-14 rounded-full text-lg font-semibold disabled:opacity-60"
      >
        {analyzing ? "جارٍ التحليل…" : count > 0 ? `حلّل ${count === 2 ? "الصورتين" : "الصورة"}` : "أضف صورة أولاً"}
      </button>
    </>
  );
}

const BARCODE_ERROR = "الباركود من 8 إلى 14 رقماً، مثل الرقم المطبوع تحت الخطوط.";
const isBarcode = (v: string) => /^\d{8,14}$/.test(v.replace(/\s/g, ""));

function BarcodePanel({ pending, onCode }: { pending: boolean; onCode: (code: string) => void }) {
  const inputId = useId();
  const [fieldError, setFieldError] = useState(false);
  return (
    <>
      <BarcodeCamera onCode={onCode} paused={pending} />
      <form
        className="glass flex flex-col gap-2 rounded-tile p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const code = String(new FormData(e.currentTarget).get("barcode") ?? "");
          if (!isBarcode(code)) return setFieldError(true);
          onCode(code);
        }}
      >
        <label htmlFor={inputId} className="font-semibold">
          أو اكتب رقم الباركود
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            name="barcode"
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            placeholder="6281007…"
            aria-invalid={fieldError || undefined}
            aria-describedby={fieldError ? `${inputId}-error` : undefined}
            onBlur={(e) => setFieldError(e.currentTarget.value.trim() !== "" && !isBarcode(e.currentTarget.value))}
            onInput={() => setFieldError(false)}
            className={`well font-num min-h-12 min-w-0 flex-1 rounded-control border px-4 text-lg tracking-wider ${fieldError ? "border-avoid" : "border-fg/15"}`}
          />
          <button type="submit" disabled={pending} className="press min-h-12 rounded-full bg-fg px-6 font-semibold text-ink disabled:opacity-60">
            {pending ? "جارٍ البحث…" : "ابحث"}
          </button>
        </div>
        {fieldError && (
          <p id={`${inputId}-error`} className="text-sm text-avoid">
            {BARCODE_ERROR}
          </p>
        )}
      </form>
    </>
  );
}
