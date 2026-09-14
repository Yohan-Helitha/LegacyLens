/** PREP / RECORD / EDIT / SUBMIT / COMPLETED — a display-only summary derived from progressPercentage. */
export type WorkStage = 'PREP' | 'RECORD' | 'EDIT' | 'SUBMIT' | 'COMPLETED';

/** How many of the 4 stepper icons (Prep/Record/Edit/Submit) should render as "done" for a given stage. */
export function stepsForStage(stage: WorkStage): number {
  switch (stage) {
    case 'PREP':
      return 0;
    case 'RECORD':
      return 1;
    case 'EDIT':
      return 2;
    case 'SUBMIT':
      return 3;
    case 'COMPLETED':
      return 4;
    default:
      return 0;
  }
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

const STAGE_ORDER: ChecklistStage[] = ['PREP', 'RECORD', 'EDIT', 'SUBMIT'];

/**
 * Mirrors the backend's currentStage/progressPercentage calculation
 * (JobWorkProgressServiceImpl) so the UI can update the checkbox, the
 * percentage, AND the stepper all in the same instant a box is tapped,
 * instead of the stepper waiting on the server round-trip. The server's
 * response remains the authoritative value once it arrives.
 */
export function deriveStageAndPercentage(items: ChecklistItemResponse[]): { percentage: number; stage: WorkStage } {
  const total = items.length;
  if (total === 0) {
    return { percentage: 0, stage: 'PREP' };
  }
  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount * 100) / total);

  if (items.every((i) => i.completed)) {
    return { percentage, stage: 'COMPLETED' };
  }
  for (const stage of STAGE_ORDER) {
    const stageItems = items.filter((i) => i.stage === stage);
    const stageDone = stageItems.every((i) => i.completed);
    if (!stageDone) {
      return { percentage, stage };
    }
  }
  return { percentage, stage: 'SUBMIT' };
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
  progressPercentage: number;
  currentStage: WorkStage;
  /** The two "Note & Written Content" sub-sections — kept as separate fields, not one combined note. */
  introduction: string | null;
  story: string | null;
  draft: boolean;
  submittedAt: string | null;
  /** True when an admin sent this submission back with a reason instead of accepting it — see RejectedWorkPage. */
  rejected: boolean;
  rejectionReason: string | null;
  rejectedAt: string | null;
  materials: WorkMaterialResponse[];
  checklistItems: ChecklistItemResponse[];
}

/** A file picked via expo-image-picker, shaped for FormData's file part — same shape as PaymentProofFile. */
export interface WorkMaterialFile {
  uri: string;
  name: string;
  type: string;
}
