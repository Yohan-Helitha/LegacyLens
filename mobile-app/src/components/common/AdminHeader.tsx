import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Radii, Spacing } from '../../theme';

export const AdminHeader: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <TouchableOpacity onPress={() => setSidebarVisible(true)}>
              <MaterialIcons name="menu" size={24} color={Colors.white} />
            </TouchableOpacity>
          <Text style={styles.appBarTitle}>Legacy Lens</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
        <View style={styles.appBarRight}>
          <TouchableOpacity style={styles.notifWrapper}>
            <MaterialIcons name="notifications" size={24} color={Colors.white} />
            <View style={styles.notifDot} />
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
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setSidebarVisible(false); onNavigate?.('home'); }}>
                <MaterialIcons name="home" size={20} color={Colors.secondary} />
                <Text style={styles.sidebarLinkText}>Return to User View</Text>
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
    backgroundColor: Colors.secondary,
  },
  appBar: {
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.secondary, 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appBarTitle: {
    fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL,
    fontWeight: '700', color: Colors.white,
  },
  adminBadge: {
    backgroundColor: Colors.white, borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  adminBadgeText: {
    fontFamily: Typography.fontBodyMed, fontSize: 10,
    color: Colors.accent, letterSpacing: 0.5, fontWeight: '700'
  },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  notifWrapper: { position: 'relative' },
  notifDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.accent, borderWidth: 1.5, borderColor: Colors.white,
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
