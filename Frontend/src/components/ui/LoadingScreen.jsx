export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="space-y-5 text-center">
        <div className="mx-auto h-14 w-14 animate-pulseSoft rounded-3xl bg-gradient-to-br from-brand to-accent shadow-glow" />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">Loading your workspace</p>
          <p className="text-sm text-slate-400">Preparing your warranties and account session.</p>
        </div>
      </div>
    </div>
  );
}
