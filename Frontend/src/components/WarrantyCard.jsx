import { FileText } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, getWarrantyStatus, daysUntil } from "@/utils/date";

export function WarrantyCard({ warranty }) {
  const status = getWarrantyStatus(warranty.expiryDate);

  return (
    <GlassCard className="animate-fadeUp">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{warranty.productName}</h3>
          <p className="mt-2 text-sm text-slate-400">{warranty.notes || "No notes added yet."}</p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Purchase Date</p>
          <p className="mt-2 text-sm font-medium text-slate-100">{formatDate(warranty.purchaseDate)}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expiry Date</p>
          <p className="mt-2 text-sm font-medium text-slate-100">{formatDate(warranty.expiryDate)}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{daysUntil(warranty.expiryDate)} days remaining</p>
        {warranty.fileName ? (
          <span className="inline-flex items-center gap-2 text-sm text-brand">
            <FileText className="h-4 w-4" />
            {warranty.fileName}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
