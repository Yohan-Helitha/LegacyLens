import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

export type UserTabKey = 'home' | 'learn' | 'market' | 'map' | 'profile';

interface UserFooterProps {
  activeTab: UserTabKey;
  onTabSelect: (tab: UserTabKey) => void;
}

export const UserFooter: React.FC<UserFooterProps> = ({ activeTab, onTabSelect }) => {
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home-outline', IconComponent: MaterialCommunityIcons },
    { key: 'learn', label: 'Learn', icon: 'marker', IconComponent: MaterialCommunityIcons },
    { key: 'market', label: 'Market', icon: 'storefront-outline', IconComponent: MaterialCommunityIcons },
    { key: 'map', label: 'Map', icon: 'map-outline', IconComponent: MaterialCommunityIcons },
    { key: 'profile', label: 'Profile', icon: 'account-circle-outline', IconComponent: MaterialCommunityIcons },
  ] as const;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity 
              key={tab.key} 
              style={styles.tabButton} 
              onPress={() => onTabSelect(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <tab.IconComponent 
                  name={tab.icon as any} 
                  size={28} 
                  color={isActive ? Colors.secondary : Colors.textMuted} 
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 200, 200, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: Colors.white,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 16,
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 67, 67, 0.1)',
  },
  label: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
});
