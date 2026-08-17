import React, { useState } from 'react';
import {
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
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SignUpScreenProps {
  /** Called when registration is complete */
  onSignUpSuccess?: () => void;
  /** Navigate back to login */
  onLogin?: () => void;
  /** Navigate to the set-photo screen */
  onSetPhoto?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive Sri Lankan Cities List
// ─────────────────────────────────────────────────────────────────────────────
const SRI_LANKA_CITIES = [
  'Ambalangoda',
  'Ampara',
  'Anuradhapura',
  'Avissawella',
  'Badulla',
  'Balangoda',
  'Bandarawela',
  'Batticaloa',
  'Bentota',
  'Beruwala',
  'Chilaw',
  'Colombo',
  'Dambulla',
  'Dehiwala-Mount Lavinia',
  'Embilipitiya',
  'Eravur',
  'Galle',
  'Gampaha',
  'Gampola',
  'Hambantota',
  'Haputale',
  'Hatton',
  'Hikkaduwa',
  'Homagama',
  'Horana',
  'Ja-Ela',
  'Jaffna',
  'Kadawatha',
  'Kalmunai',
  'Kalutara',
  'Kandy',
  'Kattankudy',
  'Kegalle',
  'Kelaniya',
  'Kesbewa',
  'Kilinochchi',
  'Kuliyapitiya',
  'Kurunegala',
  'Maharagama',
  'Mahiyanganaya',
  'Mannar',
  'Matale',
  'Matara',
  'Mawanella',
  'Minuwangoda',
  'Monaragala',
  'Moratuwa',
  'Mullaitivu',
  'Nawalapitiya',
  'Negombo',
  'Nugegoda',
  'Nuwara Eliya',
  'Panadura',
  'Peliyagoda',
  'Peradeniya',
  'Point Pedro',
  'Polonnaruwa',
  'Puttalam',
  'Ragama',
  'Ratnapura',
  'Seeduwa',
  'Sri Jayawardenepura Kotte',
  'Tangalle',
  'Trincomalee',
  'Valvettithurai',
  'Vavuniya',
  'Wattala',
  'Weligama',
].sort();

// ─────────────────────────────────────────────────────────────────────────────
// City Selection Modal Subcomponent
// ─────────────────────────────────────────────────────────────────────────────
interface CityModalProps {
  visible: boolean;
  selectedCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}

const CitySelectionModal: React.FC<CityModalProps> = ({
  visible,
  selectedCity,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filtered = SRI_LANKA_CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
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

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item === selectedCity;
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
                    {item}
                  </Text>
                  {isSelected && <Check size={18} color={Colors.secondary} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={modalStyles.empty}>
                <Text style={modalStyles.emptyText}>No city found matching "{query}"</Text>
              </View>
            }
          />
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
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onLogin,
  onSetPhoto,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [nic, setNic] = useState('');

  // Modal State
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!city.trim()) newErrors.city = 'Please select your city';
    if (!dob.trim()) newErrors.dob = 'Date of birth is required';
    if (!nic.trim()) newErrors.nic = 'NIC number is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSetPhoto?.();
      onSignUpSuccess?.();
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
                    !city && styles.placeholderText,
                  ]}
                >
                  {city || 'Select your city'}
                </Text>
                <ChevronDown size={20} color={Colors.accent} strokeWidth={2.2} />
              </Pressable>
              {!!errors.city && (
                <Text style={styles.errorMsg}>{errors.city}</Text>
              )}
            </View>

            {/* Field 4: Date of Birth */}
            <View style={styles.fieldGroup}>
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
            <View style={styles.fieldGroup}>
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
        selectedCity={city}
        onSelect={setCity}
        onClose={() => setCityModalVisible(false)}
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
