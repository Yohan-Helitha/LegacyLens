import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ConfirmDialog } from '../../../components/common';
import { MaterialViewer } from '../../../components/module-specific/marketplace/MaterialViewer';
import { PersonPhoto } from '../../../components/module-specific/marketplace/PersonPhoto';
import { VoiceNoteBubble } from '../../messaging/VoiceNoteBubble';
import { adminWorkReviewApi } from '../../../services/api/adminWorkReviewApi';
import { useWorkSubmission } from '../../../hooks/useWorkSubmission';
import { resolveImageUrl } from '../../../constants/api';
import { useLocaleStore } from '../../../store/localeStore';
import { formatDate } from '../../../utils/timeAgo';
import { MAX_FEEDBACK_LENGTH } from '../../../types/workReview';
import type { WorkMaterialResponse } from '../../../types/workProgress';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { adminGlobalStyles as g } from '../adminGlobalStyles';

const IMAGE = /\.(jpe?g|png|gif|webp|heic|heif|bmp)(\?|$)/i;
const AUDIO = /\.(mp3|m4a|aac|wav|ogg|opus|amr)(\?|$)/i;
const isImage = (m: WorkMaterialResponse) => IMAGE.test(m.fileName) || IMAGE.test(m.fileUrl);
const isAudio = (m: WorkMaterialResponse) => AUDIO.test(m.fileName) || AUDIO.test(m.fileUrl);

interface AdminWorkDetailScreenProps {
  jobId: string;
  onBack: () => void;
}

const TextPart: React.FC<{ title: string; text?: string | null }> = ({ title, text }) =>
  text && text.trim() ? (
    <View style={[g.card, s.section]}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.text}>{text}</Text>
    </View>
  ) : null;

/**
 * One piece of submitted work for the admin: the brief, what the creator wrote and attached, the knowledge
 * holder's review (approved, or the reason they asked for changes), and the admin's own Approve / Decline
 * (with a required reason). Publish appears once both reviewers have approved.
 */
