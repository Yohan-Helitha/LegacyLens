import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Handshake, Video } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import { profileApi } from '../../../services/api/profileApi';
import { useAuthStore } from '../../../store/authStore';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import type {
  CreatorDashboardSummaryResponse,
  DashboardJobStatus,
  JobResponse,
} from '../../../types/creatorDashboard';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';

// Recent Work gallery — bundled locally so the viva demo never depends on network access.
const POTTERY_IMAGE = require('../../../../assets/images/recent-work/pottery-making.jpg');
const BLUE_RICE_IMAGE = require('../../../../assets/images/recent-work/blue-rice.jpg');
const KANDYAN_DANCE_IMAGE = require('../../../../assets/images/recent-work/kandyan-dance.jpg');
const SCRIPT_EVOLUTION_IMAGE = require('../../../../assets/images/recent-work/script-evolution.png');

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped from HTML Tailwind config colour system)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  // ── 60% dominant — surfaces
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceContainer:       '#e4efef',
  surfaceContainerHigh:   '#d8e8e8',
  surfaceVariant:         '#c8dcdc',

  // ── 30% primary — teal
  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  // ── 10% accent — orange
  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',
  secondaryFixedDim:    'rgba(232,121,46,0.30)',

  // ── Tertiary — gold for star ratings
  tertiaryContainer: '#E8792E',         // reuse orange for stars

  // ── Text
  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type JobTab = 'active' | 'upcoming' | 'completed';

type ActiveJobItem = {
  id: string;
  title: string;
  client: string;
  description: string;
  location: string;
  /** The day it is scheduled for (or when it was completed). */
  dateText: string;
  /** The time range of the visit, e.g. "10:00 AM - 2:00 PM"; empty when not set. */
  timeText: string;
  statusLabel: string;
};

type ReviewItem = {
  id: string;
  quote: string;
  author: string;
};

const TAB_TO_STATUS: Record<JobTab, DashboardJobStatus> = {
  active: 'ACTIVE',
  upcoming: 'UPCOMING',
  completed: 'COMPLETED',
};

