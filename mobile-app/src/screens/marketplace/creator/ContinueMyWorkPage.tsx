import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { workProgressApi } from '../../../services/api/workProgressApi';
import { ApiError } from '../../../services/api/client';
import { ChecklistItemResponse, WorkProgressResponse, stepsForStage } from '../../../types/workProgress';

// There's no per-job image field on the backend Job entity (unlike
// Opportunity's heroImageUrl) — this bundled photo stands in for every job's
// workspace hero until that field exists.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

const STEP_LABELS = ['Prep', 'Record', 'Edit', 'Submit'];

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const CheckIcon: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const TrashIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 7h16M9 4h6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => (
  <View style={s.progressBarTrack}>
    <View style={[s.progressBarFill, { width: `${Math.max(0, Math.min(100, percentage))}%` }]} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────
const Stepper: React.FC<{ completedSteps: number }> = ({ completedSteps }) => (
  <View style={s.stepperRow}>
    {STEP_LABELS.map((label, i) => {
      const done = i < completedSteps;
      const connectorDone = i < completedSteps - 1;
      return (
        <React.Fragment key={label}>
          <View style={s.stepItem}>
            <View style={[s.stepCircle, done ? s.stepCircleDone : s.stepCircleTodo]}>
              {done && <CheckIcon />}
            </View>
            <Text style={s.stepLabel}>{label}</Text>
          </View>
          {i < STEP_LABELS.length - 1 && (
            <View style={[s.stepConnector, connectorDone && s.stepConnectorDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// ChecklistRow
// ─────────────────────────────────────────────────────────────────────────────
const ChecklistRow: React.FC<{ item: ChecklistItemResponse; onToggle: () => void }> = ({ item, onToggle }) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [s.checklistRow, pressed && s.pressed]}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: item.completed }}
    accessibilityLabel={item.label}
  >
    <View style={[s.checklistCheckbox, item.completed && s.checklistCheckboxDone]}>
      {item.completed && <CheckIcon size={12} />}
    </View>
    <Text style={[s.checklistLabel, item.completed && s.checklistLabelDone]}>{item.label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const ContinueMyWorkPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  jobId: string | null;
  jobTitle?: string | null;
  elderName?: string | null;
}> = ({ onNavigate, onBack, onSaveDraft, jobId, jobTitle, elderName }) => {
  const id = jobId ?? 'unknown';

  const [progress, setProgress] = useState<WorkProgressResponse | null>(null);
  const [noteText, setNoteText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    workProgressApi
      .getProgress(id)
      .then((data) => {
        if (cancelled) return;
        setProgress(data);
        setNoteText(data.note ?? '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Could not load this job.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const materials = progress?.materials ?? [];
  const checklistItems = progress?.checklistItems ?? [];

  const handleToggleChecklistItem = async (item: ChecklistItemResponse) => {
    if (!progress) return;
    const nextCompleted = !item.completed;

    // Optimistic flip so the checkbox/percentage/stepper respond instantly;
    // replaced by the server's real recalculation once it resolves.
    setProgress((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistItems: prev.checklistItems.map((i) =>
          i.id === item.id ? { ...i, completed: nextCompleted } : i,
        ),
      };
    });

    try {
      const updated = await workProgressApi.updateChecklistItem(id, item.id, nextCompleted);
      setProgress(updated);
    } catch (err) {
      // Roll back the optimistic flip on failure.
      setProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          checklistItems: prev.checklistItems.map((i) =>
            i.id === item.id ? { ...i, completed: item.completed } : i,
          ),
        };
      });
      const message = err instanceof ApiError ? err.message : 'Could not update this task.';
      Alert.alert('Update failed', message);
    }
  };

  const handleAddMaterial = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Legacy Lens needs access to your photo/video library to attach materials.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];

    setUploading(true);
    try {
      const updated = await workProgressApi.addMaterial(id, {
        uri: asset.uri,
        name: asset.fileName ?? `material-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        type: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      });
      setProgress(updated);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not attach this material.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMaterial = (materialId: string, name: string) => {
    Alert.alert('Remove material?', `"${name}" will be removed from this job.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await workProgressApi.removeMaterial(id, materialId);
            setProgress(updated);
          } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Could not remove this material.';
            Alert.alert('Remove failed', message);
          }
        },
      },
    ]);
  };

  // Saves the note and flags this job as a draft only — it must NOT touch
  // checklist completion or the progress percentage. Real progress only ever
  // moves when a checklist item itself is checked/unchecked.
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await workProgressApi.updateNote(id, noteText);
      const finalState = await workProgressApi.markDraft(id);
      setProgress(finalState);
      Alert.alert('Saved', 'Your progress has been saved as a draft.', [{ text: 'OK', onPress: onSaveDraft }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save your progress.';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>{loadError}</Text>
        </View>
        <BottomNavBar activeTab="home" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  if (!progress) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>Loading…</Text>
        </View>
        <BottomNavBar activeTab="home" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(jobTitle || elderName) && (
          <View style={s.jobHeader}>
            {jobTitle ? <Text style={s.jobHeaderTitle} numberOfLines={2}>{jobTitle}</Text> : null}
            {elderName ? <Text style={s.jobHeaderElder}>{elderName}</Text> : null}
          </View>
        )}

        <View style={s.heroWrapper}>
          <Image source={GENERIC_HERO_IMAGE} style={s.heroImage} resizeMode="cover" accessibilityLabel="Work in progress" />
        </View>

        <View style={s.card}>
          <View style={s.progressHeaderRow}>
            <Text style={s.progressLabel}>Overall Progress</Text>
            <View style={s.progressHeaderRight}>
              <Text style={s.progressValue}>{progress.progressPercentage}% Complete</Text>
              {progress.draft && (
                <View style={s.draftBadge}>
                  <Text style={s.draftBadgeText}>DRAFT</Text>
                </View>
              )}
            </View>
          </View>

          <ProgressBar percentage={progress.progressPercentage} />

          <Stepper completedSteps={stepsForStage(progress.currentStage)} />

          <View style={{ gap: Spacing.sm }}>
            <Text style={s.sectionTitle}>What needs to be prepared</Text>
            {checklistItems.length === 0 ? (
              <Text style={s.emptyMaterialsText}>No tasks added yet.</Text>
            ) : (
              <View style={{ gap: 2 }}>
                {checklistItems.map((item) => (
                  <ChecklistRow key={item.id} item={item} onToggle={() => handleToggleChecklistItem(item)} />
                ))}
              </View>
            )}
          </View>

          <View style={{ gap: Spacing.sm }}>
            <Text style={s.sectionTitle}>Collected Materiels</Text>
            {materials.length === 0 ? (
              <Text style={s.emptyMaterialsText}>No materials collected yet.</Text>
            ) : (
              materials.map((material) => (
                <View key={material.id} style={s.materialRow}>
                  <Text style={s.materialName} numberOfLines={1}>{material.fileName}</Text>
                  <Pressable
                    onPress={() => handleRemoveMaterial(material.id, material.fileName)}
                    style={({ pressed }) => [s.materialTrashBtn, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${material.fileName}`}
                  >
                    <TrashIcon />
                  </Pressable>
                </View>
              ))
            )}

            <Pressable
              onPress={handleAddMaterial}
              disabled={uploading}
              style={({ pressed }) => [s.addMaterialBtn, pressed && s.pressed, uploading && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Add material"
            >
              <Text style={s.addMaterialBtnText}>{uploading ? 'Uploading…' : '+ Add Material'}</Text>
            </Pressable>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <Text style={s.sectionTitle}>Note & Written Content</Text>
            <TextInput
              style={s.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write notes about the recording, ingredients, or steps here."
              placeholderTextColor={D.onSurfaceVariant}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <Pressable
          onPress={handleSaveDraft}
          disabled={saving}
          style={({ pressed }) => [s.saveBtn, pressed && s.saveBtnPressed, saving && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Save as a draft"
        >
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save As a Draft'}</Text>
        </Pressable>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default ContinueMyWorkPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  loadingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center' },

  // ── App Bar ──────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  bellWrapper:  { alignItems: 'center' },
  bellTop:      { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:     { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:  { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Job header ───────────────────────────────────────────────────────────
  jobHeader: { gap: 2 },
  jobHeaderTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface },
  jobHeaderElder: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.primary },

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroWrapper: { width: '100%', aspectRatio: 4 / 2.7, borderRadius: Radii.xl, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },

  // ── Workspace card ───────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  progressHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  draftBadge: {
    backgroundColor: D.secondaryContainer, borderRadius: Radii.full,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  draftBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.onSecondaryContainer, letterSpacing: 0.6 },

  // ── Progress bar ─────────────────────────────────────────────────────────
  progressBarTrack: {
    height: 8, borderRadius: Radii.full, backgroundColor: D.surfaceVariant, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: Radii.full, backgroundColor: D.secondary,
  },

  // ── Stepper ──────────────────────────────────────────────────────────────
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: Spacing.xs },
  stepItem: { alignItems: 'center', gap: 4, width: 44 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone: { backgroundColor: D.secondary },
  stepCircleTodo: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: D.secondary },
  stepLabel: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: D.onSurfaceVariant },
  stepConnector: { flex: 1, height: 1.5, backgroundColor: '#a0aab0', marginTop: 10 },
  stepConnectorDone: { backgroundColor: D.secondary, height: 2 },

  // ── Checklist ────────────────────────────────────────────────────────────
  checklistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 4, borderRadius: Radii.md,
  },
  checklistCheckbox: {
    width: 22, height: 22, borderRadius: Radii.sm,
    borderWidth: 2, borderColor: D.secondary, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
  },
  checklistCheckboxDone: { backgroundColor: D.secondary },
  checklistLabel: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurface },
  checklistLabelDone: { color: D.onSurfaceVariant, textDecorationLine: 'line-through' },

  // ── Materials ────────────────────────────────────────────────────────────
  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface, letterSpacing: 0.3 },
  emptyMaterialsText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  materialRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: D.surfaceContainerLowest, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
  },
  materialName: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, marginRight: 8 },
  materialTrashBtn: { padding: 2 },
  addMaterialBtn: {
    backgroundColor: D.primary, borderRadius: Radii.lg,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  addMaterialBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff' },

  // ── Note ─────────────────────────────────────────────────────────────────
  noteInput: {
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    minHeight: 96,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    lineHeight: 18,
    color: D.onSurfaceVariant,
  },

  // ── Save button ──────────────────────────────────────────────────────────
  saveBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
