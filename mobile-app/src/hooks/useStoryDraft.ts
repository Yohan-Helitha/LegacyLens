import { useStoryDraftStore } from '../store/storyDraftStore';

/**
 * Thin convenience wrapper around storyDraftStore so screens depend on this
 * hook rather than importing the Zustand store directly — keeps the
 * "Record a new story" screens decoupled from the specific state-management
 * library choice, per the module's established pattern.
 */
export function useStoryDraft() {
  const draft = useStoryDraftStore((state) => state.draft);
  const startNewDraft = useStoryDraftStore((state) => state.startNewDraft);
  const loadExistingDraft = useStoryDraftStore((state) => state.loadExistingDraft);
  const setMediaUri = useStoryDraftStore((state) => state.setMediaUri);
  const setTranscript = useStoryDraftStore((state) => state.setTranscript);
  const updateFields = useStoryDraftStore((state) => state.updateFields);
  const setThumbnail = useStoryDraftStore((state) => state.setThumbnail);
  const clearDraft = useStoryDraftStore((state) => state.clearDraft);

  return {
    draft,
    startNewDraft,
    loadExistingDraft,
    setMediaUri,
    setTranscript,
    updateFields,
    setThumbnail,
    clearDraft,
  };
}

export default useStoryDraft;
