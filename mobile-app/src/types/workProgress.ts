/** PREP / RECORD / EDIT / SUBMIT / COMPLETED — a display-only summary derived from progressPercentage. */
export type WorkStage = 'PREP' | 'RECORD' | 'EDIT' | 'SUBMIT' | 'COMPLETED';

/** Which of the four steps are done - Prep, Record, Edit and Submit. See WorkProgressResponse. */
export interface StepFlags {
  prepDone: boolean;
  recordDone: boolean;
  editDone: boolean;
  submitted: boolean;
}

/** The four stepper circles, in order, as done / not done. */
export function stepFlags(flags: StepFlags): boolean[] {
  return [flags.prepDone, flags.recordDone, flags.editDone, flags.submitted];
}

export type ChecklistStage = 'PREP' | 'RECORD' | 'EDIT' | 'SUBMIT';

export interface ChecklistItemResponse {
  id: string;
  label: string;
  sortOrder: number;
  /** Which stepper stage this task belongs to — lets the UI update the stepper instantly on toggle, see deriveStageAndPercentage. */
  stage: ChecklistStage;
  /** When true, uploading a material in "Collected Materials" auto-completes this task instead of needing a manual tap. */
  requiresMaterial: boolean;
  completed: boolean;
  completedAt: string | null;
  note: string | null;
}

/**
 * Mirrors the backend's progress calculation (JobWorkProgressServiceImpl) so the checkbox, the percentage
 * and the stepper move in the same instant a Prep task is tapped. There are four steps worth a quarter
 * each; the tasks inside Prep share its quarter however many there are. The server's answer stays
 * authoritative once it arrives.
 */
export function deriveProgress(items: ChecklistItemResponse[], flags: Omit<StepFlags, 'prepDone'>): StepFlags & { percentage: number; stage: WorkStage } {
  const prep = items.filter((i) => i.stage === 'PREP');
  const prepDone = prep.every((i) => i.completed);
  const prepShare = prep.length === 0 ? 1 : prep.filter((i) => i.completed).length / prep.length;
  const percentage = Math.round(25 * (prepShare + (flags.recordDone ? 1 : 0) + (flags.editDone ? 1 : 0) + (flags.submitted ? 1 : 0)));

  let stage: WorkStage;
  if (!prepDone) stage = 'PREP';
  else if (!flags.recordDone) stage = 'RECORD';
  else if (!flags.editDone) stage = 'EDIT';
  else stage = flags.submitted ? 'COMPLETED' : 'SUBMIT';

  return { prepDone, ...flags, percentage, stage };
}

export interface WorkMaterialResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

/**
 * Full work-progress state for one Job. progressPercentage/currentStage are
 * always computed on the backend from checklistItems — the frontend never
 * increments them itself.
 */
export interface WorkProgressResponse {
  jobId: string;
  /** The linked Opportunity's photo, present only when this job came from a real booking — see resolveOpportunityImage. */
  heroImageUrl: string | null;
  /** What the opportunity pays, in LKR. */
  offeredAmount: number;
  progressPercentage: number;
  currentStage: WorkStage;
  /** Which of the four steps are done: Prep, Record (a material uploaded), Edit (content written), Submit. */
  prepDone: boolean;
  recordDone: boolean;
  editDone: boolean;
  submitted: boolean;
  /** Where the review stands: who has approved so far, and when the work was published. */
  elderApproved: boolean;
  adminApproved: boolean;
  publishedAt: string | null;
  /** Null until the creator first opens the job - the "New" tag shows until then. */
  openedAt: string | null;
  /** The two "Note & Written Content" sub-sections — kept as separate fields, not one combined note. */
  introduction: string | null;
  story: string | null;
  /** "Search Context (SEO)" — short search-result description (max 160 chars) and keywords (max 10). */
  seoSummary: string | null;
  seoKeywords: string[];
  draft: boolean;
  submittedAt: string | null;
  /** True when an admin sent this submission back with a reason instead of accepting it — see RejectedWorkPage. */
  rejected: boolean;
  rejectionReason: string | null;
  rejectedAt: string | null;
  /** What the knowledge holder and the admin each asked to change - for the creator only, never published. */
  elderFeedback: string | null;
  elderFeedbackAt: string | null;
  adminFeedback: string | null;
  adminFeedbackAt: string | null;
  materials: WorkMaterialResponse[];
  checklistItems: ChecklistItemResponse[];
}

/** A file picked via expo-image-picker, shaped for FormData's file part — same shape as PaymentProofFile. */
export interface WorkMaterialFile {
  uri: string;
  name: string;
  type: string;
}
