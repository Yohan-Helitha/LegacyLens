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
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, FileText, MessageCircle, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog, Header } from '../../components/common';
import { HireActionButton } from '../../components/module-specific/content-capture';
import { ContentCaptureColors as D } from '../../components/module-specific/content-capture/tokens';
import { MaterialViewer } from '../../components/module-specific/marketplace/MaterialViewer';
import { PersonPhoto } from '../../components/module-specific/marketplace/PersonPhoto';
import { StarRating } from '../../components/module-specific/marketplace/StarRating';
import { VoiceNoteBubble } from '../messaging/VoiceNoteBubble';
import { useWorkSubmission } from '../../hooks/useWorkSubmission';
import { messagingApi } from '../../services/api/messagingApi';
import { ApiError } from '../../services/api/client';
import { resolveImageUrl } from '../../constants/api';
import { useLocaleStore } from '../../store/localeStore';
import { formatDate } from '../../utils/timeAgo';
import { MAX_FEEDBACK_LENGTH, MAX_RATING_COMMENT_LENGTH } from '../../types/workReview';
import type { WorkMaterialResponse } from '../../types/workProgress';
import { Typography, Spacing, Radii } from '../../theme';

const IMAGE = /\.(jpe?g|png|gif|webp|heic|heif|bmp)(\?|$)/i;
const AUDIO = /\.(mp3|m4a|aac|wav|ogg|opus|amr)(\?|$)/i;

const isImage = (m: WorkMaterialResponse) => IMAGE.test(m.fileName) || IMAGE.test(m.fileUrl);
const isAudio = (m: WorkMaterialResponse) => AUDIO.test(m.fileName) || AUDIO.test(m.fileUrl);

interface WorkDetailScreenProps {
  jobId: string;
  onBack?: () => void;
  /** Opens the chat with the creator (the conversation id comes from messagingApi.open). */
  onOpenChat?: (conversationId: string) => void;
}

