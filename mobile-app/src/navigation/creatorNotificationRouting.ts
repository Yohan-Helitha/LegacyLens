/** The creator screen a tapped notification should open, or null when it should just open the app. */
export function creatorScreenForNotification(data: Record<string, unknown> | null | undefined): 'rejected-applications' | 'saved-applications' | null {
  switch (data?.type) {
    case 'application-rejected':
      return 'rejected-applications';
    // An approved application is listed at the top of My Applications, with a way on to booking.
    case 'application-approved':
      return 'saved-applications';
    default:
      return null;
  }
}
