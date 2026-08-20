import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { StatusBar } from 'expo-status-bar';
import {
  Landmark,
  ChevronDown,
  Calendar,
  Lock,
  Search,
  X,
  Check,
} from 'lucide-react-native';
import { cityApi } from '../../services/api/cityApi';
import { ApiError } from '../../services/api/client';
import { City } from '../../types/city';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
/** Locally-validated signup fields, carried forward through SetPhoto/SetPin — the
 *  actual POST /api/auth/register call happens once a PIN is set, since the
 *  backend requires the PIN as part of registration itself. */
export interface SignUpDetails {
  fullName: string;
  phone: string;
  /** ISO 8601, e.g. "1998-04-12" */
  dateOfBirth: string;
  nic: string;
  cityId: number;
}

interface SignUpScreenProps {
  /** Called once the form passes local validation, with the normalized details */
  onContinue?: (details: SignUpDetails) => void;
  /** Navigate back to login */
  onLogin?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

/** Parses "mm/dd/yyyy" into an ISO date string, rejecting impossible calendar
 *  dates (JS Date silently rolls those over, e.g. 02/30 -> 03/02) and future
 *  dates, matching the backend's @Past validation. */
const parseDobToIso = (mmddyyyy: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(mmddyyyy);
  if (!match) return null;

  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate || date.getTime() >= Date.now()) return null;

