/** The creator screen a tapped notification should open, or null when it should just open the app. */
export function creatorScreenForNotification(data: Record<string, unknown> | null | undefined): 'rejected-applications' | 'dashboard' | null {
  switch (data?.type) {
    case 'application-rejected':
      return 'rejected-applications';
    // An accepted application is booked from the dashboard's Upcoming Booking tab.
    case 'application-approved':
      return 'dashboard';
    default:
      return null;
  }
}
