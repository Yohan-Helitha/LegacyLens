import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './OpportunityIntakeScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';
import { adminOpportunityApi } from '../../../services/api/opportunityApi';
import { OpportunityAudioResponse } from '../../../types/opportunity';

type FilterType = 'All' | 'Fully Listened' | 'Partially Listened' | 'Unlistened' | 'Need Review';

const FILTERS = [
  { id: 'All', label: 'All', count: '0', color: 'transparent' },
  { id: 'Fully Listened', label: 'Fully Listened', count: '0', color: '#10b981' },
  { id: 'Partially Listened', label: 'Partially Listened', count: '0', color: Colors.accent },
  { id: 'Unlistened', label: 'Unlistened', count: '0', color: '#ba1a1a' },
  { id: 'Need Review', label: 'Need Review', count: '0', color: '#d8dad9', icon: 'priority-high' },
];

const PlayableCard = ({ item, setPreviewVisible, onOpenReview, onStatusChange }: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(item.type === 'done' ? 45 : item.type === 'partial' ? 14 : 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 45) {
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 1, 45));
      }, 500);
    } else if (progress >= 45) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const getStatusLabel = () => {
    switch (item.type) {
      case 'done': return 'Fully Listened';
      case 'partial': return 'Partially Listened';
      case 'unread': return 'Not Listened';
      default: return item.status || 'Unknown';
    }
  };

  return (
    <View style={[styles.card, item.type === 'done' ? styles.cardOpaque : null]}>
      <View style={styles.cardMain}>
        {/* Status Pill on Top */}
        <View style={{ alignSelf: 'flex-start', backgroundColor: `${item.statusColor}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: item.statusColor }}>
            {getStatusLabel()}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.rowCenter}>
          <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: 'rgba(191,200,200,0.4)' }} />
          <Text style={styles.cardName}>{item.name}</Text>
          {item.verified ? (
            <MaterialIcons name="verified" size={20} color={Colors.accent} style={{ marginLeft: 4 }} />
          ) : null}
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="calendar-today" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.time}</Text>
          </View>
          <View style={styles.durationBadge}>
            <MaterialIcons name="timer" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
        </View>

        {/* Audio Strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 }}>
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: item.type === 'unread' ? '#f2f4f3' : 'rgba(15, 92, 92, 0.1)', borderWidth: item.type === 'unread' ? 1 : 0, borderColor: '#bfc8c8', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={24} color={item.type === 'unread' ? '#6f7978' : Colors.secondary} />
          </TouchableOpacity>

          <View style={[styles.waveformMock]}>
            {Array.from({ length: 45 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.playerWaveBar,
                  { backgroundColor: 'rgba(15, 92, 92, 0.35)' },
                  { height: `${Math.max(20, Math.floor(Math.random() * 80) + 20)}%` },
                  i < progress && styles.playerWaveBarActive
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>
        {(item.type === 'partial' || item.type === 'review') ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setPreviewVisible(true)} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>Review</Text>
            <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
        {item.type === 'unread' ? (
          <TouchableOpacity style={styles.btnOutline} onPress={() => setPreviewVisible(true)} activeOpacity={0.8}>
            <Text style={styles.btnOutlineText}>Start Listening</Text>
          </TouchableOpacity>
        ) : null}
        {item.type === 'done' ? (
          <TouchableOpacity style={styles.btnGhost} onPress={onOpenReview} activeOpacity={0.8}>
            <Text style={styles.btnGhostText}>View Details</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const mapAudioToCard = (audio: OpportunityAudioResponse) => {
  let type: 'done' | 'partial' | 'unread' = 'unread';
  let statusColor = '#ba1a1a';
  switch (audio.status) {
    case 'FULLY_LISTENED':
      type = 'done';
      statusColor = '#10b981';
      break;
    case 'PARTIALLY_LISTENED':
      type = 'partial';
      statusColor = Colors.accent;
      break;
    case 'NEEDS_REVIEW':
      type = 'partial';
      statusColor = '#d8dad9';
      break;
    default:
      type = 'unread';
      statusColor = '#ba1a1a';
  }

  return {
    id: audio.id,
    name: audio.elderName,
    avatar: audio.elderAvatarUrl || 'https://i.pravatar.cc/150?img=1',
    verified: audio.verified,
    location: audio.location || 'Unknown',
    date: audio.recordedAt ? audio.recordedAt.split(' ')[0] : '',
    time: audio.recordedAt ? audio.recordedAt.split(' ')[1]?.substring(0, 5) || '' : '',
    duration: audio.duration || '0 mins',
    status: getStatusLabel(audio.status),
    statusColor,
    type,
    audioUrl: audio.audioUrl,
  };
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'FULLY_LISTENED': return 'Fully Listened';
    case 'PARTIALLY_LISTENED': return 'Partially Listened';
    case 'NEEDS_REVIEW': return 'Need Review';
    default: return 'Not Listened';
  }
};

export const OpportunityIntakeScreen: React.FC<{ onOpenReview?: () => void }> = ({ onOpenReview }) => {
  const { audioSubmissions, refreshAll, loading } = useOpportunity();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(14);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'nameAsc' | 'nameDesc'>('newest');

  const mappedItems = useCallback(() => {
    return (audioSubmissions || []).map(mapAudioToCard);
  }, [audioSubmissions]);

  const filteredItems = mappedItems().filter((item: any) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Fully Listened') return item.type === 'done';
    if (activeFilter === 'Partially Listened') return item.type === 'partial';
    if (activeFilter === 'Unlistened') return item.type === 'unread';
    if (activeFilter === 'Need Review') return item.status === 'Need Review';
    return false;
  });

  const activeCounts = useCallback(() => {
    const items = mappedItems();
    return {
      all: items.length,
      done: items.filter((i: any) => i.type === 'done').length,
      partial: items.filter((i: any) => i.type === 'partial').length,
      unread: items.filter((i: any) => i.type === 'unread').length,
      review: items.filter((i: any) => i.status === 'Need Review').length,
    };
  }, [audioSubmissions]);

  const counts = activeCounts();
  const displayFilters = [
    { id: 'All', label: 'All', count: String(counts.all), color: 'transparent' },
    { id: 'Fully Listened', label: 'Fully Listened', count: String(counts.done), color: '#10b981' },
    { id: 'Partially Listened', label: 'Partially Listened', count: String(counts.partial), color: Colors.accent },
    { id: 'Unlistened', label: 'Unlistened', count: String(counts.unread), color: '#ba1a1a' },
    { id: 'Need Review', label: 'Need Review', count: String(counts.review), color: '#d8dad9', icon: 'priority-high' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && previewVisible && progress < 45) {
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 1, 45));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, previewVisible, progress]);

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Page Title */}
        <View style={styles.titleArea}>
          <Text style={styles.pageTitle}>Cultural Knowledge Intake</Text>
        </View>

        {/* Search & Filter Header */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <View style={[styles.searchBar, { flex: 1 }]}>
            <MaterialIcons name="search" size={20} color="#0f5c5c" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recordings..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, filtersOpen && styles.filterButtonActive]}
            onPress={() => setFiltersOpen(!filtersOpen)}
          >
            <MaterialIcons name="tune" size={20} color={filtersOpen ? Colors.white : '#0f5c5c'} />
          </TouchableOpacity>
        </View>

        {/* Expanded Filters Drawer */}
        {filtersOpen && (
          <View style={styles.filterDrawer}>
            {/* Filter by Location */}
            <View>
              <Text style={styles.filterDrawerTitle}>Location / Region:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {['all', 'Matara', 'Anuradhapura', 'Galle', 'Kandy', 'Colombo', 'Jaffna', 'Kurunegala', 'Hambantota', 'Badulla', 'Negombo'].map((loc) => {
                  const isActive = locationFilter === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={{
                        backgroundColor: isActive ? '#0f5c5c' : '#eceeed',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12
                      }}
                      onPress={() => setLocationFilter(loc)}
                    >
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                        {loc === 'all' ? 'All Locations' : loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View>
              <Text style={styles.filterDrawerTitle}>Sort Order:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { value: 'newest', label: 'Date: Newest First' },
                  { value: 'oldest', label: 'Date: Oldest First' },
                  { value: 'nameAsc', label: 'Name: A to Z' },
                  { value: 'nameDesc', label: 'Name: Z to A' }
                ].map((option) => {
                  const isActive = sortOrder === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={{
                        backgroundColor: isActive ? '#0f5c5c' : '#eceeed',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12
                      }}
                      onPress={() => setSortOrder(option.value as any)}
                    >
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Filters Scroll */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {displayFilters.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  activeFilter === f.id ? styles.filterChipActive : null
                ]}
                onPress={() => setActiveFilter(f.id as FilterType)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === f.id ? styles.filterTextActive : null
                ]}>
                  {f.label}
                </Text>
                <View style={[
                  styles.filterCountBadge,
                  activeFilter === f.id ? styles.filterCountBadgeActive : null
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    activeFilter === f.id ? styles.filterCountTextActive : null
                  ]}>
                    {f.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cards */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={{ marginTop: 12, color: Colors.textMuted }}>Loading audio submissions...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialIcons name="mic-off" size={48} color={Colors.textMuted} />
              <Text style={{ marginTop: 12, color: Colors.textMuted }}>No audio submissions found</Text>
            </View>
          ) : (
            filteredItems.map((item: any) => (
              <PlayableCard key={item.id} item={item} setPreviewVisible={setPreviewVisible} onOpenReview={onOpenReview} />
            ))
          )}
        </View>

      </ScrollView>

      {/* Bottom Sheet / Preview Player */}
      <Modal visible={previewVisible} transparent={true} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setPreviewVisible(false)} />
          <View style={styles.bottomSheet}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Player Header */}
            <View style={styles.playerHeader}>
              <View style={{ flex: 1, paddingRight: Spacing.md }}>
                <Text style={styles.previewSub}>PLAYING PREVIEW</Text>
                <Text style={styles.previewTitle} numberOfLines={2}>Traditional clay pot preparation</Text>
              </View>
              <TouchableOpacity style={styles.closePlayerBtn} onPress={() => setPreviewVisible(false)}>
                <MaterialIcons name="close-fullscreen" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Waveform */}
            <View style={styles.playerWaveformContainer}>
              <View style={styles.playerWaveform}>
                {Array.from({ length: 45 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.playerWaveBar,
                      { height: `${Math.max(20, Math.floor(Math.random() * 80) + 20)}%` },
                      i < progress && styles.playerWaveBarActive
                    ]}
                  />
                ))}
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeTextActive}>00:42</Text>
                <Text style={styles.timeText}>12:48</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.playerControls}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => setProgress(p => Math.max(0, p - 5))}>
                <MaterialIcons name="replay-10" size={32} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playPauseBtn} onPress={() => setIsPlaying(!isPlaying)}>
                <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={36} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={() => setProgress(p => Math.min(45, p + 5))}>
                <MaterialIcons name="forward-10" size={32} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Primary Action */}
            <TouchableOpacity style={styles.fullReviewBtn} activeOpacity={0.8} onPress={() => {
              setPreviewVisible(false);
              onOpenReview?.();
            }}>
              <Text style={styles.fullReviewBtnText}>Open Full Review</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
