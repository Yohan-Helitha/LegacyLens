import { create } from 'zustand';
import type { StoryMediaType, StoryStatus } from '../types/story';

/**
 * In-progress story, kept here rather than screen-local state since it has
 * to survive navigation across three separate screens (choose method →
 * record → form) before it's ever saved to the backend. Named StoryDraft
 * (not ContentDraft) and keyed to StoryMediaType/StoryMethod — this app's
 * backend entity has always been Story, not a separate Content entity; the
 * naming here matches everything else in the codebase (storiesApi,
 * StoryResponse, StoryStatus, ...).
 */
export interface StoryDraft {
  /** Undefined until first saved to the backend — set once editing an existing story. */
  id?: string;
  title: string;
  description: string;
  mediaType: StoryMediaType | null;
  /** Local file URI while recording, remote (root-relative) URL once loaded from an existing story. */
  mediaUri?: string;
  mediaDurationMillis?: number;
  /** Populated only for written/dictated content — there is no separate media file in that case. */
  transcriptText?: string;
  /** Local URI only today — see ThumbnailPicker's own doc comment for why nothing is sent to the backend yet. */
  thumbnailUri?: string;
  status: StoryStatus;
}

interface StoryDraftState {
  draft: StoryDraft | null;
  startNewDraft: (mediaType: StoryMediaType | null) => void;
  /** For edit mode — loads an existing DRAFT/REJECTED story back into the form. */
  loadExistingDraft: (draft: StoryDraft) => void;
  setMediaUri: (uri: string, durationMillis?: number) => void;
  setTranscript: (text: string) => void;
  updateFields: (fields: Partial<Pick<StoryDraft, 'title' | 'description'>>) => void;
  setThumbnail: (uri: string | undefined) => void;
  clearDraft: () => void;
}

export const useStoryDraftStore = create<StoryDraftState>()((set) => ({
  draft: null,

  startNewDraft: (mediaType) =>
    set({
      draft: {
        title: '',
        description: '',
        mediaType,
        status: 'DRAFT',
      },
    }),

  loadExistingDraft: (draft) => set({ draft }),

  setMediaUri: (uri, durationMillis) =>
    set((state) =>
      state.draft
        ? { draft: { ...state.draft, mediaUri: uri, mediaDurationMillis: durationMillis } }
        : state,
    ),

  setTranscript: (text) =>
    set((state) => (state.draft ? { draft: { ...state.draft, transcriptText: text } } : state)),

  updateFields: (fields) =>
    set((state) => (state.draft ? { draft: { ...state.draft, ...fields } } : state)),

  setThumbnail: (uri) =>
    set((state) => (state.draft ? { draft: { ...state.draft, thumbnailUri: uri } } : state)),

  clearDraft: () => set({ draft: null }),
}));

export default useStoryDraftStore;