function formatCompletedDate(iso: string): string {
  return `Completed ${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

function formatAppDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Local (not UTC) y-m-d / HH:mm — avoids the date/time shifting a day or hour
// off that toISOString() would cause for users west of UTC.
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeKey(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatClockTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function mapJobToItem(job: JobResponse): ActiveJobItem {
  const statusLabel =
    job.status === 'ACTIVE' ? 'IN PROGRESS' : job.status === 'UPCOMING' ? 'UPCOMING' : 'COMPLETED';
  const completed = job.status === 'COMPLETED';
  const dateText = completed
    ? (job.completedAt ? formatCompletedDate(job.completedAt) : '')
    : (job.scheduledAt ? formatAppDate(job.scheduledAt) : '');
  const timeText = completed ? '' : (job.timeWindowText ?? (job.scheduledAt ? formatClockTime(new Date(job.scheduledAt)) : ''));

  return {
    id: job.id,
    title: job.title,
    client: job.elderName,
    description: job.description,
    location: job.location ?? '',
    dateText,
    timeText,
    statusLabel,
  };
}

// The movie-camera look of the old emoji, as a crisp line icon (lucide - the same set as the side menu).
const JobIcon: React.FC = () => (
  <View style={s.jobIconBox}>
    <Video size={22} color={D.primary} strokeWidth={1.8} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Minimal inline icons (emoji-based, zero extra dependencies)
// ─────────────────────────────────────────────────────────────────────────────
const StarIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>★</Text>
);

// Same outline style/colour as OpportunityDetailPage's info-chip icons.
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);


// ─────────────────────────────────────────────────────────────────────────────
// GreetingSection
// ─────────────────────────────────────────────────────────────────────────────
// Greeting follows the phone's clock: morning until noon, afternoon until 5 pm, evening after that.
function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const GreetingSection: React.FC<{ name: string }> = ({ name }) => (
  <View style={s.greetingRow}>
    <Image
      source={{
        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdmWxeiutm8VuCuwb8B-bcbY4uwLEOEIZpHad16sSCOnOCn176-8moOj3W6uDPAciix85yHVNmpAd1RTzDZNIib4AVMq68gwoQfyYec-CiNygpv3Rti52MfEWixskGSi9K2HzQJc1XhIg649C9xWHdmBqgXNA5LsR-CP4PfF7fUKsBLElU0twICuF7-ZcI9Vlnj9GgnzoL4Bqj9ilpxA4BZs3oFt_0h7PcPdk4HDm4JKWKr6S3bofO2g',
      }}
      style={s.avatar}
      accessibilityLabel="Your profile photo"
    />
    <View style={s.greetingText}>
      <View style={s.greetingHeadlineRow}>
        <Text style={s.greetingHeadline}>{`${greetingForHour(new Date().getHours())}${name ? `, ${name}` : ''}`}</Text>
        <Handshake size={22} color={D.secondary} strokeWidth={2} />
      </View>
      <Text style={s.greetingSubtitle}>Ready to preserve a story today?</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// MetricsSection  (stats card + balance card)
// ─────────────────────────────────────────────────────────────────────────────
const MetricsSection: React.FC<{
  summary: CreatorDashboardSummaryResponse | null;
  onOpenHistory: () => void;
  onAddPayment: () => void;
}> = ({ summary, onOpenHistory, onAddPayment }) => (
  <View style={s.metricsGrid}>
    {/* ── Stats row ─────────────────────────────────────────────────────── */}
    <View style={s.statsCard}>
      <View style={s.ratingRow}>
        <Text style={s.ratingValue}>{summary?.rating != null ? summary.rating.toFixed(1) : '—'}</Text>
        <StarIcon size={20} color={D.tertiaryContainer} />
      </View>
      <View style={s.statsRight}>
        <Text style={s.statsJobCount}>{summary ? `${summary.completedJobsCount} completed jobs` : 'Loading…'}</Text>
        <Text style={s.statsContrib}>{summary ? `${summary.contributionsCount} contributions` : ''}</Text>
      </View>
    </View>

    {/* ── Balance card ──────────────────────────────────────────────────── */}
    <View style={s.balanceCard}>
      {/* decorative glow blob */}
      <View style={s.balanceGlow} pointerEvents="none" />

      <Text style={s.balanceLabel}>COLLECTED TODAY</Text>
      <Text style={s.balanceAmount}>
        {summary ? `LKR ${Math.round(summary.collectedToday ?? 0).toLocaleString('en-US')}` : 'LKR —'}
      </Text>

      <View style={s.balanceBtnRow}>
        <Pressable
          onPress={onOpenHistory}
          style={({ pressed }) => [s.balanceBtnOutline, pressed && s.pressedDark]}
          accessibilityRole="button"
        >
          <Text style={s.balanceBtnOutlineText}>History</Text>
        </Pressable>
        <Pressable
          onPress={onAddPayment}
          style={({ pressed }) => [s.balanceBtnFill, pressed && s.pressedLight]}
          accessibilityRole="button"
        >
          <Text style={s.balanceBtnFillText}>Add</Text>
        </Pressable>
      </View>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// TabPill
// ─────────────────────────────────────────────────────────────────────────────
const TabPill: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      s.tabPill,
      active ? s.tabPillActive : s.tabPillInactive,
      pressed && s.pressed,
    ]}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
  >
    <Text style={[s.tabPillText, active && s.tabPillTextActive]}>{label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// ActiveJobCard
// ─────────────────────────────────────────────────────────────────────────────
const ActiveJobCard: React.FC<{ item: ActiveJobItem; onPress: () => void }> = ({ item, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.jobCard, pressed && s.jobCardPressed]}
    accessibilityRole="button"
    accessibilityLabel={`${item.title} — ${item.statusLabel}`}
  >
    {/* Header */}
    <View style={s.jobCardHeader}>
      <View style={s.jobCardLeft}>
        <JobIcon />
        <View style={{ flex: 1 }}>
          <Text style={s.jobTitle}>{item.title}</Text>
          <Text style={s.jobClient}>{item.client}</Text>
        </View>
      </View>
      <View style={s.jobStatusBadge}>
        <Text style={s.jobStatusText}>{item.statusLabel}</Text>
      </View>
    </View>

    {/* Description */}
    <Text style={s.jobDesc} numberOfLines={2}>
      {item.description}
    </Text>

    {/* Meta footer */}
    <View style={s.jobMeta}>
      {!!item.location && (
        <View style={s.jobMetaItem}>
          <View style={s.jobMetaIconBox}>
            <PinIcon />
          </View>
          <Text style={s.jobMetaText}>{item.location}</Text>
        </View>
      )}
      {(!!item.dateText || !!item.timeText) && (
        <View style={s.jobMetaWhen}>
          {!!item.dateText && (
            <View style={s.jobMetaItem}>
              <View style={s.jobMetaIconBox}>
                <CalendarIcon />
              </View>
              <Text style={[s.jobMetaText, { color: D.secondary }]}>{item.dateText}</Text>
            </View>
          )}
          {!!item.timeText && (
            <View style={s.jobMetaItem}>
              <View style={s.jobMetaIconBox}>
                <ClockIcon />
              </View>
              <Text style={s.jobMetaText}>{item.timeText}</Text>
            </View>
          )}
        </View>
      )}
    </View>

    {/* Link to the full list */}
    <View style={s.jobViewDetailsRow}>
      <Text style={s.jobViewDetailsText}>{'View on My Work →'}</Text>
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// ApprovedApplicationCard — an approved OpportunityApplication shown
// in the Upcoming Booking tab (booked ones move to the Schedule page). TEMPORARY: once approving
// creates a real Job (see OpportunityApplicationStatus's javadoc), this can
// likely be retired in favour of ActiveJobCard alone.
// ─────────────────────────────────────────────────────────────────────────────
const CalendarIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const LanguageIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L4 21l1.9-4.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 13.5 4 8.5 8.5 0 0 1 21 11.5z" />
  </Svg>
);

const ApprovedApplicationCard: React.FC<{
  item: OpportunityApplicationResponse;
  onBook: () => void;
}> = ({ item, onBook }) => (
  <View style={s.jobCard}>
    <View style={s.jobCardHeader}>
      <View style={s.jobCardLeft}>
        <JobIcon />
        <View style={{ flex: 1 }}>
          <Text style={s.jobTitle}>{item.title}</Text>
          <Text style={s.jobClient}>{item.elderName}</Text>
        </View>
      </View>
      <View style={s.jobStatusBadge}>
        <Text style={s.jobStatusText}>APPROVED</Text>
      </View>
    </View>

    <View style={s.jobMeta}>
      {item.location && (
        <View style={s.jobMetaItem}>
          <View style={s.jobMetaIconBox}>
            <PinIcon />
          </View>
          <Text style={s.jobMetaText}>{item.location}</Text>
        </View>
      )}
      {item.scheduledDate && (
        <View style={s.jobMetaItem}>
          <View style={s.jobMetaIconBox}>
            <CalendarIcon />
          </View>
          <Text style={[s.jobMetaText, { color: D.secondary }]}>{formatAppDate(item.scheduledDate)}</Text>
        </View>
      )}
      {!!item.timeWindowText && (
        <View style={s.jobMetaItem}>
          <View style={s.jobMetaIconBox}>
            <ClockIcon />
          </View>
          <Text style={s.jobMetaText}>{item.timeWindowText}</Text>
        </View>
      )}
      <View style={s.jobMetaItem}>
        <View style={s.jobMetaIconBox}>
          <CardIcon />
        </View>
        <Text style={s.jobMetaText}>{`LKR ${Math.round(item.offeredAmount).toLocaleString('en-US')}`}</Text>
      </View>
      {!!item.language && (
        <View style={s.jobMetaItem}>
          <View style={s.jobMetaIconBox}>
            <LanguageIcon />
          </View>
          <Text style={s.jobMetaText}>{item.language}</Text>
        </View>
      )}
    </View>

    <View style={s.bookBtnRow}>
      <Pressable
        onPress={onBook}
        style={({ pressed }) => [s.bookBtn, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Book ${item.title}`}
      >
        <Text style={s.bookBtnText}>Book</Text>
      </Pressable>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackSection
