import { NavLink, Outlet } from "react-router-dom";
import { Boxes, LayoutDashboard, PlusSquare } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/utils/cn";

const mobileLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/items", label: "Items", icon: Boxes },
  { to: "/add-warranty", label: "Add", icon: PlusSquare },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--theme-glow-one),_transparent_25%),radial-gradient(circle_at_bottom_left,_var(--theme-glow-two),_transparent_20%)]" />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />
          <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <nav className="fixed bottom-4 left-4 right-4 z-30 grid grid-cols-3 gap-2 rounded-[24px] border border-white/10 bg-slate-950/80 p-2 shadow-glass backdrop-blur-xl lg:hidden">
        {mobileLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium text-slate-400 transition",
                isActive && "bg-white/10 text-white ring-1 ring-inset ring-white/10",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
