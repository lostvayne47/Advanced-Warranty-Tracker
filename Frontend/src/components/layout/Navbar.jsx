import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm text-slate-400">Welcome back</p>
          <h1 className="text-lg font-semibold text-white">{user?.name || "Warranty Manager"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 md:flex">
            <Search className="h-4 w-4" />
            Search coming soon
          </div>
          <ThemeSwitcher />
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
