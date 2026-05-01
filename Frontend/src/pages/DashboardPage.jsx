import { Link } from "react-router-dom";
import { ArrowRight, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { AlertsPanel } from "@/components/analytics/AlertsPanel";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";
import { ExpirationTrendChart } from "@/components/analytics/ExpirationTrendChart";
import { StatusDonutChart } from "@/components/analytics/StatusDonutChart";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWarranties } from "@/hooks/useWarranties";
import { getWarrantyAnalytics } from "@/utils/warrantyAnalytics";

export function DashboardPage() {
  const { warranties, isLoading } = useWarranties();
  const analytics = getWarrantyAnalytics(warranties);

  return (
    <div className="space-y-6">
      <GlassCard className="overflow-hidden p-0">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand">
              <ShieldCheck className="h-4 w-4" />
              Warranty Analytics
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-bold text-white sm:text-4xl">
              Coverage intelligence for every product you own.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Track warranty health, spot upcoming expirations, and jump into the full inventory
              when you need item-level details.
            </p>
          </div>

          <div className="grid min-w-72 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/add-warranty">
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                Add warranty
              </Button>
            </Link>
            <Link to="/items">
              <Button variant="secondary" className="w-full">
                View all items
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : warranties.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <StatusDonutChart data={analytics.statusCounts} />
            <AlertsPanel alerts={analytics.alerts} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <ExpirationTrendChart data={analytics.upcomingExpirations} />
            <GlassCard className="animate-fadeUp">
              <div className="rounded-full bg-brand/10 p-3 text-brand">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="mt-6 text-sm uppercase tracking-[0.22em] text-slate-400">
                Total Warranty Items
              </p>
              <p className="mt-3 text-7xl font-bold text-white">{analytics.total}</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {analytics.alerts.length > 0
                  ? `${analytics.alerts.length} warranties expire within 30 days.`
                  : "No urgent expirations in the next 30 days."}
              </p>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
