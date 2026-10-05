import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, busy = false, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy || undefined}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-slate-900 p-6 text-white shadow-2xl backdrop:bg-slate-950/80"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close dialog"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50">
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