  return `${yyyy}-${mm}-${dd}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// City Selection Modal Subcomponent
// ─────────────────────────────────────────────────────────────────────────────
interface CityModalProps {
  visible: boolean;
  cities: City[];
  loading: boolean;
  error: string | null;
  selectedCityId: number | null;
  onSelect: (city: City) => void;
  onClose: () => void;
  onRetry: () => void;
}

const CitySelectionModal: React.FC<CityModalProps> = ({
  visible,
  cities,
  loading,
  error,
  selectedCityId,
  onSelect,
  onClose,
  onRetry,
}) => {
  const [query, setQuery] = useState('');

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Select City</Text>
            <Pressable onPress={onClose} hitSlop={8} style={modalStyles.closeBtn}>
              <X size={22} color={Colors.text} />
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={modalStyles.searchRow}>
            <Search size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={modalStyles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search city in Sri Lanka..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              returnKeyType="done"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Loading */}
          {loading && (
            <View style={modalStyles.empty}>
              <ActivityIndicator color={Colors.secondary} />
              <Text style={[modalStyles.emptyText, { marginTop: Spacing.sm }]}>
                Loading cities…
              </Text>
            </View>
          )}

          {/* Error — failed to fetch from the backend */}
          {!loading && !!error && (
            <View style={modalStyles.empty}>
              <Text style={modalStyles.emptyText}>{error}</Text>
              <Pressable onPress={onRetry} hitSlop={8} style={{ marginTop: Spacing.sm }}>
                <Text style={modalStyles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {/* List */}
          {!loading && !error && (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedCityId;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    style={[
                      modalStyles.cityItem,
                      isSelected && modalStyles.cityItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        modalStyles.cityText,
                        isSelected && modalStyles.cityTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && <Check size={18} color={Colors.secondary} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={modalStyles.empty}>
                  <Text style={modalStyles.emptyText}>
                    {cities.length === 0
                      ? 'No cities are available yet.'
                      : `No city found matching "${query}"`}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    height: '75%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.secondary,
  },
  closeBtn: {
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dominant,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(195, 198, 207, 0.4)',
  },
  cityItemSelected: {
    backgroundColor: 'rgba(15, 92, 92, 0.05)',
    borderRadius: Radii.sm,
  },
  cityText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  cityTextSelected: {
    fontFamily: Typography.fontBodySemi,
    color: Colors.secondary,
  },
  empty: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onContinue,
  onLogin,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [dob, setDob] = useState('');
  const [nic, setNic] = useState('');

  // City list — fetched from the backend; the table may currently be empty,
  // which the modal surfaces as "No cities are available yet" rather than
  // silently blocking signup.
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const loadCities = () => {
    setCitiesLoading(true);
    setCitiesError(null);
    cityApi
      .getAll()
      .then((result) => {
        setCities(result);
        setCitiesLoading(false);
      })
      .catch((err) => {
        setCitiesError(
          err instanceof ApiError ? err.message : 'Could not load cities. Please try again.',
        );
        setCitiesLoading(false);
      });
  };

  useEffect(() => {
    loadCities();
  }, []);

  // Modal State
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs used to scroll a focused field above the keyboard — the Date of
  // Birth and NIC fields sit low enough in the form that the keyboard
  // otherwise covers them while typing.
  const scrollRef = useRef<ScrollView>(null);
  const dobFieldRef = useRef<View>(null);
  const nicFieldRef = useRef<View>(null);

  const scrollFieldIntoView = (fieldRef: React.RefObject<View | null>) => {
    // Small delay lets the keyboard-open animation start first, so the
    // scroll lands after layout has settled instead of racing it.
    setTimeout(() => {
      // measureLayout wants a ref to the ancestor's native component — the
      // ScrollView's own ref is a composite instance, not a host component,
      // so we need its underlying native scroll node (getNativeScrollRef).
      // Passing a findNodeHandle() number instead is deprecated and throws
      // "must be called with a ref to a native component".
      const nativeScrollRef = scrollRef.current?.getNativeScrollRef();
      if (!nativeScrollRef || !fieldRef.current) return;
      fieldRef.current.measureLayout(
        nativeScrollRef,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y: Math.max(y - Spacing.md, 0), animated: true });
        },
        () => {},
      );
    }, 100);
  };

  // Auto-format Date of Birth (mm/dd/yyyy)
  const handleDobChange = (text: string) => {
    // Strip non-digits
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);
  };

  // Validation & Submission
  const handleCreateAccount = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!PHONE_REGEX.test(phone.trim())) {
      newErrors.phone = 'Enter a valid phone number';
    }

    if (!selectedCity) newErrors.city = 'Please select your city';

    let isoDob: string | null = null;
    if (!dob.trim()) {
      newErrors.dob = 'Date of birth is required';
    } else {
      isoDob = parseDobToIso(dob);
      if (!isoDob) newErrors.dob = 'Enter a valid date of birth';
    }

    if (!nic.trim()) newErrors.nic = 'NIC number is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && isoDob && selectedCity) {
      onContinue?.({
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth: isoDob,
        nic: nic.trim(),
        cityId: selectedCity.id,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ─────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.brandHeader}>
            <Landmark size={26} color={Colors.secondary} strokeWidth={2} style={styles.brandIcon} />
            <Text style={styles.brandTitle}>Legacy Lens</Text>
          </View>

          {/* Main Card Container */}
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create your account</Text>
              <Text style={styles.cardSubtitle}>
                This helps us keep Legacy Lens safe for everyone.
              </Text>
            </View>

            {/* Field 1: Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputBox,
                  !!errors.fullName && styles.inputBoxError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={(t) => {
                    setFullName(t);
                    if (errors.fullName) setErrors((e) => ({ ...e, fullName: '' }));
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  {...Platform.select({ android: { includeFontPadding: false } })}
                />
              </View>
              {!!errors.fullName && (
                <Text style={styles.errorMsg}>{errors.fullName}</Text>
              )}
            </View>

            {/* Field 2: Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View
                style={[
                  styles.inputBox,
                  !!errors.phone && styles.inputBoxError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    if (errors.phone) setErrors((e) => ({ ...e, phone: '' }));
                  }}
                  placeholder="Enter your phone number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  {...Platform.select({ android: { includeFontPadding: false } })}
                />
              </View>
              {!!errors.phone && (
                <Text style={styles.errorMsg}>{errors.phone}</Text>
              )}
            </View>

            {/* Field 3: City Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>City</Text>
              <Pressable
                onPress={() => {
                  setCityModalVisible(true);
                  if (errors.city) setErrors((e) => ({ ...e, city: '' }));
                }}
                disabled={citiesLoading}
                style={[
                  styles.inputBox,
                  styles.dropdownBox,
                  !!errors.city && styles.inputBoxError,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select City"
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !selectedCity && styles.placeholderText,
                  ]}
                >
                  {citiesLoading
                    ? 'Loading cities…'
                    : selectedCity?.name ?? 'Select your city'}
                </Text>
                <ChevronDown size={20} color={Colors.accent} strokeWidth={2.2} />
              </Pressable>
              {!!errors.city && (
                <Text style={styles.errorMsg}>{errors.city}</Text>
              )}
            </View>

            {/* Field 4: Date of Birth */}
            <View ref={dobFieldRef} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <View
                style={[
                  styles.inputBox,
                  !!errors.dob && styles.inputBoxError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={dob}
                  onChangeText={(t) => {
                    handleDobChange(t);
                    if (errors.dob) setErrors((e) => ({ ...e, dob: '' }));
                  }}
                  onFocus={() => scrollFieldIntoView(dobFieldRef)}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={10}
                  returnKeyType="next"
                  {...Platform.select({ android: { includeFontPadding: false } })}
                />
                <Calendar size={19} color={Colors.text} strokeWidth={1.75} style={{ marginRight: 2 }} />
              </View>
              {!!errors.dob && (
                <Text style={styles.errorMsg}>{errors.dob}</Text>
              )}
            </View>

            {/* Field 5: NIC Number */}
            <View ref={nicFieldRef} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NIC Number</Text>
              <View
                style={[
                  styles.inputBox,
                  !!errors.nic && styles.inputBoxError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={nic}
                  onChangeText={(t) => {
                    setNic(t);
                    if (errors.nic) setErrors((e) => ({ ...e, nic: '' }));
                  }}
                  onFocus={() => scrollFieldIntoView(nicFieldRef)}
                  placeholder="Enter your NIC number"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  {...Platform.select({ android: { includeFontPadding: false } })}
                />
              </View>
              {!!errors.nic && (
                <Text style={styles.errorMsg}>{errors.nic}</Text>
              )}

              {/* NIC privacy note */}
              <View style={styles.privacyNoteRow}>
                <Lock size={13} color={Colors.accent} strokeWidth={2} style={{ marginTop: 2, marginRight: 6 }} />
                <Text style={styles.privacyNoteText}>
                  Used only to verify you're a valid citizen — never shown publicly.
                </Text>
              </View>
            </View>

            {/* Submit CTA Button */}
            <Pressable
              onPress={handleCreateAccount}
              style={styles.submitBtn}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={styles.submitBtnText}>Create Account</Text>
            </Pressable>

            {/* Card Footer: Already have an account? Log in. */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerPrompt}>Already have an account? </Text>
              <Pressable
                onPress={onLogin}
                accessibilityRole="link"
                accessibilityLabel="Log in"
                hitSlop={8}
              >
                <Text style={styles.footerLink}>Log in.</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sri Lanka City Selection Modal */}
      <CitySelectionModal
        visible={cityModalVisible}
        cities={cities}
        loading={citiesLoading}
        error={citiesError}
        selectedCityId={selectedCity?.id ?? null}
        onSelect={setSelectedCity}
        onClose={() => setCityModalVisible(false)}
        onRetry={loadCities}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },

  // ── Ambient glows ─────────────────────────────────────────────────────────
  glow: {
    position: 'absolute',
    borderRadius: Radii.full,
  },
  glowTopLeft: {
    width: 320,
    height: 320,
    top: -80,
    left: -80,
    backgroundColor: 'rgba(15, 92, 92, 0.07)',
  },
  glowBottomRight: {
    width: 280,
    height: 280,
    bottom: -60,
    right: -60,
    backgroundColor: 'rgba(232, 121, 46, 0.06)',
  },

  // ── Brand Header ──────────────────────────────────────────────────────────
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  brandIcon: {
    marginRight: Spacing.sm,
  },
  brandTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.secondary,
    letterSpacing: -0.4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── White Card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 6,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  cardSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Field Groups ──────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    marginBottom: 6,
    marginLeft: 2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.8)',
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 50,
  },
  inputBoxError: {
    borderColor: '#ba1a1a',
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  dropdownBox: {
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  errorMsg: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
    marginTop: 4,
    marginLeft: 4,
  },

  // ── NIC Privacy Note ──────────────────────────────────────────────────────
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  privacyNoteText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Submit Button ─────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: Colors.secondary,
    height: 52,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: Spacing.lg,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.white,
    letterSpacing: 0.4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Card Footer ───────────────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerPrompt: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  footerLink: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 14,
    color: Colors.accent,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default SignUpScreen;
