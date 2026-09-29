import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Trash2 } from 'lucide-react-native';
import { BackButton, ConfirmDialog } from '../../components/common';
import {
  MediaPreviewCard,
  MicInputField,
  RecordingActionButtons,
  SubmitConfirmationModal,
  ThumbnailPicker,
  STORY_STATUS_LABELS,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { useStoryDraft } from '../../hooks/useStoryDraft';
import { storiesApi } from '../../services/api/storiesApi';
import { getMediaUrl } from '../../constants/api';
import { ApiError } from '../../services/api/client';
import { Typography, Spacing, Radii } from '../../theme';
import type { StoryMediaType } from '../../types/story';

/**
 * PENDING is editable too: the backend has no way to hold a story at DRAFT
 * (see the limitation note below), so every "saved draft" sits at PENDING
 * until moderated — locking it would make drafts impossible to finish.
 * PUBLISHED / ARCHIVED open read-only.
 */
const isEditableStatus = (status: string) =>
  status === 'DRAFT' || status === 'PENDING' || status === 'REJECTED';

interface ContentFormScreenProps {
  mode: 'create' | 'edit';
  /** Required for edit mode — the story to load. */
  storyId?: string;
  onBack?: () => void;
  /** Saved (draft or submitted) — navigate back to My Stories. */
  onSaved?: () => void;
  /** Fired once an existing story has actually been deleted server-side. */
  onDeleted?: () => void;
  /** "Re-record" tapped on an AUDIO/VIDEO draft — go back to the matching recording screen. */
  onRerecord?: (mediaType: StoryMediaType) => void;
}

/**
 * Shared form for both creating new content and editing an existing
 * DRAFT/REJECTED story — one screen, two modes, driven by `mode`/`storyId`
 * rather than duplicating the same 3-field layout twice.
 *
 * IMPORTANT LIMITATION — "Save as Draft" isn't really a draft today: the
 * backend's create endpoint has no way to persist a story at DRAFT status
 * (Story.status always starts PENDING — see StoryStatus.java's own doc
 * comment: "no code path sets a story to DRAFT yet"). So both "Save as
 * Draft" and "Submit for Review" call the exact same storiesApi.create/
 * update — the only difference is client-side validation strictness and
 * whether the confirmation modal appears. A "saved draft" is, today,
 * already visible in the admin's moderation queue at PENDING, not actually
 * held back the way the name implies. Flagged here rather than silently
 * pretending otherwise; fixing this for real needs a backend change (either
 * a status field on CreateStoryRequest, or a true client-only local-draft
 * store that never calls the API until Submit).
 */
export const ContentFormScreen: React.FC<ContentFormScreenProps> = ({
  mode,
  storyId,
  onBack,
  onSaved,
  onDeleted,
  onRerecord,
}) => {
  const { draft, loadExistingDraft, updateFields, setTranscript, setThumbnail, clearDraft } = useStoryDraft();

  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; description?: string; media?: string }>({});
  const [discardVisible, setDiscardVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !storyId) return;
    let cancelled = false;
    setLoading(true);
    storiesApi
      .getById(storyId)
      .then((story) => {
        if (cancelled) return;
        const isWritten = story.method === 'WRITTEN' && !story.mediaType;
        loadExistingDraft({
          id: story.id,
          title: story.title,
          description: isWritten ? '' : story.description ?? '',
          mediaType: story.mediaType,
          mediaUri: story.mediaUrl ? getMediaUrl(story.mediaUrl) : undefined,
          mediaDurationMillis: story.mediaDurationMillis ?? undefined,
          transcriptText: isWritten ? story.description ?? '' : undefined,
          status: story.status,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load this story.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, storyId]);

  useEffect(() => {
    return () => {
      clearDraft();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={s.centerState}>
          <ActivityIndicator color={D.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !draft) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={s.topBar}>
          <BackButton onPress={onBack} />
        </View>
        <View style={s.centerState}>
          <Text style={s.errorText}>{loadError ?? "Couldn't load this story."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isWritten = draft.mediaType === null;
  const editable = isEditableStatus(draft.status);

  const validate = (forSubmit: boolean) => {
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = 'this field is empty';
    if (forSubmit) {
      const bodyText = isWritten ? draft.transcriptText : draft.description;
      if (!bodyText?.trim()) {
        if (isWritten) next.media = 'add your story before submitting';
        else next.description = 'this field is empty';
      }
      if (!isWritten && !draft.mediaUri) {
        next.media = 'a recording is required before submitting';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({
    title: draft.title.trim(),
    description: (isWritten ? draft.transcriptText : draft.description)?.trim() || undefined,
    method: (draft.mediaType ? ('RECORDED' as const) : ('WRITTEN' as const)),
    mediaDurationMillis: draft.mediaDurationMillis,
    media:
      !isWritten && draft.mediaUri
        ? {
            uri: draft.mediaUri,
            name: draft.mediaType === 'VIDEO' ? 'video.mp4' : 'voice.m4a',
            type: draft.mediaType === 'VIDEO' ? 'video/mp4' : 'audio/m4a',
          }
        : null,
  });

  const persist = async () => {
    if (draft.id) {
      await storiesApi.update(draft.id, {
        title: draft.title.trim(),
        description: (isWritten ? draft.transcriptText : draft.description)?.trim() || undefined,
      });
    } else {
      await storiesApi.create(buildPayload());
    }
  };

  const handleSaveAsDraft = async () => {
    if (savingDraft || submitting) return;
    if (!validate(false)) return;

    setSavingDraft(true);
    setSaveError(null);
    try {
      await persist();
      clearDraft();
      onSaved?.();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitPress = () => {
    if (!validate(true)) return;
    setConfirmVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSaveError(null);
    try {
      await persist();
      setConfirmVisible(false);
      clearDraft();
      onSaved?.();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setConfirmVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || !draft.id) return;
    setDeleting(true);
    setSaveError(null);
    try {
      await storiesApi.remove(draft.id);
      setDeleteVisible(false);
      clearDraft();
      onDeleted?.();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setDeleteVisible(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={s.topBar}>
        <BackButton onPress={() => (editable ? setDiscardVisible(true) : onBack?.())} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.heading}>
          <Text style={s.headline}>{mode === 'edit' ? 'Edit your story' : 'Review your story'}</Text>
          <Text style={s.subheadline}>Give it a title and a little context</Text>
        </View>

        {!editable && (
          <View style={s.readOnlyBanner}>
            <Text style={s.readOnlyText}>
              This story is {STORY_STATUS_LABELS[draft.status]} and can't be edited.
            </Text>
          </View>
        )}

        <MicInputField
          label="Title"
          value={draft.title}
          onChangeText={(text) => updateFields({ title: text })}
          placeholder="Give your story a title"
          errorText={errors.title}
          editable={editable}
        />

        {!isWritten && (
          <MicInputField
            label="Description"
            value={draft.description}
            onChangeText={(text) => updateFields({ description: text })}
            placeholder="Add a little context for this story…"
            multiline
            errorText={errors.description}
            editable={editable}
          />
        )}

        <View style={s.section}>
          <Text style={s.sectionLabel}>{isWritten ? 'Your story' : draft.mediaType === 'VIDEO' ? 'Video' : 'Voice recording'}</Text>

          {isWritten ? (
            <MicInputField
              label="Your story"
              value={draft.transcriptText ?? ''}
              onChangeText={setTranscript}
              placeholder="Speak or type your story…"
              multiline
              errorText={errors.media}
              editable={editable}
            />
          ) : draft.mediaUri && draft.mediaType ? (
            <>
              <MediaPreviewCard
                mediaType={draft.mediaType}
                uri={draft.mediaUri}
                durationMillis={draft.mediaDurationMillis}
                // The update endpoint can't replace an uploaded clip, so only unsaved recordings can be redone.
                onRerecord={editable && !draft.id ? () => onRerecord?.(draft.mediaType!) : undefined}
              />
              {!!errors.media && <Text style={s.fieldErrorText}>{errors.media}</Text>}
            </>
          ) : (
            <Text style={s.emptyMediaText}>No recording attached</Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Thumbnail</Text>
          <ThumbnailPicker uri={draft.thumbnailUri} onChange={setThumbnail} editable={editable} />
        </View>

        {!!saveError && <Text style={s.saveErrorText}>{saveError}</Text>}

        {editable && (
          <RecordingActionButtons
            startOverLabel={savingDraft ? 'Saving…' : 'Save as Draft'}
            finishLabel="Submit for Review"
            onStartOverPress={handleSaveAsDraft}
            onFinishPress={handleSubmitPress}
          />
        )}

        {!!draft.id && (
          <Pressable
            onPress={() => !deleting && setDeleteVisible(true)}
            style={({ pressed }) => [s.deleteBtn, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Trash2 size={18} color="#ba1a1a" strokeWidth={2} />
            <Text style={s.deleteBtnText}>Delete Content</Text>
          </Pressable>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={deleteVisible}
        title="Delete this story?"
        message="This can't be undone — the recording and details will be permanently removed."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onCancel={() => !deleting && setDeleteVisible(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        visible={discardVisible}
        title="Discard this story?"
        message="Your recording and anything you've written here will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setDiscardVisible(false)}
        onConfirm={() => {
          setDiscardVisible(false);
          clearDraft();
          onBack?.();
        }}
      />

      <SubmitConfirmationModal
        visible={confirmVisible}
        submitting={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirmSubmit}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  topBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.lg, flexGrow: 1 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },

  heading: { gap: 2, marginBottom: Spacing.xs },
  headline: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: D.onSurface },
  subheadline: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },

  readOnlyBanner: {
    backgroundColor: D.surfaceContainer,
    borderRadius: 12,
    padding: Spacing.md,
  },
  readOnlyText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },

  section: { gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  emptyMediaText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },
  fieldErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
  },

  saveErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
  },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(186,26,26,0.35)',
    backgroundColor: 'rgba(186,26,26,0.06)',
  },
  deleteBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ba1a1a' },
  pressed: { opacity: 0.85 },
});

export default ContentFormScreen;
