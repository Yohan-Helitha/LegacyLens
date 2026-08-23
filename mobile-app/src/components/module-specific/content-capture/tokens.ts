/**
 * LegacyLens Mobile — Content Capture module tokens
 * Shared colour palette for the elder-facing content-capture flow
 * (dashboard, method selection, recording), mapped from the module's
 * Tailwind/M3 design source.
 *
 * Usage:
 *   import { ContentCaptureColors } from '../../components/module-specific/content-capture';
 */
export const ContentCaptureColors = {
  surface:                '#f7fafc',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f1f4f6',
  surfaceContainer:       '#ebeef1',
  surfaceVariant:         '#e0e3e5',
  outlineVariant:         '#bfc8c8',
  outline:                '#6f7978',

  primary:            '#004343',
  primaryContainer:   '#0f5c5c',
  onPrimary:          '#ffffff',
  onPrimaryContainer: '#90d2d1',

  secondary:            '#9b4600',
  secondaryContainer:   '#fe893e',
  onSecondaryContainer: '#672c00',

  onSurface:        '#181c1e',
  onSurfaceVariant: '#3f4948',
} as const;

export default ContentCaptureColors;
