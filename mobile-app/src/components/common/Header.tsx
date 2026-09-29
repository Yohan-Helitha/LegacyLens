import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../theme';

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  onNavigate?: (tab: string) => void;
  /** Screen-reader labels — English defaults, override on localized screens. */
  menuLabel?: string;
  backLabel?: string;
  notificationLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Legacy Lens', 
  onMenuPress, 
  onNotificationPress,
  showBack = false,
  onBackPress,
  onNavigate,
  menuLabel = 'Open menu',
  backLabel = 'Go back',
  notificationLabel = 'Notifications',
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setSidebarVisible(true);
    }
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.leftSection}>
            {showBack ? (
              <TouchableOpacity onPress={onBackPress} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={backLabel}>
                <MaterialIcons name="arrow-back" size={28} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleMenuPress} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={menuLabel}>
                <MaterialIcons name="menu" size={28} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.centerSection}>
            <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>{title}</Text>
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={notificationLabel}>
              <MaterialIcons name="notifications-none" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={sidebarVisible} animationType="fade" transparent={true}>
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebarContent}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Legacy Lens</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sidebarMenu}>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setSidebarVisible(false); onNavigate?.('admin_home'); }}>
                <MaterialIcons name="admin-panel-settings" size={20} color={Colors.secondary} />
                <Text style={styles.sidebarLinkText}>Admin Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.sidebarCloseArea} onPress={() => setSidebarVisible(false)} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0f5c5c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconBtn: {
    padding: 8,
    marginHorizontal: -8, // Expand hit area
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    fontWeight: '700',
    color: Colors.white,
  },
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarCloseArea: {
    flex: 1,
  },
  sidebarContent: {
    width: 280,
    backgroundColor: Colors.white,
    height: '100%',
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e3e2',
  },
  sidebarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    fontWeight: '700',
    color: Colors.secondary,
  },
  sidebarMenu: {
    padding: Spacing.md,
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sidebarLinkText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  }
});
