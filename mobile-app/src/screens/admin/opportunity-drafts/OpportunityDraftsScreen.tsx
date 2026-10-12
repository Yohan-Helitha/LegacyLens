import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../../theme';
import { styles } from './OpportunityDraftsScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';
import { adminOpportunityApi } from '../../../services/api/opportunityApi';
import { AdminOpportunityResponse } from '../../../types/opportunity';

const formatTimeAgo = (isoString: string) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Last edited today';
  if (days === 1) return 'Last edited yesterday';
  return `Last edited ${days} days ago`;
};

type PubItem = {
  id: string;
  title: string;
  image: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REMOVED';
  dateStr: string;
  participantsInfo: string;
  location?: string | null;
  isFeatured?: boolean;
};

const toPubItem = (opp: AdminOpportunityResponse): PubItem => ({
  id: opp.id,
  title: opp.title,
  image: opp.heroImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP68zF6Gx2bvH0fVStHJXGnBk5k_zSJg9JGpVV_809FYAbsWYy07BPZju5VzHAh0a3DsWveaJuEjyGZZuqsEJK63MJTxJ8oCdRaLzuOqiEPkZjrQZbSry6dS7t3kk18Z23_FVbDtwh1ltzKXc_ucCq8Q6epXt5apHZzXR6wBeAoHsvijSJzyy7b_DOS2II3W_dmHBW_4KryJA7_7PDvzAoPgp4ylZTV3AZjsRq8m_Cc_xV9mRXNloj',
  status: opp.status === 'PUBLISHED' ? 'ACTIVE' : opp.status === 'COMPLETED' ? 'COMPLETED' : 'REMOVED',
  dateStr: opp.scheduledDate ? String(opp.scheduledDate) : (opp.createdAt ? opp.createdAt.split(' ')[0] : ''),
  participantsInfo: opp.offeredAmount ? `LKR ${opp.offeredAmount}` : 'No amount set',
  location: opp.location,
  isFeatured: false,
});

const toDraftItem = (opp: AdminOpportunityResponse) => ({
  id: opp.id,
  title: opp.title,
  image: opp.heroImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP68zF6Gx2bvH0fVStHJXGnBk5k_zSJg9JGpVV_809FYAbsWYy07BPZju5VzHAh0a3DsWveaJuEjyGZZuqsEJK63MJTxJ8oCdRaLzuOqiEPkZjrQZbSry6dS7t3kk18Z23_FVbDtwh1ltzKXc_ucCq8Q6epXt5apHZzXR6wBeAoHsvijSJzyy7b_DOS2II3W_dmHBW_4KryJA7_7PDvzAoPgp4ylZTV3AZjsRq8m_Cc_xV9mRXNloj',
  category: opp.category || 'No Category',
  locationText: opp.location || 'Unknown',
  elderName: opp.elderName || 'Unknown',
  lastEditedAt: opp.updatedAt || opp.createdAt,
  description: opp.description || '',
});

