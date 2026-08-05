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
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Font sizes (px) and weights used across the app shell. */
export const typography = {
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
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
  brand: "brand",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  neutral: "neutral",
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
