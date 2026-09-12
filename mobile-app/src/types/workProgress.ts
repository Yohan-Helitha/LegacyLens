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

export interface ChecklistItemResponse {
  id: string;
  label: string;
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
  note: string | null;
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
  note: string | null;
  draft: boolean;
  submittedAt: string | null;
  materials: WorkMaterialResponse[];
  checklistItems: ChecklistItemResponse[];
}

/** A file picked via expo-image-picker, shaped for FormData's file part — same shape as PaymentProofFile. */
export interface WorkMaterialFile {
  uri: string;
  name: string;
  type: string;
}
