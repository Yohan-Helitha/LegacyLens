import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../../services/api/client';
import { cityApi } from '../../../services/api/cityApi';
import { profileApi } from '../../../services/api/profileApi';
import { Typography, Spacing, Radii } from '../../../theme';
import type { City } from '../../../types/city';

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

/**
 * Lets the creator change the details their own account allows without a verification code: their full name and
 * city. Phone number and NIC stay on their own verified change flows. Saves to the backend, then tells the page
 * to reload so everything shows the new values.
 */
export const EditProfileSheet: React.FC<{
  visible: boolean;
  currentName: string;
  currentCityName: string | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ visible, currentName, currentCityName, onClose, onSaved }) => {
  const [name, setName] = useState(currentName);
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each time it opens, start from what is saved and (once) fetch the list of cities.
  useEffect(() => {
    if (!visible) return;
    setName(currentName);
    setError(null);
    if (cities.length > 0) {
      setCityId(cities.find((c) => c.name === currentCityName)?.id ?? null);
      return;
    }
    cityApi
      .getAll()
      .then((all) => {
        setCities(all);
        setCityId(all.find((c) => c.name === currentCityName)?.id ?? null);
      })
      .catch(() => setError("Couldn't load the list of cities."));
  }, [visible, currentName, currentCityName]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await profileApi.updateMe({ fullName: name.trim(), cityId });
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

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={s.label}>Full name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={C.onSurfaceVariant}
              autoCapitalize="words"
              accessibilityLabel="Full name"
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
                      style={({ pressed }) => [s.cityRow, index > 0 && s.cityRowDivider, selected && s.cityRowSelected, pressed && { opacity: 0.7 }]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[s.cityText, selected && s.cityTextSelected]}>{city.name}</Text>
                      {selected && <Text style={s.tick}>{'\u2713'}</Text>}
                    </Pressable>
                  );
                })
              )}
            </View>

            <Text style={s.note}>To change your phone number or NIC, use the verified change in Settings.</Text>
            {!!error && <Text style={s.error}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>

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
  body: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  label: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: C.onSurface, marginTop: Spacing.sm },
  input: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: C.onSurface,
    backgroundColor: C.card, borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: C.divider,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  card: { backgroundColor: C.card, borderRadius: Radii.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.divider },
  cityRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  cityRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.divider },
  cityRowSelected: { backgroundColor: C.selected },
  cityText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: C.onSurface },
  cityTextSelected: { fontFamily: Typography.fontBodySemi, color: C.primary },
  tick: { fontSize: 18, color: C.primary },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, lineHeight: 18, color: C.onSurfaceVariant, marginTop: Spacing.sm },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: C.danger },
  saveBtn: { minHeight: 52, borderRadius: Radii.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ffffff' },
});

export default EditProfileSheet;
