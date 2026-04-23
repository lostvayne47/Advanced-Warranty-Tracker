import { cn } from "@/utils/cn";

export function Input({ className, error, label, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand/60 focus:bg-white/10",
          error && "border-rose-400/70 focus:border-rose-400/70",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </label>
  );
}
