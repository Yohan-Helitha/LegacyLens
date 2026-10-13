import { resolveImageUrl } from '../../constants/api';

/**
 * Colours for the shared messaging screens — the same "Monsoon Coast" palette
 * the creator screens use, kept in one place so InApp and InboxMessage (and
 * any side that embeds them) stay identical.
 */
export const MessagingColors = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer:       '#e8f2f2',
  surfaceVariant:         '#c8dcdc',
  outlineVariant:         '#a0c4c4',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
  outline:          '#718096',
  danger:           '#C0392B',
} as const;

/** Profile photos come back as "/uploads/..." paths or full URLs — turns either into something <Image> can load. */
export function messagingAvatarUri(avatarUrl: string | null | undefined): string | null {
  return resolveImageUrl(avatarUrl);
}
