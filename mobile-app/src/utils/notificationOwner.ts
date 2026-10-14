/**
 * Whether a notification is for the person signed in on this phone. The server stamps each one with
 * the id of the user it is meant for; one without a stamp is treated as not safe to show. Nobody
 * signed in means nobody should see it.
 */
export function isForUser(data: Record<string, unknown> | null | undefined, signedInUserId: string | null | undefined): boolean {
  const recipient = data?.recipientId;
  if (typeof recipient !== 'string' || !signedInUserId) return false;
  return recipient === signedInUserId;
}
