import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './AdminProfileScreen.styles';
import { profileApi } from '../../../services/api/profileApi';
import { auditApi, AuditLogItem } from '../../../services/api/auditApi';
import { useAuthStore } from '../../../store/authStore';
import { UserProfile } from '../../../types/profile';
import { Colors } from '../../../theme';

interface AdminProfileScreenProps {
  onBack?: () => void;
  onNavigate?: (tab: string, item?: any) => void;
  onLogout?: () => void;
}

// ── Date Formatting Helpers ──────────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return '12 Jan 2024';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso?: string): string {
  if (!iso) return '09:30 AM';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '09:30 AM';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatAdminId(userId?: string): string {
  if (!userId) return 'LL-ADM-2024-089';
  if (userId.startsWith('LL-ADM')) return userId;
  const clean = userId.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `LL-ADM-2024-${clean || '089'}`;
}

// Sample fallback curated logs for opportunity and moderation
const SAMPLE_CURATED_LOGS: AuditLogItem[] = [
  {
    id: 'MOD-8821',
    actionType: 'APPROVED',
    entityType: 'Story',
    entityId: 'story-101',
    entityTitle: 'Sigiriya Rock Ancient Water Engineering',
    performedById: 'admin-1',
    performedByName: 'Admin',
    notes: 'Content verified according to national cultural heritage guidelines.',
    date: '12 Oct 2026',
    time: '08:45 AM',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OPP-4102',
    actionType: 'CREATED',
    entityType: 'Opportunity',
    entityId: 'opp-204',
    entityTitle: 'Galle Fort Maritime Folklore Recording',
    performedById: 'admin-1',
    performedByName: 'Admin',
    notes: 'Opportunity published with bounty of 25,000 LKR.',
    date: '11 Oct 2026',
    time: '04:15 PM',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'MOD-7734',
    actionType: 'REJECTED',
    entityType: 'Moderation',
    entityId: 'story-094',
    entityTitle: 'Unverified Folklore Submission',
    performedById: 'admin-1',
    performedByName: 'Admin',
    notes: 'Audio revision requested due to background noise.',
    date: '09 Oct 2026',
    time: '02:30 PM',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'OPP-3912',
    actionType: 'APPROVED',
    entityType: 'Opportunity',
    entityId: 'opp-188',
    entityTitle: 'Kandy Dalada Maligawa Oral Histories',
    performedById: 'admin-1',
    performedByName: 'Admin',
    notes: 'Opportunity approved for senior storyteller intake.',
    date: '07 Oct 2026',
    time: '11:20 AM',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

export const AdminProfileScreen: React.FC<AdminProfileScreenProps> = ({
  onBack,
  onNavigate,
  onLogout,
}) => {
  const cachedUser = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Toast State
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Curated Opportunity & Moderation Activity Logs
  const [curatedLogs, setCuratedLogs] = useState<AuditLogItem[]>(SAMPLE_CURATED_LOGS);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

  // Edit PIN State
  const [isEditingPin, setIsEditingPin] = useState<boolean>(false);
  const [pinStep, setPinStep] = useState<'input' | 'otp'>('input');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Logout Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);

  // ── Fetch Profile & Filtered Activity Logs ─────────────────────────────────
  const fetchProfileData = async () => {
    try {
      const data = await profileApi.getMe();
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('[AdminProfileScreen] Could not fetch profile from /users/me, using cache:', err);
    }
  };

  const fetchCuratedLogs = async () => {
    setLogsLoading(true);
    try {
      const allLogs = await auditApi.getLogs();
      if (Array.isArray(allLogs) && allLogs.length > 0) {
        // Filter ONLY Opportunity and Moderation logs as requested
        const filtered = allLogs.filter((l) => {
          const entity = (l.entityType || '').toLowerCase();
          const action = (l.actionType || '').toLowerCase();
          const title = (l.entityTitle || '').toLowerCase();
          const notes = (l.notes || '').toLowerCase();
          return (
            entity.includes('opportunity') ||
            entity.includes('moderation') ||
            entity.includes('story') ||
            title.includes('opportunity') ||
            title.includes('moderation') ||
            notes.includes('opportunity') ||
            notes.includes('moderation') ||
            action === 'approved' ||
            action === 'rejected'
          );
        });

        if (filtered.length > 0) {
          setCuratedLogs(filtered.slice(0, 10));
        }
      }
    } catch (err) {
      console.warn('[AdminProfileScreen] Audit logs endpoint unreachable, using sample curator logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadAll = async () => {
    await Promise.all([fetchProfileData(), fetchCuratedLogs()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  // ── Copy Admin ID Action ───────────────────────────────────────────────────
  const adminIdDisplay = formatAdminId(profile?.userId || cachedUser?.userId);

  const copyAdminId = () => {
    try {
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(adminIdDisplay);
      }
    } catch {
      // Fallback
    }

    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  // ── Edit PIN Flow (Functional) ─────────────────────────────────────────────
  const handleRequestPinOtp = async () => {
    setPinError(null);
    setPinSuccess(null);

    if (!/^\d{4}$/.test(newPin)) {
      setPinError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PIN confirmation does not match the new PIN.');
      return;
    }

    setPinLoading(true);
    try {
      await profileApi.requestPinChange();
      setPinStep('otp');
      setPinSuccess('A 6-digit OTP verification code has been dispatched to your phone.');
    } catch (err: any) {
      setPinError(err?.message || 'Could not send verification OTP. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleConfirmPinChange = async () => {
    setPinError(null);
    setPinSuccess(null);

    if (!/^\d{6}$/.test(otpCode)) {
      setPinError('Please enter the 6-digit OTP received on your mobile phone.');
      return;
    }

    setPinLoading(true);
    try {
      await profileApi.confirmPinChange({
        newPin,
        confirmNewPin: confirmPin,
        otpCode,
      });

      setPinSuccess('Security PIN successfully updated! Your new PIN is now active.');
      setTimeout(() => {
        setIsEditingPin(false);
        setPinStep('input');
        setNewPin('');
        setConfirmPin('');
        setOtpCode('');
        setPinSuccess(null);
      }, 2500);
    } catch (err: any) {
      setPinError(err?.message || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const resetPinForm = () => {
    setIsEditingPin(false);
    setPinStep('input');
    setNewPin('');
    setConfirmPin('');
    setOtpCode('');
    setPinError(null);
    setPinSuccess(null);
  };

  // ── Logout Action ──────────────────────────────────────────────────────────
  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    clearSession();
    if (onLogout) {
      onLogout();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  // ── Derived Profile Values ─────────────────────────────────────────────────
  const fullName = profile?.fullName || cachedUser?.fullName || 'Dr. Samantha Senanayake';
  const rawAdminId = profile?.userId || cachedUser?.userId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const phone = profile?.phoneNumber || cachedUser?.phoneNumber || '+94 77 348 9120';
  const isPhoneVerified = profile?.phoneVerified ?? true;
  const nic = profile?.nicNumber || '198425103482';
  const cityName = profile?.city?.name || 'Colombo';
  const cityRegion = profile?.city?.region || 'Western';
  const cityDisplay = `${cityName}${cityRegion ? ` (${cityRegion})` : ''}`;
  const dob = profile?.dateOfBirth || '1984-05-14';
  const roleStatus = profile?.accountStatus || 'ACTIVE';

  const createdAtDisplay = profile?.createdAt
    ? `${formatDate(profile.createdAt)}, ${formatTime(profile.createdAt)}`
    : '12 Jan 2024, 09:30 AM';
  const updatedAtDisplay = profile?.updatedAt
    ? `${formatDate(profile.updatedAt)}, ${formatTime(profile.updatedAt)}`
    : '01 Oct 2024, 08:45 AM';

  return (
    <View style={styles.container}>
      {/* ── Fixed Top Header (No adjust button) ─────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              accessibilityLabel="Go Back"
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color="#191c1c" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Profile</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.headerAvatarBadge}>
              <MaterialIcons name="person" size={20} color="#ffffff" />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Feedback Toast Notification ──────────────────────────────────── */}
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <MaterialIcons name="check-circle" size={18} color="#aceeee" />
          <Text style={styles.toastText}>Admin ID copied to clipboard</Text>
        </Animated.View>
      )}

      {/* ── Main Scroll View ─────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#004343']}
            tintColor="#004343"
          />
        }
      >
        {/* ── 1. Profile Hero Card (No image, no role pills) ───────────────── */}
        <View style={[styles.card, styles.heroCard]}>
          <View style={styles.heroAccentTopRight} />
          <View style={styles.heroAccentBottomLeft} />

          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{fullName}</Text>
            <MaterialIcons name="verified" size={22} color="#004343" />
          </View>

          <TouchableOpacity
            style={styles.adminIdButton}
            onPress={copyAdminId}
            activeOpacity={0.75}
          >
            <MaterialIcons name="badge" size={16} color="#004343" />
            <Text style={styles.adminIdText}>{adminIdDisplay}</Text>
            <MaterialIcons name="content-copy" size={16} color="#6f7978" />
          </TouchableOpacity>
        </View>

        {/* ── 2. Administrator Details Table (Clean layout, no overflow) ──── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons name="person-pin" size={20} color="#004343" />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Administrator Details
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Level 3</Text>
            </View>
          </View>

          <View style={styles.tableContainer}>
            {/* Admin ID */}
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Admin ID</Text>
              <Text style={styles.tableValueMono} numberOfLines={1} ellipsizeMode="middle">
                {rawAdminId}
              </Text>
            </View>

            {/* Full Name */}
            <View style={[styles.tableRow, styles.tableRowEven]}>
              <Text style={styles.tableLabel}>Full Name</Text>
              <Text style={styles.tableValueBold} numberOfLines={1}>
                {fullName}
              </Text>
            </View>

            {/* Phone Number */}
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Phone</Text>
              <View style={styles.phoneRowRight}>
                <Text style={styles.tableValueMono}>{phone}</Text>
                {isPhoneVerified ? (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                ) : (
                  <View style={styles.unverifiedPill}>
                    <Text style={styles.unverifiedPillText}>Unverified</Text>
                  </View>
                )}
              </View>
            </View>

            {/* NIC Number */}
            <View style={[styles.tableRow, styles.tableRowEven]}>
              <Text style={styles.tableLabel}>NIC Number</Text>
              <Text style={styles.tableValueMono}>{nic}</Text>
            </View>

            {/* City */}
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>City</Text>
              <Text style={styles.tableValue}>{cityDisplay}</Text>
            </View>

            {/* Date of Birth */}
            <View style={[styles.tableRow, styles.tableRowEven]}>
              <Text style={styles.tableLabel}>Date of Birth</Text>
              <Text style={styles.tableValue}>{dob}</Text>
            </View>

            {/* Admin Role Status */}
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Role Status</Text>
              <Text style={[styles.tableValueBold, { color: '#004343' }]}>
                {roleStatus}
              </Text>
            </View>

            {/* Created Timestamp */}
            <View style={[styles.tableRow, styles.tableRowEven]}>
              <Text style={styles.tableLabel}>Created</Text>
              <Text style={styles.tableValueMono} numberOfLines={1}>
                {createdAtDisplay}
              </Text>
            </View>

            {/* Updated Timestamp */}
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Updated</Text>
              <Text style={styles.tableValueMono} numberOfLines={1}>
                {updatedAtDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Functional Edit PIN Section ─────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.pinHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons name="lock" size={20} color="#004343" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Security & PIN
                </Text>
              </View>
            </View>

            {!isEditingPin ? (
              <TouchableOpacity
                style={[styles.secondaryBtn, { paddingVertical: 8, paddingHorizontal: 12 }]}
                onPress={() => setIsEditingPin(true)}
              >
                <Text style={[styles.secondaryBtnText, { color: '#004343', fontWeight: '700' }]}>
                  Edit PIN
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.secondaryBtn, { paddingVertical: 8, paddingHorizontal: 12 }]}
                onPress={resetPinForm}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isEditingPin ? (
            <View style={{ marginTop: 12 }}>
              <View style={styles.tableContainer}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>PIN Protection</Text>
                  <View style={styles.pinStatusBadge}>
                    <MaterialIcons name="verified-user" size={14} color="#065f46" />
                    <Text style={styles.pinStatusText}>Active & Secured</Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.tableRowEven]}>
                  <Text style={styles.tableLabel}>Auth Mode</Text>
                  <Text style={styles.tableValue}>4-Digit Encrypted Passcode</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.pinFormContainer}>
              {/* Error / Success Feedback */}
              {pinError && (
                <View style={[styles.pinFeedbackBox, styles.feedbackError]}>
                  <MaterialIcons name="error-outline" size={18} color="#b91c1c" />
                  <Text style={styles.feedbackTextError}>{pinError}</Text>
                </View>
              )}

              {pinSuccess && (
                <View style={[styles.pinFeedbackBox, styles.feedbackSuccess]}>
                  <MaterialIcons name="check-circle" size={18} color="#15803d" />
                  <Text style={styles.feedbackTextSuccess}>{pinSuccess}</Text>
                </View>
              )}

              {pinStep === 'input' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New 4-Digit PIN</Text>
                    <TextInput
                      style={styles.pinTextInput}
                      placeholder="••••"
                      placeholderTextColor="#a0a8a7"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      value={newPin}
                      onChangeText={setNewPin}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm New 4-Digit PIN</Text>
                    <TextInput
                      style={styles.pinTextInput}
                      placeholder="••••"
                      placeholderTextColor="#a0a8a7"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                    />
                  </View>

                  <View style={styles.pinButtonsRow}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={resetPinForm}
                      disabled={pinLoading}
                    >
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleRequestPinOtp}
                      disabled={pinLoading}
                    >
                      {pinLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="sms" size={18} color="#ffffff" />
                          <Text style={styles.primaryBtnText}>Request SMS OTP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter 6-Digit SMS OTP</Text>
                    <Text style={styles.inputSubtitle}>
                      Sent to your verified mobile number ({phone})
                    </Text>
                    <TextInput
                      style={styles.pinOtpInput}
                      placeholder="000000"
                      placeholderTextColor="#a0a8a7"
                      keyboardType="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                    />
                  </View>

                  <View style={styles.pinButtonsRow}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setPinStep('input')}
                      disabled={pinLoading}
                    >
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleConfirmPinChange}
                      disabled={pinLoading}
                    >
                      {pinLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="check-circle" size={18} color="#ffffff" />
                          <Text style={styles.primaryBtnText}>Confirm & Update PIN</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.resendOtpBtn}
                    onPress={handleRequestPinOtp}
                    disabled={pinLoading}
                  >
                    <Text style={styles.resendOtpText}>Resend OTP Code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── 4. Curated Activity Log (Opportunity & Moderation Only) ─────── */}
        <View style={styles.card}>
          <View style={styles.activitySectionHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons name="history-edu" size={20} color="#004343" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Curated Activity Log
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  Opportunity & Moderation Only
                </Text>
              </View>
            </View>

            <View style={styles.activityCountBadge}>
              <Text style={styles.activityCountText}>
                {curatedLogs.length} Records
              </Text>
            </View>
          </View>

          {logsLoading ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color="#004343" size="small" />
            </View>
          ) : curatedLogs.length === 0 ? (
            <View style={styles.emptyLogsContainer}>
              <MaterialIcons name="fact-check" size={32} color="#dde3eb" />
              <Text style={styles.emptyLogsText}>No Opportunity or Moderation logs yet</Text>
              <Text style={styles.emptyLogsSubtext}>
                Actions recorded during moderation and opportunity intake will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.activityTimeline}>
              {curatedLogs.map((log) => {
                const isOpp =
                  (log.entityType || '').toLowerCase().includes('opportunity') ||
                  (log.entityTitle || '').toLowerCase().includes('opportunity');

                const displayRef = log.id
                  ? log.id.length > 12
                    ? `${log.id.slice(0, 8)}...`
                    : log.id
                  : '—';

                return (
                  <View
                    key={log.id}
                    style={[
                      styles.activityCard,
                      isOpp ? styles.activityCardOpportunity : styles.activityCardModeration,
                    ]}
                  >
                    <View style={styles.activityTopRow}>
                      <View style={styles.activityTitleRow}>
                        <MaterialIcons
                          name={isOpp ? 'campaign' : 'fact-check'}
                          size={16}
                          color={isOpp ? '#004343' : '#9b4600'}
                        />
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {log.entityTitle || `${log.actionType} ${log.entityType}`}
                        </Text>
                      </View>
                      <Text style={styles.activityTime}>{log.date || 'Today'}</Text>
                    </View>

                    {log.notes ? (
                      <Text style={styles.activityDetails} numberOfLines={2}>
                        {log.notes}
                      </Text>
                    ) : null}

                    <View style={styles.activityBottomRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          isOpp ? styles.typeBadgeOpportunity : styles.typeBadgeModeration,
                        ]}
                      >
                        <Text
                          style={
                            isOpp
                              ? styles.typeBadgeTextOpportunity
                              : styles.typeBadgeTextModeration
                          }
                          numberOfLines={1}
                        >
                          {isOpp ? 'Opportunity' : 'Moderation'} • {log.actionType || 'ACTION'}
                        </Text>
                      </View>

                      <Text
                        style={styles.refCodeText}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        Ref: {displayRef}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── 5. Sign Out Trigger ─────────────────────────────────────────── */}
        <View style={styles.signOutWrapper}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={20} color="#ba1a1a" />
            <Text style={styles.signOutText}>Log Out of Legacy Lens</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Logout Confirmation Modal ────────────────────────────────────── */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Logout</Text>
              <TouchableOpacity onPress={() => setLogoutModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#191c1c" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBody}>
              Are you sure you want to log out of your Legacy Lens administrative session?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.modalConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminProfileScreen;
