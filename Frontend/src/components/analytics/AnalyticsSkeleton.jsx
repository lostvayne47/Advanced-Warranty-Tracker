export function AnalyticsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="h-5 w-40 rounded-full bg-white/10" />
        <div className="mt-6 h-72 rounded-[24px] bg-white/10" />
      </div>
      <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="h-5 w-36 rounded-full bg-white/10" />
        <div className="mt-6 h-72 rounded-[24px] bg-white/10" />
      </div>
    </div>
  );
}
