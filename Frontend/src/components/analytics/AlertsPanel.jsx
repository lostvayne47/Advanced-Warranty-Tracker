import { AlertTriangle, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/date";

export function AlertsPanel({ alerts }) {
  return (
    <GlassCard className="animate-fadeUp">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Priority Alerts</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Needs attention</h3>
        </div>
        <div className="rounded-full bg-amber-300/15 p-3 text-amber-200">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            No warranties expire in the next 30 days.
          </div>
        ) : (
          alerts.map((warranty) => (
            <Link
              key={warranty.id}
              to="/items"
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{warranty.productName}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                  <CalendarClock className="h-4 w-4" />
                  {formatDate(warranty.expiryDate)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge tone={warranty.status.tone}>{warranty.remainingDays}d</StatusBadge>
              </div>
            </Link>
          ))
        )}
      </div>
    </GlassCard>
  );
}
