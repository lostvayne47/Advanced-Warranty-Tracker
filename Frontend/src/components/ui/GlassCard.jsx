import { cn } from "@/utils/cn";

export function GlassCard({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-glass backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
