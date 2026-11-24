"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live camera that reads barcodes (EAN-13, UPC, …) with @zxing/browser.
 * Calls `onCode` once with the first barcode it reads, then stops the
 * camera. The library is loaded on demand so it is not in the main bundle.
 */
export function BarcodeCamera({ onCode, paused }: { onCode: (code: string) => void; paused: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  // Keep the latest callback without restarting the camera when it changes.
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (paused || !videoRef.current) return;
    let stop: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, ctrl) => {
          if (result) {
            ctrl.stop();
            onCodeRef.current(result.getText());
          }
        });
        stop = () => controls.stop();
        if (cancelled) stop();
      } catch {
        setCameraError(true);
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [paused]);

  if (cameraError) {
    return (
      <p className="flex aspect-[4/3] items-center justify-center rounded-card border border-dashed border-charcoal p-6 text-center text-muted">
        لا يمكن فتح الكاميرا. اسمح للمتصفح باستخدامها، أو اكتب رقم الباركود في الحقل أدناه.
      </p>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-charcoal bg-ink [container-type:size]">
      <video ref={videoRef} className="size-full object-cover" muted playsInline aria-label="الكاميرا لقراءة الباركود" />
      <ScanFrame />
      <div className="anim-scanline absolute inset-x-[12%] top-[20%] h-0.5 bg-fg" style={{ ["--travel" as string]: "60cqh" }} aria-hidden />
    </div>
  );
}

/** Four corner brackets, like the logo's scan frame. */
export function ScanFrame() {
  const corner = "absolute size-10 border-fg";
  return (
    <div className="pointer-events-none absolute inset-[10%]" aria-hidden>
      <span className={`${corner} top-0 right-0 rounded-tr-xl border-t-4 border-r-4`} />
      <span className={`${corner} top-0 left-0 rounded-tl-xl border-t-4 border-l-4`} />
      <span className={`${corner} right-0 bottom-0 rounded-br-xl border-r-4 border-b-4`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-xl border-b-4 border-l-4`} />
    </div>
  );
}
