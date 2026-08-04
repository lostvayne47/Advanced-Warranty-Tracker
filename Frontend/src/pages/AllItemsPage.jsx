import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { WarrantyCard } from "@/components/WarrantyCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WarrantySkeleton } from "@/components/ui/WarrantySkeleton";
import { useWarranties } from "@/hooks/useWarranties";
import { cn } from "@/utils/cn";
import { daysUntil, formatDate, getWarrantyStatus } from "@/utils/date";

export function AllItemsPage() {
  const { warranties, isLoading } = useWarranties();
  const [query, setQuery] = useState("");

  const filteredWarranties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return warranties;
    }

    return warranties.filter((warranty) =>
      [
        warranty.productName,
        warranty.brand,
        warranty.category,
        warranty.modelNumber,
        warranty.serialNumber,
        warranty.warrantyProvider,
        warranty.retailerName,
        warranty.notes,
        warranty.fileName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, warranties]);

  return (
    <div className="space-y-6">
      <GlassCard className="animate-fadeUp">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand">Inventory</p>
            <h2 className="mt-3 text-3xl font-bold text-white">All warranty items</h2>
            <p className="mt-2 text-sm text-slate-300">
              Browse every saved warranty with the details you need at a glance.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-72 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition focus-within:border-brand/60 focus-within:bg-white/10">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search warranties"
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <Link to="/add-warranty">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add warranty
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <WarrantySkeleton key={index} />
          ))}
        </div>
      ) : warranties.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {filteredWarranties.length > 0 ? (
            <GlassCard className="hidden overflow-hidden p-0 xl:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Purchase</th>
                    <th className="px-6 py-4 font-semibold">Expiry</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Remaining</th>
                    <th className="px-6 py-4 font-semibold">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.map((warranty) => {
                    const status = getWarrantyStatus(warranty.expiryDate);
                    const remainingDays = daysUntil(warranty.expiryDate);

                    return (
                      <tr
                        key={warranty.id}
                        className="border-t border-white/10 transition duration-200 hover:bg-white/5"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-white">{warranty.productName}</p>
                          <p className="mt-1 max-w-md truncate text-slate-400">
                            {warranty.notes || warranty.fileName || "No notes added yet."}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-slate-300">{formatDate(warranty.purchaseDate)}</td>
                        <td className="px-6 py-5 text-slate-300">{formatDate(warranty.expiryDate)}</td>
                        <td className="px-6 py-5">
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </td>
                        <td
                          className={cn(
                            "px-6 py-5 font-medium",
                            remainingDays < 0 ? "text-rose-300" : "text-slate-200",
                          )}
                        >
                          {remainingDays < 0 ? `${Math.abs(remainingDays)} days ago` : `${remainingDays} days`}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link to={`/warranties/${warranty.id}/edit`} className="font-semibold text-brand hover:text-brand-light">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          ) : null}

          {filteredWarranties.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:hidden">
              {filteredWarranties.map((warranty) => (
                <WarrantyCard key={warranty.id} warranty={warranty} />
              ))}
            </div>
          ) : null}

          {filteredWarranties.length === 0 ? (
            <GlassCard className="py-10 text-center text-sm text-slate-300">
              No warranty items match your search.
            </GlassCard>
          ) : null}
        </>
      )}
    </div>
  );
}
