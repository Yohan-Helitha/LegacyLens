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
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
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

  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',
} as const;

/**
 * Cycled, in scheduled-time order, across a day's non-urgent items so two
 * different bookings on the same date get two different dot colours.
 * Urgent items always use D.urgentDot instead, regardless of position, so
 * they read as a distinct category rather than "just another colour".
 */
const DOT_PALETTE = [D.primary, D.secondary, '#5B6EC7'] as const;
const MAX_DOTS_PER_DAY = 3;

function computeDotColors(dayItems: ScheduleItem[]): string[] {
  const colors: string[] = [];
  let paletteIndex = 0;
  for (const item of dayItems) {
    if (colors.length >= MAX_DOTS_PER_DAY) break;
    if (item.urgent) {
      colors.push(D.urgentDot);
    } else {
      colors.push(DOT_PALETTE[paletteIndex % DOT_PALETTE.length]);
      paletteIndex += 1;
    }
  }
  return colors;
}

/**
 * A calendar entry always comes from a real, confirmed Job — created only
 * once a creator has booked an approved application.
 */
interface ScheduleItem {
  id: string;
  title: string;
  elderName: string;
  location: string | null;
  date: Date;
  timeLabel: string;
  urgent: boolean;
  /** Mirrors the same status pill shown on the Opportunity/Submitted Application cards. */
  statusLabel: string;
  opportunityId?: string;
}

