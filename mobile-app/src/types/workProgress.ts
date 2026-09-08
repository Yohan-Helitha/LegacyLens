export const TOTAL_WORK_STEPS = 4;

export interface WorkMaterialResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

/** Full work-progress state for one Job — backs MyWorkList's stepper/progress bar and ContinueMyWorkPage's workspace. */
export interface WorkProgressResponse {
  jobId: string;
  completedSteps: number;
  totalSteps: number;
  note: string | null;
  draft: boolean;
  submittedAt: string | null;
  materials: WorkMaterialResponse[];
}

/** A file picked via expo-image-picker, shaped for FormData's file part — same shape as PaymentProofFile. */
export interface WorkMaterialFile {
  uri: string;
  name: string;
  type: string;
}
