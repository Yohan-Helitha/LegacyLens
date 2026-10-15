/** The creator screen a tapped notification should open, or null when it should just open the app. */
export function creatorScreenForNotification(data: Record<string, unknown> | null | undefined): 'rejected-applications' | 'dashboard' | 'market' | 'rejected-work' | 'my-work' | 'pending' | 'inbox' | null {
  switch (data?.type) {
    // A new message opens the Inbox (or, when the notification says which chat, that chat - see the navigator).
    case 'new-message':
      return 'inbox';
    case 'application-rejected':
      return 'rejected-applications';
    // An approved application is booked from the dashboard's Upcoming Booking tab.
    case 'application-approved':
      return 'dashboard';
    // A reminder about today's scheduled work opens the dashboard, whose Today's Jobs lists it.
    case 'today-work':
      return 'dashboard';
    // An urgent opportunity alert opens the opportunities, where it sits in the Urgent section.
    case 'urgent-opportunity':
      return 'market';
    // A reviewer's feedback on submitted work lands on Rejected Submissions.
    case 'work-feedback':
      return 'rejected-work';
    // Work both reviewers approved (or then published) is on the Completed tab of My Work.
    case 'work-approved':
      return 'my-work';
    // The admin's decision on the creator's own application lands on its status page.
    case 'creator-application-approved':
    case 'creator-application-rejected':
      return 'pending';
    default:
      return null;
  }
}
