import { create } from 'zustand';

/**
 * Local-only tracker for how far a creator has gotten through the
 * Prep -> Record -> Edit -> Submit stages of an active job.
 *
 * The backend Job entity has no per-stage progress field — it only knows
 * ACTIVE/UPCOMING/COMPLETED — so "which of the 4 steps is done" lives here
 * in memory instead, keyed by job id. Reaching step 4 (Submit) doesn't mark
 * the job COMPLETED on the backend; it just moves it into MyWorkList's
 * "Submitted" tab, awaiting the knowledge holder's real review — a genuine
 * completion still has to come from the backend's own COMPLETED status.
 * Resets when the app restarts, same as opportunityApplicationStore.
 */
export const TOTAL_WORK_STEPS = 4;

interface MyWorkProgressState {
  completedStepsByJobId: Record<string, number>;
  getCompletedSteps: (jobId: string, fallback: number) => number;
  advance: (jobId: string, fallback: number) => void;
}

export const useMyWorkProgressStore = create<MyWorkProgressState>()((set, get) => ({
  completedStepsByJobId: {},

  getCompletedSteps: (jobId, fallback) => get().completedStepsByJobId[jobId] ?? fallback,

  advance: (jobId, fallback) => {
    set((state) => {
      const current = state.completedStepsByJobId[jobId] ?? fallback;
      const next = Math.min(current + 1, TOTAL_WORK_STEPS);
      return { completedStepsByJobId: { ...state.completedStepsByJobId, [jobId]: next } };
    });
  },
}));
