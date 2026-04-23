import { ShieldCheck, Sparkles } from "lucide-react";
import { appConfig } from "@/config/appConfig";

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(110,231,249,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.2),_transparent_24%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-glass backdrop-blur-xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Product coverage, all in one place
          </div>
          <h1 className="mt-8 max-w-lg text-5xl font-extrabold leading-tight">
            Track warranties with a calmer, smarter dashboard.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-300">
            Keep purchase dates, expiry reminders, notes, and proof-of-purchase files organized in a
            secure glassmorphism workspace.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "JWT session handling",
              "Protected dashboard routes",
              "Quick warranty insights",
              "Elegant mobile-first layout",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200"
              >
                <Sparkles className="mb-3 h-4 w-4 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-glass backdrop-blur-xl sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand">
            {appConfig.appName}
          </p>
          <h2 className="mt-4 text-3xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
