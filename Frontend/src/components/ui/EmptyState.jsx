import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export function EmptyState() {
  return (
    <GlassCard className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="rounded-full bg-brand/10 p-4 text-brand">
        <PlusCircle className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">No warranties yet</h3>
        <p className="mt-2 max-w-md text-sm text-slate-300">
          Start building your tracker by adding your first product warranty and never miss an
          expiry date again.
        </p>
      </div>
      <Link to="/add-warranty">
        <Button>Add warranty</Button>
      </Link>
    </GlassCard>
  );
}
