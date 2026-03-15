// Color tokens — blue, black, white palette only.
// Use these in components to stay consistent.
// Dark-mode variants live in globals.css as CSS custom properties.

export const colors = {
  blue: {
    DEFAULT: "#2563EB",
    hover:   "#1D4ED8",
    light:   "#EFF6FF",
    border:  "#BFDBFE",
  },
  black:   "#0A0A0A",
  white:   "#FFFFFF",
  text: {
    primary:   "#0A0A0A",
    secondary: "#6B7280",
    muted:     "#9CA3AF",
    inverse:   "#FFFFFF",
  },
  border: {
    DEFAULT: "#E5E7EB",
    strong:  "#D1D5DB",
  },
  surface: {
    DEFAULT: "#FFFFFF",
    subtle:  "#F9FAFB",
  },
} as const;

