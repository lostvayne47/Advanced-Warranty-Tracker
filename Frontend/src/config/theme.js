export const themeConfig = {
  colors: {
    brand: {
      DEFAULT: "var(--color-brand, #6ee7f9)",
      deep: "var(--color-brand-deep, #0ea5e9)",
      soft: "var(--color-brand-soft, #67e8f9)",
    },
    accent: {
      DEFAULT: "var(--color-accent, #a78bfa)",
      soft: "var(--color-accent-soft, #c4b5fd)",
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

export const colorThemes = [
  {
    id: "aurora",
    label: "Aurora",
    variables: {
      "--color-brand": "#6ee7f9",
      "--color-brand-deep": "#0ea5e9",
      "--color-brand-soft": "#67e8f9",
      "--color-accent": "#a78bfa",
      "--color-accent-soft": "#c4b5fd",
      "--color-surface": "rgba(15, 23, 42, 0.72)",
      "--color-stroke": "rgba(148, 163, 184, 0.18)",
      "--theme-glow-one": "rgba(14, 165, 233, 0.16)",
      "--theme-glow-two": "rgba(167, 139, 250, 0.13)",
    },
  },
  {
    id: "ember",
    label: "Ember",
    variables: {
      "--color-brand": "#fb7185",
      "--color-brand-deep": "#e11d48",
      "--color-brand-soft": "#fda4af",
      "--color-accent": "#fbbf24",
      "--color-accent-soft": "#fde68a",
      "--color-surface": "rgba(24, 18, 28, 0.72)",
      "--color-stroke": "rgba(251, 191, 36, 0.18)",
      "--theme-glow-one": "rgba(244, 63, 94, 0.16)",
      "--theme-glow-two": "rgba(251, 191, 36, 0.12)",
    },
  },
  {
    id: "pink",
    label: "Pink",
    variables: {
      "--color-brand": "#f9a8d4",
      "--color-brand-deep": "#db2777",
      "--color-brand-soft": "#fbcfe8",
      "--color-accent": "#c084fc",
      "--color-accent-soft": "#e9d5ff",
      "--color-surface": "rgba(28, 16, 30, 0.72)",
      "--color-stroke": "rgba(249, 168, 212, 0.18)",
      "--theme-glow-one": "rgba(219, 39, 119, 0.16)",
      "--theme-glow-two": "rgba(192, 132, 252, 0.12)",
    },
  },
];

export const defaultThemeId = colorThemes[0].id;
