/**
 * HERGÉ Agency - Spacing & Typography System
 */

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem", // 48px
  "4xl": "3.5rem", // 56px
};

export const typography = {
  heading: {
    h1: {
      size: "2.5rem",
      weight: 700,
      lineHeight: 1.2,
    },
    h2: {
      size: "2rem",
      weight: 700,
      lineHeight: 1.3,
    },
    h3: {
      size: "1.5rem",
      weight: 600,
      lineHeight: 1.4,
    },
    h4: {
      size: "1.25rem",
      weight: 600,
      lineHeight: 1.4,
    },
  },

  body: {
    large: {
      size: "1rem",
      weight: 500,
      lineHeight: 1.5,
    },
    normal: {
      size: "0.95rem",
      weight: 400,
      lineHeight: 1.5,
    },
    small: {
      size: "0.875rem",
      weight: 400,
      lineHeight: 1.5,
    },
    tiny: {
      size: "0.75rem",
      weight: 500,
      lineHeight: 1.4,
    },
  },

  label: {
    size: "0.875rem",
    weight: 600,
    lineHeight: 1.4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
};

export const borderRadius = {
  none: "0",
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

export const transitions = {
  fast: "150ms ease-in-out",
  base: "200ms ease-in-out",
  slow: "300ms ease-in-out",
};
