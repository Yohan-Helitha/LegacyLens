import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ImageBackground,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './ModerationQueueScreen.styles';
import { homeApi, CategoryResponse } from '../../../services/api/homeApi';
import { moderationApi, ModerationQueueItemResponse } from '../../../services/api/moderationApi';
import { getMediaUrl } from '../../../constants/api';

type Tab = 'review' | 'published' | 'rejected' | 'archived';
type ViewState = 'list' | 'review_detail';
type ContentTypeFilter = 'all' | 'video' | 'blog' | 'audio';

export const ModerationQueueScreen: React.FC<{ initialItemId?: string }> = ({ initialItemId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const handledInitialItemIdRef = React.useRef<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [rejectedItems, setRejectedItems] = useState<any[]>([]);
  const [isReviewingRejected, setIsReviewingRejected] = useState(false);

  const [queueItems, setQueueItems] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [isReviewingArchived, setIsReviewingArchived] = useState(false);

  const [publishedItems, setPublishedItems] = useState<any[]>([]);

  // Sri Lankan Cultural Reference Data
  const CULTURAL_REGIONS = [
    { id: 'r1', label: 'Northern Sri Lanka', regionName: 'Northern Province', districts: ['Jaffna', 'Mannar', 'Kilinochchi', 'Mullaitivu', 'Vavuniya'] },
    { id: 'r2', label: 'North Central', regionName: 'North Central Province', districts: ['Anuradhapura', 'Polonnaruwa'] },
    { id: 'r3', label: 'Eastern Sri Lanka', regionName: 'Eastern Province', districts: ['Trincomalee', 'Batticaloa', 'Ampara'] },
    { id: 'r4', label: 'North Western', regionName: 'North Western Province', districts: ['Puttalam', 'Kurunegala'] },
    { id: 'r5', label: 'Central Highlands', regionName: 'Central Highlands', districts: ['Kandy', 'Matale', 'Nuwara Eliya'] },
    { id: 'r6', label: 'Uva & Eastern Highlands', regionName: 'Uva Province', districts: ['Badulla', 'Monaragala'] },
    { id: 'r7', label: 'Western Sri Lanka', regionName: 'Western Province', districts: ['Colombo', 'Gampaha', 'Kalutara'] },
    { id: 'r8', label: 'Southern & Sabaragamuwa', regionName: 'Southern Province', districts: ['Galle', 'Matara', 'Hambantota', 'Ratnapura', 'Kegalle'] }
  ];

  const HERITAGE_CATEGORIES = [
    'Traditional Food',
    'Farming & Agriculture',
    'Traditional Crafts',
    'Arts & Performing Arts',
    'Customs & Traditions',
    'Traditional Knowledge',
    'Beliefs & Rituals',
    'Traditional Clothing'
  ];

  const REJECTION_REASONS = [
    'Needs Revision',
    'Inappropriate Content',
    'Inaccurate Cultural Metadata',
    'Poor Media Quality',
    'Copyright or Informed Consent Issue'
  ];

  const WAVE_BARS = [20, 35, 60, 45, 80, 95, 65, 40, 75, 85, 90, 50, 70, 40, 60, 85, 90, 70, 45, 30];

  // Collapsible Section States for Content Review
  const [sectionOverviewOpen, setSectionOverviewOpen] = useState(true);
  const [sectionProvenanceOpen, setSectionProvenanceOpen] = useState(true);
  const [sectionTaxonomyOpen, setSectionTaxonomyOpen] = useState(true);
  const [sectionCoverImageOpen, setSectionCoverImageOpen] = useState(true);
  const [sectionGuidelinesOpen, setSectionGuidelinesOpen] = useState(true);

  // Provenance dropdown toggles
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  // Cover image input
  const [coverImageUrlInput, setCoverImageUrlInput] = useState('');

  // AI Tag generation state
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  const fetchModerationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pending, published, rejected, archived] = await Promise.all([
        moderationApi.getQueueItems('PENDING'),
        moderationApi.getQueueItems('PUBLISHED'),
        moderationApi.getQueueItems('REJECTED'),
        moderationApi.getQueueItems('ARCHIVED')
      ]);
      
      const mapToUIItem = (item: ModerationQueueItemResponse) => {
        let itemType = item.type?.toLowerCase() || 'blog';
        if (itemType === 'article') itemType = 'blog';
        const code = item.id.length > 8 ? `MOD-${item.id.slice(0, 6).toUpperCase()}` : item.id;
        const author = item.authorName || 'Community Contributor';
        const avatar = author.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'CC';

        let category = 'Traditional Knowledge';
        if (item.tags && item.tags.length > 0) {
          const match = HERITAGE_CATEGORIES.find(c => item.tags!.some(t => t.toLowerCase().includes(c.toLowerCase().split(' ')[0])));
          if (match) category = match;
        }

        const rawVideo = item.videoUrl || item.mediaUrl;
        const videoUrl = rawVideo ? getMediaUrl(rawVideo) : undefined;
        const imageUrl = item.imageUrl ? getMediaUrl(item.imageUrl) : undefined;

        return {
          id: item.id,
          code,
          title: item.title,
          desc: item.description,
          body: item.bodyContent,
          image: imageUrl,
          videoUrl,
          mediaUrl: videoUrl,
          type: itemType,
          author,
          avatar,
          role: item.elder ? 'Elder Cultural Custodian' : 'Heritage Contributor',
          time: new Date(item.createdAt).toLocaleDateString(),
          isElder: item.elder,
          tags: item.tags || [],
          region: item.region || '',
          district: item.district || '',
          category,
          dialect: 'Southern High-Kandyan Sinhala',
          status: item.status,
          reason: item.rejectionReason,
          notes: item.rejectionNotes
        };
      };

      setQueueItems(pending.map(mapToUIItem));
      setPublishedItems(published.map(mapToUIItem));
      setRejectedItems(rejected.map(mapToUIItem));
      setArchivedItems(archived.map(mapToUIItem));
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModerationData();
  }, [fetchModerationData, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchModerationData();
    setRefreshing(false);
  };

  // Search and filter states
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewTypeFilter, setReviewTypeFilter] = useState<ContentTypeFilter>('all');

  const [publishedSearchQuery, setPublishedSearchQuery] = useState('');
  const [publishedTypeFilter, setPublishedTypeFilter] = useState<ContentTypeFilter>('all');

  const [rejectedSearchQuery, setRejectedSearchQuery] = useState('');
  const [rejectedTypeFilter, setRejectedTypeFilter] = useState<ContentTypeFilter>('all');

  const [archivedSearchQuery, setArchivedSearchQuery] = useState('');
  const [archivedTypeFilter, setArchivedTypeFilter] = useState<ContentTypeFilter>('all');

  // Sort states
  const [reviewSortOrder, setReviewSortOrder] = useState<'newest' | 'oldest' | 'titleAsc' | 'titleDesc'>('newest');
  const [publishedSortOrder, setPublishedSortOrder] = useState<'newest' | 'oldest' | 'titleAsc' | 'titleDesc'>('newest');
  const [rejectedSortOrder, setRejectedSortOrder] = useState<'newest' | 'oldest' | 'titleAsc' | 'titleDesc'>('newest');
  const [archivedSortOrder, setArchivedSortOrder] = useState<'newest' | 'oldest' | 'titleAsc' | 'titleDesc'>('newest');

  // Category and Contributor Filter states
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>('all');
  const [publishedCategoryFilter, setPublishedCategoryFilter] = useState<string>('all');
  const [rejectedCategoryFilter, setRejectedCategoryFilter] = useState<string>('all');
  const [archivedCategoryFilter, setArchivedCategoryFilter] = useState<string>('all');

  const [reviewContributorFilter, setReviewContributorFilter] = useState<'all' | 'elders' | 'students'>('all');
  const [publishedContributorFilter, setPublishedContributorFilter] = useState<'all' | 'elders' | 'students'>('all');
  const [rejectedContributorFilter, setRejectedContributorFilter] = useState<'all' | 'elders' | 'students'>('all');
  const [archivedContributorFilter, setArchivedContributorFilter] = useState<'all' | 'elders' | 'students'>('all');

  // Filter panels toggle states
  const [reviewFiltersOpen, setReviewFiltersOpen] = useState(false);
  const [publishedFiltersOpen, setPublishedFiltersOpen] = useState(false);
  const [rejectedFiltersOpen, setRejectedFiltersOpen] = useState(false);
  const [archivedFiltersOpen, setArchivedFiltersOpen] = useState(false);

  // Archive New Modal states
  const [showArchiveNewModal, setShowArchiveNewModal] = useState(false);
  const [archiveNewSearchQuery, setArchiveNewSearchQuery] = useState('');
  const [archiveNewAuthorQuery, setArchiveNewAuthorQuery] = useState('');
  const [archiveNewTypeFilter, setArchiveNewTypeFilter] = useState<ContentTypeFilter>('all');

  // Category assignment states
  const [publishCategorySearch, setPublishCategorySearch] = useState('');
  const [publishCategory, setPublishCategory] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await homeApi.getCategories();
        if (response && response.length > 0) {
          setAvailableCategories(response.map((c: CategoryResponse) => c.name));
        } else {
          setAvailableCategories([
            'Traditional Food', 'Farming & Agriculture', 'Traditional Crafts', 'Arts & Performing Arts',
            'Customs & Traditions', 'Traditional Knowledge', 'Beliefs & Rituals', 'Traditional Clothing'
          ]);
        }
      } catch (err) {
        console.log('Error loading categories from DB:', err);
        setAvailableCategories([
          'Traditional Food', 'Farming & Agriculture', 'Traditional Crafts', 'Arts & Performing Arts',
          'Customs & Traditions', 'Traditional Knowledge', 'Beliefs & Rituals', 'Traditional Clothing'
        ]);
      }
    };
    loadCategories();
  }, []);


  const getFilteredReviewItems = () => {
    const filtered = queueItems.filter((item) => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(reviewSearchQuery.toLowerCase());

      const matchesType = reviewTypeFilter === 'all' || item.type === reviewTypeFilter;

      const matchesCategory = reviewCategoryFilter === 'all' || 
        (item.tags?.some((tag: string) => tag?.toLowerCase() === reviewCategoryFilter.toLowerCase()) ?? false);

      const matchesContributor = reviewContributorFilter === 'all' || 
        (reviewContributorFilter === 'elders' && item.isElder) ||
        (reviewContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (reviewSortOrder === 'newest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idB - idA;
      }
      if (reviewSortOrder === 'oldest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idA - idB;
      }
      if (reviewSortOrder === 'titleAsc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (reviewSortOrder === 'titleDesc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  };

  const getFilteredPublishedItems = () => {
    const filtered = publishedItems.filter((item) => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(publishedSearchQuery.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(publishedSearchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(publishedSearchQuery.toLowerCase());

      const matchesType = publishedTypeFilter === 'all' || item.type === publishedTypeFilter;

      const matchesCategory = publishedCategoryFilter === 'all' || 
        (item.tags?.some((tag: string) => tag?.toLowerCase() === publishedCategoryFilter.toLowerCase()) ?? false);

      const matchesContributor = publishedContributorFilter === 'all' || 
        (publishedContributorFilter === 'elders' && item.isElder) ||
        (publishedContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (publishedSortOrder === 'newest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idB - idA;
      }
      if (publishedSortOrder === 'oldest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idA - idB;
      }
      if (publishedSortOrder === 'titleAsc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (publishedSortOrder === 'titleDesc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  };

  const getFilteredRejectedItems = () => {
    const filtered = rejectedItems.filter((item) => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(rejectedSearchQuery.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(rejectedSearchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(rejectedSearchQuery.toLowerCase());

      const matchesType = rejectedTypeFilter === 'all' || item.type === rejectedTypeFilter;

      const matchesCategory = rejectedCategoryFilter === 'all' || 
        (item.tags?.some((tag: string) => tag?.toLowerCase() === rejectedCategoryFilter.toLowerCase()) ?? false);

      const matchesContributor = rejectedContributorFilter === 'all' || 
        (rejectedContributorFilter === 'elders' && item.isElder) ||
        (rejectedContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (rejectedSortOrder === 'newest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idB - idA;
      }
      if (rejectedSortOrder === 'oldest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idA - idB;
      }
      if (rejectedSortOrder === 'titleAsc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (rejectedSortOrder === 'titleDesc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  };

  const getFilteredArchivedItems = () => {
    const filtered = archivedItems.filter((item) => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(archivedSearchQuery.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(archivedSearchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(archivedSearchQuery.toLowerCase());

      const matchesType = archivedTypeFilter === 'all' || item.type === archivedTypeFilter;

      const matchesCategory = archivedCategoryFilter === 'all' || 
        (item.tags?.some((tag: string) => tag?.toLowerCase() === archivedCategoryFilter.toLowerCase()) ?? false);

      const matchesContributor = archivedContributorFilter === 'all' || 
        (archivedContributorFilter === 'elders' && item.isElder) ||
        (archivedContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (archivedSortOrder === 'newest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idB - idA;
      }
      if (archivedSortOrder === 'oldest') {
        const idA = parseInt(a.id?.replace(/\D/g, '') || '0') || 0;
        const idB = parseInt(b.id?.replace(/\D/g, '') || '0') || 0;
        return idA - idB;
      }
      if (archivedSortOrder === 'titleAsc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (archivedSortOrder === 'titleDesc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  };

  // Guideline checklist state
  const [checkedGuidelines, setCheckedGuidelines] = useState({
    noHateSpeech: false,
    culturallyAccurate: false,
    highQuality: false,
  });

  const [tagsConfirmed, setTagsConfirmed] = useState(false);

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('Needs Revision');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Video playback simulation
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(33);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getDistrictsForRegion = (regionLabel?: string): string[] => {
    if (!regionLabel) return [];
    const found = CULTURAL_REGIONS.find(
      r => r.label === regionLabel || r.regionName === regionLabel || r.id === regionLabel
    );
    return found ? found.districts : [];
  };

  const handleRegionChange = (regionLabel: string) => {
    const districts = getDistrictsForRegion(regionLabel);
    const newDistrict = (selectedItem?.district && districts.includes(selectedItem.district))
      ? selectedItem.district
      : '';
    setSelectedItem((prev: any) => ({
      ...prev,
      region: regionLabel,
      district: newDistrict
    }));
    setIsRegionDropdownOpen(false);
  };

  const handleDistrictChange = (district: string) => {
    setSelectedItem((prev: any) => ({
      ...prev,
      district
    }));
    setIsDistrictDropdownOpen(false);
  };

  const handleCategoryChange = (cat: string) => {
    setPublishCategory(cat);
    setSelectedItem((prev: any) => ({
      ...prev,
      category: cat
    }));
    setIsCategoryDropdownOpen(false);
  };

  const handleApplyCoverImageUrl = async () => {
    const url = coverImageUrlInput.trim();
    if (url) {
      setSelectedItem((prev: any) => ({
        ...prev,
        image: url,
        imageUrl: url
      }));
      if (selectedItem?.id) {
        try {
          await moderationApi.updateItemStatus(selectedItem.id, {
            status: selectedItem.status || 'PENDING',
            imageUrl: url
          });
          Alert.alert('Cover Image Saved', 'Cover image URL has been saved to the stories table.');
        } catch (error) {
          console.error('Failed to save cover image to stories table:', error);
          Alert.alert('Cover Image Applied', 'Cover image URL applied locally. It will also be persisted when publishing.');
        }
      } else {
        Alert.alert('Cover Image Updated', 'Cover image URL has been applied to this submission.');
      }
    }
  };

  const handleRemoveCoverImage = () => {
    setSelectedItem((prev: any) => ({
      ...prev,
      image: ''
    }));
    setCoverImageUrlInput('');
  };

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      let t = newTagInput.trim();
      if (!t.startsWith('#')) t = '#' + t;
      if (!editingTags.includes(t)) {
        setEditingTags(prev => [...prev, t]);
      }
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagIndex: number) => {
    setEditingTags(prev => prev.filter((_, idx) => idx !== tagIndex));
  };

  const handleGenerateAiTags = async () => {
    if (!selectedItem) return;
    setIsAutoTagging(true);
    try {
      let tagsToAdd: string[] = [];
      try {
        const res = await moderationApi.generateAiTags(selectedItem.id);
        if (res && res.tags && res.tags.length > 0) {
          tagsToAdd = res.tags;
        }
      } catch (apiErr) {
        // Fallback intelligent cultural tag generation
      }

      if (tagsToAdd.length === 0) {
        const cat = selectedItem.category || publishCategory || 'Traditional Knowledge';
        if (cat.includes('Craft')) {
          tagsToAdd = ['#MaskCarving', '#SacredTimber', '#KandyanArt', '#IntangibleHeritage'];
        } else if (cat.includes('Food')) {
          tagsToAdd = ['#CulinaryHeritage', '#TraditionalCuisine', '#IndigenousIngredients'];
        } else if (cat.includes('Farming') || cat.includes('Agriculture')) {
          tagsToAdd = ['#BethmaSystem', '#AncientIrrigation', '#AgrarianLineage'];
        } else if (cat.includes('Performing') || cat.includes('Dance') || cat.includes('Music')) {
          tagsToAdd = ['#FolkRitual', '#Shanthikarma', '#TraditionalDrums'];
        } else {
          tagsToAdd = ['#OralHistory', '#ElderTestimony', '#CulturalCanon', '#SriLankanHeritage'];
        }
      }

      const formatted = tagsToAdd.map((t: string) => t.startsWith('#') ? t : `#${t}`);
      const merged = Array.from(new Set([...editingTags, ...formatted]));
      setEditingTags(merged);
      Alert.alert('AI Auto-Tag Complete', `✨ Successfully generated and applied ${formatted.length} cultural taxonomy tags!`);
    } catch (err) {
      console.error('Auto tag error:', err);
    } finally {
      setIsAutoTagging(false);
    }
  };

  const allGuidelinesMet = checkedGuidelines.noHateSpeech && checkedGuidelines.culturallyAccurate && checkedGuidelines.highQuality;

  const toggleAllGuidelines = () => {
    const newState = !allGuidelinesMet;
    setCheckedGuidelines({
      noHateSpeech: newState,
      culturallyAccurate: newState,
      highQuality: newState
    });
  };

  const handleSelectReview = (item: any) => {
    setSelectedItem(item);
    setEditingTags([...item.tags]);
    setCoverImageUrlInput(item.image || '');
    setViewState('review_detail');
    setIsPlaying(false);
    setVideoProgress(33);
    setCheckedGuidelines({
      noHateSpeech: false,
      culturallyAccurate: false,
      highQuality: false,
    });
    setTagsConfirmed(false);
    setPublishCategory(item.category || null);
    setPublishCategorySearch('');
    setIsCategoryDropdownOpen(false);
    setIsRegionDropdownOpen(false);
    setIsDistrictDropdownOpen(false);
  };

  const handlePublish = async (itemId: string) => {
    if (!allGuidelinesMet) {
      Alert.alert('Guideline Check Required', 'Please satisfy all 3 community guidelines before publishing live.');
      return;
    }
    if (!selectedItem?.region || selectedItem.region.trim() === '') {
      Alert.alert('Provenance Required', 'Cultural Region is compulsory before approving and publishing.');
      return;
    }
    try {
      await moderationApi.updateItemStatus(itemId, {
        status: 'PUBLISHED',
        region: selectedItem.region,
        district: selectedItem.district || '',
        tags: editingTags,
        imageUrl: (selectedItem as any)?.image || (selectedItem as any)?.imageUrl,
      });
      setQueueItems((prev) => prev.filter((i) => i.id !== itemId));
      await fetchModerationData();
      Alert.alert('Published Live', `Submission ${selectedItem.code || itemId} has been approved and published to the Sovereign Heritage Canon!`);
      if (viewState === 'review_detail') {
        setViewState('list');
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to publish item:', error);
      Alert.alert('Error', 'Failed to publish content.');
    }
  };

  const handleRejectPress = (item: any) => {
    setRejectingItem(item);
    setRejectionReason('Needs Revision');
    setRejectionNotes('');
  };

  const handleConfirmRejection = async () => {
    if (!rejectingItem) return;
    try {
      await moderationApi.updateItemStatus(rejectingItem.id, { 
        status: 'REJECTED', 
        rejectionReason: rejectionReason, 
        rejectionNotes: rejectionNotes 
      });
      const newRejected = {
        ...rejectingItem,
        reason: rejectionReason,
        notes: rejectionNotes || 'No additional notes provided.',
        time: new Date().toLocaleDateString()
      };
      setRejectedItems((prev) => [newRejected, ...prev]);

      setQueueItems((prev) => prev.filter((i) => i.id !== rejectingItem.id));
      await fetchModerationData();
      Alert.alert('Rejection Confirmed', `Rejection sent: ${rejectionReason}`);
      setRejectingItem(null);
      if (viewState === 'review_detail') {
        setViewState('list');
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to reject item:', error);
      Alert.alert('Error', 'Failed to reject content.');
    }
  };

  const handleSelectRejectedDetail = (item: any) => {
    setSelectedItem(item);
    setEditingTags([...item.tags]);
    setIsReviewingRejected(true);
    setViewState('review_detail');
    setIsPlaying(false);
    setVideoProgress(33);
  };

  const handleSelectArchivedDetail = (item: any) => {
    setSelectedItem(item);
    setEditingTags([...item.tags]);
    setIsReviewingArchived(true);
    setViewState('review_detail');
    setIsPlaying(false);
    setVideoProgress(33);
  };

  useEffect(() => {
    if (!initialItemId || isLoading) return;
    if (handledInitialItemIdRef.current === initialItemId) return;

    const allItems = [...queueItems, ...publishedItems, ...rejectedItems, ...archivedItems];
    const target = allItems.find(i => String(i.id) === String(initialItemId));
    if (target) {
      handledInitialItemIdRef.current = initialItemId;
      if (rejectedItems.some(i => String(i.id) === String(initialItemId))) {
        setActiveTab('rejected');
        handleSelectRejectedDetail(target);
      } else if (archivedItems.some(i => String(i.id) === String(initialItemId))) {
        setActiveTab('archived');
        handleSelectArchivedDetail(target);
      } else if (publishedItems.some(i => String(i.id) === String(initialItemId))) {
        setActiveTab('published');
        handleSelectReview(target);
      } else {
        setActiveTab('review');
        handleSelectReview(target);
      }
    }
  }, [initialItemId, isLoading, queueItems, publishedItems, rejectedItems, archivedItems]);

  const handleConfirmRestore = async () => {
    if (!selectedItem) return;
    try {
      await moderationApi.updateItemStatus(selectedItem.id, { status: 'PUBLISHED' });
      await fetchModerationData();
      setShowRestoreModal(false);
      setViewState('list');
      setSelectedItem(null);
      setIsReviewingArchived(false);
      setActiveTab('published');
      Alert.alert('Success', 'Content has been restored and published successfully!');
    } catch (error) {
      console.error('Failed to restore item:', error);
      Alert.alert('Error', 'Failed to restore content.');
    }
  };

  const handleConfirmDelete = (itemId: string) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to permanently delete this content? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await moderationApi.deleteItem(itemId);
              await fetchModerationData();
              setViewState('list');
              setSelectedItem(null);
              setIsReviewingArchived(false);
              Alert.alert('Success', 'Content permanently deleted.');
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete content.');
            }
          }
        }
      ]
    );
  };

  const handleArchivedMenuPress = (item: any) => {
    Alert.alert(
      'Archived Content Actions',
      `Choose an action for "${item.title}":`,
      [
        {
          text: 'Restore Content',
          onPress: () => {
            setSelectedItem(item);
            setShowRestoreModal(true);
          }
        },
        {
          text: 'Delete Content',
          style: 'destructive',
          onPress: () => handleConfirmDelete(item.id)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleArchiveNewItem = async (item: any) => {
    try {
      await moderationApi.updateItemStatus(item.id, { status: 'ARCHIVED' });
      await fetchModerationData();
      setShowArchiveNewModal(false);
      setArchiveNewSearchQuery('');
      setArchiveNewAuthorQuery('');
      setArchiveNewTypeFilter('all');
      Alert.alert('Success', `"${item.title}" has been archived successfully!`);
    } catch (error) {
      console.error('Failed to archive item:', error);
      Alert.alert('Error', 'Failed to archive content.');
    }
  };

  // SEGMENTED CONTROL
  const renderSegmentedControl = () => {
    const tabs = [
      { id: 'review',    label: 'Review',    count: queueItems.length,     activeBg: '#0f5c5c' },
      { id: 'published', label: 'Published',  count: publishedItems.length,  activeBg: '#1a56db' },
      { id: 'rejected',  label: 'Rejected',   count: rejectedItems.length,   activeBg: '#ba1a1a' },
      { id: 'archived',  label: 'Archived',   count: archivedItems.length,   activeBg: '#fe893e' },
    ] as const;
    return (
      <View style={{ flexDirection: 'row', gap: 4, padding: 4, backgroundColor: '#eceeed', borderRadius: 14, marginBottom: 16 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
                isActive && { backgroundColor: tab.activeBg }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={{
                fontFamily: Typography.fontBodyMed,
                fontSize: 10.5,
                fontWeight: '600',
                color: isActive ? Colors.white : Colors.textMuted,
              }}>
                {tab.label}
              </Text>
              <View style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.07)',
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 1,
                minWidth: 20,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontFamily: Typography.fontBodyMed,
                  fontSize: 10,
                  fontWeight: '700',
                  color: isActive ? Colors.white : Colors.textMuted,
                }}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // LIST VIEW (Review Queue & Archived)
  const renderChecklistItems = () => {
    const isTickedNoHate = isReviewingArchived ? true : checkedGuidelines.noHateSpeech;
    const isTickedCultural = isReviewingArchived ? true : checkedGuidelines.culturallyAccurate;
    const isTickedQuality = isReviewingArchived ? true : checkedGuidelines.highQuality;

    return (
      <>
        <TouchableOpacity 
          style={styles.checkItem}
          onPress={() => {
            if (isReviewingArchived) return;
            setCheckedGuidelines(prev => ({ ...prev, noHateSpeech: !prev.noHateSpeech }));
          }}
          disabled={isReviewingArchived}
        >
          <View style={isTickedNoHate ? styles.checkboxDone : styles.checkboxPending}>
            {isTickedNoHate && <MaterialIcons name="check" size={16} color={Colors.secondary} />}
          </View>
          <Text style={styles.checkItemText}>No hate speech or harmful content</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkItem}
          onPress={() => {
            if (isReviewingArchived) return;
            setCheckedGuidelines(prev => ({ ...prev, culturallyAccurate: !prev.culturallyAccurate }));
          }}
          disabled={isReviewingArchived}
        >
          <View style={isTickedCultural ? styles.checkboxDone : styles.checkboxPending}>
            {isTickedCultural && <MaterialIcons name="check" size={16} color={Colors.secondary} />}
          </View>
          <Text style={styles.checkItemText}>Culturally accurate and respectful</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkItem}
          onPress={() => {
            if (isReviewingArchived) return;
            setCheckedGuidelines(prev => ({ ...prev, highQuality: !prev.highQuality }));
          }}
          disabled={isReviewingArchived}
        >
          <View style={isTickedQuality ? styles.checkboxDone : styles.checkboxPending}>
            {isTickedQuality && <MaterialIcons name="check" size={16} color={Colors.secondary} />}
          </View>
          <Text style={styles.checkItemText}>High quality audio and clear visuals</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderPublishButton = () => {
    const isPublishEnabled = allGuidelinesMet && !!selectedItem?.region;
    return (
      <TouchableOpacity 
        style={[styles.btnPublish, !isPublishEnabled && { backgroundColor: '#a1b5b5', opacity: 0.7 }]} 
        onPress={() => handlePublish(selectedItem.id)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MaterialIcons name="verified" size={18} color={Colors.white} />
          <Text style={styles.btnPublishText}>Approve & Publish Live</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderArchiveNewList = () => {
    const allItems = [...publishedItems, ...queueItems];
    const filtered = allItems.filter(item => {
      const matchTitle = !archiveNewSearchQuery || 
        item.title.toLowerCase().includes(archiveNewSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(archiveNewSearchQuery.toLowerCase());
      const matchAuthor = !archiveNewAuthorQuery || 
        item.author.toLowerCase().includes(archiveNewAuthorQuery.toLowerCase());
      const matchType = archiveNewTypeFilter === 'all' || item.type === archiveNewTypeFilter;
      return matchTitle && matchAuthor && matchType;
    });

    if (filtered.length === 0) {
      return (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text style={{ fontFamily: Typography.fontBody, color: Colors.textMuted }}>No active content found.</Text>
        </View>
      );
    }

    return filtered.map((item) => (
      <View 
        key={item.id} 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: '#f2f4f3', 
          padding: 12, 
          borderRadius: 12, 
          marginBottom: 8 
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, color: Colors.text, fontWeight: '600' }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }} numberOfLines={1}>
            By {item.author} {item.type === 'video' ? 'Video' : 'Article'}
          </Text>
        </View>
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#fe893e', 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 8 
          }}
          onPress={() => handleArchiveNewItem(item)}
        >
          <Text style={{ color: Colors.white, fontFamily: Typography.fontBodyMed, fontSize: 12, fontWeight: '600' }}>
            Archive
          </Text>
        </TouchableOpacity>
      </View>
    ));
  };

  // LIST VIEW (Review Queue & Archived) 
  const renderListView = () => (
    <View style={styles.flex1}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#0f5c5c']}
            tintColor="#0f5c5c"
          />
        }
      >
        {/* Intro */}
        <View style={styles.introSection}>
          <Text style={styles.pageTitle}>Moderation Queue</Text>
          <Text style={styles.pageSubtitle}>Review user submissions before they are published to the learning community.</Text>
        </View>

        {/* Segmented Control */}
        {renderSegmentedControl()}

        {(isLoading || (initialItemId && !selectedItem && !handledInitialItemIdRef.current)) ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#0f5c5c" />
            <Text style={{ marginTop: 12, fontFamily: Typography.fontBodyMed, fontSize: 14, color: Colors.textMuted }}>
              {initialItemId ? 'Loading submission details...' : 'Loading moderation queue...'}
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'review' && renderReviewQueue()}
            {activeTab === 'published' && renderPublishedQueue()}
            {activeTab === 'rejected' && renderRejectedQueue()}
            {activeTab === 'archived' && renderArchivedQueue()}
          </>
        )}
      </ScrollView>
      {/* FAB for Archived Tab */}
      {activeTab === 'archived' && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#fe893e' }]} onPress={() => setShowArchiveNewModal(true)}>
          <MaterialIcons name="archive" size={24} color="#ffffff" />
          <Text style={[styles.fabText, { color: '#ffffff' }]}>Archive New</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderReviewQueue = () => {
    const filtered = getFilteredReviewItems();
    return (
      <View style={[styles.queueContainer, { backgroundColor: 'rgba(15, 92, 92, 0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.08)' }]}>
        {/* Search & Filter Header */}
        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={[styles.searchBar, { flex: 1, marginBottom: 0, borderWidth: 1.5, borderColor: '#0f5c5c' }]}>
              <MaterialIcons name="search" size={20} color="#0f5c5c" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search pending submissions..." 
                placeholderTextColor={Colors.textMuted}
                value={reviewSearchQuery}
                onChangeText={setReviewSearchQuery}
              />
              {reviewSearchQuery ? (
                <TouchableOpacity onPress={() => setReviewSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: reviewFiltersOpen ? '#0f5c5c' : '#eceeed',
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setReviewFiltersOpen(!reviewFiltersOpen)}
            >
              <MaterialIcons name="tune" size={20} color={reviewFiltersOpen ? Colors.white : '#0f5c5c'} />
            </TouchableOpacity>
          </View>

          {/* Expanded Filters Drawer */}
          {reviewFiltersOpen && (
            <View style={{
              backgroundColor: Colors.white,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#0f5c5c',
              padding: 12,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}>
              {/* Filter by Content Type */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTENT TYPE:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['all', 'video', 'blog', 'audio'].map((type) => {
                    const isActive = reviewTypeFilter === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={{
                          backgroundColor: isActive ? '#0f5c5c' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setReviewTypeFilter(type as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text, textTransform: 'capitalize' }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter by Theme / Category */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>THEME / CATEGORY:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {['all', ...availableCategories].map((cat) => {
                    const isActive = reviewCategoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={{
                          backgroundColor: isActive ? '#0f5c5c' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setReviewCategoryFilter(cat)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {cat === 'all' ? 'All Themes' : cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Filter by Contributor Source */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTRIBUTOR SOURCE:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creators only' }
                  ].map((option) => {
                    const isActive = reviewContributorFilter === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#0f5c5c' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setReviewContributorFilter(option.value as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sort Options */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>SORT ORDER:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'newest', label: 'Date: Newest First' },
                    { value: 'oldest', label: 'Date: Oldest First' },
                    { value: 'titleAsc', label: 'Title: A to Z' },
                    { value: 'titleDesc', label: 'Title: Z to A' }
                  ].map((option) => {
                    const isActive = reviewSortOrder === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#0f5c5c' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setReviewSortOrder(option.value as any)}
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
        </View>

        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.reviewCard}
            activeOpacity={0.8}
            onPress={() => handleSelectReview(item)}
          >
            <View style={styles.reviewImgBox}>
              <Image source={{ uri: item.image }} style={styles.fullImg} />
              {item.type === 'video' && (
                <View style={styles.playOverlay}>
                  <MaterialIcons name="play-circle" size={32} color={Colors.white} />
                </View>
              )}
            </View>
            <View style={styles.reviewCardBody}>
              <View>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.pendingBadge}>
                    <MaterialIcons name="schedule" size={14} color={Colors.textMuted} />
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.cardTagsRow}>
                  {item.isElder ? (
                    <View style={styles.elderBadge}>
                      <MaterialIcons name="workspace-premium" size={14} color="#672c00" />
                      <Text style={styles.elderBadgeText}> Elder</Text>
                    </View>
                  ) : (
                    <View style={styles.studentBadge}>
                      <MaterialIcons name="school" size={14} color="#0f5c5c" />
                      <Text style={styles.studentBadgeText}> Youth Creator</Text>
                    </View>
                  )}
                  {item.type === 'video' ? (
                    <View style={styles.videoTag}>
                      <MaterialIcons name="play-arrow" size={14} color={Colors.secondary} />
                      <Text style={styles.videoTagText}> Video</Text>
                    </View>
                  ) : item.type === 'audio' ? (
                    <View style={styles.articleTag}>
                      <MaterialIcons name="audiotrack" size={14} color={Colors.secondary} />
                      <Text style={styles.articleTagText}> Audio</Text>
                    </View>
                  ) : (
                    <View style={styles.articleTag}>
                      <MaterialIcons name="article" size={14} color={Colors.secondary} />
                      <Text style={styles.articleTagText}> Blog</Text>
                    </View>
                  )}
                  <View style={styles.rowCenter}>
                    <MaterialIcons name="person" size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}> {item.author}</Text>
                  </View>
                  <Text style={styles.metaTextMuted}>{item.time}</Text>
                </View>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRejectPress(item);
                    }}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.publishBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePublish(item.id);
                    }}
                  >
                    <Text style={styles.publishBtnText}>Publish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {!isLoading && filtered.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: Colors.textMuted }}>
              No items matching criteria!
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderArchivedQueue = () => {
    const filtered = getFilteredArchivedItems();
    return (
      <View style={[styles.queueContainer, { backgroundColor: 'rgba(254, 137, 62, 0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(254, 137, 62, 0.08)' }]}>
        {/* Search & Filter Header */}
        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={[styles.searchBar, { flex: 1, marginBottom: 0, borderWidth: 1.5, borderColor: '#fe893e' }]}>
              <MaterialIcons name="search" size={20} color="#fe893e" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search archived content..." 
                placeholderTextColor={Colors.textMuted}
                value={archivedSearchQuery}
                onChangeText={setSearchQuery => setArchivedSearchQuery(setSearchQuery)}
              />
              {archivedSearchQuery ? (
                <TouchableOpacity onPress={() => setArchivedSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: archivedFiltersOpen ? '#fe893e' : '#eceeed',
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setArchivedFiltersOpen(!archivedFiltersOpen)}
            >
              <MaterialIcons name="tune" size={20} color={archivedFiltersOpen ? Colors.white : '#fe893e'} />
            </TouchableOpacity>
          </View>

          {/* Expanded Filters Drawer */}
          {archivedFiltersOpen && (
            <View style={{
              backgroundColor: Colors.white,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#fe893e',
              padding: 12,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}>
              {/* Filter by Content Type */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTENT TYPE:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['all', 'video', 'blog', 'audio'].map((type) => {
                    const isActive = archivedTypeFilter === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={{
                          backgroundColor: isActive ? '#fe893e' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setArchivedTypeFilter(type as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text, textTransform: 'capitalize' }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter by Theme / Category */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>THEME / CATEGORY:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {['all', ...availableCategories].map((cat) => {
                    const isActive = archivedCategoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={{
                          backgroundColor: isActive ? '#fe893e' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setArchivedCategoryFilter(cat)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {cat === 'all' ? 'All Themes' : cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Filter by Contributor Source */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTRIBUTOR SOURCE:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creators only' }
                  ].map((option) => {
                    const isActive = archivedContributorFilter === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#fe893e' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setArchivedContributorFilter(option.value as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sort Options */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>SORT ORDER:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'newest', label: 'Date: Newest First' },
                    { value: 'oldest', label: 'Date: Oldest First' },
                    { value: 'titleAsc', label: 'Title: A to Z' },
                    { value: 'titleDesc', label: 'Title: Z to A' }
                  ].map((option) => {
                    const isActive = archivedSortOrder === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#fe893e' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setArchivedSortOrder(option.value as any)}
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
        </View>
        
        <View style={styles.gridContainer}>
          {filtered.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[styles.archiveCard, { marginBottom: 8 }]} 
              onPress={() => handleSelectArchivedDetail(item)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.archiveCategoryTag}>
                    <Text style={styles.archiveCategoryTagText}>{item.tags[0] || 'Culture'}</Text>
                  </View>
                  <View style={{ backgroundColor: '#ffebd9', borderColor: 'rgba(254, 137, 62, 0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="archive" size={12} color="#fe893e" />
                    <Text style={{ fontSize: 11, fontFamily: Typography.fontBodyMed, color: '#fe893e', fontWeight: '600' }}>Archived</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={(e) => {
                  e.stopPropagation();
                  handleArchivedMenuPress(item);
                }}>
                  <MaterialIcons name="more-vert" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={3}>{item.desc}</Text>
              <View style={styles.archiveFooter}>
                <MaterialIcons name={item.type === 'video' ? 'play-circle' : item.type === 'audio' ? 'audiotrack' : 'article'} size={14} color={Colors.textMuted} />
                <Text style={styles.metaTextMuted}> {item.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!isLoading && filtered.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: Colors.textMuted }}>
              No items matching criteria!
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPublishedQueue = () => {
    const filtered = getFilteredPublishedItems();
    return (
      <View style={[styles.queueContainer, { backgroundColor: 'rgba(26, 86, 219, 0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(26, 86, 219, 0.08)' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: '#202426', fontWeight: 'bold' }}>Published Content</Text>
          <View style={{ backgroundColor: '#eceeed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted }}>{filtered.length} Items</Text>
          </View>
        </View>

        {/* Search & Filter Header */}
        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={[styles.searchBar, { flex: 1, marginBottom: 0, borderWidth: 1.5, borderColor: '#1a56db' }]}>
              <MaterialIcons name="search" size={20} color="#1a56db" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search published content..." 
                placeholderTextColor={Colors.textMuted}
                value={publishedSearchQuery}
                onChangeText={setPublishedSearchQuery}
              />
              {publishedSearchQuery ? (
                <TouchableOpacity onPress={() => setPublishedSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: publishedFiltersOpen ? '#1a56db' : '#eceeed',
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setPublishedFiltersOpen(!publishedFiltersOpen)}
            >
              <MaterialIcons name="tune" size={20} color={publishedFiltersOpen ? Colors.white : '#1a56db'} />
            </TouchableOpacity>
          </View>

          {/* Expanded Filters Drawer */}
          {publishedFiltersOpen && (
            <View style={{
              backgroundColor: Colors.white,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#1a56db',
              padding: 12,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}>
              {/* Filter by Content Type */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTENT TYPE:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['all', 'video', 'blog', 'audio'].map((type) => {
                    const isActive = publishedTypeFilter === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={{
                          backgroundColor: isActive ? '#1a56db' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setPublishedTypeFilter(type as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text, textTransform: 'capitalize' }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter by Theme / Category */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>THEME / CATEGORY:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {['all', ...availableCategories].map((cat) => {
                    const isActive = publishedCategoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={{
                          backgroundColor: isActive ? '#1a56db' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setPublishedCategoryFilter(cat)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {cat === 'all' ? 'All Themes' : cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Filter by Contributor Source */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTRIBUTOR SOURCE:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creators only' }
                  ].map((option) => {
                    const isActive = publishedContributorFilter === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#1a56db' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setPublishedContributorFilter(option.value as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sort Options */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>SORT ORDER:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'newest', label: 'Date: Newest First' },
                    { value: 'oldest', label: 'Date: Oldest First' },
                    { value: 'titleAsc', label: 'Title: A to Z' },
                    { value: 'titleDesc', label: 'Title: Z to A' }
                  ].map((option) => {
                    const isActive = publishedSortOrder === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#1a56db' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setPublishedSortOrder(option.value as any)}
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
        </View>

        {filtered.map((item) => (
          <View
            key={item.id}
            style={[styles.archiveCard, { marginBottom: 12 }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZT3g9M48Y5NE0FO31lVmi9ZKISvllAzGKkvZqF93c3f-NAqIKygOqUrwBGV0-Lujb6El604suIwc5_XLphsHorwluez0KuZ4jr5gd2u0YQeA7aw5aTKKnR9xrV-l9MLTqnytqZ6nxiBHpxJuGR1e8W3huWUKpNsvCaRC39qWHGYQQTAc2jem046aNIcJqMByI_AaVwqT8JrCv2XkxduT8FP3YjvZ-FMUt4scCugrswn1gU4BD6cwr' }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, color: Colors.text, fontWeight: '600' }} numberOfLines={1}>{item.author}</Text>
                  <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }}>{item.time} {item.type === 'video' ? 'Video' : item.type === 'audio' ? 'Audio' : 'Blog'}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#e0f2fe', borderColor: 'rgba(2, 132, 199, 0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="check-circle" size={12} color="#0284c9" />
                <Text style={{ fontSize: 11, fontFamily: Typography.fontBodyMed, color: '#0284c9', fontWeight: '600' }}>Published</Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { marginTop: 12 }]}>{item.title}</Text>
            <Text style={[styles.cardDesc, { marginTop: 6, marginBottom: 12 }]} numberOfLines={2}>{item.desc}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(191, 200, 200, 0.2)', paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {item.tags.slice(0, 2).map((tag: string, index: number) => (
                  <View key={index} style={{ backgroundColor: '#f2f4f3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontBody, color: Colors.textMuted }}>#{tag}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#fe893e', 
                  paddingHorizontal: 14, 
                  paddingVertical: 8, 
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}
                onPress={() => handleArchiveNewItem(item)}
              >
                <MaterialIcons name="archive" size={14} color={Colors.white} />
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.white, fontWeight: '600' }}>Archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!isLoading && filtered.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: Colors.textMuted }}>
              No items matching criteria!
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderRejectedQueue = () => {
    const filtered = getFilteredRejectedItems();
    return (
      <View style={[styles.queueContainer, { backgroundColor: 'rgba(186, 26, 26, 0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(186, 26, 26, 0.08)' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: '#202426', fontWeight: 'bold' }}>Rejected Submissions</Text>
          <View style={{ backgroundColor: '#eceeed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted }}>{filtered.length} Items</Text>
          </View>
        </View>

        {/* Search & Filter Header */}
        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={[styles.searchBar, { flex: 1, marginBottom: 0, borderWidth: 1.5, borderColor: '#ba1a1a' }]}>
              <MaterialIcons name="search" size={20} color="#ba1a1a" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search rejected submissions..." 
                placeholderTextColor={Colors.textMuted}
                value={rejectedSearchQuery}
                onChangeText={setRejectedSearchQuery}
              />
              {rejectedSearchQuery ? (
                <TouchableOpacity onPress={() => setRejectedSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: rejectedFiltersOpen ? '#ba1a1a' : '#eceeed',
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setRejectedFiltersOpen(!rejectedFiltersOpen)}
            >
              <MaterialIcons name="tune" size={20} color={rejectedFiltersOpen ? Colors.white : '#ba1a1a'} />
            </TouchableOpacity>
          </View>

          {/* Expanded Filters Drawer */}
          {rejectedFiltersOpen && (
            <View style={{
              backgroundColor: Colors.white,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#ba1a1a',
              padding: 12,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}>
              {/* Filter by Content Type */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTENT TYPE:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['all', 'video', 'blog', 'audio'].map((type) => {
                    const isActive = rejectedTypeFilter === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={{
                          backgroundColor: isActive ? '#ba1a1a' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setRejectedTypeFilter(type as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text, textTransform: 'capitalize' }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter by Theme / Category */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>THEME / CATEGORY:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {['all', ...availableCategories].map((cat) => {
                    const isActive = rejectedCategoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={{
                          backgroundColor: isActive ? '#ba1a1a' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setRejectedCategoryFilter(cat)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {cat === 'all' ? 'All Themes' : cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Filter by Contributor Source */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>CONTRIBUTOR SOURCE:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creators only' }
                  ].map((option) => {
                    const isActive = rejectedContributorFilter === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#ba1a1a' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setRejectedContributorFilter(option.value as any)}
                      >
                        <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: isActive ? Colors.white : Colors.text }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sort Options */}
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 }}>SORT ORDER:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {[
                    { value: 'newest', label: 'Date: Newest First' },
                    { value: 'oldest', label: 'Date: Oldest First' },
                    { value: 'titleAsc', label: 'Title: A to Z' },
                    { value: 'titleDesc', label: 'Title: Z to A' }
                  ].map((option) => {
                    const isActive = rejectedSortOrder === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          backgroundColor: isActive ? '#ba1a1a' : '#eceeed',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12
                        }}
                        onPress={() => setRejectedSortOrder(option.value as any)}
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
        </View>

        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.archiveCard, { marginBottom: 12 }]}
            activeOpacity={0.8}
            onPress={() => handleSelectRejectedDetail(item)}
          >
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZT3g9M48Y5NE0FO31lVmi9ZKISvllAzGKkvZqF93c3f-NAqIKygOqUrwBGV0-Lujb6El604suIwc5_XLphsHorwluez0KuZ4jr5gd2u0YQeA7aw5aTKKnR9xrV-l9MLTqnytqZ6nxiBHpxJuGR1e8W3huWUKpNsvCaRC39qWHGYQQTAc2jem046aNIcJqMByI_AaVwqT8JrCv2XkxduT8FP3YjvZ-FMUt4scCugrswn1gU4BD6cwr' }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                <View>
                  <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, color: Colors.text, fontWeight: '600' }}>{item.author}</Text>
                  <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }}>{item.time} {item.type === 'video' ? 'Video' : item.type === 'audio' ? 'Audio' : 'Blog'} Submission</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#ffdad6', borderColor: 'rgba(186, 26, 26, 0.2)', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="block" size={12} color="#ba1a1a" />
                <Text style={{ fontSize: 11, fontFamily: Typography.fontBodyMed, color: '#ba1a1a', fontWeight: '600' }}>Rejected</Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { marginTop: 12 }]}>{item.title}</Text>
            
            <View style={{ backgroundColor: '#f2f4f3', borderLeftWidth: 2, borderLeftColor: '#fe893e', padding: 8, marginTop: 8, borderRadius: 4 }}>
              <Text style={{ fontSize: 11, fontFamily: Typography.fontBodyMed, color: '#fe893e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Reason for Rejection: {item.reason}</Text>
              <Text style={{ fontSize: 13, fontFamily: Typography.fontBody, color: Colors.text, marginTop: 4 }}>{item.notes}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(191, 200, 200, 0.2)', paddingTop: 12 }}>
              <TouchableOpacity 
                style={{ backgroundColor: '#eceeed', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}
                onPress={() => handleSelectRejectedDetail(item)}
              >
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.text, fontWeight: '600' }}>View Details</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {!isLoading && filtered.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: Colors.textMuted }}>
              No items matching criteria!
            </Text>
          </View>
        )}
      </View>
    );
  };

  //  DETAIL VIEW (Content Review
  const renderDetailView = () => {
    if (!selectedItem) return null;
    return (
      <View style={styles.flex1}>
        <View style={[styles.rowBetween, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center' }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => {
            setViewState('list');
            setSelectedItem(null);
            setIsReviewingRejected(false);
            setPublishCategory(null);
            setPublishCategorySearch('');
            setIsCategoryDropdownOpen(false);
          }}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          {/* save draft removed */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailIntro}>
            <Text style={styles.pageTitle}>
              {isReviewingRejected 
                ? "Rejected Content Details" 
                : isReviewingArchived 
                  ? "Archived Content Details" 
                  : "Content Review"}
            </Text>
            <Text style={styles.pageSubtitle}>
              {isReviewingRejected 
                ? "Review the rejected submission and associated feedback details below." 
                : isReviewingArchived 
                  ? "Review the archived submission details and status below." 
                  : "Review the submission below before publishing to the main feed."}
            </Text>
          </View>

          {/* 1. Submission Overview & Media Viewer Card (Collapsible) */}
          <View style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => setSectionOverviewOpen(!sectionOverviewOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIconBox}>
                  <MaterialIcons name="preview" size={20} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Submission Overview & Media Viewer</Text>
                  <Text style={styles.sectionSubtitle}>
                    {selectedItem.code || 'MOD-ITEM'} • {(selectedItem.type || 'BLOG').toUpperCase()} • {selectedItem.status || 'PENDING'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[
                  styles.sectionBadge, 
                  { 
                    backgroundColor: selectedItem.status === 'PUBLISHED' ? '#e8f5e9' : (selectedItem.status === 'REJECTED' ? '#ffebee' : (selectedItem.status === 'ARCHIVED' ? '#fff3e0' : '#fff8e1')),
                    borderColor: selectedItem.status === 'PUBLISHED' ? '#a5d6a7' : (selectedItem.status === 'REJECTED' ? '#ffcdd2' : (selectedItem.status === 'ARCHIVED' ? '#ffe0b2' : '#ffe082'))
                  }
                ]}>
                  <Text style={[
                    styles.sectionBadgeText, 
                    { 
                      color: selectedItem.status === 'PUBLISHED' ? '#2e7d32' : (selectedItem.status === 'REJECTED' ? '#c62828' : (selectedItem.status === 'ARCHIVED' ? '#e65100' : '#f57f17'))
                    }
                  ]}>
                    {selectedItem.status || 'PENDING'}
                  </Text>
                </View>
                <MaterialIcons name={sectionOverviewOpen ? "expand-less" : "expand-more"} size={22} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>

            {sectionOverviewOpen && (
              <View style={styles.sectionBody}>
                {/* Meta Header */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <View style={{ backgroundColor: 'rgba(15, 92, 92, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '700', color: Colors.secondary }}>
                        {selectedItem.code || 'MOD-ITEM'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, fontWeight: '600', color: '#e65100' }}>
                        {selectedItem.category || publishCategory || 'Traditional Knowledge'}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }}>
                      {selectedItem.dialect || 'Southern High-Kandyan Sinhala'}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Typography.fontDisplay, fontSize: 18, fontWeight: '700', color: Colors.text }}>
                    {selectedItem.title}
                  </Text>
                </View>

                {/* Contributor Clearance Box */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8faf9', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#dde3eb', marginBottom: 14 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: Typography.fontDisplay, fontSize: 15, fontWeight: '700', color: Colors.white }}>
                      {selectedItem.avatar || (selectedItem.author?.slice(0, 2).toUpperCase() || 'CC')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Contributor Clearance
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 13, fontWeight: '700', color: Colors.secondary }}>
                        {selectedItem.author}
                      </Text>
                      {selectedItem.isElder && (
                        <MaterialIcons name="star" size={14} color="#fe893e" />
                      )}
                    </View>
                    <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }}>
                      {selectedItem.role || (selectedItem.isElder ? 'Elder Cultural Custodian' : 'Heritage Contributor')}
                    </Text>
                  </View>
                </View>

                {/* If rejected, show rejection info alert */}
                {selectedItem.status === 'REJECTED' && (
                  <View style={{ backgroundColor: '#ffdad6', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(186, 26, 26, 0.3)', padding: 12, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <MaterialIcons name="error" size={18} color="#ba1a1a" />
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 13, fontWeight: '700', color: '#ba1a1a' }}>
                        Rejection Information
                      </Text>
                    </View>
                    <View style={{ backgroundColor: Colors.white, padding: 10, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#ba1a1a', textTransform: 'uppercase' }}>Primary Reason</Text>
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 13, color: Colors.text, marginTop: 2, marginBottom: 8 }}>
                        {selectedItem.reason || 'Needs Revision'}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' }}>Curator Guidance & Revision Notes</Text>
                      <Text style={{ fontFamily: Typography.fontBody, fontSize: 12, color: '#3e4948', marginTop: 2 }}>
                        {selectedItem.notes || 'No additional curator notes recorded.'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Media Component according to type */}
                {selectedItem.type === 'video' ? (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: '#191c1c', marginBottom: 12 }}>
                      <ImageBackground source={selectedItem.image ? { uri: selectedItem.image } : undefined} style={{ width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#191c1c' }}>
                        <TouchableOpacity 
                          style={styles.playCircle} 
                          onPress={() => setIsPlaying(!isPlaying)}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color={Colors.secondary} />
                        </TouchableOpacity>
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8 }}>
                          <Text style={{ color: Colors.white, fontSize: 10, fontFamily: Typography.fontBody, textAlign: 'center', marginBottom: 4 }}>
                            Length: 18m 42s • HD 1080p 60fps • 48kHz Stereo Master
                          </Text>
                          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ width: `${videoProgress}%`, height: '100%', backgroundColor: '#fe893e' }} />
                          </View>
                        </View>
                      </ImageBackground>
                    </View>
                    <View style={{ backgroundColor: '#f8faf9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#dde3eb' }}>
                      <Text style={{ fontFamily: Typography.fontDisplay, fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 }}>
                        Video Overview & Description
                      </Text>
                      <Text style={{ fontFamily: Typography.fontBody, fontSize: 13, color: Colors.textMuted, lineHeight: 20 }}>
                        {selectedItem.desc || selectedItem.body || 'No description recorded in database.'}
                      </Text>
                    </View>
                  </View>
                ) : selectedItem.type === 'audio' ? (
                  <View style={[styles.audioCard, { marginBottom: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity 
                          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => setIsPlaying(!isPlaying)}
                        >
                          <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <View>
                          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 13, fontWeight: '700', color: Colors.text }}>Audio Recording</Text>
                          <Text style={{ fontFamily: Typography.fontBody, fontSize: 10, color: Colors.textMuted }}>AI Transcription Enabled</Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#a5d6a7' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#2e7d32' }}>High Confidence</Text>
                      </View>
                    </View>

                    {/* Scrub & Waveform */}
                    <View style={{ backgroundColor: Colors.white, borderRadius: 8, borderWidth: 1, borderColor: '#dde3eb', padding: 8, marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: Typography.fontBodyMed }}>00:45</Text>
                        <View style={{ flex: 1, height: 4, backgroundColor: '#e1e3e2', marginHorizontal: 8, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ width: `${videoProgress}%`, height: '100%', backgroundColor: '#fe893e' }} />
                        </View>
                        <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: Typography.fontBodyMed }}>04:12</Text>
                      </View>
                      <View style={styles.waveformRow}>
                        {WAVE_BARS.map((bar, idx) => (
                          <View 
                            key={idx} 
                            style={[
                              styles.waveformBar, 
                              { height: `${bar}%` },
                              (isPlaying && idx < (videoProgress / 100) * WAVE_BARS.length) && styles.waveformBarActive
                            ]} 
                          />
                        ))}
                      </View>
                    </View>

                    {/* Transcript Excerpt */}
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteText}>
                        "{selectedItem.body || selectedItem.desc}"
                      </Text>
                    </View>
                  </View>
                ) : (
                  /* Blog type */
                  <View style={{ marginBottom: 12 }}>
                    {selectedItem.image ? (
                      <View style={{ width: '100%', height: 180, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                        <Image source={{ uri: selectedItem.image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                      </View>
                    ) : null}
                    <View style={{ backgroundColor: '#f8faf9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#dde3eb' }}>
                      <Text style={{ fontFamily: Typography.fontDisplay, fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 6 }}>
                        {selectedItem.desc}
                      </Text>
                      <Text style={{ fontFamily: Typography.fontBody, fontSize: 13, color: '#3e4948', lineHeight: 20 }}>
                        {selectedItem.body || selectedItem.desc}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 2. Geographical & Cultural Provenance (Collapsible) */}
          <View style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setSectionProvenanceOpen(!sectionProvenanceOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIconBox}>
                  <MaterialIcons name="map" size={20} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Geographical & Cultural Provenance</Text>
                  <Text style={styles.sectionSubtitle}>Link this submission to Sri Lanka's official cultural landscape</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[
                  styles.sectionBadge, 
                  { 
                    backgroundColor: selectedItem.region ? '#e8f5e9' : '#ffebee',
                    borderColor: selectedItem.region ? '#a5d6a7' : '#ffcdd2'
                  }
                ]}>
                  <Text style={[
                    styles.sectionBadgeText, 
                    { color: selectedItem.region ? '#2e7d32' : '#c62828' }
                  ]}>
                    {selectedItem.region ? 'Assigned' : 'Required *'}
                  </Text>
                </View>
                <MaterialIcons name={sectionProvenanceOpen ? "expand-less" : "expand-more"} size={22} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>

            {sectionProvenanceOpen && (
              <View style={styles.sectionBody}>
                {/* Cultural Region Picker */}
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>Cultural Region *</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#ba1a1a', textTransform: 'uppercase' }}>Compulsory</Text>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.selectBox, 
                      !selectedItem.region && { borderColor: '#ba1a1a', backgroundColor: '#fff5f5' }
                    ]}
                    onPress={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  >
                    <Text style={[
                      styles.selectBoxText, 
                      !selectedItem.region && { color: '#ba1a1a', fontWeight: '600' }
                    ]}>
                      {selectedItem.region || '-- Select Cultural Region (Compulsory) --'}
                    </Text>
                    <MaterialIcons name={isRegionDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {!selectedItem.region && (
                    <Text style={{ fontSize: 11, color: '#ba1a1a', fontWeight: '600', marginTop: 4 }}>
                      ⚠️ Cultural region is mandatory before publishing live.
                    </Text>
                  )}

                  {isRegionDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {CULTURAL_REGIONS.map((reg) => (
                        <TouchableOpacity
                          key={reg.id}
                          style={[styles.dropdownItem, selectedItem.region === reg.label && styles.dropdownItemActive]}
                          onPress={() => handleRegionChange(reg.label)}
                        >
                          <Text style={selectedItem.region === reg.label ? styles.dropdownItemTextActive : styles.dropdownItemText}>
                            {reg.label} ({reg.regionName})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* District Picker */}
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>District</Text>
                    <Text style={{ fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>Optional</Text>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.selectBox, 
                      !selectedItem.region && { backgroundColor: '#f2f4f3', opacity: 0.6 }
                    ]}
                    onPress={() => {
                      if (selectedItem.region) {
                        setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
                      } else {
                        Alert.alert('Notice', 'Please select a Cultural Region first.');
                      }
                    }}
                    disabled={!selectedItem.region}
                  >
                    <Text style={[styles.selectBoxText, !selectedItem.region && { color: Colors.textMuted }]}>
                      {!selectedItem.region 
                        ? '-- Select Region First --' 
                        : (selectedItem.district || '-- Entire Region / Optional District --')}
                    </Text>
                    <MaterialIcons name={isDistrictDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {isDistrictDropdownOpen && selectedItem.region && (
                    <View style={styles.dropdownList}>
                      <TouchableOpacity
                        style={[styles.dropdownItem, !selectedItem.district && styles.dropdownItemActive]}
                        onPress={() => handleDistrictChange('')}
                      >
                        <Text style={!selectedItem.district ? styles.dropdownItemTextActive : styles.dropdownItemText}>
                          -- Entire Region (All Districts) --
                        </Text>
                      </TouchableOpacity>
                      {getDistrictsForRegion(selectedItem.region).map((dist) => (
                        <TouchableOpacity
                          key={dist}
                          style={[styles.dropdownItem, selectedItem.district === dist && styles.dropdownItemActive]}
                          onPress={() => handleDistrictChange(dist)}
                        >
                          <Text style={selectedItem.district === dist ? styles.dropdownItemTextActive : styles.dropdownItemText}>
                            {dist}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {selectedItem.region && (
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                      Available districts in {selectedItem.region}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* 3. Cultural Taxonomy & Category Alignment (Collapsible) */}
          <View style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setSectionTaxonomyOpen(!sectionTaxonomyOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIconBox}>
                  <MaterialIcons name="local-offer" size={20} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Cultural Taxonomy & Category Alignment</Text>
                  <Text style={styles.sectionSubtitle}>Metadata classification • {editingTags.length} tag(s) applied</Text>
                </View>
              </View>
              <MaterialIcons name={sectionTaxonomyOpen ? "expand-less" : "expand-more"} size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            {sectionTaxonomyOpen && (
              <View style={styles.sectionBody}>
                {/* Official Heritage Category */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.fieldLabel}>Official Heritage Category</Text>
                  <TouchableOpacity 
                    style={styles.selectBox}
                    onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <Text style={styles.selectBoxText}>
                      {selectedItem.category || publishCategory || 'Traditional Knowledge'}
                    </Text>
                    <MaterialIcons name={isCategoryDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {isCategoryDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {HERITAGE_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.dropdownItem, (selectedItem.category === cat || publishCategory === cat) && styles.dropdownItemActive]}
                          onPress={() => handleCategoryChange(cat)}
                        >
                          <Text style={(selectedItem.category === cat || publishCategory === cat) ? styles.dropdownItemTextActive : styles.dropdownItemText}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Applied Taxonomy Tags */}
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.fieldLabel}>Applied Taxonomy Tags</Text>
                    <TouchableOpacity 
                      style={styles.aiTagBtn}
                      onPress={handleGenerateAiTags}
                      disabled={isAutoTagging}
                    >
                      {isAutoTagging ? (
                        <ActivityIndicator size="small" color={Colors.secondary} />
                      ) : (
                        <>
                          <MaterialIcons name="auto-awesome" size={14} color={Colors.secondary} />
                          <Text style={styles.aiTagBtnText}>Auto-Tag</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: '#f8faf9', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#dde3eb' }}>
                    {editingTags.map((tag, idx) => (
                      <View key={idx} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <TouchableOpacity style={styles.tagRemoveBtn} onPress={() => handleRemoveTag(idx)}>
                          <MaterialIcons name="close" size={13} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {isAddingTag ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextInput
                          style={styles.tagInput}
                          value={newTagInput}
                          onChangeText={setNewTagInput}
                          placeholder="#tag-name"
                          placeholderTextColor={Colors.textMuted}
                          autoFocus
                          onSubmitEditing={handleAddTag}
                        />
                        <TouchableOpacity 
                          style={{ backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                          onPress={handleAddTag}
                        >
                          <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '700' }}>Add</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsAddingTag(false)}>
                          <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addTagBtn} onPress={() => setIsAddingTag(true)}>
                        <Text style={styles.addTagText}>+ Add Tag</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 4. Cover Image Details (Collapsible - Blogs) */}
          {selectedItem.type === 'blog' && (
            <View style={styles.sectionCard}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setSectionCoverImageOpen(!sectionCoverImageOpen)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIconBox}>
                    <MaterialIcons name="add-photo-alternate" size={20} color={Colors.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Cover Image</Text>
                    <Text style={styles.sectionSubtitle}>
                      {selectedItem.image ? 'Cover image set — tap to adjust' : 'Optional — upload thumbnail for heritage feed'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[
                    styles.sectionBadge, 
                    { 
                      backgroundColor: selectedItem.image ? '#e8f5e9' : '#f2f4f3',
                      borderColor: selectedItem.image ? '#a5d6a7' : '#dde3eb'
                    }
                  ]}>
                    <Text style={[
                      styles.sectionBadgeText, 
                      { color: selectedItem.image ? '#2e7d32' : Colors.textMuted }
                    ]}>
                      {selectedItem.image ? 'Image Set' : 'Optional'}
                    </Text>
                  </View>
                  <MaterialIcons name={sectionCoverImageOpen ? "expand-less" : "expand-more"} size={22} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>

              {sectionCoverImageOpen && (
                <View style={styles.sectionBody}>
                  {selectedItem.image ? (
                    <View style={[styles.coverImageContainer, { marginBottom: 10 }]}>
                      <Image source={{ uri: selectedItem.image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                      <View style={styles.coverImageOverlay}>
                        <TouchableOpacity 
                          style={[styles.coverBtn, { backgroundColor: '#ba1a1a' }]}
                          onPress={handleRemoveCoverImage}
                        >
                          <MaterialIcons name="delete" size={14} color={Colors.white} />
                          <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '700' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  <Text style={styles.fieldLabel}>Cover Image URL</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TextInput 
                      style={[styles.selectBox, { flex: 1, paddingVertical: 8 }]}
                      placeholder="https://images.unsplash.com/..."
                      placeholderTextColor={Colors.textMuted}
                      value={coverImageUrlInput}
                      onChangeText={setCoverImageUrlInput}
                    />
                    <TouchableOpacity 
                      style={{ backgroundColor: Colors.secondary, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8 }}
                      onPress={handleApplyCoverImageUrl}
                    >
                      <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '700' }}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                    The cover image will be used as the thumbnail across the heritage feed and mobile cards.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 5. Guideline Checklist & Decision Controls (Collapsible) */}
          <View style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setSectionGuidelinesOpen(!sectionGuidelinesOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIconBox}>
                  <MaterialIcons name="fact-check" size={20} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Guideline Checklist & Decision Controls</Text>
                  <Text style={styles.sectionSubtitle}>Complete all checks before publishing to the heritage feed</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[
                  styles.sectionBadge, 
                  { 
                    backgroundColor: allGuidelinesMet ? '#e8f5e9' : '#fff8e1',
                    borderColor: allGuidelinesMet ? '#a5d6a7' : '#ffe082'
                  }
                ]}>
                  <Text style={[
                    styles.sectionBadgeText, 
                    { color: allGuidelinesMet ? '#2e7d32' : '#f57f17' }
                  ]}>
                    {allGuidelinesMet ? 'All Clear' : 'Pending'}
                  </Text>
                </View>
                <MaterialIcons name={sectionGuidelinesOpen ? "expand-less" : "expand-more"} size={22} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>

            {sectionGuidelinesOpen && (
              <View style={styles.sectionBody}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <TouchableOpacity onPress={toggleAllGuidelines}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.secondary }}>
                      {allGuidelinesMet ? 'Uncheck All' : 'Check All'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Criterion 1 */}
                <TouchableOpacity 
                  style={[styles.guidelineItem, checkedGuidelines.noHateSpeech && styles.guidelineItemActive]}
                  onPress={() => setCheckedGuidelines(prev => ({ ...prev, noHateSpeech: !prev.noHateSpeech }))}
                  activeOpacity={0.8}
                >
                  <View style={checkedGuidelines.noHateSpeech ? styles.checkboxDone : styles.checkboxPending}>
                    {checkedGuidelines.noHateSpeech && <MaterialIcons name="check" size={16} color={Colors.secondary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guidelineTitle}>No hate speech or harmful content</Text>
                    <Text style={styles.guidelineDesc}>Verify submission is free of discrimination, hate speech, or harmful narratives.</Text>
                  </View>
                </TouchableOpacity>

                {/* Criterion 2 */}
                <TouchableOpacity 
                  style={[styles.guidelineItem, checkedGuidelines.culturallyAccurate && styles.guidelineItemActive]}
                  onPress={() => setCheckedGuidelines(prev => ({ ...prev, culturallyAccurate: !prev.culturallyAccurate }))}
                  activeOpacity={0.8}
                >
                  <View style={checkedGuidelines.culturallyAccurate ? styles.checkboxDone : styles.checkboxPending}>
                    {checkedGuidelines.culturallyAccurate && <MaterialIcons name="check" size={16} color={Colors.secondary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guidelineTitle}>Culturally accurate and respectful</Text>
                    <Text style={styles.guidelineDesc}>Authentic representation of Sri Lankan traditions, customs, and heritage.</Text>
                  </View>
                </TouchableOpacity>

                {/* Criterion 3 */}
                <TouchableOpacity 
                  style={[styles.guidelineItem, checkedGuidelines.highQuality && styles.guidelineItemActive]}
                  onPress={() => setCheckedGuidelines(prev => ({ ...prev, highQuality: !prev.highQuality }))}
                  activeOpacity={0.8}
                >
                  <View style={checkedGuidelines.highQuality ? styles.checkboxDone : styles.checkboxPending}>
                    {checkedGuidelines.highQuality && <MaterialIcons name="check" size={16} color={Colors.secondary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guidelineTitle}>High quality audio and clear visuals</Text>
                    <Text style={styles.guidelineDesc}>Clear audio recording, legible imagery, and audible narrative fidelity.</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Permanently Visible Decision Controls Bottom Bar */}
        {isReviewingRejected ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.btnPublish, { flex: 1, backgroundColor: Colors.secondary }]} 
              onPress={() => {
                setViewState('list');
                setSelectedItem(null);
                setIsReviewingRejected(false);
              }}
            >
              <Text style={styles.btnPublishText}>Back to Rejected List</Text>
            </TouchableOpacity>
          </View>
        ) : isReviewingArchived ? (
          <View style={[styles.bottomBar, { flexDirection: 'row', gap: 8 }]}>
            <TouchableOpacity 
              style={[styles.btnReject, { flex: 1, backgroundColor: '#eceeed', paddingVertical: 10 }]} 
              onPress={() => {
                setViewState('list');
                setSelectedItem(null);
                setIsReviewingArchived(false);
              }}
            >
              <Text style={[styles.btnRejectText, { color: Colors.text, fontSize: 13 }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#ba1a1a', borderRadius: 24, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 }} 
              onPress={() => {
                handleConfirmDelete(selectedItem.id);
              }}
            >
              <Text style={{ color: Colors.white, fontFamily: Typography.fontBodyMed, fontSize: 13, fontWeight: '600' }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnPublish, { flex: 1, backgroundColor: Colors.secondary, paddingVertical: 10 }]} 
              onPress={() => {
                setShowRestoreModal(true);
              }}
            >
              <Text style={[styles.btnPublishText, { fontSize: 13 }]}>Restore</Text>
            </TouchableOpacity>
          </View>
        ) : selectedItem.status === 'PUBLISHED' ? (
          <View style={[styles.bottomBar, { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }]}>
            <TouchableOpacity 
              style={[styles.btnReject, { flex: 1, borderColor: '#fe893e' }]} 
              onPress={() => handleArchiveNewItem(selectedItem)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="archive" size={16} color="#9b4600" />
                <Text style={[styles.btnRejectText, { color: '#9b4600' }]}>Archive</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e8f5e9', borderRadius: 24, paddingVertical: 12 }}>
              <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
              <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 12, fontWeight: '700', color: '#2e7d32' }}>
                Published in Heritage Canon
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.btnReject} onPress={() => handleRejectPress(selectedItem)}>
              <Text style={styles.btnRejectText}>Reject</Text>
            </TouchableOpacity>
            {renderPublishButton()}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      {viewState === 'list' ? renderListView() : renderDetailView()}

      {/* Rejection Modal */}
      <Modal visible={!!rejectingItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Grab handle mimicking sheet */}
            <View style={{ width: 48, height: 6, backgroundColor: 'rgba(191, 200, 200, 0.5)', borderRadius: 3, alignSelf: 'center', marginBottom: 16 }} />

            <View style={[styles.rowBetween, { alignItems: 'center', marginBottom: 16 }]}>
              <Text style={styles.modalTitleError}>Reject Content</Text>
              <TouchableOpacity onPress={() => setRejectingItem(null)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.rejectInputLabel}>Primary Rejection Reason</Text>
            <View style={styles.rejectSelectContainer}>
              {REJECTION_REASONS.map((option) => {
                const isActive = rejectionReason === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.rejectSelectOption, isActive && styles.rejectSelectOptionActive]}
                    onPress={() => setRejectionReason(option)}
                  >
                    <Text style={isActive ? styles.rejectSelectOptionTextActive : styles.rejectSelectOptionText}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.rejectInputLabel}>Curator Guidance & Revision Notes</Text>
            <TextInput
              style={styles.rejectNotesInput}
              value={rejectionNotes}
              onChangeText={setRejectionNotes}
              placeholder="Provide clear historical or technical guidance on what needs amendment before re-submission..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={[styles.modalActions, { marginTop: 24, gap: 12 }]}>
              <TouchableOpacity style={styles.modalBtnCancelPill} onPress={() => setRejectingItem(null)}>
                <Text style={styles.modalBtnCancelPillText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirmPill} onPress={handleConfirmRejection}>
                <Text style={styles.modalBtnConfirmPillText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restore Modal */}
      <Modal visible={showRestoreModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <MaterialIcons name="settings-backup-restore" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.modalTitle}>Restore Content</Text>
            <Text style={styles.modalBody}>
              Restore this content to the active feed? It will be immediately visible to students in the "Ancient Irrigation" module.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowRestoreModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleConfirmRestore}>
                <Text style={styles.modalBtnConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Archive New Modal */}
      <Modal visible={showArchiveNewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: Typography.fontDisplay, fontSize: 18, fontWeight: '700', color: Colors.text }}>Archive New Content</Text>
              <TouchableOpacity onPress={() => { 
                setShowArchiveNewModal(false); 
                setArchiveNewSearchQuery(''); 
                setArchiveNewAuthorQuery('');
                setArchiveNewTypeFilter('all');
              }}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Title / Keywords Search */}
            <View style={[styles.searchBar, { marginBottom: 8, height: 38 }]}>
              <MaterialIcons name="search" size={18} color="#fe893e" />
              <TextInput
                style={[styles.searchInput, { fontSize: 13 }]}
                placeholder="Search by Title / Keywords..."
                placeholderTextColor={Colors.textMuted}
                value={archiveNewSearchQuery}
                onChangeText={setArchiveNewSearchQuery}
              />
              {archiveNewSearchQuery ? (
                <TouchableOpacity onPress={() => setArchiveNewSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* User / Author Details Search */}
            <View style={[styles.searchBar, { marginBottom: 12, height: 38 }]}>
              <MaterialIcons name="person" size={18} color="#fe893e" />
              <TextInput
                style={[styles.searchInput, { fontSize: 13 }]}
                placeholder="Search by User / Author Name..."
                placeholderTextColor={Colors.textMuted}
                value={archiveNewAuthorQuery}
                onChangeText={setArchiveNewAuthorQuery}
              />
              {archiveNewAuthorQuery ? (
                <TouchableOpacity onPress={() => setArchiveNewAuthorQuery('')}>
                  <MaterialIcons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Content Type Filter */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: Colors.textMuted }}>Type:</Text>
              {['all', 'video', 'blog', 'audio'].map((t) => {
                const isAct = archiveNewTypeFilter === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={{
                      backgroundColor: isAct ? '#fe893e' : '#eceeed',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 12
                    }}
                    onPress={() => setArchiveNewTypeFilter(t as any)}
                  >
                    <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 10, color: isAct ? Colors.white : Colors.text, textTransform: 'capitalize' }}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Scrollable list of archivable posts */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 16 }}>
              {renderArchiveNewList()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

