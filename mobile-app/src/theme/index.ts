/**
 * LegacyLens Mobile — Theme
 * Re-exports the shared Monsoon Coast tokens as a React Native–ready object.
 *
 * Usage:
 *   import { Colors, Typography, Spacing, Radii } from 'src/theme';
 */

// ── Colour palette ────────────────────────────────────────────────────────────
export const Colors = {
  /** 60 % dominant — Indian Ocean mist, screen background */
  dominant: '#EDEFEE',
  /** 30 % secondary — Monsoon cloud teal, primary brand colour */
  secondary: '#0F5C5C',
  /** 10 % accent — Mango orange, CTAs & highlights */
  accent: '#E8792E',
  /** Near-black body text */
  text: '#202426',
  /** Muted body copy on dominant background */
  textMuted: '#6B7178',
  /** Slightly darker surface for cards */
  surface: '#E4E7E6',
  /** Deep teal for inverted / dark sections */
  secondaryDark: '#0A3D3D',
  /** Teal at 20 % opacity */
  secondarySubtle: 'rgba(15, 92, 92, 0.20)',
  /** Mango at 20 % opacity — glows / shadows */
  accentSubtle: 'rgba(232, 121, 46, 0.20)',
  /** Pure white */
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;

// ── Typography ────────────────────────────────────────────────────────────────
export const Typography = {
  fontDisplay: 'Literata_700Bold',
  fontBody:    'WorkSans_400Regular',
  fontBodyMed: 'WorkSans_500Medium',
  fontBodySemi: 'WorkSans_600SemiBold',

  sizeXS:   12,
  sizeSM:   14,
  sizeMD:   16,
  sizeLG:   18,
  sizeXL:   24,
  size2XL:  32,
  size3XL:  40,
  size4XL:  48,

  lineHeightBody:   24,
  lineHeightTitle:  1.15, // multiplier
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
  xxl: 64,
} as const;

// ── Border radii ──────────────────────────────────────────────────────────────
export const Radii = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   20,
  full: 9999,
} as const;
