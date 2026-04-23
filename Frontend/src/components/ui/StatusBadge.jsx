import { cn } from "@/utils/cn";

const tones = {
  success: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/20",
  warning: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/20",
  danger: "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20",
};

export function StatusBadge({ tone = "success", children }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
