import { Platform } from 'react-native';

/**
 * Per-platform localhost fallback used only when EXPO_PUBLIC_API_BASE_URL
 * isn't set — lets simulator/emulator development work with zero config.
 * Android's emulator can't reach the host machine via "localhost"; it must
 * use the special alias 10.0.2.2 instead.
 */
const DEV_FALLBACK_HOST = Platform.select({
  android: 'http://10.0.2.2:8081',
  default: 'http://localhost:8081',
});

/**
 * Resolves the backend's base URL (including the shared /api prefix).
 *
 * Set EXPO_PUBLIC_API_BASE_URL (e.g. in a .env file, see .env.example) to
 * point at a physical device's reachable LAN IP or a deployed backend —
 * Expo inlines EXPO_PUBLIC_* variables at build time, no extra tooling
 * needed. Falls back to the platform-appropriate localhost otherwise.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  const base = configured && configured.trim().length > 0 ? configured.trim() : DEV_FALLBACK_HOST;

  return `${base.replace(/\/+$/, '')}/api`;
}

/**
 * Turns a backend-relative "/uploads/..." path (see FileStorageService,
 * which serves them outside the /api prefix via WebConfig's resource
 * handler) into an absolute URL an <Image> can load.
 */
export function resolveUploadUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const base = getApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${relativePath}`;
}
