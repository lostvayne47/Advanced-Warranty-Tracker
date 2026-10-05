import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const variants = {
  primary:
    "bg-gradient-to-r from-brand-deep to-brand text-slate-950 shadow-glow hover:brightness-110",
  secondary:
    "bg-white/10 text-white ring-1 ring-inset ring-white/10 hover:bg-white/15",
  ghost: "bg-transparent text-slate-300 hover:bg-white/10",
  danger: "bg-rose-500/20 text-rose-200 ring-1 ring-inset ring-rose-400/30 hover:bg-rose-500/30",
};

export function Button({ children, className, variant = "primary", isLoading = false, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
