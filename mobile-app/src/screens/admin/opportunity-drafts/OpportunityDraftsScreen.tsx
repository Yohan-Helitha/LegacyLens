import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../../theme';
import { styles } from './OpportunityDraftsScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';

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
  location?: string;
  isFeatured?: boolean;
};

export const OpportunityDraftsScreen: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { drafts, setActiveDraftId, setOriginTab } = useOpportunity();
  const [activeTab, setActiveTab] = useState<'drafts' | 'published' | 'removed'>('drafts');

  const [publishedItems, setPublishedItems] = useState<PubItem[]>([
    {
      id: 'pub-1',
      title: 'The Art of Dumbara Weaving',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIiNdt-VSB0jWGt-7CRL4MIiUhjonVrtJhDB-9aYQdTjtMz-pIe22xnhtz5M0PORG1Zu-u85v1RvDzBYNia5fpEfR_8_5DXKGR4R4RI11z466mhGj6n1zC_hA9c8y_Na5ZxJk1rA36-iiyMkVS5qexh7IM0UqryKUjLXeowXBn7Qdc09lcE9DRuAYc74VLLgUliRlMNVCxaER4B1othqYlxUlnxKRU2tlJXZQHoHVEe0ObVK7JN_jm',
      status: 'ACTIVE',
      dateStr: 'Aug 20 - Aug 25',
      participantsInfo: '12/15 Participants',
      location: 'Kandy',
      isFeatured: true,
    },
    {
      id: 'pub-2',
      title: 'Mask Making of Ambalangoda',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0LBwhjBOLd-Wcqs4p1zStS44VLPGjUcfp4P4TOQwYNP8IcKU2NOvjfN2u7iPSwwq5LwEKFZ3lgSZMDptIIcmlYYrqHowVVKkfF-QbneeiXOtrvEJfZTMLHJ_jXxTjmnl9V-mp1qw2iKYY4pMMIxhDMj6oB3uzbTPqtUbXfGGfOjBxzhWbZTEvfYC7OxX5jNXwxABHJve_GGTFA8elNlu6sGabZzo-rcPVVRxqILyrCfD8jjpv1yHh',
      status: 'COMPLETED',
      dateStr: 'Aug 12',
      participantsInfo: '8 participants | 5 documents created',
    },
    {
      id: 'pub-3',
      title: 'Forgotten Rituals of the South',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR4MtorZn99HeGj0ObvehyYSemX22KZrJw0fyyNyOTJd5eSs_XI2kRJEREhjtbuINH_L87ROQkqWQlLRYIBMa63oty8cADm0qhEj0agYXimHxYm92LVUSo1Y7JL5v4uR0PmVsnfBM-GfpWHOSB444VrdNO5E__VNcANuM_VBehwmeZMlKuwquv0lUo58K3fzKw2z2IRDGF0RtJk0-y-BAfzi2MsuazCgyU0gFS3wqBV0rlMf2xMu_G',
      status: 'ACTIVE',
      dateStr: 'Aug 28',
      participantsInfo: '2/5 participants',
    },
    {
      id: 'pub-4',
      title: 'Palm Leaf Manuscripts',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_L5nhlxUO-W9Jq1c98RF-BJWu4WVJqtUikaJunHbaYoJhzZHTHYqd33EPa7cEsvHClgxhIgFyQbxPrd-FCZqcEA_0of3PWR1Tam2NL4U7GeEHzP6_GYtXESDk73QFwqd3NMFyYcQOpKbRskhlaAERh2XTqneyBY4sH4J09aOFLQK8sfdJKsYgOk46jqQAlK_8GvRZiKtwvEIRSb_t0MtKu14Q9QVjFMCRzYYfO55THvKN3oX8TpPP',
      status: 'COMPLETED',
      dateStr: 'July 15',
      participantsInfo: '12 participants',
    }
  ]);

  const [removedItems, setRemovedItems] = useState<PubItem[]>([]);

  const handleAddNew = () => {
    setActiveDraftId(null);
    setOriginTab('drafts');
    onNavigate?.('add_opp');
  };

  const handleEdit = (id: string) => {
    setActiveDraftId(id);
    setOriginTab('drafts');
    onNavigate?.('add_opp');
  };

  const handleRemoveOpportunity = (item: PubItem) => {
    Alert.alert(
      "Remove Opportunity",
      "Are you sure you want to remove this opportunity? It will be moved to the Removed section.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            setPublishedItems(prev => prev.filter(i => i.id !== item.id));
            setRemovedItems(prev => [{ ...item, status: 'REMOVED' }, ...prev]);
          }
        }
      ]
    );
  };

  const { featuredDraft, listDrafts } = useMemo(() => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const sorted = [...drafts].sort((a, b) => new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime());
    
    const featured = sorted.find(d => (now - new Date(d.lastEditedAt).getTime()) < thirtyDaysMs);
    const list = sorted.filter(d => d.id !== featured?.id);
    
    return { featuredDraft: featured, listDrafts: list };
  }, [drafts]);

  const readyCount = drafts.filter(d => d.opportunityTitle && d.coverImage && d.selectedKnowledgeHolder && (d.isFlexibleSchedule || d.scheduleDate)).length;
  const needsMoreCount = drafts.length - readyCount;

  const renderDrafts = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>YOUR WORKSPACE</Text>
      <Text style={styles.sectionTitle}>Stories still in progress</Text>
      <Text style={styles.sectionDesc}>Continue creating opportunities that help preserve local knowledge.</Text>
      <Text style={styles.sectionMeta}>{drafts.length} drafts: {readyCount} ready to publish, {needsMoreCount} need more details</Text>
      
      {featuredDraft && (
        <>
          <Text style={styles.labelHeader}>CONTINUE WHERE YOU LEFT OFF</Text>
          <View style={styles.featuredCard}>
            <View style={styles.featuredImageWrapper}>
              {featuredDraft.coverImage ? (
                <Image source={{ uri: featuredDraft.coverImage }} style={styles.featuredImage} />
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
              <Text style={styles.featuredTitle}>{featuredDraft.opportunityTitle || 'Untitled Opportunity'}</Text>
              <Text style={styles.featuredSub}>
                <MaterialIcons name="location-on" size={14} /> {featuredDraft.locationText} • {featuredDraft.selectedKnowledgeHolder ? 'Holder selected' : 'No holder selected'}
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
                  <MaterialIcons name={featuredDraft.opportunityTitle ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.opportunityTitle ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.opportunityTitle ? styles.checklistText : styles.checklistTextMuted}>Clear title</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.coverImage ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.coverImage ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.coverImage ? styles.checklistText : styles.checklistTextMuted}>Cover image added</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.selectedKnowledgeHolder ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.selectedKnowledgeHolder ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.selectedKnowledgeHolder ? styles.checklistText : styles.checklistTextMuted}>Verified knowledge holder</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.locationText ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.locationText ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.locationText ? styles.checklistText : styles.checklistTextMuted}>Location pinned</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.scheduleDate || featuredDraft.isFlexibleSchedule ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.scheduleDate || featuredDraft.isFlexibleSchedule ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.scheduleDate || featuredDraft.isFlexibleSchedule ? styles.checklistText : styles.checklistTextMuted}>Schedule configured</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.preservationDescription ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.preservationDescription ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.preservationDescription ? styles.checklistText : styles.checklistTextMuted}>Detailed description (Optional)</Text>
                </View>
                <View style={styles.checklistItem}>
                  <MaterialIcons name={featuredDraft.selectedDeliverables?.length > 0 ? "check-circle" : "radio-button-unchecked"} size={18} color={featuredDraft.selectedDeliverables?.length > 0 ? Colors.secondary : Colors.textMuted} />
                  <Text style={featuredDraft.selectedDeliverables?.length > 0 ? styles.checklistText : styles.checklistTextMuted}>Expected deliverables (Optional)</Text>
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
                {draft.coverImage ? (
                  <Image source={{ uri: draft.coverImage }} style={styles.draftImg} />
                ) : (
                  <View style={styles.draftImgPlaceholder}>
                    <MaterialIcons name="image" size={32} color={Colors.textMuted} />
                  </View>
                )}
              </View>
              <View style={styles.draftBody}>
                <View>
                  <Text style={styles.draftTitle} numberOfLines={1}>{draft.opportunityTitle || 'Untitled Opportunity'}</Text>
                  <Text style={styles.draftSub}>{draft.locationText} • {draft.selectedCategory || 'No Category'}</Text>
                  <Text style={styles.draftTime}>{formatTimeAgo(draft.lastEditedAt)}</Text>
                </View>
                <View style={styles.draftBottomRow}>
                  <View style={styles.draftTags}>
                    <View style={draft.selectedKnowledgeHolder ? styles.draftTagCheck : styles.draftTagEmpty}>
                      <Text style={draft.selectedKnowledgeHolder ? styles.draftTagTextCheck : styles.draftTagTextEmpty}>Holder {draft.selectedKnowledgeHolder ? '✓' : '○'}</Text>
                    </View>
                    <View style={draft.scheduleDate || draft.isFlexibleSchedule ? styles.draftTagCheck : styles.draftTagEmpty}>
                      <Text style={draft.scheduleDate || draft.isFlexibleSchedule ? styles.draftTagTextCheck : styles.draftTagTextEmpty}>Sched {draft.scheduleDate || draft.isFlexibleSchedule ? '✓' : '○'}</Text>
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
    } else if (status === 'COMPLETED') {
      return <View style={styles.badgeCompleted}><Text style={styles.badgeCompletedText}>COMPLETED</Text></View>;
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
        <Text style={styles.sectionTitle}>Stories you've shared</Text>
        <Text style={styles.sectionDesc}>You have published {publishedItems.length} opportunities that are actively helping preserve local heritage.</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statPill}><Text style={styles.statPillText}>{publishedItems.length} published</Text></View>
          <Text style={styles.statDot}>•</Text>
          <View style={styles.statPillActive}><Text style={styles.statPillActiveText}>{publishedItems.filter(i => i.status === 'ACTIVE').length} active</Text></View>
          <Text style={styles.statDot}>•</Text>
          <View style={styles.statPill}><Text style={styles.statPillText}>{publishedItems.filter(i => i.status === 'COMPLETED').length} completed</Text></View>
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
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => handleRemoveOpportunity(featured)}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.white} />
                    <Text style={styles.btnPrimaryText}>Manage Opportunity</Text>
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
                  <TouchableOpacity style={styles.pubListActionBtn} onPress={() => handleRemoveOpportunity(item)}>
                    <Text style={styles.pubListActionText}>Manage Opportunity</Text>
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

  const renderRemoved = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>ARCHIVED</Text>
      <Text style={styles.sectionTitle}>Removed Opportunities</Text>
      <Text style={styles.sectionDesc}>These opportunities are no longer visible to the public.</Text>
      
      <View style={{ marginTop: 24 }}>
        {removedItems.length > 0 ? (
          removedItems.map(item => (
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
          ))
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

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate?.('admin_home')}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Opportunities</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleAddNew}>
          <MaterialIcons name="add" size={24} color={Colors.secondary} />
        </TouchableOpacity>
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
