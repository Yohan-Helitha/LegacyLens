// mobile-app/src/screens/learning/StudyBuilderSelectScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Search,
  MapPin,
  Briefcase,
  Volume2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { studyBuilderApi } from '../../services/api/studyBuilderApi';
import { SourceContentSummary } from '../../types/studyBuilder';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'StudyBuilderSelect'>;

const MAX_SELECTABLE_ITEMS = 5;

const REGION_CHIPS = ['All', 'Southern', 'Central', 'Western', 'Northern', 'Sabaragamuwa'];

export default function StudyBuilderSelectScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [contentList, setContentList] = useState<SourceContentSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<{ dailyLimit: number; remainingQuota: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, quotaData] = await Promise.all([
        studyBuilderApi.searchContent(),
        studyBuilderApi.getQuota().catch(() => ({ dailyLimit: 5, remainingQuota: 5 })),
      ]);
      setContentList(items);
      setQuota(quotaData);
    } catch (error: any) {
      console.log('Failed to load study builder source content:', error?.message ?? error);
      Alert.alert(learningStrings.common.errorTitle, 'Could not load community stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = useMemo(() => {
    return contentList.filter((item) => {
      const matchesQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.snippet && item.snippet.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.occupation && item.occupation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRegion =
        selectedRegion === 'All' ||
        (item.region && item.region.toLowerCase().includes(selectedRegion.toLowerCase()));

      return matchesQuery && matchesRegion;
    });
  }, [contentList, searchQuery, selectedRegion]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= MAX_SELECTABLE_ITEMS) {
        Alert.alert('Selection Limit', `You can select up to ${MAX_SELECTABLE_ITEMS} stories for a study set.`);
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleProceed = () => {
    if (selectedIds.length === 0) {
      Alert.alert('No Selection', 'Please select at least 1 story to generate a study set.');
      return;
    }

    if (quota && quota.remainingQuota <= 0) {
      Alert.alert('Daily Limit', learningStrings.builder.quotaExceeded);
      return;
    }

    navigation.navigate('StudyBuilderConfigure', { selectedSourceIds: selectedIds });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to Discover Tracks"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.stepSubtitle}>{learningStrings.builder.step1Subtitle}</Text>
          <Text style={styles.headerTitle}>{learningStrings.builder.step1Title}</Text>
        </View>

        {quota && (
          <View style={[styles.quotaPill, quota.remainingQuota === 0 && styles.quotaPillEmpty]}>
            <Sparkles size={12} color={quota.remainingQuota > 0 ? Colors.secondary : Colors.accent} />
            <Text style={[styles.quotaText, quota.remainingQuota === 0 && { color: Colors.accent }]}>
              {quota.remainingQuota}/{quota.dailyLimit}
            </Text>
          </View>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={learningStrings.builder.searchPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search stories"
        />
      </View>

      {/* Region Filter Chips */}
      <View style={styles.chipsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={REGION_CHIPS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = selectedRegion === item;
            return (
              <Pressable
                onPress={() => setSelectedRegion(item)}
                style={[styles.chip, isSelected && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.chipsList}
        />
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>{learningStrings.common.loading}</Text>
        </View>
      ) : filteredContent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{learningStrings.builder.noStoriesFound}</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search query or region filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                <Pressable
                  onPress={() => toggleSelection(item.id)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${item.title}, ${item.region ?? ''}, ${item.occupation ?? ''}`}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Check size={14} color={Colors.white} strokeWidth={3} />}
                    </View>
                  </View>

                  {item.snippet ? (
                    <Text style={styles.cardSnippet} numberOfLines={3}>{item.snippet}</Text>
                  ) : null}

                  <View style={styles.cardFooterRow}>
                    {item.region ? (
                      <View style={styles.tagWrapper}>
                        <MapPin size={12} color={Colors.secondary} />
                        <Text style={styles.tagText}>{item.region}</Text>
                      </View>
                    ) : null}
                    {item.occupation ? (
                      <View style={styles.tagWrapper}>
                        <Briefcase size={12} color={Colors.secondary} />
                        <Text style={styles.tagText}>{item.occupation}</Text>
                      </View>
                    ) : null}
                    {item.hasAudio ? (
                      <View style={[styles.tagWrapper, styles.audioTag]}>
                        <Volume2 size={12} color={Colors.accent} />
                        <Text style={[styles.tagText, { color: Colors.accent }]}>Audio</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            );
          }}
        />
      )}

      {/* Sticky Bottom Bar */}
      <Animated.View entering={FadeInUp.duration(300)} style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.selectionCountText}>
            {learningStrings.builder.selectedCounter(selectedIds.length, MAX_SELECTABLE_ITEMS)}
          </Text>
          <Text style={styles.selectionSubtext}>
            {selectedIds.length === 0
              ? 'Select 1–5 stories to proceed'
              : `${selectedIds.length} stor${selectedIds.length === 1 ? 'y' : 'ies'} ready for grounding`}
          </Text>
        </View>

        <Pressable
          onPress={handleProceed}
          disabled={selectedIds.length === 0}
          style={[styles.nextButton, selectedIds.length === 0 && styles.nextButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={learningStrings.builder.nextConfigure}
        >
          <Text style={styles.nextButtonText}>{learningStrings.builder.nextConfigure}</Text>
          <ArrowRight size={18} color={Colors.white} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  stepSubtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.secondarySubtle,
  },
  quotaPillEmpty: {
    borderColor: Colors.accentSubtle,
    backgroundColor: '#FFF2EB',
  },
  quotaText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  chipsContainer: {
    marginVertical: Spacing.sm + 2,
  },
  chipsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  chipText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: '#F7FCFC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 1,
    color: Colors.text,
    lineHeight: 22,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radii.sm,
    borderWidth: 2,
    borderColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  cardSnippet: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.md,
  },
  audioTag: {
    backgroundColor: Colors.accentSubtle,
  },
  tagText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    fontFamily: Typography.fontBody,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 2,
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBarInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  selectionCountText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },
  selectionSubtext: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  nextButton: {
    minHeight: 48,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.white,
  },
});
