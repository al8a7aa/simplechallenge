"use client";

import { Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { deleteMyData } from "@/app/actions/profile";

/**
 * Destructive action with a named confirmation in a native <dialog>
 * (focus is trapped and restored by the browser; Esc closes it). Cancel has
 * default focus so Enter never deletes by accident.
 */
export function DeleteDataButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="press flex min-h-12 items-center gap-2 self-start rounded-control border border-avoid/60 px-5 font-semibold text-avoid"
      >
        <Trash2 size={20} aria-hidden />
        احذف بياناتي
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="anim-pop m-auto w-[min(440px,calc(100vw-32px))] glass rounded-card p-6 text-fg backdrop:bg-ink/80"
      >
        <h2 id="delete-title" className="text-xl font-semibold">
          حذف بياناتك نهائياً؟
        </h2>
        <p className="mt-3 text-muted">سيُحذف ملفك الصحي، وكل فحوصاتك، والمنتجات المفضلة. لا يمكن التراجع عن هذا.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => deleteMyData())}
            className="press min-h-12 rounded-control bg-avoid px-5 font-semibold text-ink disabled:opacity-60"
          >
            {pending ? "جارٍ الحذف…" : "احذف الملف والفحوصات"}
          </button>
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className="press min-h-12 glass rounded-full px-5 font-semibold">
            إلغاء
          </button>
        </div>
      </dialog>
    </>
  );
}
