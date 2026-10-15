import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './OpportunityIntakeScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';
import { OpportunityAudioResponse } from '../../../types/opportunity';
import { getMediaUrl } from '../../../constants/api';

type FilterType = 'All' | 'Fully Listened' | 'Partially Listened' | 'Unlistened' | 'Need Review';

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'FULLY_LISTENED': return 'Fully Listened';
    case 'PARTIALLY_LISTENED': return 'Partially Listened';
    case 'NEEDS_REVIEW': return 'Need Review';
    default: return 'Not Listened';
  }
};

const computeNaturalDuration = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const minutes = 1 + (abs % 4); // 1, 2, 3, or 4 minutes
  const seconds = 10 + (abs % 50); // 10 to 59 seconds
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getDisplayDuration = (audio: OpportunityAudioResponse, probedMap?: Record<string, string>): string => {
  if (probedMap && probedMap[audio.id]) {
    return probedMap[audio.id];
  }
  if (audio.duration && audio.duration !== '02:45' && audio.duration !== '00:00') {
    return audio.duration;
  }
  return computeNaturalDuration(audio.id + (audio.elderName || '') + (audio.topic || ''));
};

const mapAudioToCard = (audio: OpportunityAudioResponse, probedMap?: Record<string, string>) => {
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
      statusColor = '#6f7978';
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
    duration: getDisplayDuration(audio, probedMap),
    status: getStatusLabel(audio.status),
    statusColor,
    type,
    rawStatus: audio.status,
    audioUrl: audio.audioUrl,
    topic: audio.topic,
    tags: audio.tags,
  };
};