export const AdminWorkDetailScreen: React.FC<AdminWorkDetailScreenProps> = ({ jobId, onBack }) => {
  const locale = useLocaleStore((state) => state.locale);
  const { detail, loading, loadError, busy, approve, decline, publish, reload } = useWorkSubmission(jobId, adminWorkReviewApi);

  const [confirm, setConfirm] = useState<'approve' | 'publish' | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [declineError, setDeclineError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [viewing, setViewing] = useState<WorkMaterialResponse | null>(null);

  const summary = detail?.summary;
  const state = summary?.state;
  const done = state === 'COMPLETED' || state === 'PUBLISHED';
  const trimmed = reason.trim();
  const materials = detail?.materials ?? [];
  const keywords = detail?.seoKeywords ?? [];

  const run = async (action: () => Promise<{ ok: boolean; error: string }>, success: string) => {
    setActionError('');
    const result = await action();
    if (result.ok) setNotice(success);
    else setActionError(result.error || "That didn't work. Please try again.");
  };

  const doConfirm = async () => {
    const which = confirm;
    setConfirm(null);
    if (which === 'approve') await run(approve, 'Work approved');
    if (which === 'publish') await run(publish, 'Work published');
  };

  const doDecline = async () => {
    if (!trimmed) return;
    setDeclineError('');
    const result = await decline(trimmed);
    if (result.ok) {
      setDeclineOpen(false);
      setReason('');
      setNotice('Feedback sent to the creator');
    } else {
      // Keep what was typed so nothing is lost.
      setDeclineError(result.error || "That didn't work. Please try again.");
    }
  };

  return (
    <View style={g.safeArea}>
      <Pressable onPress={onBack} style={s.backRow} accessibilityRole="button" accessibilityLabel="Back to submitted work">
        <MaterialIcons name="arrow-back" size={22} color={Colors.secondary} />
        <Text style={s.backText}>Submitted work</Text>
      </Pressable>

      {loading && !detail && <ActivityIndicator size="large" color={Colors.secondary} style={s.state} />}

      {!loading && !detail && (
        <View style={s.state}>
          <MaterialIcons name="error-outline" size={32} color={Colors.textMuted} />
          <Text style={s.stateText}>{loadError && loadError !== 'error' ? loadError : "Couldn't load this work. Check your connection and try again."}</Text>
          <Pressable onPress={reload} style={s.retry} accessibilityRole="button">
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {!!detail && !!summary && (
        <>
          <ScrollView contentContainerStyle={g.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.identity}>
              <PersonPhoto name={summary.creatorName} size={52} />
              <View style={s.identityText}>
                <Text style={s.title}>{summary.title}</Text>
                <Text style={s.sub}>
                  By {summary.creatorName}
                  {summary.elderName ? ` · for ${summary.elderName}` : ''}
                </Text>
              </View>
            </View>

            {!!notice && (
              <Text style={s.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {notice}
              </Text>
            )}
            {!!actionError && (
              <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {actionError}
              </Text>
            )}

            {state === 'PUBLISHED' && (
              <Text style={s.statusDone}>Published to users{summary.publishedAt ? ` on ${formatDate(summary.publishedAt, locale)}` : ''}</Text>
            )}
            {state === 'COMPLETED' && <Text style={s.statusDone}>Both reviewers approved. Not published yet - publish it below.</Text>}

            {/* The knowledge holder's review - what the admin most needs to see. */}
            <View style={[g.card, s.section, summary.elderApproved ? s.panelOk : detail.elderFeedback ? s.panelWarn : null]}>
              <Text style={s.sectionTitle}>Knowledge holder's review</Text>
              {summary.elderApproved ? (
                <Text style={s.panelOkText}>Approved by knowledge holder</Text>
              ) : detail.elderFeedback ? (
                <>
                  <Text style={s.panelWarnTitle}>
                    Knowledge holder asked for changes
                    {detail.elderFeedbackAt ? ` · ${formatDate(detail.elderFeedbackAt, locale)}` : ''}
                  </Text>
                  <Text style={s.text}>{detail.elderFeedback}</Text>
                </>
              ) : (
                <Text style={s.sub}>Knowledge holder hasn't reviewed yet</Text>
              )}
            </View>

            {/* The admin's own review. */}
            <View style={[g.card, s.section]}>
              <Text style={s.sectionTitle}>Your review</Text>
              {summary.adminApproved ? (
                <Text style={s.panelOkText}>You approved this work</Text>
              ) : detail.adminFeedback ? (
                <>
                  <Text style={s.panelWarnTitle}>
                    You asked for changes{detail.adminFeedbackAt ? ` · ${formatDate(detail.adminFeedbackAt, locale)}` : ''}
                  </Text>
                  <Text style={s.text}>{detail.adminFeedback}</Text>
                </>
              ) : (
                <Text style={s.sub}>You haven't reviewed this yet</Text>
              )}
            </View>

            <TextPart title="What was asked" text={detail.brief} />
            <TextPart title="Introduction" text={detail.introduction} />
            <TextPart title="Story" text={detail.story} />
            <TextPart title="Search summary" text={detail.seoSummary} />
            {keywords.length > 0 && <TextPart title="Keywords" text={keywords.join(', ')} />}

            <View style={[g.card, s.section]}>
              <Text style={s.sectionTitle}>Photos, videos and recordings ({materials.length})</Text>
              {materials.length === 0 && <Text style={s.sub}>Nothing was attached.</Text>}
              {materials.map((material) =>
                isAudio(material) ? (
                  <View key={material.id} style={s.audioRow}>
                    <Text style={s.fileName} numberOfLines={1}>
                      {material.fileName}
                    </Text>
                    <VoiceNoteBubble mediaUrl={material.fileUrl} fromMe={false} />
                  </View>
                ) : (
                  <Pressable
                    key={material.id}
                    onPress={() => setViewing(material)}
                    accessibilityRole="button"
                    accessibilityLabel={material.fileName}
                    style={({ pressed }) => [s.fileRow, pressed && { opacity: 0.8 }]}
                  >
                    {isImage(material) && resolveImageUrl(material.fileUrl) ? (
                      <Image source={{ uri: resolveImageUrl(material.fileUrl) ?? '' }} style={s.thumb} />
                    ) : (
                      <View style={[s.thumb, s.thumbFile]}>
                        <MaterialIcons name="insert-drive-file" size={24} color={Colors.secondary} />
                      </View>
                    )}
                    <Text style={s.fileName} numberOfLines={2}>
                      {material.fileName}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </ScrollView>

          <View style={s.footer}>
            {state === 'COMPLETED' && (
              <Pressable
                onPress={() => setConfirm('publish')}
                disabled={busy}
                accessibilityRole="button"
                style={[s.btn, s.btnPrimary, busy && s.btnOff]}
              >
                <Text style={s.btnPrimaryText}>{busy ? 'Working…' : 'Publish'}</Text>
              </Pressable>
            )}
            {!done && (
              <>
                {!summary.adminApproved && (
                  <Pressable
                    onPress={() => setConfirm('approve')}
                    disabled={busy}
                    accessibilityRole="button"
                    style={[s.btn, s.btnPrimary, busy && s.btnOff]}
                  >
                    <Text style={s.btnPrimaryText}>{busy ? 'Working…' : 'Approve'}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    setDeclineError('');
                    setDeclineOpen(true);
                  }}
                  disabled={busy}
                  accessibilityRole="button"
                  style={[s.btn, s.btnOutline, busy && s.btnOff]}
                >
                  <Text style={s.btnOutlineText}>Decline</Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}

      <ConfirmDialog
        visible={confirm !== null}
        title={confirm === 'publish' ? 'Publish this work?' : 'Approve this work?'}
        message={
          confirm === 'publish'
            ? 'The creator is told it has been published.'
            : 'It is published to users once the knowledge holder has approved it too.'
        }
        confirmLabel={confirm === 'publish' ? 'Publish' : 'Approve'}
        cancelLabel="Cancel"
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* Decline: a written reason is required. The knowledge holder's own reason stays visible while typing. */}
      <Modal visible={declineOpen} animationType="slide" transparent onRequestClose={() => !busy && setDeclineOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !busy && setDeclineOpen(false)} accessibilityLabel="Cancel" />
          <View style={s.sheet}>
            <Text style={s.sectionTitle}>What needs to change?</Text>
            {!!detail?.elderFeedback && !summary?.elderApproved && (
              <View style={s.elderNote}>
                <Text style={s.panelWarnTitle}>Knowledge holder's reason</Text>
                <Text style={s.text}>{detail.elderFeedback}</Text>
              </View>
            )}
            <TextInput
              value={reason}
              onChangeText={(value) => setReason(value.slice(0, MAX_FEEDBACK_LENGTH))}
              placeholder="Write your feedback for the creator…"
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              maxLength={MAX_FEEDBACK_LENGTH}
              style={s.input}
              accessibilityLabel="What needs to change?"
            />
            <Text style={s.counter}>
              {reason.length} / {MAX_FEEDBACK_LENGTH}
            </Text>
            {!!declineError && (
              <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {declineError}
              </Text>
            )}
            <Pressable
              onPress={doDecline}
              disabled={!trimmed || busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: !trimmed || busy }}
              style={[s.btn, s.btnPrimary, (!trimmed || busy) && s.btnOff]}
            >
              <Text style={s.btnPrimaryText}>{busy ? 'Sending…' : 'Send feedback'}</Text>
            </Pressable>
            <Pressable onPress={() => setDeclineOpen(false)} disabled={busy} accessibilityRole="button" style={[s.btn, s.btnOutline]}>
              <Text style={s.btnOutlineText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <MaterialViewer material={viewing} onClose={() => setViewing(null)} />
    </View>
  );
};

const s = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 48 },
  backText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.secondary },
  state: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  stateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: Colors.textMuted, textAlign: 'center' },
  retry: { backgroundColor: Colors.secondary, borderRadius: Radii.full, paddingVertical: 12, paddingHorizontal: Spacing.lg, minHeight: 44, justifyContent: 'center' },
  retryText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.white },

  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  identityText: { flex: 1, gap: 2 },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, lineHeight: 30, color: Colors.text },
  sub: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: Colors.textMuted },
  text: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: Colors.text },

  notice: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.white, backgroundColor: Colors.secondary, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, lineHeight: 21, color: '#ba1a1a', marginBottom: Spacing.sm },
  statusDone: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.secondary, marginBottom: Spacing.sm },

  section: { gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, lineHeight: 24, color: Colors.text },
  panelOk: { borderColor: Colors.secondary, borderWidth: 2 },
  panelWarn: { borderColor: '#b4543c', borderWidth: 2 },
  panelOkText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.secondary },
  panelWarnTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#7a3626' },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64 },
  thumb: { width: 64, height: 64, borderRadius: Radii.md, backgroundColor: Colors.surface },
  thumbFile: { alignItems: 'center', justifyContent: 'center' },
  fileName: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: Colors.text },
  audioRow: { gap: 4 },

  footer: { gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(15,92,92,0.2)' },
  btn: { minHeight: 48, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  btnPrimary: { backgroundColor: Colors.secondary },
  btnPrimaryText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.white },
  btnOutline: { borderWidth: 1.5, borderColor: Colors.secondary, backgroundColor: 'transparent' },
  btnOutlineText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.secondary },
  btnOff: { opacity: 0.45 },

  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { gap: Spacing.sm, padding: Spacing.md, paddingBottom: Spacing.lg, backgroundColor: '#f8faf9', borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl },
  elderNote: { backgroundColor: 'rgba(180,84,60,0.12)', borderRadius: Radii.lg, padding: Spacing.md, gap: 4 },
  input: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#6f7978',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.text,
    textAlignVertical: 'top',
    backgroundColor: Colors.white,
  },
  counter: { alignSelf: 'flex-end', fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted },
});

export default AdminWorkDetailScreen;
