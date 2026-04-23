export const themeConfig = {
  colors: {
    brand: {
      DEFAULT: "#6ee7f9",
      deep: "#0ea5e9",
      soft: "#67e8f9",
    },
    accent: {
      DEFAULT: "#a78bfa",
      soft: "#c4b5fd",
    },
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#fb7185",
    surface: {
      900: "#020617",
      800: "#0f172a",
      700: "#162033",
      600: "#1e293b",
      glass: "rgba(15, 23, 42, 0.58)",
      panel: "rgba(15, 23, 42, 0.72)",
    },
    stroke: {
      DEFAULT: "rgba(148, 163, 184, 0.18)",
      strong: "rgba(148, 163, 184, 0.28)",
    },
  },
};

export const cssVariables = {
  "--color-brand": themeConfig.colors.brand.DEFAULT,
  "--color-brand-deep": themeConfig.colors.brand.deep,
  "--color-accent": themeConfig.colors.accent.DEFAULT,
  "--color-surface": themeConfig.colors.surface.panel,
  "--color-stroke": themeConfig.colors.stroke.DEFAULT,
};
