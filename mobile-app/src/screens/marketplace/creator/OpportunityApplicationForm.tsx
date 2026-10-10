import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { opportunityApi } from '../../../services/api/opportunityApi';
import { profileApi } from '../../../services/api/profileApi';
import { cityApi } from '../../../services/api/cityApi';
import { creatorProfileApi } from '../../../services/api/creatorProfileApi';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import type { OpportunityDetailResponse } from '../../../types/opportunity';
import type { City } from '../../../types/city';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';
import { resolveImageUrl } from '../../../constants/api';
import { LanguagePicker } from '../../../components/module-specific/marketplace/LanguagePicker';
import {
  languageMissingLevel,
  selectionFromLanguages,
  toLanguageRequests,
  toWireFormat,
} from '../../../utils/creatorLanguages';
import type { LanguageSelection } from '../../../utils/creatorLanguages';

// Shown when an opportunity has no picture of its own, or its picture cannot be loaded.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
interface OptionGroup {
  title: string;
  items: string[];
}

const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

/**
 * The opportunity doesn't carry a "required skills" or "equipment" field on
 * the backend yet, so these checklists are static/illustrative for now —
 * matching the mockup — rather than derived from real per-opportunity data.
 */
const SKILL_GROUPS: OptionGroup[] = [
  { title: 'Capture', items: ['Photography', 'Videography', 'Audio Recording'] },
  { title: 'Edit', items: ['Basic Video Editing', 'Photo Editing'] },
  {
    title: 'Research & writing',
    items: ['Oral History Interviewing', 'Documentation & Report Writing', 'Translation & Transcription'],
  },
];

const EQUIPMENT_GROUPS: OptionGroup[] = [
  { title: 'Cameras', items: ['DSLR / Mirrorless Camera', 'Smartphone Camera'] },
  { title: 'Sound', items: ['Microphone (Lavalier / Shotgun)', 'Portable Audio Recorder'] },
  { title: 'Support', items: ['Tripod', 'Portable Lighting Kit', 'Laptop for Editing'] },
];

function formatScheduledDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons — same outline style/colour as OpportunityDetailPage's
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const PhoneIcon: React.FC<IconProps> = ({ size = 14, color = D.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </Svg>
);

const ArrowRightIcon: React.FC<IconProps> = ({ size = 11, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </Svg>
);

const ClockCircleIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="12 7 12 12 15 15" />
  </Svg>
);

const CheckMark: React.FC<{ color?: string }> = ({ color = '#ffffff' }) => (
  <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Avatar - the creator's photo, or their initials when they have none
// ─────────────────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; photoUrl: string | null }> = ({ name, photoUrl }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
  return photoUrl ? (
    <Image source={{ uri: photoUrl }} style={s.avatar} accessibilityLabel={`${name} photo`} />
  ) : (
    <View style={[s.avatar, s.avatarFallback]} accessibilityLabel={`${name} initials`}>
      <Text style={s.avatarInitials}>{initials || '?'}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TextField - a roomy writing box: accent edge, teal ring while typing, and a live character count
// ─────────────────────────────────────────────────────────────────────────────
const TEXT_FIELD_MAX = 600;

const TextField: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label: string;
}> = ({ value, onChangeText, placeholder, label }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.fieldCard, focused && s.fieldCardFocused]}>
      <View style={[s.fieldAccent, focused && s.fieldAccentFocused]} />
      <View style={s.fieldBody}>
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={D.onSurfaceVariant}
          multiline
          maxLength={TEXT_FIELD_MAX}
          textAlignVertical="top"
          accessibilityLabel={label}
        />
        <Text style={s.fieldCount}>{`${value.length}/${TEXT_FIELD_MAX}`}</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OptionTile - one pick-any choice: a rounded box with a checkbox, 56pt tall so it is easy to hit
// ─────────────────────────────────────────────────────────────────────────────
const OptionTile: React.FC<{ label: string; selected: boolean; onToggle: () => void }> = ({
  label,
  selected,
  onToggle,
}) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [s.tile, selected && s.tileSelected, pressed && s.pressed]}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={label}
  >
    <View style={[s.tileBox, selected && s.tileBoxSelected]}>{selected && <CheckMark />}</View>
    <Text style={[s.tileText, selected && s.tileTextSelected]} numberOfLines={3}>{label}</Text>
  </Pressable>
);