/** A plain y-m-d string (from JobResponse.scheduledAt) parsed without UTC shifting. */
function parseDateOnly(isoDateOrDateTime: string): Date {
  const [y, m, d] = isoDateOrDateTime.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function jobToScheduleItem(job: JobResponse): ScheduleItem | null {
  if (!job.scheduledAt) return null;
  return {
    id: `job-${job.id}`,
    title: job.title,
    elderName: job.elderName,
    location: job.location,
    date: parseDateOnly(job.scheduledAt),
    timeLabel: job.timeWindowText ?? formatTime(job.scheduledAt),
    urgent: job.urgent,
    // Any Job that reached the schedule page came from a confirmed booking.
    statusLabel: 'Booked',
  };
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
    timeWindowText: null,
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
    timeWindowText: null,
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
  item: ScheduleItem;
  onView: () => void;
  onRemove: () => void;
}> = ({ item, onView, onRemove }) => (
  <View style={[s.jobCard, { borderLeftColor: item.urgent ? D.urgentDot : D.primary }]}>
    <View style={s.jobCardHeaderRow}>
      <View style={s.jobIconBox}>
        <Text style={{ fontSize: 18 }}>🎥</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {item.urgent && (
          <View style={s.urgentBadge}>
            <Text style={s.urgentBadgeText}>Urgent</Text>
          </View>
        )}
        <Text style={s.jobTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.jobClient}>{item.elderName}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={s.scheduleStatusBadge}>
          <Text style={s.scheduleStatusText}>{item.statusLabel}</Text>
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
    </View>

    <View style={s.jobMetaRow}>
      <View style={s.jobMetaItem}>
        <View style={s.jobMetaIconBox}><ClockIcon size={12} color={D.secondary} /></View>
        <Text style={s.jobMetaText}>{item.timeLabel}</Text>
      </View>
      {item.location && (
        <View style={s.jobMetaItem}>
          <View style={s.jobMetaIconBox}><PinIcon size={12} color={D.secondary} /></View>
          <Text style={s.jobMetaText}>{item.location}</Text>
        </View>
      )}
    </View>

    <Pressable
      onPress={onView}
      style={({ pressed }) => [s.viewBtn, pressed && s.viewBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
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
  /** Opens the real opportunity for an application-sourced item — Job-sourced items have no detail page yet, so they fall back to onBack. */
  onViewOpportunity?: (opportunityId: string) => void;
}> = ({ onNavigate, onBack, onViewOpportunity }) => {
  const [jobs, setJobs] = useState<JobResponse[]>(FALLBACK_JOBS);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
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

  const scheduleItems = useMemo(() => {
    const jobItems = jobs.map(jobToScheduleItem).filter((x): x is ScheduleItem => x !== null);
    return jobItems.filter((item) => !removedIds.has(item.id));
  }, [jobs, removedIds]);

  const itemsByDateKey = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const item of scheduleItems) {
      const key = dateKey(item.date);
      (map[key] ??= []).push(item);
    }
    return map;
  }, [scheduleItems]);

  const dotColorsByDateKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [key, dayItems] of Object.entries(itemsByDateKey)) {
      map[key] = computeDotColors(dayItems);
    }
    return map;
  }, [itemsByDateKey]);

  const selectedItems = itemsByDateKey[selectedKey] ?? [];
  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedKey]);

  const handleRemove = (itemId: string) => {
    Alert.alert(
      'Remove from schedule?',
      'This only removes it from this view — there is no cancellation request sent yet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setRemovedIds((prev) => new Set(prev).add(itemId)) },
      ],
    );
  };

  const handleView = (item: ScheduleItem) => {
    if (item.opportunityId && onViewOpportunity) {
      onViewOpportunity(item.opportunityId);
    } else {
      // No per-job detail page exists yet — same stopgap used elsewhere.
      onBack();
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 2 }}>
          <Text style={s.pageTitle}>My Schedule</Text>
          <Text style={s.pageSubtitle}>Confirmed bookings and upcoming sessions</Text>
        </View>

        <Calendar
          visibleMonth={visibleMonth}
          selectedKey={selectedKey}
          dotColorsByDateKey={dotColorsByDateKey}
          onSelectDate={(d) => setSelectedKey(dateKey(d))}
          onPrevMonth={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        />

        <View style={s.legendSection}>
          <View style={s.legendRow}>
            <View style={s.legendChip}>
              <View style={[s.legendDot, { backgroundColor: D.primary }]} />
              <Text style={s.legendChipText}>Booking</Text>
            </View>
            <View style={[s.legendChip, s.legendChipUrgent]}>
              <View style={[s.legendDot, { backgroundColor: D.urgentDot }]} />
              <Text style={[s.legendChipText, { color: D.urgentDot }]}>Urgent</Text>
            </View>
          </View>
          <Text style={s.legendHint}>Different colours on one date mean different bookings.</Text>
        </View>

        <View style={s.selectedCard}>
          <View style={[s.selectedAccentBar, { backgroundColor: selectedItems.length > 0 ? D.primary : D.surfaceVariant }]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.selectedHeading}>{formatSelectedHeading(selectedDate)}</Text>
            <Text style={s.selectedSubtext}>
              {selectedItems.length === 0
                ? 'No scheduled work.'
                : `${selectedItems.length} scheduled work${selectedItems.length > 1 ? 's' : ''}.`}
            </Text>
          </View>
          {selectedItems.length > 0 && (
            <View style={s.selectedCountBadge}>
              <Text style={s.selectedCountText}>{selectedItems.length}</Text>
            </View>
          )}
        </View>

        {selectedItems.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Nothing booked for this date yet.</Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {selectedItems.map((item) => (
              <ScheduledJobCard key={item.id} item={item} onView={() => handleView(item)} onRemove={() => handleRemove(item.id)} />
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
  pageTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: D.onSurface,
    letterSpacing: -0.3,
  },
  pageSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Calendar ─────────────────────────────────────────────────────────────
  calendarCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: D.primary, paddingVertical: 14, paddingHorizontal: Spacing.md,
  },
  calendarNavBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  calendarMonthText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: '#ffffff',
    letterSpacing: 0.2,
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
  legendSection: { gap: 6 },
  legendRow: { flexDirection: 'row', gap: Spacing.sm },
  legendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  legendChipUrgent: { backgroundColor: '#fbecea' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendChipText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  legendHint: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant },

  // ── Selected date summary ────────────────────────────────────────────────
  selectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.lg,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  selectedAccentBar: { width: 4, alignSelf: 'stretch', borderRadius: Radii.full },
  selectedHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
    letterSpacing: -0.2,
  },
  selectedSubtext: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  selectedCountBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: D.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  selectedCountText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSecondaryContainer },

  emptyState: { paddingVertical: Spacing.lg, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Scheduled job card ───────────────────────────────────────────────────
  jobCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderLeftWidth: 3,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  jobCardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  jobIconBox: { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: D.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface },
  jobClient: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.primary },
  urgentBadge: {
    alignSelf: 'flex-start', backgroundColor: D.urgentDot, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  urgentBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: '#ffffff', letterSpacing: 0.4 },
  scheduleStatusBadge: {
    alignSelf: 'flex-start', backgroundColor: D.secondaryContainer, borderRadius: Radii.full,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  scheduleStatusText: {
    fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSecondaryContainer, letterSpacing: 0.8,
  },
  trashBtn: { padding: 2 },
  jobMetaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: D.surfaceVariant,
  },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobMetaIconBox: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(232, 121, 46, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  jobMetaText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.2 },
  viewBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  viewBtnPressed: { opacity: 0.9 },
  viewBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
