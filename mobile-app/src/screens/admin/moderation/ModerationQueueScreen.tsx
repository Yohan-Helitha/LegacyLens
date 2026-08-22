import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './ModerationQueueScreen.styles';

type Tab = 'review' | 'archived';
type ViewState = 'list' | 'review_detail';

export const ModerationQueueScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('review');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'review' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('review')}
          >
            <Text style={[styles.segmentText, activeTab === 'review' && styles.segmentTextActive]}>Review Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'archived' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('archived')}
          >
            <Text style={[styles.segmentText, activeTab === 'archived' && styles.segmentTextActive]}>Archived Content</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'review' ? renderReviewQueue() : renderArchivedQueue()}
      </ScrollView>

      {/* FAB for Archived Tab */}
      {activeTab === 'archived' && (
        <TouchableOpacity style={styles.fab}>
          <MaterialIcons name="add" size={24} color="#672c00" />
          <Text style={styles.fabText}>Archive New</Text>
        </TouchableOpacity>
      )}

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
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={() => setShowRestoreModal(false)}>
                <Text style={styles.modalBtnConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderReviewQueue = () => (
    <View style={styles.queueContainer}>
      {/* Review Card 1 */}
      <TouchableOpacity style={styles.reviewCard} activeOpacity={0.8} onPress={() => setViewState('review_detail')}>
        <View style={styles.reviewImgBox}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiU4M7TKJ8SywceJc_v2uBr9lBdAWZY3foF-U7xwE0PZp4HcVxcKCpeczRUmMto4DH3NGNGzQlqkuRIOc_qF6lPMafDffijQ58uGW1XBHKME2L_R__8NPzsVTfqj-MqX2bGLPMlOWwLV53rLBDDmubH3NFy7K_V0DJv-iXJ9pqix5z_0LWaYFlMoxB3SmqixdFm5UOnRJGJxqxk-kGxbHeUtEC39ZmUiuyegTgdIEI2D1HNdULgZzl' }} style={styles.fullImg} />
          <View style={styles.playOverlay}>
            <MaterialIcons name="play-circle" size={32} color={Colors.white} />
          </View>
        </View>
        <View style={styles.reviewCardBody}>
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>The Kandy Perahera</Text>
              <View style={styles.pendingBadge}>
                <MaterialIcons name="schedule" size={14} color={Colors.textMuted} />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.cardDesc} numberOfLines={2}>An incredible look at the traditional dance, drumming, and majestic elephants that make up one of Sri Lanka's most famous cultural festivals.</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.cardTagsRow}>
              <View style={styles.elderTag}><Text style={styles.elderTagText}>Elder Tag</Text></View>
              <View style={styles.rowCenter}><MaterialIcons name="person" size={14} color={Colors.textMuted} /><Text style={styles.metaText}> Sunil Perera</Text></View>
              <Text style={styles.metaTextMuted}>• 2h ago</Text>
            </View>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity style={styles.rejectBtn}><Text style={styles.rejectBtnText}>Reject</Text></TouchableOpacity>
              <TouchableOpacity style={styles.publishBtn}><Text style={styles.publishBtnText}>Publish</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Review Card 2 */}
      <TouchableOpacity style={styles.reviewCard} activeOpacity={0.8} onPress={() => setViewState('review_detail')}>
        <View style={styles.reviewImgBox}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDux_unKhgQoX94K9rhlnGT6AR9X41j3lM480DfbajmgpYFUnVvN90Ziz1WGbxXBJQopvAhBzZOkdt6bKKZ_PO1JcljAZXKLoX_jsRQ6ggRqkOgR-g8GBl-XFEkZw4edBKLaTdWAevysxyB-UOeEy3ObWPmAVwZT5_S3DYDlPPzg2aGvGkO2sdxUibCsGn3DVo1JYxPF9Yzci50SdtOM00mfjtxo4XGIPD3G5NdHd0_8sZE70On0ge6' }} style={styles.fullImg} />
        </View>
        <View style={styles.reviewCardBody}>
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Traditional Herbs</Text>
              <View style={styles.pendingBadge}>
                <MaterialIcons name="schedule" size={14} color={Colors.textMuted} />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.cardDesc} numberOfLines={2}>Exploring the medicinal properties and historical uses of local flora in everyday rural life and holistic health practices.</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.cardTagsRow}>
              <View style={styles.articleTag}><MaterialIcons name="article" size={12} color={Colors.textMuted} /><Text style={styles.articleTagText}> Article</Text></View>
              <View style={styles.rowCenter}><MaterialIcons name="person" size={14} color={Colors.textMuted} /><Text style={styles.metaText}> Nuwani D.</Text></View>
              <Text style={styles.metaTextMuted}>• 4h ago</Text>
            </View>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity style={styles.rejectBtn}><Text style={styles.rejectBtnText}>Reject</Text></TouchableOpacity>
              <TouchableOpacity style={styles.publishBtn}><Text style={styles.publishBtnText}>Publish</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderArchivedQueue = () => (
    <View style={styles.queueContainer}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search archived content" placeholderTextColor={Colors.textMuted} />
      </View>
      
      <View style={styles.gridContainer}>
        {/* Archive Card 1 */}
        <View style={styles.archiveCard}>
          <View style={styles.rowBetween}>
            <View style={styles.archiveCategoryTag}><Text style={styles.archiveCategoryTagText}>History</Text></View>
            <TouchableOpacity onPress={() => setShowRestoreModal(true)}><MaterialIcons name="more-vert" size={20} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <Text style={styles.cardTitle}>Ancient Irrigation</Text>
          <Text style={styles.cardDesc} numberOfLines={3}>A detailed look at the complex hydrological engineering systems developed during the Anuradhapura era, showcasing massive reservoirs and subtle gradients.</Text>
          <View style={styles.archiveFooter}>
            <MaterialIcons name="archive" size={14} color={Colors.textMuted} />
            <Text style={styles.metaTextMuted}> Archived 2 days ago</Text>
          </View>
        </View>

        {/* Archive Card 2 */}
        <View style={[styles.archiveCard, { opacity: 0.7 }]}>
          <View style={styles.rowBetween}>
            <View style={styles.archiveCategoryTag}><Text style={styles.archiveCategoryTagText}>Arts</Text></View>
            <TouchableOpacity><MaterialIcons name="more-vert" size={20} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <Text style={styles.cardTitle}>Folk Songs (Jana Kavi)</Text>
          <Text style={styles.cardDesc} numberOfLines={3}>Collection of traditional verses sung during agricultural activities, reflecting the cultural mindset and daily rhythms of ancient farming communities.</Text>
          <View style={styles.archiveFooter}>
            <MaterialIcons name="archive" size={14} color={Colors.textMuted} />
            <Text style={styles.metaTextMuted}> Archived 1 week ago</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── DETAIL VIEW (Content Review) ───────────────────────────────────────────────
  const renderDetailView = () => (
    <View style={styles.flex1}>
      <View style={[styles.rowBetween, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center' }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setViewState('list')}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveDraftBtn}>
          <Text style={styles.saveDraftBtnText}>Save Draft</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailIntro}>
          <Text style={styles.pageTitle}>Content Review</Text>
          <Text style={styles.pageSubtitle}>Review the submission below before publishing to the main feed.</Text>
        </View>

        {/* Video Player */}
        <View style={styles.videoPlayerContainer}>
          <ImageBackground source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzWKJNXnYwVZ4XRj8wqwJ81qOH7Kf7rBe4W1oYuDSw882hTglQFIGW_Qay70gl9l-wCOvTRqkCWwQ0UgZg7VYbTBVi2pMQQdviqgoeYArv4hx12H0cOOi_DaEEgXU8_wnMziPMGdoxI6xYa4xuD6x7yj1Z-9mm2qFYMpz4cC9-xesWGKooWUSDXPYR2x-ywYWZbbDQ4qvRApMqSiWhQx_fSBm_g69WVWTywuXHYl6Y-Vjl0tQG2PzB' }} style={styles.videoBg}>
            <View style={styles.videoOverlay}>
              <View style={styles.playCircle}>
                <MaterialIcons name="play-arrow" size={32} color={Colors.secondary} />
              </View>
            </View>
            {/* Progress Bar Mock */}
            <View style={styles.videoProgressBarBg}>
              <View style={styles.videoProgressBarFill} />
            </View>
          </ImageBackground>
        </View>

        {/* Submitter Info */}
        <View style={styles.submitterCard}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw8_8bd1MoyfJOKvJlrxTI2jRbmuJbNjnMKw6zNr3QdMvvsfVqB6AXP74y7Ou5vKdO6sHAW129RAum1ATnF-2q5QtvTGrE3gGsHEANkAIOd1Mp04HlJxImdYnEtvYPfYnrGnQnL8oaKr3BsyMvpR4gGAMkr4qd_MFsWeYOaHtLlRLVSdUlfU_s0rLEGIGxZT7An4nSkXePTOC2uVGXDcRVRIiyPPuPYD4GJC8F4t7RGWdO9hT0vQp_' }} style={styles.submitterAvatar} />
          <View>
            <Text style={styles.submitterName}>Mrs. Kamala Wijesinghe</Text>
            <View style={styles.verifiedTag}>
              <MaterialIcons name="verified" size={14} color="#0f5c5c" />
              <Text style={styles.verifiedTagText}>Verified Elder</Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color="#fe893e" />
          <Text style={styles.infoBannerText}>Elder submission — will be auto-tagged on approval.</Text>
        </View>

        {/* Guideline Checklist */}
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
              <View style={styles.checkItem}>
                <View style={styles.checkboxDone}><MaterialIcons name="check" size={16} color={Colors.secondary} /></View>
                <Text style={styles.checkItemText}>No hate speech or harmful content</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkboxDone}><MaterialIcons name="check" size={16} color={Colors.secondary} /></View>
                <Text style={styles.checkItemText}>Culturally accurate and respectful</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkboxDone}><MaterialIcons name="check" size={16} color={Colors.secondary} /></View>
                <Text style={styles.checkItemText}>High quality audio and clear visuals</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnReject} onPress={() => setViewState('list')}>
          <Text style={styles.btnRejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPublish} onPress={() => setViewState('list')}>
          <Text style={styles.btnPublishText}>Publish to Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      {viewState === 'list' ? renderListView() : renderDetailView()}
    </View>
  );
};


