import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './AdminNotificationsScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';
import { moderationApi, ModerationQueueItemResponse } from '../../../services/api/moderationApi';
import { Colors, Typography, Spacing } from '../../../theme';
import { adminNotificationApi, AdminNotificationResponse } from '../../../services/api/adminNotificationApi';

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

export const AdminNotificationsScreen = ({ onBack }: { onBack?: () => void }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { audioSubmissions, refreshAll } = useOpportunity();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshAll();
        const moderationItems = await moderationApi.getQueueItems('PENDING');
        const adminNotifs = await adminNotificationApi.getNotifications();
        
        const generatedNotifications: AppNotification[] = [];
        
        // Add Audio Submissions (Opportunities)
        audioSubmissions.forEach(sub => {
          if (sub.status !== 'FULLY_LISTENED') {
            generatedNotifications.push({
              id: `opp-${sub.id}`,
              originalId: sub.id,
              title: sub.elderName || 'Contributor',
              subtitle: 'Opportunity Intake',
              body: `Submitted a new recording for review.`,
              time: 'Recently',
              timeMs: new Date().getTime(),
              icon: 'mic',
              iconColor: '#004343',
              iconBg: 'rgba(0,67,67,0.1)',
              leftBorderColor: '#004343',
              actionText: 'Listen & Review',
              actionType: 'primary',
              read: false,
              type: 'opportunity'
            });
          }
        });
        
        const adminNotificationItems: AppNotification[] = adminNotifs.map(n => {
          const isOpp = n.type === 'opportunity';
          return {
            id: `${n.type}-${n.id}`,
            originalId: n.id,
            title: n.title,
            subtitle: n.subtitle,
            body: n.body,
            time: new Date(n.createdAt).toLocaleDateString(),
            timeMs: new Date(n.createdAt).getTime(),
            icon: isOpp ? 'mic' : 'flag',
            iconColor: isOpp ? '#004343' : '#9b4600',
            iconBg: isOpp ? 'rgba(0,67,67,0.1)' : 'rgba(254,137,62,0.2)',
            leftBorderColor: isOpp ? '#004343' : '#9b4600',
            actionText: isOpp ? 'Listen & Review' : 'View Details',
            actionType: isOpp ? 'primary' : 'secondary',
            read: n.read,
            type: n.type as 'opportunity' | 'moderation'
          };
        });
        generatedNotifications.push(...adminNotificationItems);
        
        // Add Moderation Items
        moderationItems.forEach((mod: ModerationQueueItemResponse) => {
          generatedNotifications.push({
            id: `mod-${mod.id}`,
            originalId: mod.id,
            title: mod.title || 'Reported Content',
            subtitle: 'Moderation Queue',
            body: `Received a report requiring moderation review.`,
            time: new Date(mod.createdAt).toLocaleDateString(),
            timeMs: new Date(mod.createdAt).getTime(),
            icon: 'flag',
            iconColor: '#9b4600',
            iconBg: 'rgba(254,137,62,0.2)',
            leftBorderColor: '#9b4600',
            actionText: 'View Details',
            actionType: 'secondary',
            read: false,
            type: 'moderation'
          });
        });
        
        // Dummy System Notifications
        generatedNotifications.push({
          id: `sys-1`,
          originalId: 'sys-1',
          title: 'Elder Verification',
          subtitle: 'System',
          body: 'Pending credential review for 2 new elder accounts.',
          time: '1d ago',
          timeMs: new Date().getTime() - 86400000,
          icon: 'verified',
          iconColor: '#004343',
          iconBg: 'rgba(0,67,67,0.1)',
          leftBorderColor: '#004343',
          actionText: 'Verify Credentials',
          actionType: 'primary',
          read: true,
          type: 'system'
        });
        
        setNotifications(generatedNotifications.sort((a, b) => b.timeMs - a.timeMs));
        setNotifications(generatedNotifications);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [audioSubmissions.length]);

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
          <TouchableOpacity style={n.actionType === 'primary' ? styles.btnPrimary : styles.btnSecondary} activeOpacity={0.8}>
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

