import { GlassCard } from "@/components/ui/GlassCard";

export function ExpirationTrendChart({ data }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
      const y = 88 - (item.count / max) * 70;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <GlassCard className="animate-fadeUp">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Next 6 Months</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Upcoming expiration trend</h3>
      </div>

      <div className="mt-8 h-72">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[18, 36, 54, 72, 90].map((line) => (
            <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="rgba(255,255,255,0.08)" />
          ))}
          <polygon points={`0,100 ${points} 100,100`} fill="url(#trendFill)" />
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-brand)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((item, index) => {
            const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
            const y = 88 - (item.count / max) * 70;

            return (
              <circle
                key={item.key}
                cx={x}
                cy={y}
                r="1.9"
                fill="var(--color-accent)"
                stroke="#020617"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {data.map((item) => (
          <div key={item.key} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{item.count}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