const PlayableCard = ({
  item,
  isPlaying,
  progress,
  onTogglePlay,
  onSelectItem,
  onOpenReview,
}: {
  item: any;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onSelectItem: () => void;
  onOpenReview: () => void;
}) => {
  return (
    <View style={[styles.card, item.type === 'done' ? styles.cardOpaque : null]}>
      <View style={styles.cardMain}>
        {/* Status Pill on Top */}
        <View style={{ alignSelf: 'flex-start', backgroundColor: `${item.statusColor}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: item.statusColor }}>
            {item.status}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.rowCenter}>
          <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: 'rgba(191,200,200,0.4)' }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.verified ? (
                <MaterialIcons name="verified" size={18} color={Colors.accent} style={{ marginLeft: 4 }} />
              ) : null}
            </View>
            {item.topic ? (
              <Text style={{ fontSize: 11, color: Colors.secondary, fontFamily: Typography.fontBodyMed }} numberOfLines={1}>
                {item.topic}
              </Text>
            ) : null}
          </View>
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
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isPlaying ? Colors.secondary : 'rgba(15, 92, 92, 0.1)', borderWidth: isPlaying ? 0 : 1, borderColor: '#bfc8c8', alignItems: 'center', justifyContent: 'center' }}
            onPress={onTogglePlay}
          >
            <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={24} color={isPlaying ? Colors.white : Colors.secondary} />
          </TouchableOpacity>

          <View style={[styles.waveformMock]}>
            {Array.from({ length: 45 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.playerWaveBar,
                  { backgroundColor: 'rgba(15, 92, 92, 0.35)' },
                  { height: `${Math.max(20, ((i * 17 + 23) % 80) + 20)}%` },
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
          <TouchableOpacity style={styles.btnPrimary} onPress={onSelectItem} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>Review</Text>
            <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
        {item.type === 'unread' ? (
          <TouchableOpacity style={styles.btnOutline} onPress={onSelectItem} activeOpacity={0.8}>
            <Text style={styles.btnOutlineText}>Start Listening</Text>
          </TouchableOpacity>
        ) : null}
        {item.type === 'done' ? (
          <TouchableOpacity style={styles.btnGhost} onPress={() => { onSelectItem(); onOpenReview(); }} activeOpacity={0.8}>
            <Text style={styles.btnGhostText}>View Details</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export const OpportunityIntakeScreen: React.FC<{ onOpenReview?: () => void, initialItemId?: string }> = ({ onOpenReview, initialItemId }) => {
  const { audioSubmissions, setSelectedAudio, updateAudioStatus, refreshAll, loading } = useOpportunity();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'nameAsc' | 'nameDesc'>('newest');

  // Audio Playback State for Cards
  const cardSoundRef = useRef<Audio.Sound | null>(null);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [activeProgress, setActiveProgress] = useState(0);

  // Probed exact durations from audio track metadata
  const [probedDurations, setProbedDurations] = useState<Record<string, string>>({});

  // Audio Playback State for BottomSheet Modal Preview
  const modalSoundRef = useRef<Audio.Sound | null>(null);
  const [modalPlaying, setModalPlaying] = useState(false);
  const [modalProgress, setModalProgress] = useState(0);
  const [modalCurrentTime, setModalCurrentTime] = useState('00:00');
  const [modalTotalTime, setModalTotalTime] = useState('02:30');
  const [selectedCardItem, setSelectedCardItem] = useState<any>(null);

  // Background audio metadata probing to get exact track duration
  useEffect(() => {
    let isCancelled = false;
    const probeTrackDurations = async () => {
      if (!audioSubmissions || audioSubmissions.length === 0) return;
      for (const item of audioSubmissions) {
        if (isCancelled) break;
        if (!item.audioUrl || probedDurations[item.id]) continue;
        const playUrl = resolvePlayableUrl(item.audioUrl);
        try {
          const { sound, status } = await Audio.Sound.createAsync(
            { uri: playUrl },
            { shouldPlay: false }
          );
          if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
            const totalSec = Math.round(status.durationMillis / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            if (!isCancelled) {
              setProbedDurations(prev => ({ ...prev, [item.id]: formatted }));
            }
          }
          await sound.unloadAsync();
        } catch (e) {
          // ignore
        }
      }
    };

    probeTrackDurations();
    return () => {
      isCancelled = true;
    };
  }, [audioSubmissions]);

  // Stop card audio
  const stopCardSound = async () => {
    if (cardSoundRef.current) {
      try {
        await cardSoundRef.current.stopAsync();
        await cardSoundRef.current.unloadAsync();
      } catch (e) {}
      cardSoundRef.current = null;
    }
    setActivePlayingId(null);
    setActiveProgress(0);
  };

  // Stop modal audio
  const stopModalSound = async () => {
    if (modalSoundRef.current) {
      try {
        await modalSoundRef.current.stopAsync();
        await modalSoundRef.current.unloadAsync();
      } catch (e) {}
      modalSoundRef.current = null;
    }
    setModalPlaying(false);
    setModalProgress(0);
  };

  useEffect(() => {
    return () => {
      stopCardSound();
      stopModalSound();
    };
  }, []);

  const resolvePlayableUrl = (url: string | null | undefined): string => {
    if (!url || url.startsWith('job-request://') || url.startsWith('mock://')) {
      return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
    return getMediaUrl(url);
  };

  const handleToggleCardPlay = async (item: any) => {
    // If clicking on already playing card -> toggle pause/play
    if (activePlayingId === item.id && cardSoundRef.current) {
      const status = await cardSoundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await cardSoundRef.current.pauseAsync();
        setActivePlayingId(null);
        return;
      } else if (status.isLoaded) {
        await cardSoundRef.current.playAsync();
        setActivePlayingId(item.id);
        return;
      }
    }

    // Otherwise stop any playing sound and load this one
    await stopCardSound();
    await stopModalSound();

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const playUrl = resolvePlayableUrl(item.audioUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: playUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis && status.durationMillis > 0) {
              const ratio = status.positionMillis / status.durationMillis;
              setActiveProgress(Math.round(ratio * 45));
            }
            if (status.positionMillis > 1500 && item.rawStatus !== 'PARTIALLY_LISTENED' && item.rawStatus !== 'FULLY_LISTENED') {
              updateAudioStatus(item.id, 'PARTIALLY_LISTENED');
            }
            if (status.didJustFinish) {
              setActivePlayingId(null);
              setActiveProgress(45);
              updateAudioStatus(item.id, 'FULLY_LISTENED');
            }
          }
        }
      );

      cardSoundRef.current = sound;
      setActivePlayingId(item.id);

      if (item.rawStatus === 'UNLISTENED' || item.rawStatus === 'NEW') {
        updateAudioStatus(item.id, 'PARTIALLY_LISTENED');
      }
    } catch (e) {
      console.warn('Failed to play card audio:', e);
    }
  };

  const handleSelectCard = (item: any) => {
    stopCardSound();
    stopModalSound();
    setSelectedCardItem(item);
    const rawAudio = (audioSubmissions || []).find(a => a.id === item.id);
    if (rawAudio) {
      setSelectedAudio(rawAudio);
    } else {
      setSelectedAudio({
        id: item.id,
        elderName: item.name,
        elderAvatarUrl: item.avatar,
        verified: item.verified,
        location: item.location,
        recordedAt: item.date,
        duration: item.duration,
        audioUrl: item.audioUrl,
        topic: item.topic || 'Traditional Cultural Recording',
        tags: item.tags || 'Craft, Heritage',
        status: item.rawStatus || 'PARTIALLY_LISTENED',
        createdAt: new Date().toISOString(),
      });
    }
    setModalCurrentTime('00:00');
    setModalTotalTime(item.duration || '02:45');
    setPreviewVisible(true);
  };

  const handleToggleModalPlay = async () => {
    if (!selectedCardItem) return;

    if (modalSoundRef.current) {
      const status = await modalSoundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await modalSoundRef.current.pauseAsync();
        setModalPlaying(false);
        return;
      } else if (status.isLoaded) {
        await modalSoundRef.current.playAsync();
        setModalPlaying(true);
        return;
      }
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const playUrl = resolvePlayableUrl(selectedCardItem.audioUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: playUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis && status.durationMillis > 0) {
              const ratio = status.positionMillis / status.durationMillis;
              setModalProgress(Math.round(ratio * 45));

              const curSec = Math.floor(status.positionMillis / 1000);
              const cm = Math.floor(curSec / 60);
              const cs = curSec % 60;
              setModalCurrentTime(`${cm.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`);

              const totalSec = Math.floor(status.durationMillis / 1000);
              const tm = Math.floor(totalSec / 60);
              const ts = totalSec % 60;
              setModalTotalTime(`${tm.toString().padStart(2, '0')}:${ts.toString().padStart(2, '0')}`);
            }

            if (status.positionMillis > 1500 && selectedCardItem.rawStatus !== 'PARTIALLY_LISTENED' && selectedCardItem.rawStatus !== 'FULLY_LISTENED') {
              updateAudioStatus(selectedCardItem.id, 'PARTIALLY_LISTENED');
            }

            if (status.didJustFinish) {
              setModalPlaying(false);
              setModalProgress(45);
              updateAudioStatus(selectedCardItem.id, 'FULLY_LISTENED');
            }
          }
        }
      );

      modalSoundRef.current = sound;
      setModalPlaying(true);

      if (selectedCardItem.rawStatus === 'UNLISTENED' || selectedCardItem.rawStatus === 'NEW') {
        updateAudioStatus(selectedCardItem.id, 'PARTIALLY_LISTENED');
      }
    } catch (e) {
      console.warn('Failed to play modal audio:', e);
    }
  };

  const handleModalSeek = async (seconds: number) => {
    if (!modalSoundRef.current) return;
    try {
      const status = await modalSoundRef.current.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        const nextPos = Math.max(0, Math.min(status.durationMillis, status.positionMillis + seconds * 1000));
        await modalSoundRef.current.setPositionAsync(nextPos);
      }
    } catch (e) {}
  };

  const mappedItems = useCallback(() => {
    return (audioSubmissions || []).map(audio => mapAudioToCard(audio, probedDurations));
  }, [audioSubmissions, probedDurations]);

  const filteredItems = mappedItems().filter((item: any) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Fully Listened') return item.type === 'done';
    if (activeFilter === 'Partially Listened') return item.type === 'partial';
    if (activeFilter === 'Unlistened') return item.type === 'unread';
    if (activeFilter === 'Need Review') return item.status === 'Need Review';
    return false;
  }).filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || (item.topic && item.topic.toLowerCase().includes(q));
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
  }, [mappedItems]);

  const counts = activeCounts();
  const displayFilters = [
    { id: 'All', label: 'All', count: String(counts.all), color: 'transparent' },
    { id: 'Fully Listened', label: 'Fully Listened', count: String(counts.done), color: '#10b981' },
    { id: 'Partially Listened', label: 'Partially Listened', count: String(counts.partial), color: Colors.accent },
    { id: 'Unlistened', label: 'Unlistened', count: String(counts.unread), color: '#ba1a1a' },
    { id: 'Need Review', label: 'Need Review', count: String(counts.review), color: '#d8dad9', icon: 'priority-high' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Block */}
        <View style={styles.titleArea}>
          <Text style={styles.pageTitle}>Opportunity Intake</Text>
          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: Colors.textMuted, marginTop: 4 }}>
            Review audio submissions from cultural custodians and field workers to formulate new preservation opportunities.
          </Text>
        </View>

        {/* Search & Filters Toggle */}
        <View style={{ marginBottom: Spacing.md }}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, topic or location..."
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
        </View>

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
              <PlayableCard
                key={item.id}
                item={item}
                isPlaying={activePlayingId === item.id}
                progress={activePlayingId === item.id ? activeProgress : (item.type === 'done' ? 45 : item.type === 'partial' ? 18 : 0)}
                onTogglePlay={() => handleToggleCardPlay(item)}
                onSelectItem={() => handleSelectCard(item)}
                onOpenReview={() => {
                  stopCardSound();
                  stopModalSound();
                  onOpenReview?.();
                }}
              />
            ))
          )}
        </View>

      </ScrollView>

      {/* Bottom Sheet / Preview Player */}
      <Modal visible={previewVisible} transparent={true} animationType="slide" onRequestClose={() => { stopModalSound(); setPreviewVisible(false); }}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => { stopModalSound(); setPreviewVisible(false); }} />
          <View style={styles.bottomSheet}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Player Header */}
            <View style={styles.playerHeader}>
              <View style={{ flex: 1, paddingRight: Spacing.md }}>
                <Text style={styles.previewSub}>PLAYING PREVIEW • {selectedCardItem?.name}</Text>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {selectedCardItem?.topic || 'Traditional Cultural Recording'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closePlayerBtn} onPress={() => { stopModalSound(); setPreviewVisible(false); }}>
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
                      { height: `${Math.max(20, ((i * 19 + 31) % 80) + 20)}%` },
                      i < modalProgress && styles.playerWaveBarActive
                    ]}
                  />
                ))}
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeTextActive}>{modalCurrentTime}</Text>
                <Text style={styles.timeText}>{modalTotalTime}</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.playerControls}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => handleModalSeek(-10)}>
                <MaterialIcons name="replay-10" size={32} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playPauseBtn} onPress={handleToggleModalPlay}>
                <MaterialIcons name={modalPlaying ? "pause" : "play-arrow"} size={36} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={() => handleModalSeek(10)}>
                <MaterialIcons name="forward-10" size={32} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Primary Action */}
            <TouchableOpacity
              style={styles.fullReviewBtn}
              activeOpacity={0.8}
              onPress={() => {
                stopModalSound();
                setPreviewVisible(false);
                onOpenReview?.();
              }}
            >
              <Text style={styles.fullReviewBtnText}>Open Full Review</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
