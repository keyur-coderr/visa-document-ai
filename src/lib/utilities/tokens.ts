/**
 * Shared design tokens for the Phase 1 UI foundation.
 *
 * These mirror (and document) values already expressed in tailwind.config.ts
 * so non-Tailwind contexts (inline styles, chart placeholders, future
 * design-system docs) have a single source to read from. Prefer Tailwind
 * utility classes in components; reach for these constants only when a
 * literal value is required (e.g. computing a chart height).
 */

/** 4px base spacing scale, in pixels. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl2: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Font sizes (px) and weights used across the app shell. */
export const typography = {
  family: {
    sans: "Inter, system-ui, sans-serif",
  },
  fontSize: {
    caption: 12,
    small: 13,
    body: 14,
    h4: 18,
    h3: 20,
    h2: 24,
    h1: 30,
    display: 40,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/** Matches tailwind.config.ts `theme.extend.colors`. */
export const colorTokens = {
  background: "#f8fafc",
  surface: "#ffffff",
  primary: "#2563eb",
  accent: "#7c3aed",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  border: "#e2e8f0",
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
} as const;

export const shadows = {
  xs: "0 1px 2px rgb(15 23 42 / 0.06)",
  sm: "0 2px 6px rgb(15 23 42 / 0.08)",
  md: "0 10px 28px rgb(15 23 42 / 0.12)",
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 320,
} as const;

export const layout = {
  contentMax: 1200,
  narrowMax: 960,
} as const;

/** Matches tailwind.config.ts `theme.extend.screens` plus Tailwind defaults. */
export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;
