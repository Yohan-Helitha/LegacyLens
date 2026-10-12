/** The creator screen a tapped notification should open, or null when it should just open the app. */
export function creatorScreenForNotification(data: Record<string, unknown> | null | undefined): 'rejected-applications' | 'dashboard' | 'market' | 'rejected-work' | 'my-work' | null {
  switch (data?.type) {
    case 'application-rejected':
      return 'rejected-applications';
    // An approved application is booked from the dashboard's Upcoming Booking tab.
    case 'application-approved':
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
    default:
      return null;
  }
}