// ─────────────────────────────────────────────────────────────────────────────
const FeedbackSection: React.FC<{ rating: number | null; reviews: ReviewItem[] | null }> = ({ rating, reviews }) => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>Client Feedback</Text>
      <View style={s.ratingRow}>
        <Text style={s.feedbackRating}>{rating != null ? rating.toFixed(1) : '—'}</Text>
        <StarIcon size={16} color={D.tertiaryContainer} />
      </View>
    </View>

    {reviews === null ? (
      <View style={s.emptyState}>
        <Text style={s.emptyStateText}>Loading…</Text>
      </View>
    ) : reviews.length === 0 ? (
      <View style={s.emptyState}>
        <Text style={s.emptyStateText}>No reviews yet.</Text>
      </View>
    ) : (
      <View style={{ gap: Spacing.sm }}>
        {reviews.map((review) => (
          <View key={review.id} style={s.feedbackCard}>
            {/* Decorative large quote mark */}
            <Text style={s.quoteDecor}>{'“'}</Text>
            {/* Left accent bar */}
            <View style={s.quoteBar} />
            <Text style={s.quoteText}>{`“${review.quote}”`}</Text>
            <Text style={s.quoteAuthor}>{`— ${review.author}`}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// RecentWorkSection
// ─────────────────────────────────────────────────────────────────────────────
const RecentWorkSection: React.FC = () => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>Recent Work</Text>
      <Pressable
        style={({ pressed }) => pressed ? [s.pressed] : []}
        accessibilityRole="button"
      >
        <Text style={s.viewAllText}>View All ›</Text>
      </Pressable>
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.galleryRow}
    >
      {/* Item 1 — photo: traditional pottery making */}
      <View style={s.galleryItem}>
        <Image
          source={POTTERY_IMAGE}
          style={s.galleryImage}
          accessibilityLabel="Traditional pottery being shaped on a potter's wheel"
        />
        <View style={s.galleryOverlayGradient} />
        <Text style={s.galleryTypeIcon}>🖼</Text>
      </View>

      {/* Item 2 — video: blue butterfly-pea-flower rice recipe documentary */}
      <View style={s.galleryItem}>
        <Image
          source={BLUE_RICE_IMAGE}
          style={s.galleryImage}
          accessibilityLabel="Traditional blue butterfly-pea-flower rice recipe documentary thumbnail"
        />
        <View style={s.galleryOverlayDark} />
        <View style={s.playBtnWrapper}>
          <View style={s.playBtn}>
            <Text style={{ fontSize: 16, color: D.secondary, marginLeft: 2 }}>▶</Text>
          </View>
        </View>
      </View>

      {/* Item 3 — photo: Kandyan dancer in costume */}
      <View style={s.galleryItem}>
        <Image
          source={KANDYAN_DANCE_IMAGE}
          style={s.galleryImage}
          accessibilityLabel="Traditional Kandyan dancer in costume"
        />
        <View style={s.galleryOverlayGradient} />
        <Text style={s.galleryTypeIcon}>🖼</Text>
      </View>

      {/* Item 4 — photo: Sinhala script evolution chart */}
      <View style={s.galleryItem}>
        <Image
          source={SCRIPT_EVOLUTION_IMAGE}
          style={s.galleryImage}
          accessibilityLabel="Evolution of the Sinhala script from Brahmi chart"
        />
        <View style={s.galleryOverlayGradient} />
        <Text style={s.galleryTypeIcon}>📄</Text>
      </View>
    </ScrollView>
  </View>
);



// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorDashboard: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onOpenHistory: () => void;
  onOpenSchedule: () => void;
  onOpenMyWork: () => void;
  onAddPayment: () => void;
  onOpenSavedApplications: () => void;
  onOpenRejectedWork: () => void;
}> = ({ onNavigate, onOpenHistory, onOpenSchedule, onOpenMyWork, onAddPayment, onOpenSavedApplications, onOpenRejectedWork }) => {
  const [activeTab, setActiveTab] = useState<JobTab>('active');
  const [summary, setSummary] = useState<CreatorDashboardSummaryResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [jobsByTab, setJobsByTab] = useState<Partial<Record<JobTab, ActiveJobItem[]>>>({});
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(false);

  // Approved-but-not-yet-booked applications — shown alongside real Jobs in
  // the Upcoming Booking tab. See ApprovedApplicationCard's comment above.
  const [approvedApplications, setApprovedApplications] = useState<OpportunityApplicationResponse[]>([]);

  // "Confirm Booking" modal state — bookingTarget non-null means it's open.
  const [bookingTarget, setBookingTarget] = useState<OpportunityApplicationResponse | null>(null);
  const [confirmedDate, setConfirmedDate] = useState(new Date());
  const [confirmedStartTime, setConfirmedStartTime] = useState(new Date());
  const [confirmedEndTime, setConfirmedEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [booking, setBooking] = useState(false);

  // The greeting uses the first name from the creator's own profile (the login's name shows until it loads).
  const cachedName = useAuthStore((st) => st.user?.fullName ?? '');
  const [profileName, setProfileName] = useState('');
  const firstName = (profileName || cachedName).trim().split(/\s+/)[0] ?? '';

  useEffect(() => {
    profileApi.getMe().then((p) => setProfileName(p.fullName)).catch(() => {});
    creatorDashboardApi
      .getSummary()
      .then(setSummary)
      .catch(() => setSummary({ rating: null, completedJobsCount: 0, contributionsCount: 0, collectedToday: 0 }));
    creatorDashboardApi
      .getReviews(5)
      .then((data) => setReviews(data.map((r) => ({ id: r.id, quote: r.comment, author: r.elderName }))))
      .catch(() => setReviews([]));

    opportunityApplicationApi
      .getMyApplications()
      .then((apps) => setApprovedApplications(apps.filter((a) => a.status === 'APPROVED')))
      .catch(() => {});
  }, []);

  const openBookingModal = (app: OpportunityApplicationResponse) => {
    const initialDate = app.scheduledDate ? new Date(app.scheduledDate) : new Date();
    const defaultStart = new Date(initialDate);
    defaultStart.setHours(9, 0, 0, 0);
    const defaultEnd = new Date(initialDate);
    defaultEnd.setHours(11, 0, 0, 0);

    setBookingTarget(app);
    setConfirmedDate(initialDate);
    setConfirmedStartTime(defaultStart);
    setConfirmedEndTime(defaultEnd);
  };

  const handleConfirmBooking = async () => {
    if (!bookingTarget) return;

    setBooking(true);
    try {
      await opportunityApplicationApi.book(bookingTarget.id, {
        confirmedDate: toDateKey(confirmedDate),
        startTime: toTimeKey(confirmedStartTime),
        endTime: toTimeKey(confirmedEndTime),
      });
      setApprovedApplications((prev) => prev.filter((a) => a.id !== bookingTarget.id));
      setBookingTarget(null);

      // Booking confirmed — jump straight to the Schedule page so the
      // creator sees it marked on the calendar right away.
      onOpenSchedule();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not confirm this booking.';
      Alert.alert('Booking failed', message);
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    // Upcoming Booking lists only approved opportunities still waiting to be booked; once booked they
    // live on the Schedule page, so there is no job list to load for this tab.
    if (activeTab === 'upcoming') {
      setJobsLoading(false);
      setJobsError(false);
      return;
    }
    let cancelled = false;
    setJobsLoading(true);
    setJobsError(false);

    creatorDashboardApi
      .getJobs(TAB_TO_STATUS[activeTab])
      .then((data) => {
        if (!cancelled) {
          // The Active tab is "what I have to do today": only the jobs scheduled for today. The full list lives on My Work.
          const todayKey = toDateKey(new Date());
          const shown = activeTab === 'active'
            ? data.filter((j) => !!j.scheduledAt && toDateKey(new Date(j.scheduledAt)) === todayKey)
            : data;
          setJobsByTab((prev) => ({ ...prev, [activeTab]: shown.map(mapJobToItem) }));
        }
      })
      .catch(() => {
        if (!cancelled) setJobsError(true);
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const currentJobs = activeTab === 'upcoming' ? undefined : jobsByTab[activeTab];

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="menu" onOpenMyWork={onOpenMyWork} onOpenSavedApplications={onOpenSavedApplications} onOpenRejectedWork={onOpenRejectedWork} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GreetingSection name={firstName} />
        <MetricsSection
          summary={summary}
          onOpenHistory={onOpenHistory}
          onAddPayment={onAddPayment}
        />

        {/* ── Job Management ───────────────────────────────────────────── */}
        <View style={s.section}>
          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsRow}
          >
            <TabPill
              label="Today's Jobs"
              active={activeTab === 'active'}
              onPress={() => setActiveTab('active')}
            />
            <TabPill
              label="Upcoming Booking"
              active={activeTab === 'upcoming'}
              onPress={() => setActiveTab('upcoming')}
            />
            <TabPill
              label="Schedule"
              active={false}
              onPress={onOpenSchedule}
            />
            <TabPill
              label="Completed"
              active={activeTab === 'completed'}
              onPress={() => setActiveTab('completed')}
            />
          </ScrollView>

          {(currentJobs && currentJobs.length > 0) ||
          (activeTab === 'upcoming' && approvedApplications.length > 0) ? (
            <View style={{ gap: Spacing.sm }}>
              {currentJobs?.map((item) => (
                <ActiveJobCard key={item.id} item={item} onPress={onOpenMyWork} />
              ))}
              {activeTab === 'upcoming' &&
                approvedApplications.map((app) => (
                  <ApprovedApplicationCard key={app.id} item={app} onBook={() => openBookingModal(app)} />
                ))}
            </View>
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>
                {jobsLoading && !currentJobs
                  ? 'Loading…'
                  : jobsError
                    ? "Couldn't load jobs. Pull down to try again."
                    : activeTab === 'upcoming'
                      ? 'No approved opportunities waiting to be booked.'
                      : activeTab === 'active'
                        ? 'Nothing scheduled for today.'
                        : 'No jobs to show.'}
              </Text>
            </View>
          )}
        </View>

        <FeedbackSection rating={summary?.rating ?? null} reviews={reviews} />
        <RecentWorkSection />
        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />

      <Modal
        visible={bookingTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setBookingTarget(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Confirm Booking</Text>

            <Text style={s.modalLabel}>Opportunity</Text>
            <Text style={s.modalValue}>{bookingTarget?.title}</Text>

            <Text style={s.modalLabel}>Elder</Text>
            <Text style={s.modalValue}>{bookingTarget?.elderName}</Text>

            {bookingTarget?.location && (
              <>
                <Text style={s.modalLabel}>Location</Text>
                <Text style={s.modalValue}>{bookingTarget.location}</Text>
              </>
            )}

            <Text style={s.modalLabel}>Select Date</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [s.pickerField, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Select date"
            >
              <Text style={s.pickerFieldText}>{formatLongDate(confirmedDate)}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={confirmedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event: any, date?: Date) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && date) setConfirmedDate(date);
                }}
              />
            )}

            <Text style={s.modalLabel}>Select Time</Text>
            <View style={s.timeRow}>
              <Pressable
                onPress={() => setShowStartTimePicker(true)}
                style={({ pressed }) => [s.pickerField, { flex: 1 }, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Select start time"
              >
                <Text style={s.pickerFieldText}>{formatClockTime(confirmedStartTime)}</Text>
              </Pressable>
              <Text style={s.timeRowDash}>—</Text>
              <Pressable
                onPress={() => setShowEndTimePicker(true)}
                style={({ pressed }) => [s.pickerField, { flex: 1 }, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Select end time"
              >
                <Text style={s.pickerFieldText}>{formatClockTime(confirmedEndTime)}</Text>
              </Pressable>
            </View>
            {showStartTimePicker && (
              <DateTimePicker
                value={confirmedStartTime}
                mode="time"
                display="default"
                onChange={(event: any, date?: Date) => {
                  setShowStartTimePicker(false);
                  if (event.type === 'set' && date) setConfirmedStartTime(date);
                }}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={confirmedEndTime}
                mode="time"
                display="default"
                onChange={(event: any, date?: Date) => {
                  setShowEndTimePicker(false);
                  if (event.type === 'set' && date) setConfirmedEndTime(date);
                }}
              />
            )}

            <View style={s.modalBtnRow}>
              <Pressable
                onPress={() => setBookingTarget(null)}
                style={({ pressed }) => [s.modalBtnCancel, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cancel booking"
              >
                <Text style={s.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmBooking}
                disabled={booking}
                style={({ pressed }) => [s.modalBtnConfirm, pressed && s.pressed, booking && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Confirm booking"
              >
                <Text style={s.modalBtnConfirmText}>{booking ? 'Booking…' : 'Confirm Booking'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const GALLERY_SIZE = 128;

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  // ── Greeting ───────────────────────────────────────────────────────────────
  greetingRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: D.surfaceVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  greetingText:     { flex: 1, justifyContent: 'center' },
  greetingHeadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greetingHeadline: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface,
  },
  greetingSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurfaceVariant, marginTop: 2,
  },

  // ── Metrics ────────────────────────────────────────────────────────────────
  metricsGrid: { gap: Spacing.md },
  statsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue:   { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: '#E8792E', lineHeight: 28 },
  statsRight:    { alignItems: 'flex-end' },
  statsJobCount: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#0F5C5C', letterSpacing: 0.5 },
  statsContrib:  { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, marginTop: 2 },

  balanceCard: {
    backgroundColor: '#0F5C5C',
    borderRadius: Radii.xl, padding: Spacing.md, overflow: 'hidden',
    shadowColor: '#0F5C5C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  balanceGlow: {
    position: 'absolute', top: -40, right: -40, width: 128, height: 128,
    borderRadius: 64, backgroundColor: 'rgba(232,121,46,0.15)', opacity: 1,
  },
  balanceLabel: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#ffffff',
    letterSpacing: 1.2, opacity: 0.85, marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontFamily: Typography.fontDisplay, fontSize: 32, lineHeight: 40,
    letterSpacing: -0.5, color: '#ffffff', fontWeight: '800', marginBottom: Spacing.md,
  },
  balanceBtnRow:         { flexDirection: 'row', gap: Spacing.sm },
  balanceBtnOutline: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    minHeight: 44, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceBtnOutlineText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  balanceBtnFill: {
    flex: 1, backgroundColor: '#E8792E', borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    minHeight: 44,
    shadowColor: '#E8792E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  balanceBtnFillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },

  // ── Section ────────────────────────────────────────────────────────────────
  section:       { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
    lineHeight: 28,
  },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabsRow:           { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  tabPill:           { paddingHorizontal: 18, paddingVertical: 8, borderRadius: Radii.full },
  tabPillActive:     {
    backgroundColor: D.secondary,
    shadowColor: D.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  tabPillInactive:   { backgroundColor: D.surfaceContainer, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant },
  tabPillText:       { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.3 },
  tabPillTextActive: { color: D.onSecondary },

  // ── Job Card ───────────────────────────────────────────────────────────────
  jobCard: {
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    borderLeftWidth: 3, borderLeftColor: D.secondary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1, gap: Spacing.sm,
  },
  jobCardPressed: { shadowOpacity: 0.12, elevation: 3 },
  jobCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  jobCardLeft:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flex: 1 },
  jobIconBox:     { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: D.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  jobTitle:       { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface, marginBottom: 2 },
  jobClient:      { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#0F5C5C' },  // teal
  jobStatusBadge: { backgroundColor: D.secondaryContainer, borderRadius: Radii.full, paddingHorizontal: 9, paddingVertical: 4, marginTop: 2 },
  jobStatusText:  { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSecondaryContainer, letterSpacing: 0.8 },
  jobDesc:        { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurfaceVariant },
  jobMeta:        { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.md, rowGap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: D.surfaceVariant, marginTop: 2 },
  jobMetaWhen:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.xs },
  jobMetaItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobMetaIconBox: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(232, 121, 46, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  jobMetaText:    { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.2 },
  jobViewDetailsRow: { alignItems: 'flex-end' },
  bookBtnRow: { alignItems: 'stretch' },
  jobViewDetailsText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.secondary,
    minHeight: 44,
    textAlignVertical: 'center',
  },
  bookBtn: {
    alignSelf: 'stretch',
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff' },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState:     { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Feedback ───────────────────────────────────────────────────────────────
  feedbackRating: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.tertiaryContainer, lineHeight: 20 },
  feedbackCard: {
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant, overflow: 'hidden',
  },
  quoteDecor:  { position: 'absolute', top: -8, left: -4, fontSize: 80, color: D.surfaceVariant, opacity: 0.3, lineHeight: 80, fontFamily: Typography.fontDisplay },
  quoteBar:    { position: 'absolute', left: Spacing.md, top: Spacing.md, bottom: Spacing.md, width: 2, backgroundColor: D.secondaryFixedDim, borderRadius: 1 },
  quoteText:   { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurfaceVariant, fontStyle: 'italic', paddingLeft: Spacing.md },
  quoteAuthor: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary, textAlign: 'right', marginTop: Spacing.sm, letterSpacing: 0.3 },

  // ── Gallery ────────────────────────────────────────────────────────────────
  viewAllText:            { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary, letterSpacing: 0.2 },
  galleryRow:             { flexDirection: 'row', gap: Spacing.md, paddingBottom: 4 },
  galleryItem: {
    width: GALLERY_SIZE, height: GALLERY_SIZE, borderRadius: Radii.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  galleryImage:           { width: '100%', height: '100%' },
  galleryOverlayGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  galleryOverlayDark:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
  galleryTypeIcon:        { position: 'absolute', bottom: 8, left: 8, fontSize: 18, color: '#fff' },
  playBtnWrapper:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.82)', alignItems: 'center', justifyContent: 'center' },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed:      { opacity: 0.75 },
  pressedDark:  { backgroundColor: 'rgba(255,255,255,0.14)' },
  pressedLight: { opacity: 0.88 },

  // ── Confirm Booking modal ────────────────────────────────────────────────
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
    gap: 4,
  },
  modalTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    marginBottom: 6,
  },
  modalLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
    marginTop: 8,
  },
  modalValue: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
  },
  pickerField: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  pickerFieldText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timeRowDash: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
  modalBtnCancel: {
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  modalBtnCancelText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  modalBtnConfirm: {
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  modalBtnConfirmText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
});

export default CreatorDashboard;

