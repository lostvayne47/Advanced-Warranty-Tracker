import { useEffect } from "react";
import { cssVariables } from "@/config/theme";

export function useLocalTheme() {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.classList.add("dark");
  }, []);
}
