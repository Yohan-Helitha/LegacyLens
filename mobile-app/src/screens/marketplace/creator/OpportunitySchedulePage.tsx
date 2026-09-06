import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import type { JobResponse } from '../../../types/creatorDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  secondary:            '#E8792E',
  onSecondary:          '#ffffff',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
  outline:          '#a0aab0',

  /** Alert red — reserved for urgent work only, never used elsewhere in this screen's palette. */
  urgentDot: '#C0392B',
} as const;

/**
 * Cycled, in scheduled-time order, across a day's non-urgent jobs so two
 * different bookings on the same date get two different dot colours.
 * Urgent jobs always use D.urgentDot instead, regardless of position, so
 * they read as a distinct category rather than "just another colour".
 */
const DOT_PALETTE = [D.primary, D.secondary, '#5B6EC7'] as const;
const MAX_DOTS_PER_DAY = 3;

function computeDotColors(dayJobs: JobResponse[]): string[] {
  const colors: string[] = [];
  let paletteIndex = 0;
  for (const job of dayJobs) {
    if (colors.length >= MAX_DOTS_PER_DAY) break;
    if (job.urgent) {
      colors.push(D.urgentDot);
    } else {
      colors.push(DOT_PALETTE[paletteIndex % DOT_PALETTE.length]);
      paletteIndex += 1;
    }
  }
  return colors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback data — shown only if /api/creator-dashboard/jobs fails, so the
// screen never renders blank.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_JOBS: JobResponse[] = [
  {
    id: 'fallback-1',
    title: 'Traditional Recipe Documentation',
    description: '',
    elderName: 'Mrs. Kamala Wijesinghe',
    location: 'Matara',
    offeredAmount: 3000,
    status: 'UPCOMING',
    urgent: false,
    scheduledAt: '2026-08-30T12:30:00',
    completedAt: null,
  },
  {
    id: 'fallback-2',
    title: 'Photographing the Family Loom',
    description: '',
    elderName: 'Mrs. Kamala Wijesinghe',
    location: 'Matara',
    offeredAmount: 1800,
    status: 'UPCOMING',
    urgent: true,
    scheduledAt: '2026-08-30T15:30:00',
    completedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers — a plain y-m-d key (never ISO/UTC) so a job scheduled at
// 11pm local time doesn't silently land on the wrong calendar day.
// ─────────────────────────────────────────────────────────────────────────────
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

type CalendarCell = { date: Date; inMonth: boolean };

/** Builds a full 7-column month grid, padded with the trailing/leading days of neighbouring months. */
function buildCalendarWeeks(monthStart: Date): CalendarCell[][] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatSelectedHeading(d: Date): string {
  const weekdayMonthDay = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `${weekdayMonthDay} ${d.getFullYear()}`;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const ChevronIcon: React.FC<IconProps & { direction: 'left' | 'right' }> = ({ size = 16, color = D.primary, direction }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </Svg>
);

const PinIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);

const PersonIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="7" x2="20" y2="7" />
    <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <Line x1="9" y1="4" x2="15" y2="4" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar — back arrow, since this is reached via a button, not a nav tab
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.appBar}>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
      <Text style={s.backArrow}>{'←'}</Text>
    </Pressable>
    <Text style={s.appBarTitle}>Legacy Lens</Text>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Notifications">
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Calendar
// ─────────────────────────────────────────────────────────────────────────────
const Calendar: React.FC<{
  visibleMonth: Date;
  selectedKey: string;
  dotColorsByDateKey: Record<string, string[]>;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}> = ({ visibleMonth, selectedKey, dotColorsByDateKey, onSelectDate, onPrevMonth, onNextMonth }) => {
  const weeks = useMemo(() => buildCalendarWeeks(visibleMonth), [visibleMonth]);
  const todayKey = dateKey(new Date());

  return (
    <View style={s.calendarCard}>
      <View style={s.calendarHeader}>
        <Pressable onPress={onPrevMonth} style={({ pressed }) => [s.calendarNavBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Previous month">
          <ChevronIcon direction="left" color="#ffffff" />
        </Pressable>
        <Text style={s.calendarMonthText}>
          {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={onNextMonth} style={({ pressed }) => [s.calendarNavBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Next month">
          <ChevronIcon direction="right" color="#ffffff" />
        </Pressable>
      </View>

      <View style={s.weekdayRow}>
        {WEEKDAY_LABELS.map((w) => (
          <Text key={w} style={s.weekdayText}>{w}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={s.weekRow}>
          {week.map((cell) => {
            const key = dateKey(cell.date);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            const dots = dotColorsByDateKey[key] ?? [];
            return (
              <Pressable
                key={key}
                onPress={() => onSelectDate(cell.date)}
                style={s.dayCell}
                accessibilityRole="button"
                accessibilityLabel={cell.date.toDateString()}
              >
                <View style={[s.dayCircle, isSelected && s.dayCircleSelected, !isSelected && isToday && s.dayCircleToday]}>
                  <Text
                    style={[
                      s.dayText,
                      !cell.inMonth && s.dayTextOutMonth,
                      isSelected && s.dayTextSelected,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </View>
                {!isSelected && dots.length > 0 && (
                  <View style={s.dayDotsRow}>
                    {dots.map((color, i) => (
                      <View key={i} style={[s.dayDot, { backgroundColor: color }]} />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scheduled job card
// ─────────────────────────────────────────────────────────────────────────────
const ScheduledJobCard: React.FC<{
  job: JobResponse;
  onView: () => void;
  onRemove: () => void;
}> = ({ job, onView, onRemove }) => (
  <View style={s.jobCard}>
    <View style={s.jobCardHeaderRow}>
      <View style={{ flex: 1, gap: 4 }}>
        {job.urgent && (
          <View style={s.urgentBadge}>
            <Text style={s.urgentBadgeText}>Urgent</Text>
          </View>
        )}
        <Text style={s.jobTitle} numberOfLines={2}>{job.title}</Text>
      </View>
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Remove from schedule"
      >
        <TrashIcon />
      </Pressable>
    </View>

    <View style={{ gap: 8 }}>
      <View style={s.jobInfoRow}>
        <PersonIcon />
        <Text style={s.jobInfoText}>{job.elderName}</Text>
      </View>
      <View style={s.jobInfoRow}>
        <ClockIcon />
        <Text style={s.jobInfoText}>{formatTime(job.scheduledAt)}</Text>
      </View>
      {job.location && (
        <View style={s.jobInfoRow}>
          <PinIcon />
          <Text style={s.jobInfoText}>{job.location}</Text>
        </View>
      )}
    </View>

    <Pressable
      onPress={onView}
      style={({ pressed }) => [s.viewBtn, pressed && s.viewBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View ${job.title}`}
    >
      <Text style={s.viewBtnText}>View</Text>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunitySchedulePage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
}> = ({ onNavigate, onBack }) => {
  const [jobs, setJobs] = useState<JobResponse[]>(FALLBACK_JOBS);
  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(new Date(FALLBACK_JOBS[0].scheduledAt!)));
  const [selectedKey, setSelectedKey] = useState<string>(dateKey(new Date(FALLBACK_JOBS[0].scheduledAt!)));

  useEffect(() => {
    creatorDashboardApi
      .getJobs('UPCOMING')
      .then((data) => {
        setJobs(data);
        const scheduled = data.filter((j) => j.scheduledAt).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
        if (scheduled.length > 0) {
          const first = new Date(scheduled[0].scheduledAt!);
          setVisibleMonth(startOfMonth(first));
          setSelectedKey(dateKey(first));
        }
      })
      .catch(() => {});
  }, []);

  const jobsByDateKey = useMemo(() => {
    const map: Record<string, JobResponse[]> = {};
    for (const job of jobs) {
      if (!job.scheduledAt) continue;
      const key = dateKey(new Date(job.scheduledAt));
      (map[key] ??= []).push(job);
    }
    return map;
  }, [jobs]);

  const dotColorsByDateKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [key, dayJobs] of Object.entries(jobsByDateKey)) {
      map[key] = computeDotColors(dayJobs);
    }
    return map;
  }, [jobsByDateKey]);

  const selectedJobs = jobsByDateKey[selectedKey] ?? [];
  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedKey]);

  const handleRemove = (jobId: string) => {
    Alert.alert(
      'Remove from schedule?',
      'This only removes it from this view — there is no cancellation request sent yet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setJobs((prev) => prev.filter((j) => j.id !== jobId)) },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.breadcrumb}>Schedule Booking.....</Text>

        <Calendar
          visibleMonth={visibleMonth}
          selectedKey={selectedKey}
          dotColorsByDateKey={dotColorsByDateKey}
          onSelectDate={(d) => setSelectedKey(dateKey(d))}
          onPrevMonth={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        />

        <View style={s.legendRow}>
          <View style={s.legendItemsRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: D.primary }]} />
              <Text style={s.legendText}>Booking</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: D.urgentDot }]} />
              <Text style={s.legendText}>Urgent</Text>
            </View>
          </View>
          <Text style={s.legendHint}>Different colours on one date mean different bookings.</Text>
        </View>

        <View style={{ gap: 2 }}>
          <Text style={s.selectedHeading}>{formatSelectedHeading(selectedDate)}</Text>
          <Text style={s.selectedSubtext}>
            {selectedJobs.length === 0
              ? 'No scheduled work.'
              : `${selectedJobs.length} scheduled work${selectedJobs.length > 1 ? 's' : ''}.`}
          </Text>
        </View>

        {selectedJobs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Nothing booked for this date yet.</Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {selectedJobs.map((job) => (
              <ScheduledJobCard key={job.id} job={job} onView={onBack} onRemove={() => handleRemove(job.id)} />
            ))}
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default OpportunitySchedulePage;

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
  breadcrumb: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
  },

  // ── Calendar ─────────────────────────────────────────────────────────────
  calendarCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: D.primary, paddingVertical: 12, paddingHorizontal: Spacing.sm,
  },
  calendarNavBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calendarMonthText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: '#ffffff',
  },
  weekdayRow: {
    flexDirection: 'row',
    backgroundColor: D.surfaceContainerLow,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
  },
  weekdayText: {
    flex: 1, textAlign: 'center',
    fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.onSurfaceVariant, letterSpacing: 0.3,
  },
  weekRow: { flexDirection: 'row', paddingVertical: 2 },
  dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  dayCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: D.primary },
  dayCircleToday: { borderWidth: 1.5, borderColor: D.secondary },
  dayText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },
  dayTextOutMonth: { color: D.outline },
  dayTextSelected: { color: '#ffffff', fontFamily: Typography.fontBodySemi },
  dayDotsRow: {
    position: 'absolute', bottom: 2,
    flexDirection: 'row', gap: 3,
  },
  dayDot: { width: 4, height: 4, borderRadius: 2 },

  // ── Legend ───────────────────────────────────────────────────────────────
  legendRow: { gap: 4 },
  legendItemsRow: { flexDirection: 'row', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  legendHint: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant },

  // ── Selected date summary ────────────────────────────────────────────────
  selectedHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    color: D.onSurface,
    letterSpacing: -0.2,
  },
  selectedSubtext: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  emptyState: { paddingVertical: Spacing.lg, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Scheduled job card ───────────────────────────────────────────────────
  jobCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  jobCardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  jobTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  urgentBadge: {
    alignSelf: 'flex-start', backgroundColor: D.urgentDot, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  urgentBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: '#ffffff', letterSpacing: 0.4 },
  trashBtn: { padding: 2 },
  jobInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobInfoText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  viewBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  viewBtnPressed: { opacity: 0.9 },
  viewBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
