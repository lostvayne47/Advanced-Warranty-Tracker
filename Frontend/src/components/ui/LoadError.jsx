import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export function LoadError({ message, onRetry }) {
  return (
    <GlassCard className="space-y-4">
      <p role="alert" className="text-sm text-rose-200">{message}</p>
      <Button type="button" variant="secondary" onClick={onRetry}>Try again</Button>
    </GlassCard>
  );
}

