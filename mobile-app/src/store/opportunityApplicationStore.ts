import { create } from 'zustand';

/**
 * Local-only store for "apply to an opportunity" drafts and submissions.
 *
 * There is no backend endpoint yet for opportunity applications (unlike
 * "Become a Creator", which is fully real) — this intentionally mirrors that
 * future shape (SAVED draft -> PENDING submission -> APPROVED) purely in
 * memory so the Save/Edit/Submit/Delete/Book flow between
 * OpportunityApplicationForm and SavedOpportunityApplication actually works
 * end-to-end today. It resets when the app restarts; a real implementation
 * would replace this with a CreatorOpportunityApplication entity + API,
 * the same pattern CreatorApplicationServiceImpl already established.
 */
export type OpportunityApplicationStatus = 'SAVED' | 'PENDING' | 'APPROVED';

export interface OpportunityApplicationFormState {
  selectedSkills: string[];
  experienceText: string;
  approachText: string;
  availabilityConfirmed: boolean;
  selectedEquipment: string[];
}

export interface OpportunityApplicationRecord {
  id: string;
  opportunityId: string | null;
  title: string;
  elderName: string;
  location: string | null;
  heroImageUrl: string | null;
  scheduledDateText: string | null;
  timeWindowText: string | null;
  status: OpportunityApplicationStatus;
  savedAt: string;
  submittedAt: string | null;
  formState: OpportunityApplicationFormState;
}

type DraftInput = Omit<OpportunityApplicationRecord, 'id' | 'status' | 'savedAt' | 'submittedAt'>;

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Demo seed content matching the mockup, so the page isn't empty on first
// launch — a real Pending and a real Approved example. These have no
// opportunityId since they don't correspond to a real seeded opportunity row.
const INITIAL_APPLICATIONS: OpportunityApplicationRecord[] = [
  {
    id: 'seed-pending-1',
    opportunityId: null,
    title: 'Fishing Terms Documentation',
    elderName: 'Mr. Sunil Perera',
    location: 'Negombo',
    heroImageUrl: 'local:fisheries',
    scheduledDateText: '08 Sept 2026',
    timeWindowText: '10.30 A.M - 1.30 P.M',
    status: 'PENDING',
    savedAt: '2026-08-10T00:00:00',
    submittedAt: '2026-08-12T00:00:00',
    formState: { selectedSkills: [], experienceText: '', approachText: '', availabilityConfirmed: true, selectedEquipment: [] },
  },
  {
    id: 'seed-approved-1',
    opportunityId: null,
    title: 'Traditional Dance Event',
    elderName: 'Mrs. Kamala Wijesinghe',
    location: 'Kandy',
    heroImageUrl: null,
    scheduledDateText: '31 Aug 2026',
    timeWindowText: '8.30 P.M - 11.30 P.M',
    status: 'APPROVED',
    savedAt: '2026-08-05T00:00:00',
    submittedAt: '2026-08-06T00:00:00',
    formState: { selectedSkills: [], experienceText: '', approachText: '', availabilityConfirmed: true, selectedEquipment: [] },
  },
];

interface OpportunityApplicationState {
  applications: OpportunityApplicationRecord[];
  /** Creates a new SAVED draft, or updates an existing one in place when `id` is given. Returns its id. */
  saveDraft: (input: DraftInput, id?: string) => string;
  submitApplication: (id: string) => void;
  removeApplication: (id: string) => void;
  getById: (id: string) => OpportunityApplicationRecord | undefined;
}

export const useOpportunityApplicationStore = create<OpportunityApplicationState>()((set, get) => ({
  applications: INITIAL_APPLICATIONS,

  saveDraft: (input, id) => {
    const existingId = id ?? generateId();
    set((state) => {
      const existingIndex = state.applications.findIndex((a) => a.id === existingId);
      if (existingIndex >= 0) {
        const updated = [...state.applications];
        updated[existingIndex] = { ...updated[existingIndex], ...input };
        return { applications: updated };
      }
      const record: OpportunityApplicationRecord = {
        ...input,
        id: existingId,
        status: 'SAVED',
        savedAt: new Date().toISOString(),
        submittedAt: null,
      };
      return { applications: [record, ...state.applications] };
    });
    return existingId;
  },

  submitApplication: (id) => {
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, status: 'PENDING', submittedAt: new Date().toISOString() } : a,
      ),
    }));
  },

  removeApplication: (id) => {
    set((state) => ({ applications: state.applications.filter((a) => a.id !== id) }));
  },

  getById: (id) => get().applications.find((a) => a.id === id),
}));
