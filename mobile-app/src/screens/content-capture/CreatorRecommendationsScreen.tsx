import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Languages,
  MapPin,
  SearchX,
  Square,
  Tag,
  Volume2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ConfirmDialog, Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  CreatorProfileSheet,
  ElderNavDrawer,
  HireActionButton,
  RecommendedCreatorCard,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { choiceKey, useCreatorRecommendations } from '../../hooks/useCreatorRecommendations';
import { useHireStrings } from '../../hooks/useHireStrings';
import type {
  OpportunityRecommendations,
  RecommendationOpportunitySummary,
  RecommendedCreator,
} from '../../types/creatorRecommendation';
import { resolveOpportunityImage } from '../../utils/opportunityImages';
import { Typography, Spacing, Radii } from '../../theme';

interface CreatorRecommendationsScreenProps {
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/** A choose action waiting on the elder's "Yes, choose". */
interface PendingChoice {
  opportunity: RecommendationOpportunitySummary;
  creator: RecommendedCreator;
}

/**
 * Content Creator Recommendation ("Hire a Creator" in the elder drawer).
 *
 * The elder records an audio description of an opportunity; an admin
 * structures and publishes it (location, date, category, language…). For
 * each of the elder's opportunities that is still open, this screen shows
 * its own section: the opportunity itself, a highlighted "Best match" with
 * the reasons behind it, then other good matches. Recommendations for
 * different opportunities are never mixed, and completed/closed ones never
 * appear.
 *
 * Designed for older readers: large, heavy-enough type (no italics, nothing
 * under 16dp for content), high-contrast colours, one idea per line, big
 * touch targets, a confirmation before anything is committed, and a "Listen
 * to this page" button near the top that reads everything aloud in the
 * elder's own language.
 */
export const CreatorRecommendationsScreen: React.FC<CreatorRecommendationsScreenProps> = ({
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const { t, formatDate, formatRating, speechLang } = useHireStrings();
  const {
    sections,
    loading,
    refreshing,
    loadError,
    busyKey,
    actionErrorFor,
    chosen,
    choose,
    clearActionError,
    refresh,
    reload,
  } = useCreatorRecommendations();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profile, setProfile] = useState<PendingChoice | null>(null);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Never keep talking after the elder has left the screen.
  useEffect(() => () => void Speech.stop(), []);

  const describeCreator = (creator: RecommendedCreator) => {
    const parts = [creator.name];
    if (creator.matchPercentage != null) parts.push(t('recommend.matchPercent', { percent: creator.matchPercentage }));
    if (creator.rating != null) parts.push(t('applicants.rating', { rating: formatRating(creator.rating) }));
    parts.push(t('recommend.completedJobs', { count: creator.completedJobs }));
    if (creator.specialty) parts.push(creator.specialty);
    return parts.join('. ');
  };

  const buildSpokenPage = () => {
    const lines = [t('recommend.heading'), t('recommend.intro')];
    if (sections.length === 0) {
      lines.push(t('recommend.empty.body'));
    }
    sections.forEach(({ opportunity, bestMatch, others }, index) => {
      lines.push(t('recommend.speech.opportunity', { index: index + 1, title: opportunity.title }));
      const names = others.map((creator) => creator.name).join(', ');
      if (bestMatch) {
        lines.push(t('recommend.speech.best', { name: describeCreator(bestMatch) }));
        if (bestMatch.reasons.length > 0) lines.push(`${t('recommend.whyTitle')}: ${bestMatch.reasons.join('. ')}.`);
        if (others.length > 0) lines.push(t('recommend.speech.others', { names }));
      } else if (others.length > 0) {
        lines.push(t('recommend.noBestMatch'));
        lines.push(t('recommend.speech.recommended', { names }));
      } else {
        lines.push(t('recommend.noMatchForOpportunity'));
      }
    });
    return lines.join(' ');
  };

  const toggleListen = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(buildSpokenPage(), {
      language: speechLang,
      rate: 0.9, // a touch slower than default — easier to follow
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  // Choosing always goes through a confirmation — one stray tap must never commit.
  const askToChoose = (opportunity: RecommendationOpportunitySummary, creator: RecommendedCreator) => {
    clearActionError();
    setProfile(null);
    setPendingChoice({ opportunity, creator });
  };

  const confirmChoice = async () => {
    const choice = pendingChoice;
    if (!choice) return;
    setPendingChoice(null);
    Speech.stop();
    setSpeaking(false);
    if (await choose(choice.opportunity.opportunityId, choice.creator)) {
      AccessibilityInfo.announceForAccessibility(t('recommend.chosen', { name: choice.creator.name }));
    }
  };

  const showEmpty = !loading && !loadError && sections.length === 0;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />

      <Header
        title={t('recommend.headerTitle')}
        onMenuPress={() => setDrawerVisible(true)}
        menuLabel={t('common.openMenu')}
        notificationLabel={t('common.notifications')}
      />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={D.primary} colors={[D.primary]} />
        }
      >
        <View style={s.heading}>
          <Text style={s.title} accessibilityRole="header">
            {t('recommend.heading')}
          </Text>
          <Text style={s.intro}>{t('recommend.intro')}</Text>
        </View>

        <HireActionButton
          label={speaking ? t('recommend.stopListening') : t('recommend.listen')}
          icon={speaking ? Square : Volume2}
          variant="neutral"
          onPress={toggleListen}
          disabled={loading}
        />

        {loading && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel={t('common.loading')} />
          </View>
        )}

        {loadError && !loading && (
          <View style={s.centered}>
            <View style={s.iconWrap}>
              <CircleAlert size={34} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
            <Text style={s.stateTitle}>{t('recommend.loadError.title')}</Text>
            <Text style={s.stateBody}>{t('recommend.loadError.body')}</Text>
            <HireActionButton label={t('common.retry')} size="large" onPress={reload} style={s.stateBtn} />
          </View>
        )}

        {showEmpty && (
          <View style={s.centered}>
            <View style={[s.iconWrap, s.iconWrapCalm]}>
              <SearchX size={34} color={D.primary} strokeWidth={2} />
            </View>
            <Text style={s.stateTitle}>{t('recommend.empty.title')}</Text>
            <Text style={s.stateBody}>{t('recommend.empty.body')}</Text>
          </View>
        )}

        {sections.map((section, index) => (
          <OpportunitySection
            key={section.opportunity.opportunityId}
            section={section}
            index={index}
            total={sections.length}
            busyKey={busyKey}
            chosenCreator={chosen[section.opportunity.opportunityId] ?? null}
            actionError={actionErrorFor === section.opportunity.opportunityId}
            formatDate={formatDate}
            t={t}
            onChoose={(creator) => askToChoose(section.opportunity, creator)}
            onViewProfile={(creator) => setProfile({ opportunity: section.opportunity, creator })}
          />
        ))}
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <CreatorProfileSheet
        creator={profile?.creator ?? null}
        busy={!!profile && busyKey === choiceKey(profile.opportunity.opportunityId, profile.creator.creatorId)}
        onClose={() => setProfile(null)}
        onChoose={(creator) => profile && askToChoose(profile.opportunity, creator)}
      />

      <ConfirmDialog
        visible={pendingChoice !== null}
        title={t('recommend.confirm.title', { name: pendingChoice?.creator.name ?? '' })}
        message={t('recommend.confirm.body', {
          name: pendingChoice?.creator.name ?? '',
          title: pendingChoice?.opportunity.title ?? '',
        })}
        confirmLabel={t('recommend.confirm.yes')}
        cancelLabel={t('recommend.confirm.no')}
        onCancel={() => setPendingChoice(null)}
        onConfirm={confirmChoice}
      />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="hire"
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// One opportunity and its own recommended creators
// ─────────────────────────────────────────────────────────────────────────────
interface OpportunitySectionProps {
  section: OpportunityRecommendations;
  index: number;
  total: number;
  busyKey: string | null;
  /** Who the elder chose for this opportunity during this visit — locks the section. */
  chosenCreator: RecommendedCreator | null;
  actionError: boolean;
  formatDate: (iso: string) => string;
  t: ReturnType<typeof useHireStrings>['t'];
  onChoose: (creator: RecommendedCreator) => void;
  onViewProfile: (creator: RecommendedCreator) => void;
}

const OpportunitySection: React.FC<OpportunitySectionProps> = ({
  section,
  index,
  total,
  busyKey,
  chosenCreator,
  actionError,
  formatDate,
  t,
  onChoose,
  onViewProfile,
}) => {
  const { opportunity, bestMatch, others } = section;
  const locked = busyKey !== null || chosenCreator !== null;
  const isBusy = (creator: RecommendedCreator) =>
    busyKey === choiceKey(opportunity.opportunityId, creator.creatorId);

  const image = resolveOpportunityImage(opportunity.heroImageUrl);
  const scheduled = opportunity.scheduledDate ? formatDate(opportunity.scheduledDate) : '';

  const facts: { icon: LucideIcon; text: string }[] = [];
  if (opportunity.category) facts.push({ icon: Tag, text: opportunity.category });
  if (opportunity.location) facts.push({ icon: MapPin, text: opportunity.location });
  if (scheduled) facts.push({ icon: CalendarDays, text: t('recommend.scheduled', { date: scheduled }) });
  if (opportunity.language) facts.push({ icon: Languages, text: opportunity.language });

  return (
    <View style={[s.section, index > 0 && s.sectionDivided]}>
      {total > 1 && (
        <Text style={s.counter} accessibilityRole="header">
          {t('recommend.opportunityCount', { index: index + 1, total })}
        </Text>
      )}

      <View
        style={s.opportunityCard}
        accessible
        accessibilityLabel={`${t('recommend.yourOpportunity')}: ${opportunity.title}. ${facts.map((f) => f.text).join(', ')}`}
      >
        {image && <Image source={image} style={s.opportunityImage} resizeMode="cover" />}
        <View style={s.opportunityBody}>
          <Text style={s.opportunityLabel}>{t('recommend.yourOpportunity')}</Text>
          <Text style={s.opportunityTitle}>{opportunity.title}</Text>
          {facts.length > 0 && (
            <View style={s.facts}>
              {facts.map(({ icon: Icon, text }) => (
                <View key={text} style={s.fact}>
                  <Icon size={20} color={D.primary} strokeWidth={2.25} />
                  <Text style={s.factText}>{text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {chosenCreator && (
        <View style={s.successBanner} accessibilityLiveRegion="polite">
          <CircleCheck size={26} color={D.onPrimary} strokeWidth={2.25} />
          <Text style={s.successText}>{t('recommend.chosen', { name: chosenCreator.name })}</Text>
        </View>
      )}

      {actionError && (
        <Text style={s.actionError} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {t('recommend.actionError')}
        </Text>
      )}

      {!bestMatch && others.length === 0 && (
        <View style={s.noMatch}>
          <SearchX size={24} color={D.primary} strokeWidth={2} />
          <Text style={s.noMatchText}>{t('recommend.noMatchForOpportunity')}</Text>
        </View>
      )}

      {bestMatch && (
        <RecommendedCreatorCard
          creator={bestMatch}
          variant="best"
          busy={isBusy(bestMatch)}
          locked={locked}
          onChoose={onChoose}
          onViewProfile={onViewProfile}
        />
      )}

      {others.length > 0 && (
        <View style={s.others}>
          <Text style={s.othersTitle} accessibilityRole="header">
            {bestMatch ? t('recommend.others') : t('recommend.recommended')}
          </Text>
          {!bestMatch && <Text style={s.noBestNote}>{t('recommend.noBestMatch')}</Text>}
          {others.map((creator) => (
            <RecommendedCreatorCard
              key={creator.creatorId}
              creator={creator}
              busy={isBusy(creator)}
              locked={locked}
              onChoose={onChoose}
              onViewProfile={onViewProfile}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  flex: { flex: 1 },

  content: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },

  heading: { gap: Spacing.sm },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: 28,
    lineHeight: 36,
    color: D.onSurface,
  },
  intro: {
    fontFamily: Typography.fontBody,
    fontSize: 17,
    lineHeight: 26,
    color: D.onSurfaceVariant,
  },

  // ── Opportunity section ─────────────────────────────────────────────────
  section: { gap: Spacing.md, marginTop: Spacing.sm },
  // A clear break between opportunities so their recommendations never blur together.
  sectionDivided: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: D.outlineVariant,
  },
  counter: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.secondary,
    letterSpacing: 0.3,
  },

  opportunityCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    borderStartWidth: 5,
    borderStartColor: D.secondaryContainer,
    overflow: 'hidden',
  },
  opportunityImage: { width: '100%', aspectRatio: 16 / 7 },
  opportunityBody: { padding: Spacing.md, gap: 6 },
  opportunityLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.secondary,
  },
  opportunityTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 20,
    lineHeight: 28,
    color: D.onSurface,
  },
  facts: { gap: Spacing.sm, marginTop: 4 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  factText: {
    flex: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurface,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: D.primary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  successText: {
    flex: 1,
    fontFamily: Typography.fontBodySemi,
    fontSize: 17,
    lineHeight: 24,
    color: D.onPrimary,
  },
  actionError: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: '#ba1a1a',
    textAlign: 'center',
  },

  noMatch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(15,92,92,0.08)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  noMatchText: {
    flex: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
  },

  others: { gap: Spacing.md },
  noBestNote: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
    marginTop: -Spacing.sm,
  },
  othersTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    lineHeight: 30,
    color: D.onSurface,
  },

  // ── Page states ─────────────────────────────────────────────────────────
  centered: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapCalm: { backgroundColor: 'rgba(15,92,92,0.12)' },
  stateTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: D.onSurface,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: Typography.fontBody,
    fontSize: 17,
    lineHeight: 26,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
  stateBtn: { alignSelf: 'stretch', marginTop: Spacing.md },
});

export default CreatorRecommendationsScreen;
