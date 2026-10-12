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
  return `${getApiOrigin()}/api`;
}

/** Same host as getApiBaseUrl(), without the /api prefix — static assets like /uploads/** live here. */
export function getApiOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  const base = configured && configured.trim().length > 0 ? configured.trim() : DEV_FALLBACK_HOST;

  return base.replace(/\/+$/, '');
}

/** True for a path the backend already returned as a full URL (e.g. Supabase Storage), never one to prefix with our own host. */
function isAbsoluteUrl(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

/**
 * Resolves a media path into a full playable URL. Most paths are still
 * root-relative ("/uploads/stories/xxx.m4a", see FileStorageService), but
 * some content (see STORAGE_PROVIDER) is stored externally and the backend
 * already returns a complete URL for it — passed through unchanged rather
 * than mangled by prefixing our own API host onto it.
 */
export function getMediaUrl(relativePath: string): string {
  if (isAbsoluteUrl(relativePath)) return relativePath;
  return `${getApiOrigin()}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}

/**
 * Turns a backend-relative "/uploads/..." path (see FileStorageService,
 * which serves them outside the /api prefix via WebConfig's resource
 * handler) into an absolute URL an <Image> can load. Same external-URL
 * pass-through as getMediaUrl — see its doc comment.
 */
export function resolveUploadUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  if (isAbsoluteUrl(relativePath)) return relativePath;
  const base = getApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${relativePath}`;
}
