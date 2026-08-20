import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography, Radii } from '../../theme';

export interface SegmentedControlTab<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  tabs: SegmentedControlTab<T>[];
  active: T;
  onChange: (key: T) => void;
}

/** Row of pill tabs where the active tab gets an elevated white background. */
export function SegmentedControl<T extends string>({
  tabs,
  active,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.control} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    backgroundColor: '#dde3ef',
    borderRadius: Radii.lg,
    padding: 4,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  tabTextActive: {
    color: Colors.accent,
  },
});

export default SegmentedControl;
