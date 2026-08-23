import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './OpportunityIntakeScreen.styles';

type FilterType = 'All' | 'Fully Listened' | 'Partially Listened' | 'Unlistened' | 'Need Review';

const FILTERS = [
  { id: 'All', label: 'All', count: '10', color: 'transparent' },
  { id: 'Fully Listened', label: 'Fully Listened', count: '3', color: '#10b981' },
  { id: 'Partially Listened', label: 'Partially Listened', count: '2', color: Colors.accent },
  { id: 'Unlistened', label: 'Unlistened', count: '2', color: '#ba1a1a' },
  { id: 'Need Review', label: 'Need Review', count: '3', color: '#d8dad9', icon: 'priority-high' },
];

const MOCK_DATA = [
  {
    id: '1',
    name: 'Mrs. Kamala Wijesinghe',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH7-D0WjeNXK_Uvi1YZNypRZpKGGl9ARF1OKGCgjzzafTdzi8Ud7a87lLHmWiiVEq5vag2cvWWxwzmy3U9vqJrUCKglNcD31GjQoTz08zh1v8l_A0LQUFVwUPofpc3e2gWIjg-JTxerNyJTGxOUTfZzxS-ofTS1rkBaoNyoWQD_uP-wC8BSVLAfVekBtK4CMvHbz429JBR8A--jPYPo-JYjldjylfqD5YdNb57YR8okDiLlN7_u0PG',
    verified: true,
    location: 'Matara',
    date: '18 Aug 2026',
    time: '09:42 AM',
    duration: '12:48',
    status: 'Partially Listened (04:32 / 12:48)',
    statusColor: Colors.accent,
    type: 'partial',
  },
  {
    id: '2',
    name: 'Mr. Sunil Perera',
    avatar: 'https://i.pravatar.cc/150?img=11',
    verified: false,
    location: 'Anuradhapura',
    date: '19 Aug 2026',
    time: '10:15 AM',
    duration: '08:30',
    status: 'Not Listened',
    statusColor: '#ba1a1a',
    type: 'unread',
  },
  {
    id: '3',
    name: 'Mrs. Amara Perera',
    avatar: 'https://i.pravatar.cc/150?img=5',
    verified: false,
    location: 'Galle',
    date: '20 Aug 2026',
    time: '02:20 PM',
    duration: '15:45',
    status: 'Fully Listened',
    statusColor: '#10b981',
    type: 'done',
  },
  {
    id: '4',
    name: 'Mr. Sunil Karunaratne',
    avatar: 'https://i.pravatar.cc/150?img=12',
    verified: true,
    location: 'Kandy',
    date: '21 Aug 2026',
    time: '11:00 AM',
    duration: '10:20',
    status: 'Need Review',
    statusColor: '#e8792e',
    type: 'review',
  },
  {
    id: '5',
    name: 'Mrs. Sunethra Fernando',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw8_8bd1MoyfJOKvJlrxTI2jRbmuJbNjnMKw6zNr3QdMvvsfVqB6AXP74y7Ou5vKdO6sHAW129RAum1ATnF-2q5QtvTGrE3gGsHEANkAIOd1Mp04HlJxImdYnEtvYPfYnrGnQnL8oaKr3BsyMvpR4gGAMkr4qd_MFsWeYOaHtLlRLVSdUlfU_s0rLEGIGxZT7An4nSkXePTOC2uVGXDcRVRIiyPPuPYD4GJC8F4t7RGWdO9hT0vQp_',
    verified: false,
    location: 'Colombo',
    date: '22 Aug 2026',
    time: '04:15 PM',
    duration: '06:40',
    status: 'Partially Listened (02:10 / 06:40)',
    statusColor: Colors.accent,
    type: 'partial',
  },
  {
    id: '6',
    name: 'Mr. Ranjith Silva',
    avatar: 'https://i.pravatar.cc/150?img=8',
    verified: true,
    location: 'Jaffna',
    date: '22 Aug 2026',
    time: '09:30 AM',
    duration: '18:15',
    status: 'Fully Listened',
    statusColor: '#10b981',
    type: 'done',
  },
  {
    id: '7',
    name: 'Mrs. Pushpa Kumari',
    avatar: 'https://i.pravatar.cc/150?img=9',
    verified: false,
    location: 'Kurunegala',
    date: '23 Aug 2026',
    time: '08:00 AM',
    duration: '11:50',
    status: 'Not Listened',
    statusColor: '#ba1a1a',
    type: 'unread',
  },
  {
    id: '8',
    name: 'Mr. Mahinda Rajapaksa',
    avatar: 'https://i.pravatar.cc/150?img=13',
    verified: false,
    location: 'Hambantota',
    date: '23 Aug 2026',
    time: '10:30 AM',
    duration: '14:25',
    status: 'Need Review',
    statusColor: '#e8792e',
    type: 'review',
  },
  {
    id: '9',
    name: 'Mrs. Seetha Ranjani',
    avatar: 'https://i.pravatar.cc/150?img=10',
    verified: true,
    location: 'Badulla',
    date: '23 Aug 2026',
    time: '11:15 AM',
    duration: '09:45',
    status: 'Need Review',
    statusColor: '#e8792e',
    type: 'review',
  },
  {
    id: '10',
    name: 'Mr. Nihal Perera',
    avatar: 'https://i.pravatar.cc/150?img=14',
    verified: false,
    location: 'Negombo',
    date: '23 Aug 2026',
    time: '11:45 AM',
    duration: '07:30',
    status: 'Fully Listened',
    statusColor: '#10b981',
    type: 'done',
  },
];

const PlayableCard = ({ item, setPreviewVisible, onOpenReview }: any) => {
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

export const OpportunityIntakeScreen: React.FC<{ onOpenReview?: () => void }> = ({ onOpenReview }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused
  const [progress, setProgress] = useState(14);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'nameAsc' | 'nameDesc'>('newest');

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
            {FILTERS.map((f) => (
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
          {MOCK_DATA.filter(item => {
            // Tab filter
            if (activeFilter === 'Fully Listened' && item.type !== 'done') return false;
            if (activeFilter === 'Partially Listened' && item.type !== 'partial') return false;
            if (activeFilter === 'Unlistened' && item.type !== 'unread') return false;
            if (activeFilter === 'Need Review' && item.type !== 'review') return false;

            // Search filter
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const nameMatch = item.name.toLowerCase().includes(query);
              const locMatch = item.location.toLowerCase().includes(query);
              if (!nameMatch && !locMatch) return false;
            }

            // Location filter
            if (locationFilter !== 'all' && item.location.toLowerCase() !== locationFilter.toLowerCase()) {
              return false;
            }

            return true;
          }).sort((a, b) => {
            if (sortOrder === 'newest') {
              return parseInt(b.id) - parseInt(a.id);
            }
            if (sortOrder === 'oldest') {
              return parseInt(a.id) - parseInt(b.id);
            }
            if (sortOrder === 'nameAsc') {
              return a.name.localeCompare(b.name);
            }
            if (sortOrder === 'nameDesc') {
              return b.name.localeCompare(a.name);
            }
            return 0;
          }).map((item) => (
            <PlayableCard key={item.id} item={item} setPreviewVisible={setPreviewVisible} onOpenReview={onOpenReview} />
          ))}
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


