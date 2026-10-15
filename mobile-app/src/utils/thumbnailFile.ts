const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
};

/** True for a picture that's already on the server (an https URL), as opposed to one picked from the phone this session. */
export function isRemoteUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

/**
 * Describes a picked image file the way React Native's FormData expects it ({uri, name, type}). The picker gives
 * a bare file URI, so the type is worked out from the extension (JPEG when it can't be told).
 */
export function thumbnailFileFromUri(uri: string): { uri: string; name: string; type: string } {
  const cleanPath = uri.split('?')[0];
  const extension = (cleanPath.split('.').pop() ?? '').toLowerCase();
  const known = MIME_BY_EXTENSION[extension];
  return {
    uri,
    name: `thumbnail.${known ? extension : 'jpg'}`,
    type: known ?? 'image/jpeg',
  };
}
