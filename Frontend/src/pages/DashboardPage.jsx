import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Plus, ShieldCheck } from "lucide-react";
import { WarrantyCard } from "@/components/WarrantyCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { WarrantySkeleton } from "@/components/ui/WarrantySkeleton";
import { fetchWarranties } from "@/services/warrantyService";

export function DashboardPage() {
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadWarranties() {
      try {
        const data = await fetchWarranties();
        if (!ignore) {
          setWarranties(data);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error.response?.data?.message || "Unable to load warranties.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadWarranties();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <GlassCard className="overflow-hidden p-0">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand">
              <ShieldCheck className="h-4 w-4" />
              Warranty Overview
            </div>
            <h2 className="mt-5 text-3xl font-bold text-white">Keep every warranty within reach.</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Monitor active coverage, quickly spot upcoming expirations, and attach proof of
              purchase files without breaking your workflow.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-5">
            <p className="text-sm text-slate-400">Tracked warranties</p>
            <p className="mt-3 text-5xl font-bold text-white">{warranties.length}</p>
            <p className="mt-3 text-sm text-slate-400">Stay ahead of renewals with one clean dashboard.</p>
            <Link to="/add-warranty" className="mt-6 inline-flex">
              <Button>
                <Plus className="h-4 w-4" />
                Add new
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <WarrantySkeleton key={index} />
          ))}
        </div>
      ) : warranties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {warranties.map((warranty) => (
            <WarrantyCard key={warranty.id} warranty={warranty} />
          ))}
        </div>
      )}
    </div>
  );
}
