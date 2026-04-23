import { LayoutDashboard, PlusSquare, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { appConfig } from "@/config/appConfig";
import { cn } from "@/utils/cn";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add-warranty", label: "Add Warranty", icon: PlusSquare },
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 flex-col border-r border-white/10 bg-white/5 px-6 py-8 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-accent p-3 text-slate-950 shadow-glow">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-white">{appConfig.appName}</p>
          <p className="text-sm text-slate-400">Coverage control center</p>
        </div>
      </div>

      <nav className="mt-10 space-y-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                isActive && "bg-white/10 text-white ring-1 ring-inset ring-white/10",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
