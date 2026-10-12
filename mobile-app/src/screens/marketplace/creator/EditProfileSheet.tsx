import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepInputVisible } from '../../../hooks/useKeepInputVisible';
import { ApiError } from '../../../services/api/client';
import { cityApi } from '../../../services/api/cityApi';
import { creatorApplicationApi } from '../../../services/api/creatorApplicationApi';
import { profileApi } from '../../../services/api/profileApi';
import { Typography, Spacing, Radii } from '../../../theme';
import type { City } from '../../../types/city';
import type { ExperienceLevel } from '../../../types/creatorApplication';
import type { CreatorProfileData } from '../../../types/creatorProfile';

const C = {
  primary: '#0F5C5C',
  secondary: '#E8792E',
  surface: '#EDEFEE',
  card: '#ffffff',
  onSurface: '#202428',
  onSurfaceVariant: '#4a5568',
  danger: '#C0392B',
  divider: '#c8dcdc',
  selected: '#f0f5f5',
} as const;

const SKILL_SUGGESTIONS = ['Photography', 'Videography', 'Script Writing', 'Transcription', 'Basic Video Editing'];
const INTEREST_SUGGESTIONS = ['Traditional Foods', 'Fishing Heritage', 'Local History', 'Traditional Dance'];

const EXPERIENCE_CHOICES: { key: ExperienceLevel; label: string }[] = [
  { key: 'NEW_TO_DOCUMENTATION', label: 'New to content documentation' },
  { key: 'SOME_EXPERIENCE', label: 'Some experience' },
  { key: 'EXPERIENCED', label: 'Experienced' },
];

const PHONE_PATTERN = /^\+?[0-9]{9,14}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EXTRA_NUMBERS = 3;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/**
 * Skills or interests: tap the suggestions to switch them on or off, and type your own to add something new
 * (e.g. a skill you have just learned). What is switched on is what gets saved.
 */
const TagEditor: React.FC<{
  value: string[];
  suggestions: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}> = ({ value, suggestions, placeholder, onChange }) => {
  const [draft, setDraft] = useState('');
  const has = (tag: string) => value.some((v) => v.toLowerCase() === tag.toLowerCase());
  const toggle = (tag: string) => onChange(has(tag) ? value.filter((v) => v.toLowerCase() !== tag.toLowerCase()) : [...value, tag]);
  const add = () => {
    const tag = draft.trim();
    if (tag && !has(tag)) onChange([...value, tag]);
    setDraft('');
  };
  // Suggestions first, then anything the creator added themselves.
  const shown = [...suggestions, ...value.filter((v) => !suggestions.some((sg) => sg.toLowerCase() === v.toLowerCase()))];

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={s.chipWrap}>
        {shown.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => toggle(tag)}
            style={({ pressed }) => [s.chip, has(tag) && s.chipOn, pressed && { opacity: 0.7 }]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: has(tag) }}
          >
            <Text style={[s.chipText, has(tag) && s.chipTextOn]}>{has(tag) ? `${tag}  \u2713` : tag}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.addRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={C.onSurfaceVariant}
          maxLength={40}
          onSubmitEditing={add}
          returnKeyType="done"
          accessibilityLabel={placeholder}
        />
        <Pressable onPress={add} style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="Add">
          <Text style={s.addBtnText}>+ Add</Text>
        </Pressable>
      </View>
    </View>
  );
};

/**
 * "Edit profile": everything a creator may change about themselves after applying - name and city (their account),
 * contact email and extra phone numbers, about text, skills, interests and experience. The login phone number and
 * NIC are shown but not editable here (changing them needs a verification code). Saves to the backend, then asks
 * the page to reload.
 */
