import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/utils/cn";

const colorByTone = {
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#fb7185",
};

export function StatusDonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let progress = 0;
  const gradientStops =
    total === 0
      ? "rgba(255,255,255,0.1) 0 100%"
      : data
          .filter((item) => item.value > 0)
          .map((item) => {
            const start = progress;
            progress += (item.value / total) * 100;
            return `${colorByTone[item.tone]} ${start}% ${progress}%`;
          })
          .join(", ");

  return (
    <GlassCard className="animate-fadeUp">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Coverage Health</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Status distribution</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {total} items
        </span>
      </div>

      <div className="mt-8 grid items-center gap-8 sm:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-52 w-52">
          <div
            className="h-full w-full rounded-full transition duration-500"
            style={{ background: `conic-gradient(${gradientStops})` }}
          />
          <div className="absolute inset-7 rounded-full border border-white/10 bg-slate-950/80 backdrop-blur-xl" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{total}</span>
            <span className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Tracked</span>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item) => {
            const width = total === 0 ? 0 : Math.round((item.value / total) * 100);

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        item.tone === "success" && "bg-emerald-400",
                        item.tone === "warning" && "bg-amber-300",
                        item.tone === "danger" && "bg-rose-400",
                      )}
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-700",
                      item.tone === "success" && "bg-emerald-400",
                      item.tone === "warning" && "bg-amber-300",
                      item.tone === "danger" && "bg-rose-400",
                    )}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
