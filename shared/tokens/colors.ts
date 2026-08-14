/**
 * LegacyLens — Monsoon Coast Design Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the brand palette.
 *
 * Usage (React Native / Expo):
 *   import { MonsoonCoast } from '../../shared/tokens/colors';
 *   const styles = StyleSheet.create({ container: { backgroundColor: MonsoonCoast.dominant } });
 *
 * Usage (TypeScript / Web):
 *   import { MonsoonCoast } from '@/shared/tokens/colors';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Palette role   Hex       Weight   Semantic name
 * Dominant       #EDEFEE   60 %     background, surface
 * Secondary      #0F5C5C   30 %     primary actions, headings, brand teal
 * Accent         #E8792E   10 %     CTA, highlights, mango orange
 * Text/Neutral   #202426   —        body text, dark neutrals
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MonsoonCoast = {
  // ── Core palette ────────────────────────────────────────────────────────────
  /** 60 % dominant — Indian Ocean mist, page/screen background */
  dominant: '#EDEFEE',

  /** 30 % secondary — Deep teal, primary brand colour */
  secondary: '#0F5C5C',

  /** 10 % accent — Mango orange, call-to-action & highlights */
  accent: '#E8792E',

  /** Neutral — Near-black for body text */
  text: '#202426',

  // ── Derived / utility shades ─────────────────────────────────────────────────
  /** Slightly darker dominant for card/container surfaces */
  surface: '#E4E7E6',

  /** Muted body copy — secondary text on dominant background */
  textMuted: '#6B7178',

  /** Teal at reduced opacity — disabled states, borders */
  secondarySubtle: '#0F5C5C33', // 20 % opacity teal

  /** Accent at reduced opacity — glow / shadow effects */
  accentSubtle: '#E8792E33', // 20 % opacity mango

  /** Pure white — for cards, modals, overlays */
  white: '#FFFFFF',

  /** Deep teal surface — for inverted/dark sections */
  secondaryDark: '#0A3D3D',
} as const;

/** Convenience re-export as flat named colours */
export const Colors = MonsoonCoast;

/** CSS variable names — mirrors colors.css */
export const CSSVars = {
  dominant: 'var(--color-dominant)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  text: 'var(--color-text)',
  surface: 'var(--color-surface)',
  textMuted: 'var(--color-text-muted)',
  secondarySubtle: 'var(--color-secondary-subtle)',
  accentSubtle: 'var(--color-accent-subtle)',
  white: 'var(--color-white)',
  secondaryDark: 'var(--color-secondary-dark)',
} as const;

export type MonsoonCoastKey = keyof typeof MonsoonCoast;
