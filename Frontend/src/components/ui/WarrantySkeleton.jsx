export function WarrantySkeleton() {
  return (
    <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="mb-4 h-5 w-1/2 rounded-full bg-white/10" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded-full bg-white/10" />
        <div className="h-4 w-4/5 rounded-full bg-white/10" />
        <div className="h-10 w-1/3 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
