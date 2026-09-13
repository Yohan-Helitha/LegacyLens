import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './ModerationQueueScreen.styles';
import { homeApi, CategoryResponse } from '../../../services/api/homeApi';

type Tab = 'review' | 'published' | 'rejected' | 'archived';
type ViewState = 'list' | 'review_detail';

export const ModerationQueueScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  
  const [rejectedItems, setRejectedItems] = useState<any[]>([
    {
      id: 'r1',
      title: 'History of the Old Fort - Project vlog',
      desc: 'Violates community guidelines: Background audio contains copyrighted commercial music (0:45 - 2:10). Please replace with royalty-free audio and resubmit.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ4_tUhbhbo9qVMFM7pTGJLRc_ps42dVVmx3rr1C_KL6YiUqz9Lr40WeWuldq8f0ntaSJ51bOxhpOquwEXiIMZE-H1NyZ6Oz5Rh64VCXlA4cExCMG-rzuXEBawYEy7I8TqPfRr9a9kWvEE8pIIpEkZCdCAm5r6LgA3T--cFLEP4p1UxRmDJ9hKgC0jM5-jY3r6OWWMlB6vHnveL1LoXqd-BsOfJevjJevRPQo7ayicc9e1E5V-2fSK',
      type: 'video',
      author: 'Amara Silva',
      time: 'Oct 12, 2023',
      reason: 'Inappropriate Content',
      notes: 'Background audio contains copyrighted commercial music (0:45 - 2:10). Please replace with royalty-free audio and resubmit.',
      isElder: false,
      tags: ['History', 'Vlog', 'Fort']
    }
  ]);
  const [isReviewingRejected, setIsReviewingRejected] = useState(false);

  const [queueItems, setQueueItems] = useState([
    {
      id: '1',
      title: 'The Kandy Perahera',
      desc: 'An incredible look at the traditional dance, drumming, and majestic elephants that make up one of Sri Lanka\'s most famous cultural festivals.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiU4M7TKJ8SywceJc_v2uBr9lBdAWZY3foF-U7xwE0PZp4HcVxcKCpeczRUmMto4DH3NGNGzQlqkuRIOc_qF6lPMafDffijQ58uGW1XBHKME2L_R__8NPzsVTfqj-MqX2bGLPMlOWwLV53rLBDDmubH3NFy7K_V0DJv-iXJ9pqix5z_0LWaYFlMoxB3SmqixdFm5UOnRJGJxqxk-kGxbHeUtEC39ZmUiuyegTgdIEI2D1HNdULgZzl',
      type: 'video',
      author: 'Sunil Perera',
      time: '2h ago',
      isElder: true,
      tags: ['Handicrafts', 'Tradition', 'Hand-woven'],
    },
    {
      id: '2',
      title: 'Traditional Herbs',
      desc: 'Exploring the medicinal properties and historical uses of local flora in everyday rural life and holistic health practices.',
      body: 'Exploring the medicinal properties and historical uses of local flora in everyday rural life and holistic health practices. For generations, traditional practitioners have used these natural resources to treat various ailments, maintain vitality, and foster harmony with nature.\n\nRituals dictate that plants are harvested during specific lunar phases to maximize their therapeutic potency. Understanding these plants connects us directly to the wisdom of our ancestors, keeping long-lost practices alive in the modern world.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDux_unKhgQoX94K9rhlnGT6AR9X41j3lM480DfbajmgpYFUnVvN90Ziz1WGbxXBJQopvAhBzZOkdt6bKKZ_PO1JcljAZXKLoX_jsRQ6ggRqkOgR-g8GBl-XFEkZw4edBKLaTdWAevysxyB-UOeEy3ObWPmAVwZT5_S3DYDlPPzg2aGvGkO2sdxUibCsGn3DVo1JYxPF9Yzci50SdtOM00mfjtxo4XGIPD3G5NdHd0_8sZE70On0ge6',
      type: 'article',
      author: 'Nuwani D.',
      time: '4h ago',
      isElder: false,
      tags: ['Herbs', 'Holistic', 'Nature'],
    }
  ]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const [archivedItems, setArchivedItems] = useState<any[]>([
    {
      id: 'a1',
      title: 'Ancient Irrigation',
      desc: 'A detailed look at the complex hydrological engineering systems developed during the Anuradhapura era, showcasing massive reservoirs and subtle gradients.',
      body: 'A detailed look at the complex hydrological engineering systems developed during the Anuradhapura era, showcasing massive reservoirs and subtle gradients. The builders utilized natural geography to divert rivers into giant man-made lakes, which in turn fed smaller village ponds through intricate canals. To prevent silt buildup, they designed early desilting traps (bisokotuwa), demonstrating an advanced grasp of hydraulic pressure and fluid dynamics that remains functional to this day.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDux_unKhgQoX94K9rhlnGT6AR9X41j3lM480DfbajmgpYFUnVvN90Ziz1WGbxXBJQopvAhBzZOkdt6bKKZ_PO1JcljAZXKLoX_jsRQ6ggRqkOgR-g8GBl-XFEkZw4edBKLaTdWAevysxyB-UOeEy3ObWPmAVwZT5_S3DYDlPPzg2aGvGkO2sdxUibCsGn3DVo1JYxPF9Yzci50SdtOM00mfjtxo4XGIPD3G5NdHd0_8sZE70On0ge6',
      type: 'article',
      author: 'Saman Kumara',
      time: 'Archived 2 days ago',
      isElder: false,
      tags: ['History', 'Irrigation', 'Hydrology']
    },
    {
      id: 'a2',
      title: 'Folk Songs (Jana Kavi)',
      desc: 'Collection of traditional verses sung during agricultural activities, reflecting the cultural mindset and daily rhythms of ancient farming communities.',
      body: 'Collection of traditional verses sung during agricultural activities, reflecting the cultural mindset and daily rhythms of ancient farming communities. Sung mostly while weeding paddy fields, harvesting crops, or watch-guarding at night to fend off wild animals, these chants offered rhythm and emotional relief. They reflect deep philosophical thoughts on impermanence, connection to nature, and the struggles of everyday life.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiU4M7TKJ8SywceJc_v2uBr9lBdAWZY3foF-U7xwE0PZp4HcVxcKCpeczRUmMto4DH3NGNGzQlqkuRIOc_qF6lPMafDffijQ58uGW1XBHKME2L_R__8NPzsVTfqj-MqX2bGLPMlOWwLV53rLBDDmubH3NFy7K_V0DJv-iXJ9pqix5z_0LWaYFlMoxB3SmqixdFm5UOnRJGJxqxk-kGxbHeUtEC39ZmUiuyegTgdIEI2D1HNdULgZzl',
      type: 'article',
      author: 'Kusuma Silva',
      time: 'Archived 1 week ago',
      isElder: true,
      tags: ['Arts', 'Music', 'Tradition']
    }
  ]);
  const [isReviewingArchived, setIsReviewingArchived] = useState(false);

  // Search and filter states
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'all' | 'video' | 'article'>('all');

  const [publishedSearchQuery, setPublishedSearchQuery] = useState('');
  const [publishedTypeFilter, setPublishedTypeFilter] = useState<'all' | 'video' | 'article'>('all');

  const [rejectedSearchQuery, setRejectedSearchQuery] = useState('');
  const [rejectedTypeFilter, setRejectedTypeFilter] = useState<'all' | 'video' | 'article'>('all');

  const [archivedSearchQuery, setArchivedSearchQuery] = useState('');
  const [archivedTypeFilter, setArchivedTypeFilter] = useState<'all' | 'video' | 'article'>('all');

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
  const [archiveNewTypeFilter, setArchiveNewTypeFilter] = useState<'all' | 'video' | 'article'>('all');

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

  // Active / Published posts that are eligible for archiving
  const [publishedItems, setPublishedItems] = useState<any[]>([
    {
      id: 'p1',
      title: 'Sigiriya Rock Fortress',
      desc: 'An in-depth documentary highlighting the history, structural architecture, and ancient gardens of Sigiriya.',
      body: 'An in-depth documentary highlighting the history, structural architecture, and ancient gardens of Sigiriya.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiU4M7TKJ8SywceJc_v2uBr9lBdAWZY3foF-U7xwE0PZp4HcVxcKCpeczRUmMto4DH3NGNGzQlqkuRIOc_qF6lPMafDffijQ58uGW1XBHKME2L_R__8NPzsVTfqj-MqX2bGLPMlOWwLV53rLBDDmubH3NFy7K_V0DJv-iXJ9pqix5z_0LWaYFlMoxB3SmqixdFm5UOnRJGJxqxk-kGxbHeUtEC39ZmUiuyegTgdIEI2D1HNdULgZzl',
      type: 'video',
      author: 'Priyantha C.',
      time: 'Published 3 days ago',
      isElder: false,
      tags: ['History', 'Sigiriya', 'Engineering']
    },
    {
      id: 'p2',
      title: 'Traditional Mask Making',
      desc: 'Step-by-step masterclass showcasing the Ambalangoda mask carving craft and its ritual importance.',
      body: 'Step-by-step masterclass showcasing the Ambalangoda mask carving craft and its ritual importance.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDux_unKhgQoX94K9rhlnGT6AR9X41j3lM480DfbajmgpYFUnVvN90Ziz1WGbxXBJQopvAhBzZOkdt6bKKZ_PO1JcljAZXKLoX_jsRQ6ggRqkOgR-g8GBl-XFEkZw4edBKLaTdWAevysxyB-UOeEy3ObWPmAVwZT5_S3DYDlPPzg2aGvGkO2sdxUibCsGn3DVo1JYxPF9Yzci50SdtOM00mfjtxo4XGIPD3G5NdHd0_8sZE70On0ge6',
      type: 'article',
      author: 'Karunaratne H.',
      time: 'Published 1 week ago',
      isElder: true,
      tags: ['Art', 'Rituals', 'Tradition']
    }
  ]);

  const getFilteredReviewItems = () => {
    const filtered = queueItems.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(reviewSearchQuery.toLowerCase());

      const matchesType = reviewTypeFilter === 'all' || item.type === reviewTypeFilter;

      const matchesCategory = reviewCategoryFilter === 'all' || 
        item.tags.some(tag => tag.toLowerCase() === reviewCategoryFilter.toLowerCase());

      const matchesContributor = reviewContributorFilter === 'all' || 
        (reviewContributorFilter === 'elders' && item.isElder) ||
        (reviewContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (reviewSortOrder === 'newest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA;
      }
      if (reviewSortOrder === 'oldest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
      }
      if (reviewSortOrder === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      if (reviewSortOrder === 'titleDesc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  };

  const getFilteredPublishedItems = () => {
    const filtered = publishedItems.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(publishedSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(publishedSearchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(publishedSearchQuery.toLowerCase());

      const matchesType = publishedTypeFilter === 'all' || item.type === publishedTypeFilter;

      const matchesCategory = publishedCategoryFilter === 'all' || 
        item.tags.some((tag: string) => tag.toLowerCase() === publishedCategoryFilter.toLowerCase());

      const matchesContributor = publishedContributorFilter === 'all' || 
        (publishedContributorFilter === 'elders' && item.isElder) ||
        (publishedContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (publishedSortOrder === 'newest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA;
      }
      if (publishedSortOrder === 'oldest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
      }
      if (publishedSortOrder === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      if (publishedSortOrder === 'titleDesc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  };

  const getFilteredRejectedItems = () => {
    const filtered = rejectedItems.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(rejectedSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(rejectedSearchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(rejectedSearchQuery.toLowerCase());

      const matchesType = rejectedTypeFilter === 'all' || item.type === rejectedTypeFilter;

      const matchesCategory = rejectedCategoryFilter === 'all' || 
        item.tags.some((tag: string) => tag.toLowerCase() === rejectedCategoryFilter.toLowerCase());

      const matchesContributor = rejectedContributorFilter === 'all' || 
        (rejectedContributorFilter === 'elders' && item.isElder) ||
        (rejectedContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (rejectedSortOrder === 'newest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA;
      }
      if (rejectedSortOrder === 'oldest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
      }
      if (rejectedSortOrder === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      if (rejectedSortOrder === 'titleDesc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  };

  const getFilteredArchivedItems = () => {
    const filtered = archivedItems.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(archivedSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(archivedSearchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(archivedSearchQuery.toLowerCase());

      const matchesType = archivedTypeFilter === 'all' || item.type === archivedTypeFilter;

      const matchesCategory = archivedCategoryFilter === 'all' || 
        item.tags.some((tag: string) => tag.toLowerCase() === archivedCategoryFilter.toLowerCase());

      const matchesContributor = archivedContributorFilter === 'all' || 
        (archivedContributorFilter === 'elders' && item.isElder) ||
        (archivedContributorFilter === 'students' && !item.isElder);

      return matchesSearch && matchesType && matchesCategory && matchesContributor;
    });

    return filtered.sort((a, b) => {
      if (archivedSortOrder === 'newest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA;
      }
      if (archivedSortOrder === 'oldest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
      }
      if (archivedSortOrder === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      if (archivedSortOrder === 'titleDesc') {
        return b.title.localeCompare(a.title);
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

  const handleSelectReview = (item: any) => {
    setSelectedItem(item);
    setEditingTags([...item.tags]);
    setViewState('review_detail');
    setIsPlaying(false);
    setVideoProgress(33);
    setCheckedGuidelines({
      noHateSpeech: false,
      culturallyAccurate: false,
      highQuality: false,
    });
    setTagsConfirmed(false);
    setPublishCategory(null);
    setPublishCategorySearch('');
    setIsCategoryDropdownOpen(false);
  };

  const handlePublish = (itemId: string) => {
    setQueueItems((prev) => prev.filter((i) => i.id !== itemId));
    Alert.alert('Success', 'Content has been published successfully!');
    if (viewState === 'review_detail') {
      setViewState('list');
      setSelectedItem(null);
    }
  };

  const handleRejectPress = (item: any) => {
    setRejectingItem(item);
    setRejectionReason('Needs Revision');
    setRejectionNotes('');
  };

  const handleConfirmRejection = () => {
    if (!rejectingItem) return;
    const newRejected = {
      ...rejectingItem,
      reason: rejectionReason,
      notes: rejectionNotes || 'No additional notes provided.',
      time: new Date().toLocaleDateString()
    };
    setRejectedItems((prev) => [newRejected, ...prev]);

    setQueueItems((prev) => prev.filter((i) => i.id !== rejectingItem.id));
    Alert.alert('Rejection Confirmed', `Rejection sent: ${rejectionReason}`);
    setRejectingItem(null);
    if (viewState === 'review_detail') {
      setViewState('list');
      setSelectedItem(null);
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

  const handleConfirmRestore = () => {
    if (!selectedItem) return;
    setArchivedItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
    setPublishedItems((prev) => [
      { ...selectedItem, time: 'Published just now' },
      ...prev,
    ]);

    setShowRestoreModal(false);
    setViewState('list');
    setSelectedItem(null);
    setIsReviewingArchived(false);
    setActiveTab('published');
    Alert.alert('Success', 'Content has been restored and published successfully!');
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
          onPress: () => {
            setArchivedItems((prev) => prev.filter((i) => i.id !== itemId));
            setViewState('list');
            setSelectedItem(null);
            setIsReviewingArchived(false);
            Alert.alert('Success', 'Content permanently deleted.');
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
          onPress: () => {
            Alert.alert(
              'Delete Content',
              'Are you sure you want to permanently delete this content? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    setArchivedItems((prev) => prev.filter((i) => i.id !== item.id));
                    Alert.alert('Success', 'Content permanently deleted.');
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleArchiveNewItem = (item: any) => {
    // Remove from publishedItems or queueItems
    setPublishedItems((prev) => prev.filter((i) => i.id !== item.id));
    setQueueItems((prev) => prev.filter((i) => i.id !== item.id));

    // Add to archivedItems
    const newArchived = {
      ...item,
      time: 'Archived just now'
    };
    setArchivedItems((prev) => [newArchived, ...prev]);
    setShowArchiveNewModal(false);
    setArchiveNewSearchQuery('');
    setArchiveNewAuthorQuery('');
    setArchiveNewTypeFilter('all');
    Alert.alert('Success', `"${item.title}" has been archived successfully!`);
  };

  // ─── LIST VIEW (Review Queue & Archived) ──────────────────────────────────────
  const renderListView = () => (
    <View style={styles.flex1}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introSection}>
          <Text style={styles.pageTitle}>Moderation Queue</Text>
          <Text style={styles.pageSubtitle}>Review user submissions before they are published to the learning community.</Text>
        </View>

        {/* Segmented Control */}
        {(() => {
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
        })()}

        {activeTab === 'review' && renderReviewQueue()}
        {activeTab === 'published' && renderPublishedQueue()}
        {activeTab === 'rejected' && renderRejectedQueue()}
        {activeTab === 'archived' && renderArchivedQueue()}
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
                  {['all', 'video', 'article'].map((type) => {
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
                  {['all', 'History', 'Tradition', 'Engineering', 'Music', 'Art', 'Rituals'].map((cat) => {
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
                <View style={{ flexDirection: 'row', gap: 6 }}>
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
                </View>
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
                  ) : (
                    <View style={styles.articleTag}>
                      <MaterialIcons name="article" size={14} color={Colors.secondary} />
                      <Text style={styles.articleTagText}> Article</Text>
                    </View>
                  )}
                  <View style={styles.rowCenter}>
                    <MaterialIcons name="person" size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}> {item.author}</Text>
                  </View>
                  <Text style={styles.metaTextMuted}>• {item.time}</Text>
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
        {filtered.length === 0 && (
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
                  {['all', 'video', 'article'].map((type) => {
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
                  {['all', 'History', 'Tradition', 'Engineering', 'Music', 'Art', 'Rituals'].map((cat) => {
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
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creator only' }
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
                </View>
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
                <MaterialIcons name={item.type === 'video' ? 'play-circle' : 'article'} size={14} color={Colors.textMuted} />
                <Text style={styles.metaTextMuted}> {item.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
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
                  {['all', 'video', 'article'].map((type) => {
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
                  {['all', 'History', 'Tradition', 'Engineering', 'Music', 'Art', 'Rituals'].map((cat) => {
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
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creator only' }
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
                </View>
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
                  <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }}>{item.time} • {item.type === 'video' ? 'Video' : 'Article'}</Text>
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

        {filtered.length === 0 && (
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
                  {['all', 'video', 'article'].map((type) => {
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
                  {['all', 'History', 'Tradition', 'Engineering', 'Music', 'Art', 'Rituals'].map((cat) => {
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
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Contributors' },
                    { value: 'elders', label: 'Elders only' },
                    { value: 'students', label: 'Youth Creator only' }
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
                </View>
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
                  <Text style={{ fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textMuted }}>{item.time} • {item.type === 'video' ? 'Video' : 'Article'} Submission</Text>
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

        {filtered.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 16, color: Colors.textMuted }}>
              No items matching criteria!
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── DETAIL VIEW (Content Review) ───────────────────────────────────────────────
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

          {/* Rejection Details (Only if reviewing a rejected item) */}
          {isReviewingRejected && (
            <View style={{ backgroundColor: '#ffdad6', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(186, 26, 26, 0.2)', padding: Spacing.md, marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MaterialIcons name="error" size={20} color="#ba1a1a" />
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, fontWeight: '700', color: '#ba1a1a' }}>Rejection Information</Text>
              </View>
              <View style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 8 }}>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: '#fe893e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Primary Reason</Text>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, color: Colors.text, marginTop: 2, marginBottom: 12 }}>{selectedItem.reason}</Text>

                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 11, color: '#fe893e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Detailed Feedback Sent to User</Text>
                <Text style={{ fontFamily: Typography.fontBody, fontSize: 13, color: Colors.text, marginTop: 2 }}>{selectedItem.notes}</Text>
              </View>
            </View>
          )}

          {/* Video Player */}
          {selectedItem.type === 'video' && (
            <View style={styles.videoPlayerContainer}>
              <ImageBackground source={{ uri: selectedItem.image }} style={styles.videoBg}>
                <View style={styles.videoOverlay}>
                  <TouchableOpacity style={styles.playCircle} onPress={() => setIsPlaying(!isPlaying)}>
                    <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color={Colors.secondary} />
                  </TouchableOpacity>
                </View>
                {/* Progress Bar Mock */}
                <View style={styles.videoProgressBarBg}>
                  <View style={[styles.videoProgressBarFill, { width: `${videoProgress}%` }]} />
                </View>
              </ImageBackground>
            </View>
          )}

          {/* Article Text Preview Panel */}
          {selectedItem.type === 'article' && (
            <View style={styles.articlePreviewCard}>
              <View style={styles.articlePreviewHeader}>
                <Text style={styles.articlePreviewLabel}>Draft Preview</Text>
                <View style={styles.articleReadTimeBadge}>
                  <Text style={styles.articleReadTimeText}>
                    {`${Math.ceil((selectedItem.body || selectedItem.desc).split(' ').length / 150)} min read`}
                  </Text>
                </View>
              </View>
              <View style={styles.articlePreviewBody}>
                <Text style={styles.articlePreviewTitle}>{selectedItem.title}</Text>
                <ScrollView 
                  style={{ maxHeight: 220 }} 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.articlePreviewContent}>
                    {selectedItem.body || selectedItem.desc}
                  </Text>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Submitter Info */}
          <View style={styles.submitterCard}>
            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw8_8bd1MoyfJOKvJlrxTI2jRbmuJbNjnMKw6zNr3QdMvvsfVqB6AXP74y7Ou5vKdO6sHAW129RAum1ATnF-2q5QtvTGrE3gGsHEANkAIOd1Mp04HlJxImdYnEtvYPfYnrGnQnL8oaKr3BsyMvpR4gGAMkr4qd_MFsWeYOaHtLlRLVSdUlfU_s0rLEGIGxZT7An4nSkXePTOC2uVGXDcRVRIiyPPuPYD4GJC8F4t7RGWdO9hT0vQp_' }} style={styles.submitterAvatar} />
            <View>
              <Text style={styles.submitterName}>{selectedItem.author}</Text>
              <View style={styles.verifiedTag}>
                <MaterialIcons name="verified" size={14} color="#0f5c5c" />
                <Text style={styles.verifiedTagText}>{selectedItem.isElder ? 'Verified Elder' : 'Creator'}</Text>
              </View>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={20} color="#fe893e" />
            <Text style={styles.infoBannerText}>
              {selectedItem.isElder ? 'Elder submission — will be auto-tagged on approval.' : 'Standard submission — verify before approval.'}
            </Text>
          </View>

          {/* Verify Tags */}
          <View style={styles.tagsCard}>
            <View style={styles.tagsCardHeader}>
              <Text style={styles.tagsCardTitle}>{(isReviewingRejected || isReviewingArchived) ? "Tags Applied" : "Verify Tags"}</Text>
              {tagsConfirmed && !isReviewingRejected && !isReviewingArchived && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="check-circle" size={16} color="#0f5c5c" />
                  <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 12, color: '#0f5c5c', fontWeight: '600' }}>Confirmed</Text>
                </View>
              )}
            </View>
            <View style={styles.tagsContainer}>
              {editingTags.map((tag, index) => {
                return (
                  <View key={index} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                    {!tagsConfirmed && !isReviewingRejected && !isReviewingArchived && (
                      <TouchableOpacity
                        style={styles.tagRemoveBtn}
                        onPress={() => setEditingTags((prev) => prev.filter((_, idx) => idx !== index))}
                      >
                        <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              
              {!tagsConfirmed && !isReviewingRejected && !isReviewingArchived && (
                isAddingTag ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TextInput
                      style={styles.tagInput}
                      value={newTagInput}
                      onChangeText={setNewTagInput}
                      placeholder="Tag name"
                      autoFocus
                    />
                    <TouchableOpacity
                      style={{ backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                      onPress={() => {
                        if (newTagInput.trim()) {
                          setEditingTags((prev) => [...prev, newTagInput.trim()]);
                          setNewTagInput('');
                        }
                        setIsAddingTag(false);
                      }}
                    >
                      <Text style={{ color: Colors.white, fontSize: 12, fontWeight: 'bold' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addTagBtn} onPress={() => setIsAddingTag(true)}>
                    <Text style={styles.addTagText}>+ Add Tag</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            
            {/* Confirm Tags Button */}
            {!isReviewingRejected && !isReviewingArchived && (
              <TouchableOpacity 
                style={{ 
                  marginTop: 12, 
                  backgroundColor: tagsConfirmed ? 'rgba(15, 92, 92, 0.1)' : '#0f5c5c', 
                  paddingVertical: 10, 
                  alignItems: 'center', 
                  borderRadius: 8,
                  borderWidth: tagsConfirmed ? 1 : 0,
                  borderColor: '#0f5c5c'
                }}
                onPress={() => setTagsConfirmed(!tagsConfirmed)}
              >
                <Text style={{ 
                  fontFamily: Typography.fontBodyMed, 
                  fontSize: 12, 
                  fontWeight: '600', 
                  color: tagsConfirmed ? '#0f5c5c' : Colors.white 
                }}>
                  {tagsConfirmed ? 'Tags Confirmed (Tap to Edit)' : 'Confirm Tags'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Assignment */}
          {!isReviewingRejected && !isReviewingArchived && (
            <View style={[styles.checklistCard, { marginBottom: 16, padding: 16 }]}>
              <View style={styles.rowCenter}>
                <MaterialIcons name="category" size={20} color={Colors.textMuted} />
                <Text style={styles.checklistTitle}>Assign Category</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity 
                  style={{ borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                >
                  <Text style={{ fontFamily: Typography.fontBody, fontSize: 14, color: publishCategory ? Colors.text : Colors.textMuted }}>
                    {publishCategory || 'Select a category...'}
                  </Text>
                  <MaterialIcons name={isCategoryDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={Colors.textMuted} />
                </TouchableOpacity>

                {isCategoryDropdownOpen && (
                  <View style={{ marginTop: 8, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', borderRadius: 8, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(191, 200, 200, 0.2)', backgroundColor: '#f9f9f9' }}>
                      <MaterialIcons name="search" size={20} color={Colors.textMuted} />
                      <TextInput 
                        style={{ flex: 1, padding: 10, fontFamily: Typography.fontBody, fontSize: 13, color: Colors.text }}
                        placeholder="Search category..."
                        placeholderTextColor={Colors.textMuted}
                        value={publishCategorySearch}
                        onChangeText={setPublishCategorySearch}
                      />
                    </View>
                    <View style={{ maxHeight: 150 }}>
                      <ScrollView nestedScrollEnabled>
                        {availableCategories.filter(c => c.toLowerCase().includes(publishCategorySearch.toLowerCase())).map(cat => (
                          <TouchableOpacity 
                            key={cat} 
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(191, 200, 200, 0.1)', backgroundColor: publishCategory === cat ? 'rgba(15, 92, 92, 0.1)' : Colors.white }}
                            onPress={() => {
                              setPublishCategory(cat);
                              setIsCategoryDropdownOpen(false);
                              setPublishCategorySearch('');
                            }}
                          >
                            <Text style={{ fontFamily: Typography.fontBody, fontSize: 14, color: publishCategory === cat ? '#0f5c5c' : Colors.text, fontWeight: publishCategory === cat ? '600' : '400' }}>{cat}</Text>
                          </TouchableOpacity>
                        ))}
                        {availableCategories.filter(c => c.toLowerCase().includes(publishCategorySearch.toLowerCase())).length === 0 && publishCategorySearch.length > 0 && (
                          <TouchableOpacity 
                            style={{ padding: 12, backgroundColor: 'rgba(254, 137, 62, 0.1)' }}
                            onPress={async () => {
                              const newCat = publishCategorySearch.trim();
                              if (newCat) {
                                try {
                                  await homeApi.createCategory(newCat);
                                } catch (e) {
                                  console.log('Failed saving category to DB:', e);
                                }
                                setAvailableCategories(prev => [...prev, newCat]);
                                setPublishCategory(newCat);
                                setIsCategoryDropdownOpen(false);
                                setPublishCategorySearch('');
                              }
                            }}
                          >
                            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, color: '#fe893e', fontWeight: '600' }}>+ Add "{publishCategorySearch}"</Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Guideline Checklist */}
          {!isReviewingRejected && (
            <View style={styles.checklistCard}>
              <TouchableOpacity style={styles.checklistHeader} onPress={() => setChecklistOpen(!checklistOpen)} activeOpacity={0.7}>
                <View style={styles.rowCenter}>
                  <MaterialIcons name="fact-check" size={20} color={Colors.textMuted} />
                  <Text style={styles.checklistTitle}>Guideline Checklist</Text>
                </View>
                <MaterialIcons name={checklistOpen ? 'expand-less' : 'expand-more'} size={24} color={Colors.textMuted} />
              </TouchableOpacity>
              {checklistOpen && (
                <View style={styles.checklistContent}>
                  <View style={styles.divider} />
                  {(() => {
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
                  })()}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Action Bar */}
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
        ) : (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.btnReject} onPress={() => handleRejectPress(selectedItem)}>
              <Text style={styles.btnRejectText}>Reject</Text>
            </TouchableOpacity>
            {(() => {
              const isPublishEnabled = checkedGuidelines.noHateSpeech && checkedGuidelines.culturallyAccurate && checkedGuidelines.highQuality && tagsConfirmed && !!publishCategory;
              return (
                <TouchableOpacity 
                  style={[styles.btnPublish, !isPublishEnabled && { backgroundColor: '#a1b5b5', opacity: 0.7 }]} 
                  onPress={() => handlePublish(selectedItem.id)}
                  disabled={!isPublishEnabled}
                >
                  <Text style={styles.btnPublishText}>Publish to Feed</Text>
                </TouchableOpacity>
              );
            })()}
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
            
            <Text style={styles.rejectInputLabel}>Primary Reason</Text>
            <View style={styles.rejectSelectContainer}>
              {['Inappropriate Content', 'Factual Inaccuracies', 'Poor Formatting/Quality', 'Duplicate Submission', 'Needs Revision'].map((option) => {
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

            <Text style={styles.rejectInputLabel}>Detailed Feedback (Sent to user)</Text>
            <TextInput
              style={styles.rejectNotesInput}
              value={rejectionNotes}
              onChangeText={setRejectionNotes}
              placeholder="Explain what needs to be changed..."
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
              {['all', 'video', 'article'].map((t) => {
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
              {(() => {
                // Combine publishedItems and queueItems
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
                        By {item.author} • {item.type === 'video' ? 'Video' : 'Article'}
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
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
