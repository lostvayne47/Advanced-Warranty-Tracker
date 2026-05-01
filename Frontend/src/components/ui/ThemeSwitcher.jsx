import { Palette } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

export function ThemeSwitcher() {
  const { themeId, themes, setThemeId } = useTheme();

  return (
    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2 md:flex">
      <Palette className="h-4 w-4 text-slate-400" />
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          title={`${theme.label} theme`}
          aria-label={`${theme.label} theme`}
          onClick={() => setThemeId(theme.id)}
          className={cn(
            "h-6 w-6 rounded-full border border-white/20 transition duration-200 hover:scale-110",
            themeId === theme.id && "ring-2 ring-brand ring-offset-2 ring-offset-slate-950",
          )}
          style={{
            background: `linear-gradient(135deg, ${theme.variables["--color-brand"]}, ${theme.variables["--color-accent"]})`,
          }}
        />
      ))}
    </div>
  );
}
