import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
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
          {warranty.brand || warranty.modelNumber ? (
            <p className="mt-1 text-sm text-brand">{[warranty.brand, warranty.modelNumber].filter(Boolean).join(" · ")}</p>
          ) : null}
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

      {warranty.invoiceImageUrl ? (
        <a
          href={warranty.invoiceImageUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block overflow-hidden rounded-xl border border-white/10 bg-slate-950/30"
        >
          <img
            src={warranty.invoiceImageUrl}
            alt={`Invoice for ${warranty.productName}`}
            className="h-40 w-full object-cover transition hover:scale-[1.02]"
          />
        </a>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{daysUntil(warranty.expiryDate)} days remaining</p>
        {warranty.fileName ? (
          <span className="inline-flex items-center gap-2 text-sm text-brand">
            <FileText className="h-4 w-4" />
            {warranty.fileName}
          </span>
        ) : null}
      </div>
      <Link to={`/warranties/${warranty.id}/edit`} className="mt-5 inline-block text-sm font-semibold text-brand">
        Edit warranty
      </Link>
    </GlassCard>
  );
}