/** Options under small group headings, two tiles to a row - one card per section. */
const OptionGroups: React.FC<{
  groups: OptionGroup[];
  selected: Record<string, boolean>;
  onToggle: (item: string) => void;
}> = ({ groups, selected, onToggle }) => (
  <View style={s.groupsCard}>
    {groups.map((group) => (
      <View key={group.title} style={s.groupBlock}>
        <Text style={s.groupTitle}>{group.title}</Text>
        <View style={s.tileGrid}>
          {group.items.map((item) => (
            <OptionTile key={item} label={item} selected={!!selected[item]} onToggle={() => onToggle(item)} />
          ))}
        </View>
      </View>
    ))}
  </View>
);

const SectionHeader: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <View style={s.sectionHeaderRow}>
    <Text style={s.sectionTitle}>{title}</Text>
    {!!hint && <Text style={s.sectionHint}>{hint}</Text>}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunityApplicationForm: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onSave: () => void;
  opportunityId: string | null;
}> = ({ onNavigate, onBack, onSave, opportunityId }) => {
  // Null until each real fetch resolves — no fallback/mock data; a genuine
  // failure surfaces as an error state instead of invented content.
  const [detail, setDetail] = useState<OpportunityDetailResponse | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cityObj, setCityObj] = useState<City | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [experienceText, setExperienceText] = useState('');
  const [approachText, setApproachText] = useState('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, boolean>>({});
  const [languages, setLanguages] = useState<LanguageSelection>({});
  const [heroFailed, setHeroFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  // "Edit Your Details" — full name + city only. Phone/NIC stay on their own
  // OTP-verified change flow (see AccountSecurityController), so this form
  // never touches them directly.
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCityId, setEditCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [cityListOpen, setCityListOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setHeroFailed(false);
    if (!opportunityId) {
      setLoadError('No opportunity was selected.');
      return;
    }
    opportunityApi
      .getById(opportunityId)
      .then(setDetail)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load this opportunity.'));

    // A creator applies to a given opportunity at most once — if they
    // already have a draft (or even a submitted application) for it, restore
    // what they'd already filled in instead of starting blank. Not found
    // (null data, no throw) simply means they're starting fresh.
    opportunityApplicationApi
      .getByOpportunity(opportunityId)
      .then(async (existing) => {
        if (existing) {
          setSelectedSkills(Object.fromEntries(existing.skills.map((k) => [k, true])));
          setExperienceText(existing.experienceText ?? '');
          setApproachText(existing.approachText ?? '');
          setAvailabilityConfirmed(existing.availabilityConfirmed);
          setSelectedEquipment(Object.fromEntries(existing.equipment.map((k) => [k, true])));
          if (existing.languages?.length) {
            setLanguages(selectionFromLanguages(existing.languages));
            return;
          }
        }
        // Nothing saved for this opportunity yet: start from the languages already on the
        // creator's own profile, so they only have to adjust them.
        const profile = await creatorProfileApi.getMine().catch(() => null);
        if (profile?.languages?.length) {
          setLanguages(selectionFromLanguages(profile.languages));
        }
      })
      .catch(() => {});
  }, [opportunityId]);

  useEffect(() => {
    profileApi
      .getMe()
      .then((me) => {
        setName(me.fullName);
        setPhone(me.phoneNumber || '—');
        setPhotoUrl(resolveImageUrl(me.profilePhotoUrl));
        setCityObj(me.city);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load your profile.'));
  }, []);

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));

  const toggleEquipment = (item: string) =>
    setSelectedEquipment((prev) => ({ ...prev, [item]: !prev[item] }));

  const openEditDetails = () => {
    setEditName(name ?? '');
    setEditCityId(cityObj?.id ?? null);
    setCityListOpen(false);
    setEditVisible(true);
    if (cities.length === 0) {
      cityApi.getAll().then(setCities).catch(() => {});
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await profileApi.updateMe({ fullName: editName.trim(), cityId: editCityId });
      setName(updated.fullName);
      setCityObj(updated.city);
      setEditVisible(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update your details.';
      Alert.alert('Update failed', message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!opportunityId) {
      Alert.alert('Cannot save', 'No opportunity is selected.');
      return;
    }

    const missingLevel = languageMissingLevel(languages);
    if (missingLevel) {
      Alert.alert('Language level needed', `Choose how well you speak ${missingLevel}, or untick it.`);
      return;
    }

    setSaving(true);
    try {
      await opportunityApplicationApi.saveDraft({
        opportunityId,
        skills: Object.keys(selectedSkills).filter((k) => selectedSkills[k]),
        experienceText,
        approachText,
        availabilityConfirmed,
        equipment: Object.keys(selectedEquipment).filter((k) => selectedEquipment[k]),
        languages: toWireFormat(toLanguageRequests(languages)),
      });
      Alert.alert('Application saved', 'Your application draft has been saved.', [
        { text: 'OK', onPress: onSave },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save your application.';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  };

  // Held back until every fetch above settles — real data only, no
  // fallback/mock content, and a genuine failure shows as an error state.
  if (loadError) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>{loadError}</Text>
        </View>
        <BottomNavBar activeTab="market" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // cityObj is intentionally excluded here — a creator with no city set is a valid loaded state, not a pending fetch.
  if (!detail || name === null || phone === null) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>Loading…</Text>
        </View>
        <BottomNavBar activeTab="market" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  const availabilityText = detail.scheduledDate
    ? `${formatScheduledDate(detail.scheduledDate)}${detail.timeWindowText ? `, ${detail.timeWindowText}` : ''}`
    : (detail.timeWindowText ?? '—');

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.headingBlock}>
          <Text style={s.pageHeading}>Apply to Opportunity</Text>
          <Text style={s.pageSubtitle}>Tell the knowledge holder why you are the right person for this work.</Text>
        </View>

        {/* Opportunity summary card */}
        <View style={s.card}>
          <View style={s.summaryRow}>
            <Image
              source={(heroFailed ? undefined : resolveOpportunityImage(detail.heroImageUrl)) ?? GENERIC_HERO_IMAGE}
              style={s.thumbnail}
              accessibilityLabel={detail.title}
              resizeMode="cover"
              onError={() => setHeroFailed(true)}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.summaryTitle} numberOfLines={3}>{detail.title}</Text>
              <Text style={s.elderName}>{detail.elderName}</Text>
              {detail.location && (
                <View style={s.metaInline}>
                  <PinIcon />
                  <Text style={s.metaInlineText}>{detail.location}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.dateStipendStrip}>
            <View style={s.metaInline}>
              <CalendarIcon />
              <Text style={s.stripText}>{formatScheduledDate(detail.scheduledDate)}</Text>
            </View>
            <View style={s.metaInline}>
              <CardIcon />
              <Text style={s.stripText}>{`LKR ${Math.round(detail.offeredAmount).toLocaleString('en-US')}`}</Text>
            </View>
          </View>

          <Pressable
            onPress={onBack}
            style={({ pressed }) => [s.viewOpportunityRow, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View opportunity details"
          >
            <Text style={s.viewOpportunityText}>View Opportunity</Text>
            <ArrowRightIcon />
          </Pressable>
        </View>

        {/* Your Details */}
        <View style={s.section}>
          <SectionHeader title="Your Details" hint="Sent with your application" />
          <View style={s.profileCard}>
            <View style={s.profileTop}>
              <Avatar name={name} photoUrl={photoUrl} />
              <View style={s.profileNameBlock}>
                <Text style={s.detailsName} numberOfLines={2}>{name}</Text>
                <Text style={s.profileRole}>Content Creator</Text>
              </View>
              <Pressable
                onPress={openEditDetails}
                style={({ pressed }) => [s.editProfilePill, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Edit your details"
              >
                <Text style={s.editProfileText}>Edit Profile</Text>
              </Pressable>
            </View>

            <View style={s.profileDivider} />

            <View style={s.detailRow}>
              <View style={s.detailIcon}><PhoneIcon /></View>
              <Text style={s.detailText}>{phone}</Text>
            </View>
            <View style={s.detailRow}>
              <View style={s.detailIcon}><PinIcon size={14} color={D.primary} /></View>
              <Text style={s.detailText}>{cityObj?.name ?? 'No city set'}</Text>
            </View>
          </View>
        </View>

        {/* Relevant Skill */}
        <View style={s.section}>
          <SectionHeader
            title="Relevant Skill"
            hint={`${Object.values(selectedSkills).filter(Boolean).length} selected`}
          />
          <OptionGroups groups={SKILL_GROUPS} selected={selectedSkills} onToggle={toggleSkill} />
        </View>

        {/* Languages - the same picker the "Become a Content Creator" form uses */}
        <View style={s.section}>
          <SectionHeader title="Languages" hint="Which can you work in?" />
          <View style={s.card}>
            <LanguagePicker value={languages} onChange={setLanguages} />
          </View>
        </View>

        {/* Relevant Experience */}
        <View style={s.section}>
          <SectionHeader title="Relevant Experience" hint="Past work, in your own words" />
          <TextField
            label="Relevant experience"
            value={experienceText}
            onChangeText={setExperienceText}
            placeholder="Tell the knowledge holder about similar work you have done."
          />
        </View>

        {/* Approach */}
        <View style={s.section}>
          <SectionHeader title="Approach" hint="Your plan, step by step" />
          <TextField
            label="Approach"
            value={approachText}
            onChangeText={setApproachText}
            placeholder="How will you approach this documentation work."
          />
        </View>

        {/* Availability */}
        <View style={s.section}>
          <SectionHeader title="Availability" />
          <View style={s.card}>
            <View style={s.availabilityRow}>
              <View style={s.availabilityBadge}>
                <ClockCircleIcon />
              </View>
              <Text style={s.availabilityText}>{availabilityText}</Text>
            </View>
            <Pressable
              onPress={() => setAvailabilityConfirmed((v) => !v)}
              style={({ pressed }) => [s.confirmRow, availabilityConfirmed && s.confirmRowOn, pressed && s.pressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: availabilityConfirmed }}
              accessibilityLabel="I'm available at this time."
            >
              <View style={[s.confirmBox, availabilityConfirmed && s.confirmBoxOn]}>
                {availabilityConfirmed && <CheckMark />}
              </View>
              <Text style={[s.confirmText, availabilityConfirmed && s.confirmTextOn]}>
                {"I'm available at this time."}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Equipment */}
        <View style={s.section}>
          <SectionHeader
            title="Equipment"
            hint={`${Object.values(selectedEquipment).filter(Boolean).length} selected`}
          />
          <OptionGroups groups={EQUIPMENT_GROUPS} selected={selectedEquipment} onToggle={toggleEquipment} />
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [s.discardBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Discard application"
          >
            <Text style={s.discardBtnText}>Discard</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [s.saveBtn, pressed && s.saveBtnPressed, saving && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Save application"
          >
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />

      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Edit Your Details</Text>

            <Text style={s.modalLabel}>Full Name</Text>
            <TextInput
              style={s.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={D.onSurfaceVariant}
            />

            <Text style={s.modalLabel}>City</Text>
            <Pressable
              style={({ pressed }) => [s.citySelector, pressed && s.pressed]}
              onPress={() => setCityListOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Select your city"
            >
              <Text style={s.citySelectorText}>
                {cities.find((c) => c.id === editCityId)?.name ?? 'Select your city'}
              </Text>
            </Pressable>
            {cityListOpen && (
              <ScrollView style={s.cityListBox} nestedScrollEnabled>
                {cities.map((c) => (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [s.cityListRow, pressed && s.pressed]}
                    onPress={() => {
                      setEditCityId(c.id);
                      setCityListOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                  >
                    <Text style={[s.cityListRowText, c.id === editCityId && s.cityListRowTextActive]}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Text style={s.modalLabel}>Phone Number</Text>
            <Text style={s.modalPhoneReadOnly}>{phone}</Text>
            <Text style={s.modalPhoneNote}>
              Phone numbers are changed separately with SMS verification, from Profile → Privacy & Security.
            </Text>

            <View style={s.modalBtnRow}>
              <Pressable
                onPress={() => setEditVisible(false)}
                style={({ pressed }) => [s.modalBtnCancel, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <Text style={s.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={({ pressed }) => [s.modalBtnSave, pressed && s.saveBtnPressed, savingProfile && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Save your details"
              >
                <Text style={s.modalBtnSaveText}>{savingProfile ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OpportunityApplicationForm;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ──────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surface,
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

  headingBlock: { gap: 4 },
  pageHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    lineHeight: 28,
    color: D.primary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    lineHeight: 19,
    color: D.onSurfaceVariant,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Section cards ────────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  section: { gap: Spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: 15, color: D.onSurface },
  sectionHint: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: D.onSurfaceVariant },

  // ── Option tiles (skills, equipment) ─────────────────────────────────────
  groupsCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.sm + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm + 4,
  },
  groupBlock: { gap: Spacing.sm },
  groupTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: D.onSurfaceVariant,
  },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.sm },
  tile: {
    width: '48.5%',
    minHeight: 48,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLowest,
  },
  tileSelected: { backgroundColor: '#E3F1F0', borderColor: D.primary },
  tileBox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: D.secondary,
    backgroundColor: D.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  tileBoxSelected: { backgroundColor: D.primary, borderColor: D.primary },
  tileText: {
    flex: 1, fontFamily: Typography.fontBodyMed, fontSize: 12.5, lineHeight: 16, color: D.onSurface,
    includeFontPadding: false, textAlignVertical: 'center',
  },
  tileTextSelected: { fontFamily: Typography.fontBodySemi, color: D.primary },

  // ── Opportunity summary ──────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  thumbnail: {
    width: 92, height: 92, borderRadius: Radii.lg,
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  summaryTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface },
  summaryMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  elderName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaInlineText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  dateStipendStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  stripText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  viewOpportunityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewOpportunityText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary },

  // ── Your Details ─────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderTopWidth: 4,
    borderTopColor: D.primary,
    gap: Spacing.sm,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  profileNameBlock: { flex: 1, gap: 2 },
  profileRole: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: D.onSurfaceVariant },
  profileDivider: { height: StyleSheet.hairlineWidth, backgroundColor: D.surfaceVariant, marginVertical: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: D.surfaceContainerLow },
  avatarFallback: { backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: Typography.fontBodySemi, fontSize: 15, color: '#ffffff' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 32 },
  detailIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#E3F1F0', alignItems: 'center', justifyContent: 'center',
  },
  detailText: { fontFamily: Typography.fontBodyMed, fontSize: 13, color: D.onSurface },
  editProfilePill: {
    borderRadius: Radii.full, borderWidth: 1, borderColor: D.secondary,
    paddingVertical: 4, paddingHorizontal: 12,
  },
  editProfileText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.secondary },
  detailsName: { fontFamily: Typography.fontBodySemi, fontSize: 14, color: D.onSurface },

  // ── Availability ─────────────────────────────────────────────────────────
  availabilityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg, padding: Spacing.sm,
  },
  availabilityBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: D.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  availabilityText: { fontFamily: Typography.fontBodySemi, fontSize: 13, color: D.onSurface, flex: 1 },

  // ── Actions ──────────────────────────────────────────────────────────────
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, paddingTop: Spacing.xs },
  discardBtn: {
    minWidth: 120, paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  discardBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  saveBtn: {
    minWidth: 140, paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },

  // ── Writing boxes (experience, approach) ────────────────────────────────
  fieldCard: {
    flexDirection: 'row',
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: D.surfaceVariant,
    overflow: 'hidden',
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldCardFocused: { borderColor: D.primary, shadowOpacity: 0.18, elevation: 4 },
  fieldAccent: { width: 5, backgroundColor: D.secondary },
  fieldAccentFocused: { backgroundColor: D.primary },
  fieldBody: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 6 },
  fieldInput: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    lineHeight: 20,
    color: D.onSurface,
    minHeight: 84,
    paddingTop: 4,
  },
  fieldCount: {
    alignSelf: 'flex-end',
    fontFamily: Typography.fontBodyMed,
    fontSize: 11,
    color: D.onSurfaceVariant,
  },

  // ── "I'm available" strip - same inset as the time strip above it, so the two line up ──
  confirmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    minHeight: 48, padding: Spacing.sm,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLowest,
  },
  confirmRowOn: { backgroundColor: '#E3F1F0', borderColor: D.primary },
  confirmBox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 1.5, borderColor: D.secondary,
    backgroundColor: D.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBoxOn: { backgroundColor: D.primary, borderColor: D.primary },
  confirmText: { flex: 1, fontFamily: Typography.fontBodyMed, fontSize: 13, color: D.onSurface },
  confirmTextOn: { fontFamily: Typography.fontBodySemi, color: D.primary },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },

  // ── Edit Your Details modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: 6,
  },
  modalTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    marginBottom: 4,
  },
  modalLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
  },
  citySelector: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  citySelectorText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurface },
  cityListBox: {
    maxHeight: 160,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
    marginTop: 6,
  },
  cityListRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
  },
  cityListRowText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurface },
  cityListRowTextActive: { fontFamily: Typography.fontBodySemi, color: D.primary },
  modalPhoneReadOnly: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    paddingVertical: 4,
  },
  modalPhoneNote: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    lineHeight: 16,
    color: D.onSurfaceVariant,
  },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
  modalBtnCancel: {
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  modalBtnCancelText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  modalBtnSave: {
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  modalBtnSaveText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
});