/** Heading + text block that is left out entirely when the creator wrote nothing there. */
const TextPart: React.FC<{ title: string; text?: string | null }> = ({ title, text }) =>
  text && text.trim() ? (
    <View style={s.section}>
      <Text style={s.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <Text style={s.text}>{text}</Text>
    </View>
  ) : null;

/**
 * Reviewing one piece of submitted work: what was asked, what the creator wrote and attached, then Approve,
 * or Decline with a required written reason. Once the work is completed the elder can rate the creator.
 * The work is only completed when the admin has also approved - this screen says so.
 */
export const WorkDetailScreen: React.FC<WorkDetailScreenProps> = ({ jobId, onBack, onOpenChat }) => {
  const { t } = useTranslation('contentCapture');
  const locale = useLocaleStore((state) => state.locale);
  const { detail, rating, loading, loadError, busy, approve, decline, rate, reload } = useWorkSubmission(jobId);

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [declineError, setDeclineError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [viewing, setViewing] = useState<WorkMaterialResponse | null>(null);
  const [stars, setStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const summary = detail?.summary;
  const name = summary?.creatorName ?? '';
  const done = summary?.state === 'COMPLETED' || summary?.state === 'PUBLISHED';
  const canReview = !!summary && !done && !summary.elderApproved;
  const trimmedReason = reason.trim();

  const doApprove = async () => {
    setConfirmApprove(false);
    setActionError('');
    const result = await approve();
    if (result.ok) setNotice(t('workDetail.approvedNote'));
    else setActionError(result.error || t('workDetail.actionError'));
  };

  const doDecline = async () => {
    if (!trimmedReason) return;
    setDeclineError('');
    const result = await decline(trimmedReason);
    if (result.ok) {
      setDeclineOpen(false);
      setReason('');
      setNotice(t('workDetail.sentNote'));
    } else {
      // Keep what was typed so the elder does not lose it.
      setDeclineError(result.error || t('workDetail.actionError'));
    }
  };

  const doRate = async () => {
    if (stars < 1) return;
    setActionError('');
    const result = await rate(stars, ratingComment);
    if (result.ok) setNotice(t('workDetail.ratingThanks'));
    else setActionError(result.error || t('workDetail.actionError'));
  };

  const message = async () => {
    if (!summary?.opportunityId) return;
    setChatBusy(true);
    setActionError('');
    try {
      const conversation = await messagingApi.open(summary.opportunityId, summary.creatorId);
      onOpenChat?.(conversation.id);
    } catch (err) {
      setActionError(err instanceof ApiError && err.message ? err.message : t('creatorApps.chatError'));
    } finally {
      setChatBusy(false);
    }
  };

  const materials = detail?.materials ?? [];
  const keywords = detail?.seoKeywords ?? [];

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <Header title={t('workDetail.headerTitle')} showBack onBackPress={onBack} />

      {loading && !detail && (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={D.primary} />
        </View>
      )}

      {!loading && !detail && (
        <View style={s.centered}>
          <CircleAlert size={32} color={D.onSecondaryContainer} strokeWidth={2} />
          <Text style={s.text}>{loadError && loadError !== 'error' ? loadError : t('workDetail.loadError')}</Text>
          <HireActionButton label={t('workDetail.retry')} variant="neutral" onPress={reload} />
        </View>
      )}

      {!!detail && !!summary && (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <View style={s.identity}>
              <PersonPhoto name={name} size={56} />
              <View style={s.identityText}>
                <Text style={s.title}>{summary.title}</Text>
                <Text style={s.sub}>{t('workDetail.by', { name })}</Text>
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

            {done && <Text style={s.statusDone}>{t('workDetail.completedNote')}</Text>}
            {!done && summary.elderApproved && <Text style={s.statusWaiting}>{t('workDetail.waitingAdmin')}</Text>}

            {!!detail.elderFeedback && !summary.elderApproved && (
              <View style={s.previous}>
                <Text style={s.previousTitle}>
                  {t('workDetail.previous', { date: formatDate(detail.elderFeedbackAt, locale) })}
                </Text>
                <Text style={s.text}>{detail.elderFeedback}</Text>
              </View>
            )}

            <TextPart title={t('workDetail.brief')} text={detail.brief} />
            <TextPart title={t('workDetail.introduction')} text={detail.introduction} />
            <TextPart title={t('workDetail.story')} text={detail.story} />
            <TextPart title={t('workDetail.seoSummary')} text={detail.seoSummary} />
            {keywords.length > 0 && <TextPart title={t('workDetail.keywords')} text={keywords.join(', ')} />}

            <View style={s.section}>
              <Text style={s.sectionTitle} accessibilityRole="header">
                {t('workDetail.materials', { count: materials.length })}
              </Text>
              {materials.length === 0 && <Text style={s.text}>{t('workDetail.noMaterials')}</Text>}
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
                    style={({ pressed }) => [s.fileRow, pressed && s.pressed]}
                  >
                    {isImage(material) && resolveImageUrl(material.fileUrl) ? (
                      <Image source={{ uri: resolveImageUrl(material.fileUrl) ?? '' }} style={s.thumb} />
                    ) : (
                      <View style={[s.thumb, s.thumbFile]}>
                        <FileText size={24} color={D.primary} strokeWidth={2} />
                      </View>
                    )}
                    <Text style={s.fileName} numberOfLines={2}>
                      {material.fileName}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            {done && (
              <View style={s.section}>
                <Text style={s.sectionTitle} accessibilityRole="header">
                  {rating ? t('workDetail.yourRating') : t('workDetail.rateTitle', { name })}
                </Text>
                {rating ? (
                  <>
                    <StarRating rating={rating.rating} size={28} />
                    {!!rating.comment && <Text style={s.text}>{rating.comment}</Text>}
                  </>
                ) : (
                  <>
                    <Text style={s.sub}>{t('workDetail.rateHint')}</Text>
                    <View style={s.starsRow}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable
                          key={value}
                          onPress={() => setStars(value)}
                          accessibilityRole="button"
                          accessibilityLabel={t('workDetail.stars', { count: value })}
                          accessibilityState={{ selected: stars === value }}
                          style={s.starBtn}
                        >
                          <Star size={34} color="#E8792E" fill={value <= stars ? '#E8792E' : 'transparent'} strokeWidth={2} />
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      value={ratingComment}
                      onChangeText={setRatingComment}
                      placeholder={t('workDetail.ratingComment')}
                      placeholderTextColor={D.onSurfaceVariant}
                      multiline
                      maxLength={MAX_RATING_COMMENT_LENGTH}
                      style={s.input}
                    />
                    <HireActionButton
                      label={t('workDetail.submitRating')}
                      disabled={stars < 1 || busy}
                      loading={busy}
                      onPress={doRate}
                    />
                  </>
                )}
              </View>
            )}
          </ScrollView>

          <View style={s.footer}>
            {canReview && (
              <>
                <HireActionButton
                  label={busy ? t('workDetail.approving') : t('workDetail.approve')}
                  variant="accent"
                  size="large"
                  loading={busy}
                  onPress={() => setConfirmApprove(true)}
                />
                <HireActionButton
                  label={t('workDetail.decline')}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => {
                    setDeclineError('');
                    setDeclineOpen(true);
                  }}
                />
              </>
            )}
            {!!summary.opportunityId && (
              <HireActionButton
                label={t('workDetail.message', { name })}
                icon={MessageCircle}
                variant="neutral"
                loading={chatBusy}
                disabled={chatBusy || busy}
                onPress={message}
              />
            )}
          </View>
        </>
      )}

      <ConfirmDialog
        visible={confirmApprove}
        title={t('workDetail.approveTitle')}
        message={t('workDetail.approveBody')}
        confirmLabel={t('workDetail.approve')}
        cancelLabel={t('workDetail.cancel')}
        onConfirm={doApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      {/* Decline: a written reason is required - Send stays off until there is one. */}
      <Modal visible={declineOpen} animationType="slide" transparent onRequestClose={() => !busy && setDeclineOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !busy && setDeclineOpen(false)} accessibilityLabel={t('workDetail.cancel')} />
          <View style={s.sheet}>
            <Text style={s.sectionTitle} accessibilityRole="header">
              {t('workDetail.declineTitle')}
            </Text>
            <Text style={s.sub}>{t('workDetail.declineHint', { name })}</Text>
            <TextInput
              value={reason}
              onChangeText={(value) => setReason(value.slice(0, MAX_FEEDBACK_LENGTH))}
              placeholder={t('workDetail.declinePlaceholder')}
              placeholderTextColor={D.onSurfaceVariant}
              multiline
              autoFocus
              maxLength={MAX_FEEDBACK_LENGTH}
              style={[s.input, s.reasonInput]}
              accessibilityLabel={t('workDetail.declineTitle')}
            />
            <Text style={s.counter}>{t('workDetail.counter', { count: reason.length, max: MAX_FEEDBACK_LENGTH })}</Text>
            {!!declineError && (
              <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {declineError}
              </Text>
            )}
            <HireActionButton
              label={busy ? t('workDetail.sending') : t('workDetail.send')}
              size="large"
              loading={busy}
              disabled={!trimmedReason || busy}
              onPress={doDecline}
            />
            <HireActionButton label={t('workDetail.cancel')} variant="secondary" disabled={busy} onPress={() => setDeclineOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <MaterialViewer material={viewing} onClose={() => setViewing(null)} />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  identityText: { flex: 1, gap: 2 },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, lineHeight: 32, color: D.onSurface },
  sub: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurfaceVariant },
  text: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 26, color: D.onSurface },

  notice: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onPrimary,
    backgroundColor: D.primary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, lineHeight: 22, color: '#ba1a1a' },
  statusDone: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.primary },
  statusWaiting: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSecondaryContainer,
    backgroundColor: D.secondaryContainer,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  previous: {
    gap: 4,
    backgroundColor: D.clayContainer,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  previousTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onClayContainer },

  section: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, lineHeight: 26, color: D.onSurface },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64 },
  pressed: { opacity: 0.8 },
  thumb: { width: 64, height: 64, borderRadius: Radii.md, backgroundColor: D.surfaceVariant },
  thumbFile: { alignItems: 'center', justifyContent: 'center' },
  fileName: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: D.onSurface },
  audioRow: { gap: 4 },

  starsRow: { flexDirection: 'row', gap: 4 },
  starBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: D.outline,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
    textAlignVertical: 'top',
    backgroundColor: D.surfaceContainerLowest,
  },
  reasonInput: { minHeight: 140 },
  counter: { alignSelf: 'flex-end', fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  footer: {
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: D.surfaceContainerLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.outlineVariant,
  },

  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: D.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
  },
});

export default WorkDetailScreen;
