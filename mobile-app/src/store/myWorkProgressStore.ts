import { create } from 'zustand';

/**
 * Local-only tracker for how far a creator has gotten through the
 * Prep -> Record -> Edit -> Submit stages of an active job, plus the
 * materials/notes collected along the way on ContinueMyWorkPage.
 *
 * The backend Job entity has no per-stage progress field, no attached-file
 * list, and no notes field — it only knows ACTIVE/UPCOMING/COMPLETED — so
 * all of this lives here in memory instead, keyed by job id. Reaching step 4
 * (Submit) doesn't mark the job COMPLETED on the backend; it just moves it
 * into MyWorkList's "Submitted" tab, awaiting the knowledge holder's real
 * review — a genuine completion still has to come from the backend's own
 * COMPLETED status. Resets when the app restarts, same as
 * opportunityApplicationStore.
 */
export const TOTAL_WORK_STEPS = 4;

export interface WorkMaterial {
  id: string;
  name: string;
  uri: string;
}

// Demo seed content matching the mockup, shown only for the fallback job id
// MyWorkList uses when the real /jobs call fails — never fabricated for a
// real job pulled from the backend, which starts with no materials/notes.
const DEMO_JOB_ID = 'fallback-1';
const INITIAL_MATERIALS: Record<string, WorkMaterial[]> = {
  [DEMO_JOB_ID]: [
    { id: 'demo-1', name: 'recipe_recording.mp4', uri: '' },
    { id: 'demo-2', name: 'recipe_Image1.jpg', uri: '' },
  ],
};
const INITIAL_NOTES: Record<string, string> = {
  [DEMO_JOB_ID]:
    'Ingredients..\nMrs. Kamala stressed the importance of roasting the curry powder on a low flame until it turns a deep mahogany colour but not burnt.\n\nKey Ingredients :',
};

function generateId(): string {
  return `material-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface MyWorkProgressState {
  completedStepsByJobId: Record<string, number>;
  materialsByJobId: Record<string, WorkMaterial[]>;
  noteByJobId: Record<string, string>;
  /** Job ids explicitly saved as a draft from ContinueMyWorkPage's "Save As a Draft" — shown on SavedCompletedWorkPage. */
  savedDraftJobIds: string[];

  getCompletedSteps: (jobId: string, fallback: number) => number;
  advance: (jobId: string, fallback: number) => void;

  getMaterials: (jobId: string) => WorkMaterial[];
  addMaterial: (jobId: string, material: Omit<WorkMaterial, 'id'>) => void;
  removeMaterial: (jobId: string, materialId: string) => void;

  getNote: (jobId: string) => string;
  setNote: (jobId: string, text: string) => void;

  /** Adds a job to the saved-drafts list if it isn't already there. */
  markSavedAsDraft: (jobId: string) => void;
  /** Marks a draft's work fully done (Submit reached) and removes it from the drafts list — its materials/notes stay intact. */
  submitDraftForReview: (jobId: string) => void;
  /** Discards a draft entirely: clears its progress, materials, and notes, and removes it from the drafts list. */
  deleteDraft: (jobId: string) => void;
}

export const useMyWorkProgressStore = create<MyWorkProgressState>()((set, get) => ({
  completedStepsByJobId: {},
  materialsByJobId: INITIAL_MATERIALS,
  noteByJobId: INITIAL_NOTES,
  // Seeded so SavedCompletedWorkPage isn't empty on first launch, matching
  // the demo materials/note already seeded for this same fallback job.
  savedDraftJobIds: [DEMO_JOB_ID],

  getCompletedSteps: (jobId, fallback) => get().completedStepsByJobId[jobId] ?? fallback,

  advance: (jobId, fallback) => {
    set((state) => {
      const current = state.completedStepsByJobId[jobId] ?? fallback;
      const next = Math.min(current + 1, TOTAL_WORK_STEPS);
      return { completedStepsByJobId: { ...state.completedStepsByJobId, [jobId]: next } };
    });
  },

  getMaterials: (jobId) => get().materialsByJobId[jobId] ?? [],

  addMaterial: (jobId, material) => {
    set((state) => ({
      materialsByJobId: {
        ...state.materialsByJobId,
        [jobId]: [...(state.materialsByJobId[jobId] ?? []), { ...material, id: generateId() }],
      },
    }));
  },

  removeMaterial: (jobId, materialId) => {
    set((state) => ({
      materialsByJobId: {
        ...state.materialsByJobId,
        [jobId]: (state.materialsByJobId[jobId] ?? []).filter((m) => m.id !== materialId),
      },
    }));
  },

  getNote: (jobId) => get().noteByJobId[jobId] ?? '',

  setNote: (jobId, text) => {
    set((state) => ({ noteByJobId: { ...state.noteByJobId, [jobId]: text } }));
  },

  markSavedAsDraft: (jobId) => {
    set((state) =>
      state.savedDraftJobIds.includes(jobId)
        ? state
        : { savedDraftJobIds: [...state.savedDraftJobIds, jobId] },
    );
  },

  submitDraftForReview: (jobId) => {
    set((state) => ({
      completedStepsByJobId: { ...state.completedStepsByJobId, [jobId]: TOTAL_WORK_STEPS },
      savedDraftJobIds: state.savedDraftJobIds.filter((id) => id !== jobId),
    }));
  },

  deleteDraft: (jobId) => {
    set((state) => {
      const { [jobId]: _removedSteps, ...restSteps } = state.completedStepsByJobId;
      const { [jobId]: _removedMaterials, ...restMaterials } = state.materialsByJobId;
      const { [jobId]: _removedNote, ...restNotes } = state.noteByJobId;
      return {
        completedStepsByJobId: restSteps,
        materialsByJobId: restMaterials,
        noteByJobId: restNotes,
        savedDraftJobIds: state.savedDraftJobIds.filter((id) => id !== jobId),
      };
    });
  },
}));
