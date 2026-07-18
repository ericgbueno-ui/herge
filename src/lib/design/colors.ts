/**
 * HERGÉ Agency - Color System & Design Tokens
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: "#F4A460", // Sandy Brown (laranja quente - HERGÉ)
    secondary: "#6366F1", // Indigo (azul profissional)
    accent: "#EC4899", // Pink (destaque)
  },

  // Semantic Colors
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    900: "#166534",
  },

  info: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    900: "#082F49",
  },

  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    500: "#EAB308",
    600: "#CA8A04",
    700: "#A16207",
    900: "#713F12",
  },

  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    900: "#7F1D1D",
  },

  // Neutrals - Dark Mode
  neutral: {
    0: "#FFFFFF",
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },

  // Dark Mode Palette
  dark: {
    bg: {
      primary: "#0F172A", // Very dark blue
      secondary: "#1E293B", // Dark slate
      tertiary: "#334155", // Medium slate
      hover: "#475569", // Light slate
    },
    text: {
      primary: "#F1F5F9", // Slate 100
      secondary: "#CBD5E1", // Slate 300
      tertiary: "#94A3B8", // Slate 400
    },
    border: "#334155", // Slate 700
  },

  // Charts & Data Viz
  charts: {
    series: [
      "#F4A460", // Orange (brand)
      "#6366F1", // Indigo
      "#EC4899", // Pink
      "#10B981", // Green
      "#F59E0B", // Amber
      "#8B5CF6", // Purple
      "#EF4444", // Red
      "#14B8A6", // Teal
    ],
  },
};

export type Colors = typeof colors;
