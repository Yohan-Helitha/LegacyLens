import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './AdminNotificationsScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';
import { Colors, Typography, Spacing } from '../../../theme';
import { adminNotificationApi, AdminNotificationResponse } from '../../../services/api/adminNotificationApi';
import { moderationApi } from '../../../services/api/moderationApi';

type AppNotification = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  time: string;
  timeMs: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  leftBorderColor: string;
  actionText: string;
  actionType: 'primary' | 'secondary';
  read: boolean;
  type: 'opportunity' | 'moderation' | 'system';
  originalId: string;
};

export const AdminNotificationsScreen = ({ onBack, onNavigate }: { onBack?: () => void, onNavigate?: (tab: string, item?: any) => void }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { audioSubmissions, refreshAll } = useOpportunity();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshAll();

        let adminNotifs: any[] = [];
        try {
          adminNotifs = await adminNotificationApi.getNotifications();
        } catch (apiErr) {
          console.warn('Backend notifications endpoint error, using state fallback:', apiErr);
        }

        const generatedNotifications: AppNotification[] = [];
        const seenIds = new Set<string>();

        // 1. Existing backend notifications
        (adminNotifs || [])
          .filter((n: any) => n.type === 'opportunity' || n.type === 'moderation')
          .forEach((n: any) => {
            const isOpp = n.type === 'opportunity';
            seenIds.add(n.id);
            seenIds.add(`${n.type}-${n.id}`);
            generatedNotifications.push({
              id: `${n.type}-${n.id}`,
              originalId: n.id,
              title: n.title,
              subtitle: n.subtitle,
              body: n.body,
              time: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent',
              timeMs: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
              icon: isOpp ? 'mic' : 'flag',
              iconColor: isOpp ? '#004343' : '#9b4600',
              iconBg: isOpp ? 'rgba(0,67,67,0.1)' : 'rgba(254,137,62,0.2)',
              leftBorderColor: isOpp ? '#004343' : '#9b4600',
              actionText: isOpp ? 'Listen & Review' : 'View Details',
              actionType: isOpp ? 'primary' : 'secondary',
              read: Boolean(n.read),
              type: n.type as 'opportunity' | 'moderation',
            });
          });

        // 2. Audio Submissions for Opportunities (Opportunity Intake Queue)
        (audioSubmissions || []).forEach((audio) => {
          if (!seenIds.has(audio.id) && !seenIds.has(`opportunity-${audio.id}`)) {
            seenIds.add(audio.id);
            const isFullyListened = audio.status === 'FULLY_LISTENED';
            generatedNotifications.push({
              id: `opportunity-${audio.id}`,
              originalId: audio.id,
              title: `Audio Submission: ${audio.elderName || 'Cultural Custodian'}`,
              subtitle: `Opportunity Intake • ${audio.topic || 'Cultural Practice'}`,
              body: `New audio recording awaiting transcription and review from ${audio.location || 'Sri Lanka'}.`,
              time: audio.recordedAt ? audio.recordedAt.split(' ')[0] : 'Recent',
              timeMs: audio.recordedAt ? new Date(audio.recordedAt.replace(' ', 'T')).getTime() || Date.now() : Date.now(),
              icon: 'mic',
              iconColor: '#004343',
              iconBg: 'rgba(0,67,67,0.1)',
              leftBorderColor: '#004343',
              actionText: 'Listen & Review',
              actionType: 'primary',
              read: isFullyListened,
              type: 'opportunity',
            });
          }
        });

        // 3. Moderation Queue items (Stories pending approval or flagged)
        try {
          const modItems = await moderationApi.getQueueItems('ALL');
          (modItems || []).forEach((m) => {
            if (!seenIds.has(m.id) && !seenIds.has(`moderation-${m.id}`)) {
              seenIds.add(m.id);
              const isPending = m.status === 'PENDING' || m.status === 'REPORTED';
              generatedNotifications.push({
                id: `moderation-${m.id}`,
                originalId: m.id,
                title: m.title || 'Reported Cultural Content',
                subtitle: `Moderation Queue • ${m.authorName || 'Contributor'}`,
                body: m.description || 'Community story submitted for cultural authenticity review and verification.',
                time: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent',
                timeMs: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
                icon: 'flag',
                iconColor: '#9b4600',
                iconBg: 'rgba(254,137,62,0.2)',
                leftBorderColor: '#9b4600',
                actionText: 'Review Story',
                actionType: 'secondary',
                read: !isPending,
                type: 'moderation',
              });
            }
          });
        } catch (modErr) {
          console.warn('Could not fetch moderation items for notifications:', modErr);
        }

        setNotifications(generatedNotifications.sort((a, b) => b.timeMs - a.timeMs));
      } catch (err) {
        console.error('Failed to load admin notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [audioSubmissions]);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const handleMarkAllRead = async () => {
    try {
      await adminNotificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (n: AppNotification) => {
    if (!n.read && n.type !== 'system') {
      try {
        await adminNotificationApi.markAsRead(n.type, n.originalId);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
      } catch (err) {
        console.error(err);
      }
    }
    
    // Navigate to the respective screen
    if (onNavigate) {
      if (n.type === 'opportunity') {
        onNavigate('intake', n.originalId);
      } else if (n.type === 'moderation') {
        onNavigate('review', n.originalId);
      }
    }
  };

  const renderNotification = (n: AppNotification) => {
    return (
      <View key={n.id} style={[styles.card, n.read && { opacity: 0.7 }]}>
        <View style={[styles.cardLeftBorder, { backgroundColor: n.leftBorderColor }]} />
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconBox, { backgroundColor: n.iconBg }]}>
              <MaterialIcons name={n.icon as any} size={20} color={n.iconColor} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{n.title}</Text>
              <Text style={[styles.cardSubtitle, { color: n.type === 'moderation' ? '#9b4600' : '#3F4948', fontWeight: n.type === 'moderation' ? '500' : '400' }]}>{n.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.cardTime}>{n.time}</Text>
        </View>
        <Text style={styles.cardBody}>{n.body}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={n.actionType === 'primary' ? styles.btnPrimary : styles.btnSecondary} 
            activeOpacity={0.8}
            onPress={() => handleAction(n)}
          >
            {n.icon === 'mic' && <MaterialIcons name="play-arrow" size={18} color={Colors.white} style={{ marginRight: 4 }} />}
            <Text style={n.actionType === 'primary' ? styles.btnPrimaryText : styles.btnSecondaryText}>{n.actionText}</Text>
            {n.actionType === 'secondary' && <MaterialIcons name="arrow-forward" size={16} color="#202426" style={{ marginLeft: 4 }} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badgeNew}>
              <Text style={styles.badgeNewText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color="#004343" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <TouchableOpacity 
              style={filter === 'all' ? styles.filterBtnActive : styles.filterBtnInactive}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={filter === 'all' ? styles.filterBtnActiveText : styles.filterBtnInactiveText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={filter === 'unread' ? styles.filterBtnActive : styles.filterBtnInactive}
              onPress={() => setFilter('unread')}
              activeOpacity={0.7}
            >
              <Text style={filter === 'unread' ? styles.filterBtnActiveText : styles.filterBtnInactiveText}>Unread</Text>
              {unreadCount > 0 && filter !== 'unread' && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.markReadBtn} activeOpacity={0.7} onPress={handleMarkAllRead}>
            <MaterialIcons name="done-all" size={18} color="#004343" />
            <Text style={styles.markReadText}>Mark read</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          {displayedNotifications.length === 0 ? (
            <Text style={{ fontFamily: Typography.fontBody, color: Colors.textMuted, marginTop: Spacing.md }}>No notifications to display.</Text>
          ) : (
            displayedNotifications.map(renderNotification)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminNotificationsScreen;



