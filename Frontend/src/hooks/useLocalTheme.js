import { useEffect, useState } from "react";
import { colorThemes, defaultThemeId } from "@/config/theme";

const storageKey = "warranty-tracker-theme";

function getTheme(themeId) {
  if (themeId === "mint") {
    return getTheme("pink");
  }

  return colorThemes.find((theme) => theme.id === themeId) || colorThemes[0];
}

function applyTheme(themeId) {
  const root = document.documentElement;
  const theme = getTheme(themeId);

  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.classList.add("dark");
  root.dataset.theme = theme.id;
}

export function useLocalTheme() {
  const [themeId, setThemeId] = useState(() => {
    const storedThemeId = localStorage.getItem(storageKey);
    return storedThemeId === "mint" ? "pink" : storedThemeId || defaultThemeId;
  });

  useEffect(() => {
    applyTheme(themeId);
    localStorage.setItem(storageKey, themeId);
  }, [themeId]);

  return {
    themeId,
    themes: colorThemes,
    setThemeId,
  };
}
