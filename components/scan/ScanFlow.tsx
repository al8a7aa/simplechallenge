"use client";

import { Camera, ImageUp, ScanBarcode } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { analyzePhoto, scanBarcode, type ScanResult } from "@/app/actions/scan";
import { useTransitionRouter } from "@/components/motion/TransitionLink";
import { resizeImage } from "@/lib/image/resize";
import { BarcodeCamera, ScanFrame } from "./BarcodeCamera";

/**
 * The scan screen, Cal AI style: one big viewfinder and one big button.
 *
 *   Photo   — snap a meal, the front of a pack or its label. Claude reads it.
 *   Barcode — live camera or typed number, looked up in Open Food Facts.
 *
 * On success the result page opens with the "zoom" transition (the verdict
 * reveal). Errors stay on this screen, shake once, and say what to do next.
 */

type Mode = "photo" | "barcode";
type ScanError = Extract<ScanResult, { ok: false }>["error"];

const ERROR_TEXT: Record<ScanError, string> = {
  not_found: "لا نعرف هذا الباركود بعد. صوّر الملصق الغذائي بدلاً منه.",
  not_food: "لم نجد أكلاً في الصورة. صوّر الطبق أو المنتج من قريب.",
  unreadable: "لم نتمكن من قراءة الصورة. صوّر من جديد في إضاءة أفضل.",
  too_many: "تم بلوغ حد الفحص بالصور لهذا اليوم. افحص بالباركود بدلاً من ذلك.",
  invalid: "الملف غير صالح. استخدم صورة JPG أو PNG أقل من 5 ميغابايت، أو باركوداً من 8 إلى 14 رقماً.",
  service: "خدمة التحليل مشغولة الآن. حاول مرة أخرى بعد دقيقة.",
  no_profile: "أكمل ملفك الصحي أولاً حتى نعطيك حكماً يناسبك.",
};

export function ScanFlow() {
  const [mode, setMode] = useState<Mode>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<ScanError | null>(null);
  /** Bumped on every error so the shake animation replays. */
  const [errorKey, setErrorKey] = useState(0);
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

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const resized = await resizeImage(file);
    const form = new FormData();
    form.set("photo", resized);
    run(() => analyzePhoto(form));
  }

  return (
    <div className="flex flex-col gap-5">
      <ModeTabs mode={mode} onChange={(m) => { setMode(m); setError(null); }} />

      {mode === "photo" ? (
        <PhotoPanel preview={preview} analyzing={pending} onFile={onPhoto} />
      ) : (
        <BarcodePanel pending={pending} onCode={(code) => run(() => scanBarcode(code))} />
      )}

      <div aria-live="polite">
        {error && (
          <div key={errorKey} className="anim-shake flex flex-col gap-3 rounded-card border border-avoid/60 bg-space p-4" role="alert">
            <p>{ERROR_TEXT[error]}</p>
            {error === "not_found" && (
              <button type="button" onClick={() => { setMode("photo"); setError(null); }} className="press min-h-12 self-start rounded-control bg-charcoal px-4 font-semibold">
                صوّر الملصق
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Segmented control (two toggle buttons with aria-pressed). Simpler and
 * fully keyboard-accessible, unlike a half-implemented ARIA tablist.
 */
function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const option = (m: Mode, label: string, Icon: typeof Camera) => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => onChange(m)}
      className={`press flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control font-semibold ${
        mode === m ? "bg-charcoal text-fg" : "text-muted"
      }`}
    >
      <Icon size={20} aria-hidden />
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="طريقة الفحص" className="flex gap-1 rounded-card border border-charcoal bg-space p-1">
      {option("photo", "صورة", Camera)}
      {option("barcode", "باركود", ScanBarcode)}
    </div>
  );
}

function PhotoPanel({ preview, analyzing, onFile }: { preview: string | null; analyzing: boolean; onFile: (f: File | undefined) => void }) {
  const cameraId = useId();
  const galleryId = useId();
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={frameRef} className="relative aspect-[4/3] overflow-hidden rounded-card border border-charcoal bg-space [container-type:size]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="الصورة التي التقطتها" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted">
            <Camera size={40} aria-hidden />
            <p>صوّر الطبق، أو واجهة المنتج، أو الملصق الغذائي</p>
          </div>
        )}
        <ScanFrame />
        {analyzing && (
          <>
            <div className="anim-scanline absolute inset-x-[12%] top-[12%] h-0.5 bg-fg" style={{ ["--travel" as string]: "76cqh" }} aria-hidden />
            <p className="anim-fade absolute inset-x-0 bottom-4 text-center font-semibold" role="status">
              جارٍ التحليل…
            </p>
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* `capture` opens the rear camera on phones; desktops get a file picker. */}
        <label htmlFor={cameraId} className={`press flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-control bg-fg text-lg font-semibold text-ink ${analyzing ? "pointer-events-none opacity-60" : ""}`}>
          <Camera size={22} aria-hidden />
          التقط صورة
        </label>
        <input id={cameraId} type="file" accept="image/*" capture="environment" className="sr-only" disabled={analyzing} onChange={(e) => onFile(e.target.files?.[0])} />

        <label htmlFor={galleryId} className={`press flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-control border border-charcoal bg-space font-semibold ${analyzing ? "pointer-events-none opacity-60" : ""}`}>
          <ImageUp size={22} aria-hidden />
          اختر من الصور
        </label>
        <input id={galleryId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={analyzing} onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
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
        className="flex flex-col gap-2"
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
            className={`min-h-12 min-w-0 flex-1 rounded-control border bg-ink px-4 text-lg tracking-wider ${fieldError ? "border-avoid" : "border-charcoal"}`}
          />
          <button type="submit" disabled={pending} className="press min-h-12 rounded-control bg-fg px-5 font-semibold text-ink disabled:opacity-60">
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
