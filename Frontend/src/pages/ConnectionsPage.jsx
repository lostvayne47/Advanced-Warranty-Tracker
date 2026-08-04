import toast from "react-hot-toast";
import { Mailbox, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { appConfig } from "@/config/appConfig";
import { beginGmailConnection } from "@/services/authService";

export function ConnectionsPage() {
  function handleConnect() {
    try {
      beginGmailConnection();
    } catch (error) {
      toast.error(error.message);
    }
  }

  const isBackendConnected = Boolean(appConfig.apiBaseUrl);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand">Connected accounts</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Gmail invoice import</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Connect Gmail only if you want to select invoice attachments from your mailbox.
        </p>
      </div>

      <GlassCard className="animate-fadeUp">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-brand/10 p-3 text-brand">
              <Mailbox className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Gmail</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                Grant read-only access, choose an invoice email, and review extracted details before anything is saved.
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-brand" />
                Your mailbox is never scanned or saved automatically.
              </p>
            </div>
          </div>
          <Button type="button" onClick={handleConnect}>
            Connect Gmail
          </Button>
        </div>
        {!isBackendConnected ? (
          <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Demo mode: configure VITE_API_URL after Spring Boot is available to enable Google OAuth.
          </p>
        ) : null}
      </GlassCard>
    </div>
  );
}