export const OpportunityDraftsScreen: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { drafts, setActiveDraftId, setOriginTab, draftOpportunities, publishedOpportunities, closedOpportunities, refreshAll } = useOpportunity();
  const [activeTab, setActiveTab] = useState<'drafts' | 'published' | 'removed'>('drafts');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    refreshAll();
  }, [activeTab, refreshAll]);

  const combinedDrafts = useMemo(() => {
    const apiDrafts = draftOpportunities.map(toDraftItem);
    const localDrafts = drafts.map(d => ({
      id: d.id,
      title: d.opportunityTitle,
      image: d.coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP68zF6Gx2bvH0fVStHJXGnBk5k_zSJg9JGpVV_809FYAbsWYy07BPZju5VzHAh0a3DsWveaJuEjyGZZuqsEJK63MJTxJ8oCdRaLzuOqiEPkZjrQZbSry6dS7t3kk18Z23_FVbDtwh1ltzKXc_ucCq8Q6epXt5apHZzXR6wBeAoHsvijSJzyy7b_DOS2II3W_dmHBW_4KryJA7_7PDvzAoPgp4ylZTV3AZjsRq8m_Cc_xV9mRXNloj',
      category: d.selectedCategory || 'No Category',
      locationText: d.locationText || 'Unknown',
      elderName: d.selectedKnowledgeHolder ? 'Selected' : '',
      lastEditedAt: d.lastEditedAt,
      description: d.preservationDescription || '',
    }));
    return [...localDrafts, ...apiDrafts];
  }, [draftOpportunities, drafts]);

  const publishedItems = useMemo(() => publishedOpportunities.map(toPubItem), [publishedOpportunities]);
  const removedItems = useMemo(() => closedOpportunities.map(toPubItem), [closedOpportunities]);


  const handleEdit = (id: string) => {
    setActiveDraftId(id);
    setOriginTab('drafts');
    onNavigate?.('add_opp');
  };

  const handleRemoveOpportunity = async (item: PubItem) => {
    Alert.alert(
      "Remove Opportunity",
      "Are you sure you want to remove this opportunity? It will be moved to the Removed section.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(item.id);
            try {
              await adminOpportunityApi.updateOpportunityStatus(item.id, 'CLOSED');
              await refreshAll();
            } catch (e) {
              console.error('Failed to remove opportunity', e);
            } finally {
              setRemovingId(null);
            }
          }
        }
      ]
    );
  };

  const { featuredDraft, listDrafts } = useMemo(() => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const sorted = [...combinedDrafts].sort((a, b) => new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime());

    const featured = sorted.find(d => (now - new Date(d.lastEditedAt).getTime()) < thirtyDaysMs);
    const list = sorted.filter(d => d.id !== featured?.id);

    return { featuredDraft: featured, listDrafts: list };
  }, [combinedDrafts]);

  const readyCount = combinedDrafts.filter(d => d.title && d.image).length;
  const needsMoreCount = combinedDrafts.length - readyCount;

  const renderDrafts = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>YOUR WORKSPACE</Text>
      <Text style={styles.sectionTitle}>Opportunities still in progress</Text>
      <Text style={styles.sectionDesc}>Continue creating opportunities that help preserve local knowledge.</Text>
      <Text style={styles.sectionMeta}>{combinedDrafts.length} drafts: {readyCount} ready to publish, {needsMoreCount} need more details</Text>

      {featuredDraft && (
        <>
          <Text style={styles.labelHeader}>CONTINUE WHERE YOU LEFT OFF</Text>
          <View style={styles.featuredCard}>
            <View style={styles.featuredImageWrapper}>
              {featuredDraft.image || featuredDraft.image ? (
                <Image source={{ uri: featuredDraft.image || featuredDraft.image }} style={styles.featuredImage} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="image" size={48} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.featuredTag}>
                <MaterialIcons name="edit-document" size={14} color={Colors.secondary} />
                <Text style={styles.featuredTagText}>Draft</Text>
              </View>
            </View>
            <View style={styles.featuredBody}>
              <Text style={styles.featuredTitle}>{featuredDraft.title || 'Untitled Opportunity'}</Text>
              <Text style={styles.featuredSub}>
                <MaterialIcons name="location-on" size={14} /> {featuredDraft.locationText} • {featuredDraft.elderName ? 'Holder selected' : 'No holder selected'}
              </Text>
              <Text style={styles.featuredTime}>{formatTimeAgo(featuredDraft.lastEditedAt)}</Text>

              <View style={styles.qualityRow}>
                <Text style={styles.qualityLabel}>Opportunity quality</Text>
                <Text style={styles.qualityPercent}>57%</Text>
              </View>
              <View style={styles.qualityBarBg}>
                <View style={[styles.qualityBarFill, { width: '57%' }]} />
              </View>

              <View style={styles.checklist}>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.title ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.title ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.title ? styles.checklistText : styles.checklistTextMuted}>Clear title</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={(featuredDraft.image || featuredDraft.image) ? "check-circle" : "radio-button-unchecked"} size={18} color={(featuredDraft.image || featuredDraft.image) ? Colors.secondary : Colors.textMuted} />
                  <Text style={(featuredDraft.image || featuredDraft.image) ? styles.checklistText : styles.checklistTextMuted}>Cover image added</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.elderName ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.elderName ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.elderName ? styles.checklistText : styles.checklistTextMuted}>Verified knowledge holder</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.locationText ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.locationText ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.locationText ? styles.checklistText : styles.checklistTextMuted}>Location pinned</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={(featuredDraft.description) ? "check-circle" : "radio-button-unchecked"} size={18} color={(featuredDraft.description) ? Colors.secondary : Colors.textMuted} />
                  <Text style={(featuredDraft.description) ? styles.checklistText : styles.checklistTextMuted}>Schedule configured</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={(featuredDraft.description) ? "check-circle" : "radio-button-unchecked"} size={18} color={(featuredDraft.description) ? Colors.secondary : Colors.textMuted} />
                  <Text style={(featuredDraft.description) ? styles.checklistText : styles.checklistTextMuted}>Detailed description (Optional)</Text>
                </View>
              </View>
              <Text style={styles.checklistHint}>Review your checklist to improve opportunity quality.</Text>

              <View style={styles.featuredActions}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => handleEdit(featuredDraft.id)}>
                  <Text style={styles.btnPrimaryText}>Continue Editing</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {listDrafts.length > 0 && (
        <>
          <Text style={styles.listHeader}>{featuredDraft ? 'All drafts' : 'Older drafts'}</Text>

          {listDrafts.map(draft => (
            <View key={draft.id} style={styles.draftItem}>
              <View style={styles.draftImgWrapper}>
                {draft.image ? (
                  <Image source={{ uri: draft.image }} style={styles.draftImg} />
                ) : (
                  <View style={styles.draftImgPlaceholder}>
                    <MaterialIcons name="image" size={32} color={Colors.textMuted} />
                  </View>
                )}
              </View>
              <View style={styles.draftBody}>
                <View>
                  <Text style={styles.draftTitle} numberOfLines={1}>{draft.title || 'Untitled Opportunity'}</Text>
                  <Text style={styles.draftSub}>{draft.locationText} • {draft.category || 'No Category'}</Text>
                  <Text style={styles.draftTime}>{formatTimeAgo(draft.lastEditedAt)}</Text>
                </View>
                <View style={styles.draftBottomRow}>
                  <View style={styles.draftTags}>
                    <View style={styles.draftTagCheck}>
                      <Text style={styles.draftTagTextCheck}>Holder {draft.elderName ? '✓' : '○'}</Text>
                    </View>
                    <View style={styles.draftTagCheck}>
                      <Text style={styles.draftTagTextCheck}>Sched {draft.description ? '✓' : '○'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(draft.id)}>
                    <Text style={styles.continueBtn}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return <View style={styles.badgeActiveSmall}><Text style={styles.badgeActiveSmallText}>ACTIVE</Text></View>;
    } else if (status === 'REMOVED') {
      return <View style={styles.badgeRemoved}><Text style={styles.badgeRemovedText}>REMOVED</Text></View>;
    }
    return null;
  };

  const renderPublished = () => {
    const featured = publishedItems.find(i => i.isFeatured);
    const list = publishedItems.filter(i => !i.isFeatured);

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>YOUR IMPACT</Text>
        <Text style={styles.sectionTitle}>Opportunities you've shared</Text>
        <Text style={styles.sectionDesc}>You have published {publishedItems.length} opportunities that are actively helping preserve local heritage.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}><Text style={styles.statPillText}>{publishedItems.length} published</Text></View>
          <Text style={styles.statDot}>•</Text>
          <View style={styles.statPillActive}><Text style={styles.statPillActiveText}>{publishedItems.filter(i => i.status === 'ACTIVE').length} active</Text></View>
        </View>

        {featured && (
          <>
            <Text style={[styles.labelHeader, { marginTop: 32 }]}>FEATURED ACTIVE OPPORTUNITY</Text>
            <View style={styles.featuredCard}>
              <View style={styles.featuredImageWrapper}>
                <Image source={{ uri: featured.image }} style={styles.featuredImage} />
                <View style={styles.badgeActive}>
                  <View style={styles.badgeActiveDot} />
                  <Text style={styles.badgeActiveText}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.featuredBody}>
                <Text style={styles.pubFeaturedTitle}>{featured.title}</Text>
                <View style={styles.pubFeaturedMeta}>
                  <View style={styles.pubFeaturedMetaItem}>
                    <MaterialIcons name="location-on" size={16} color={Colors.textMuted} />
                    <Text style={{ fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted }}>{featured.location || 'Location'}</Text>
                  </View>
                  <View style={styles.pubFeaturedMetaItem}>
                    <MaterialIcons name="event" size={16} color={Colors.textMuted} />
                    <Text style={{ fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted }}>{featured.dateStr}</Text>
                  </View>
                </View>

                <View style={styles.pubStatsBox}>
                  <View style={styles.pubStatsHeader}>
                    <View style={styles.pubStatsPartic}>
                      <MaterialIcons name="group" size={18} color={Colors.secondary} />
                      <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text }}>{featured.participantsInfo}</Text>
                    </View>
                    <View>
                      <Text style={styles.pubStatsReachNum}>4,200</Text>
                      <Text style={styles.pubStatsReach}>Reach</Text>
                    </View>
                  </View>
                  <View style={styles.qualityBarBg}>
                    <View style={[styles.qualityBarFill, { width: '80%', backgroundColor: Colors.secondary }]} />
                  </View>
                </View>

                <View style={styles.featuredActions}>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => handleRemoveOpportunity(featured)} disabled={removingId === featured.id}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.white} />
                    <Text style={styles.btnPrimaryText}>{removingId === featured.id ? 'Removing...' : 'Manage Opportunity'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        {list.length > 0 && (
          <>
            <Text style={styles.listHeader}>All Published</Text>
            {list.map(item => (
              <View key={item.id} style={styles.pubListItem}>
                <Image source={{ uri: item.image }} style={styles.pubListImg} />
                <View style={styles.pubListContent}>
                  <View>
                    <View style={styles.pubListHeader}>
                      <Text style={styles.pubListTitle} numberOfLines={2}>{item.title}</Text>
                      {renderBadge(item.status)}
                    </View>
                    <View style={styles.pubListDate}>
                      <MaterialIcons name="event" size={14} color={Colors.textMuted} />
                      <Text style={styles.pubListDateText}>{item.dateStr}</Text>
                    </View>
                    <Text style={styles.pubListSub}>{item.participantsInfo}</Text>
                  </View>
                  <TouchableOpacity style={styles.pubListActionBtn} onPress={() => handleRemoveOpportunity(item)} disabled={removingId === item.id}>
                    <Text style={styles.pubListActionText}>{removingId === item.id ? 'Removing...' : 'Manage Opportunity'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderRemoved = () => {
    const featured = removedItems.find(i => i.isFeatured);
    const list = removedItems.filter(i => !i.isFeatured);

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>ARCHIVED</Text>
        <Text style={styles.sectionTitle}>Removed Opportunities</Text>
        <Text style={styles.sectionDesc}>These opportunities are no longer visible to the public.</Text>

        <View style={{ marginTop: 24 }}>
          {removedItems.length > 0 ? (
            <>
              {featured && (
                <View style={styles.featuredCard}>
                  <View style={styles.featuredImageWrapper}>
                    <Image source={{ uri: featured.image }} style={styles.featuredImage} />
                    <View style={styles.badgeRemoved}>
                      <Text style={styles.badgeRemovedText}>REMOVED</Text>
                    </View>
                  </View>
                  <View style={styles.featuredBody}>
                    <Text style={styles.pubFeaturedTitle}>{featured.title}</Text>
                    <View style={styles.pubFeaturedMeta}>
                      <View style={styles.pubFeaturedMetaItem}>
                        <MaterialIcons name="location-on" size={16} color={Colors.textMuted} />
                        <Text style={{ fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted }}>{featured.location || 'Location'}</Text>
                      </View>
                      <View style={styles.pubFeaturedMetaItem}>
                        <MaterialIcons name="event" size={16} color={Colors.textMuted} />
                        <Text style={{ fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted }}>{featured.dateStr}</Text>
                      </View>
                    </View>
                    <Text style={styles.pubListSub}>{featured.participantsInfo}</Text>
                  </View>
                </View>
              )}
              {list.map(item => (
                <View key={item.id} style={styles.pubListItem}>
                  <Image source={{ uri: item.image }} style={styles.pubListImg} />
                  <View style={styles.pubListContent}>
                    <View>
                      <View style={styles.pubListHeader}>
                        <Text style={styles.pubListTitle} numberOfLines={2}>{item.title}</Text>
                        {renderBadge(item.status)}
                      </View>
                      <View style={styles.pubListDate}>
                        <MaterialIcons name="event" size={14} color={Colors.textMuted} />
                        <Text style={styles.pubListDateText}>{item.dateStr}</Text>
                      </View>
                      <Text style={styles.pubListSub}>{item.participantsInfo}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12 }}>
              <MaterialIcons name="inventory-2" size={48} color={Colors.textMuted} />
              <Text style={{ marginTop: 12, fontFamily: Typography.fontBodyMed, color: Colors.textMuted }}>No removed opportunities</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.iconBtn, styles.backBtn]} onPress={() => onNavigate?.('admin_home')}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Opportunities</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'drafts' ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab('drafts')}
        >
          <Text style={activeTab === 'drafts' ? styles.tabTextActive : styles.tabTextInactive}>Drafts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'published' ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={activeTab === 'published' ? styles.tabTextActive : styles.tabTextInactive}>Published</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'removed' ? styles.tabActive : styles.tabInactive]}
          onPress={() => setActiveTab('removed')}
        >
          <Text style={activeTab === 'removed' ? styles.tabTextActive : styles.tabTextInactive}>Removed</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'drafts' && renderDrafts()}
      {activeTab === 'published' && renderPublished()}
      {activeTab === 'removed' && renderRemoved()}
    </View>
  );
};
