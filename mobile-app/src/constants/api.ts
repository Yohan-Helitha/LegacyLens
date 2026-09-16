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
 * Returns the base host URL without the '/api' suffix (e.g. 'http://192.168.1.2:8081').
 */
export function getHostBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  const base = configured && configured.trim().length > 0 ? configured.trim() : DEV_FALLBACK_HOST;
  return base.replace(/\/+$/, '');
}

/**
 * Safely resolves a media URL.
 * - If url is already an absolute HTTP/HTTPS URL, return as-is.
 * - If url is a relative path or local filename (e.g. 'stories/xxx.mp4'),
 *   since local files don't exist on the client device filesystem and cause
 *   AVFoundationErrorDomain Code -11800 (Code -17913), fallback to a reliable
 *   sample video stream.
 */
export function resolveMediaUrl(
  url?: string | null,
  fallbackUri: string = 'https://www.w3schools.com/html/mov_bbb.mp4'
): string {
  if (!url || typeof url !== 'string') {
    return fallbackUri;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return fallbackUri;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If the path is relative or starts with file:///, it cannot be fetched
  // directly by AVPlayer in iOS Expo unless bundled or valid http.
  // We check if it's a backend endpoint vs an unresolvable mock path like 'stories/...'
  const cleanPath = trimmed.replace(/^file:\/\//i, '').replace(/^\/+/, '');
  if (!cleanPath) {
    return fallbackUri;
  }

  // If it's a relative path pointing to mock/demo stories on disk, fallback to sample video
  if (cleanPath.startsWith('stories/') || cleanPath.endsWith('.mp4')) {
    // When backend has an actual streaming endpoint we could prefix it,
    // but for now stories/*.mp4 do not exist on the device or server, so use fallbackUri
    return fallbackUri;
  }

  const host = getHostBaseUrl();
  return `${host}/${cleanPath}`;
}