export const EditProfileSheet: React.FC<{
  visible: boolean;
  profile: CreatorProfileData;
  onClose: () => void;
  onSaved: () => void;
}> = ({ visible, profile, onClose, onSaved }) => {
  const owner = profile.ownerDetails;
  const { scrollProps, inputProps, keyboardHeight } = useKeepInputVisible();

  const [name, setName] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [email, setEmail] = useState('');
  const [extraNumbers, setExtraNumbers] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState<ExperienceLevel>('NEW_TO_DOCUMENTATION');
  const [experience, setExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each time it opens, start from what is saved and (once) fetch the list of cities.
  useEffect(() => {
    if (!visible) return;
    setName(profile.name);
    setEmail(owner?.email ?? '');
    setExtraNumbers(owner?.additionalPhoneNumbers ?? []);
    setAbout(profile.aboutYou ?? '');
    setSkills(profile.skills);
    setInterests(profile.interests);
    setLevel(profile.experienceLevel ?? 'NEW_TO_DOCUMENTATION');
    setExperience(profile.experienceDescription ?? '');
    setError(null);
    const pick = (all: City[]) => setCityId(all.find((c) => c.name === profile.city)?.id ?? null);
    if (cities.length > 0) {
      pick(cities);
      return;
    }
    cityApi
      .getAll()
      .then((all) => {
        setCities(all);
        pick(all);
      })
      .catch(() => setError("Couldn't load the list of cities."));
  }, [visible, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const numbers = extraNumbers.map((n) => n.trim()).filter(Boolean);
    if (!name.trim()) return setError('Please enter your full name.');
    if (!EMAIL_PATTERN.test(email.trim())) return setError('Please enter a valid email address.');
    if (numbers.some((n) => !PHONE_PATTERN.test(n))) return setError('Enter phone numbers like +94771234567 (digits only, 9 to 14 long).');
    if (!experience.trim()) return setError('Please tell us a little about your experience.');

    setSaving(true);
    setError(null);
    try {
      await profileApi.updateMe({ fullName: name.trim(), cityId });
      await creatorApplicationApi.updateDetails({
        email: email.trim(),
        aboutYou: about.trim(),
        skills,
        interests,
        experienceLevel: level,
        experienceDescription: experience.trim(),
        additionalPhoneNumbers: numbers,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Edit profile</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel" style={s.closeBtn}>
            <Text style={s.closeText}>Cancel</Text>
          </Pressable>
        </View>

        <ScrollView
          {...scrollProps}
          style={{ flex: 1 }}
          contentContainerStyle={[s.body, { paddingBottom: Spacing.lg + keyboardHeight }]}
          showsVerticalScrollIndicator={false}
        >
          <Section title="Basic details">
            <Text style={s.label}>Full name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={C.onSurfaceVariant}
              autoCapitalize="words"
              accessibilityLabel="Full name"
              {...inputProps('name')}
            />
            <Text style={s.label}>City</Text>
            <View style={s.card}>
              {cities.length === 0 && !error ? (
                <ActivityIndicator color={C.primary} style={{ margin: Spacing.md }} />
              ) : (
                cities.map((city, index) => {
                  const selected = city.id === cityId;
                  return (
                    <Pressable
                      key={city.id}
                      onPress={() => setCityId(city.id)}
                      style={({ pressed }) => [s.cityRow, index > 0 && s.rowDivider, selected && s.rowSelected, pressed && { opacity: 0.7 }]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[s.rowText, selected && s.rowTextSelected]}>{city.name}</Text>
                      {selected && <Text style={s.tick}>{'\u2713'}</Text>}
                    </Pressable>
                  );
                })
              )}
            </View>
          </Section>

          <Section title="Contact">
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email"
              {...inputProps('email')}
            />

            <Text style={s.label}>Phone number</Text>
            <View style={[s.input, s.readOnly]}>
              <Text style={s.readOnlyText}>{owner?.phoneNumber ?? ''}</Text>
            </View>
            <Text style={s.note}>This is the number you log in with. Changing it needs a verification code.</Text>

            {extraNumbers.map((number, index) => (
              <View key={index} style={s.addRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={number}
                  onChangeText={(text) => setExtraNumbers((prev) => prev.map((n, i) => (i === index ? text : n)))}
                  placeholder="+94771234567"
                  placeholderTextColor={C.onSurfaceVariant}
                  keyboardType="phone-pad"
                  accessibilityLabel={`Extra phone number ${index + 1}`}
                  {...inputProps(`phone${index}`)}
                />
                <Pressable
                  onPress={() => setExtraNumbers((prev) => prev.filter((_, i) => i !== index))}
                  style={({ pressed }) => [s.removeBtn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove extra phone number ${index + 1}`}
                >
                  <Text style={s.removeText}>{'\u2715'}</Text>
                </Pressable>
              </View>
            ))}
            {extraNumbers.length < MAX_EXTRA_NUMBERS && (
              <Pressable
                onPress={() => setExtraNumbers((prev) => [...prev, ''])}
                style={({ pressed }) => [s.plusBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Add another phone number"
              >
                <Text style={s.plusText}>+  Add another number</Text>
              </Pressable>
            )}

            {!!profile.maskedNic && (
              <>
                <Text style={s.label}>NIC number</Text>
                <View style={[s.input, s.readOnly]}>
                  <Text style={s.readOnlyText}>{owner?.nicNumber ?? profile.maskedNic}</Text>
                </View>
                <Text style={s.note}>Other people only ever see {profile.maskedNic}. Your NIC cannot be changed here.</Text>
              </>
            )}
          </Section>

          <Section title="About me">
            <TextInput
              style={[s.input, s.multiline]}
              value={about}
              onChangeText={setAbout}
              placeholder="Tell elders a little about yourself"
              placeholderTextColor={C.onSurfaceVariant}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              accessibilityLabel="About me"
              {...inputProps('about')}
            />
          </Section>

          <Section title="My skills">
            <TagEditor value={skills} suggestions={SKILL_SUGGESTIONS} placeholder="Add a new skill" onChange={setSkills} />
          </Section>

          <Section title="Cultural interests">
            <TagEditor value={interests} suggestions={INTEREST_SUGGESTIONS} placeholder="Add a new interest" onChange={setInterests} />
          </Section>

          <Section title="Experience">
            <View style={s.card}>
              {EXPERIENCE_CHOICES.map((choice, index) => {
                const selected = choice.key === level;
                return (
                  <Pressable
                    key={choice.key}
                    onPress={() => setLevel(choice.key)}
                    style={({ pressed }) => [s.cityRow, index > 0 && s.rowDivider, selected && s.rowSelected, pressed && { opacity: 0.7 }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[s.rowText, selected && s.rowTextSelected]}>{choice.label}</Text>
                    {selected && <Text style={s.tick}>{'\u2713'}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={[s.input, s.multiline]}
              value={experience}
              onChangeText={setExperience}
              placeholder="What work have you done? Keep this up to date as you grow."
              placeholderTextColor={C.onSurfaceVariant}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              accessibilityLabel="Experience details"
              {...inputProps('experience')}
            />
          </Section>

          {!!error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
        </ScrollView>

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [s.saveBtn, (pressed || saving) && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={s.saveText}>Save</Text>}
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface, padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXL, color: C.primary },
  closeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  closeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: C.primary },
  body: { gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: C.primary },
  label: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: C.onSurface, marginTop: 4 },
  input: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: C.onSurface,
    backgroundColor: C.card, borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: C.divider,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  multiline: { minHeight: 110 },
  readOnly: { backgroundColor: '#e4efef' },
  readOnlyText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: C.onSurfaceVariant },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, lineHeight: 18, color: C.onSurfaceVariant },
  card: { backgroundColor: C.card, borderRadius: Radii.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.divider },
  cityRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.divider },
  rowSelected: { backgroundColor: C.selected },
  rowText: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: C.onSurface },
  rowTextSelected: { fontFamily: Typography.fontBodySemi, color: C.primary },
  tick: { fontSize: 18, color: C.primary },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  addBtn: { minHeight: 48, paddingHorizontal: Spacing.md, borderRadius: Radii.lg, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  removeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDECEA' },
  removeText: { fontSize: 16, color: C.danger },
  plusBtn: { minHeight: 44, justifyContent: 'center' },
  plusText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: C.secondary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: Radii.full, backgroundColor: C.card, borderWidth: StyleSheet.hairlineWidth, borderColor: C.divider },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: C.onSurfaceVariant },
  chipTextOn: { color: '#ffffff' },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: C.danger },
  saveBtn: { minHeight: 52, borderRadius: Radii.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ffffff' },
});

export default EditProfileSheet;
