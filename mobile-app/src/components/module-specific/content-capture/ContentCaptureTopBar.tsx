import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Menu, X, SlidersHorizontal } from 'lucide-react-native';
import { RoundIconButton } from '../../common';
import { Typography, Spacing } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

type LeftAction = 'menu' | 'close' | 'none';
type RightAction = 'filter' | 'none';

interface ContentCaptureTopBarProps {
  title?: string;
  left?: LeftAction;
  right?: RightAction;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

/**
 * Shared app bar for the content-capture flow — a menu/close icon on the
 * left, an optional centred title, and an optional filter icon on the
 * right. Used by the elder dashboard and the recording screens so the bar
 * chrome stays identical across the whole module.
 */
export const ContentCaptureTopBar: React.FC<ContentCaptureTopBarProps> = ({
  title,
  left = 'menu',
  right = 'none',
  onLeftPress,
  onRightPress,
}) => (
  <View style={s.bar}>
    <View style={s.slot}>
      {left === 'menu' && (
        <RoundIconButton
          icon={Menu}
          color={D.primary}
          onPress={onLeftPress}
          accessibilityLabel="Open menu"
        />
      )}
      {left === 'close' && (
        <RoundIconButton
          icon={X}
          color={D.primary}
          onPress={onLeftPress}
          accessibilityLabel="Close"
        />
      )}
    </View>

    {title ? <Text style={s.title}>{title}</Text> : <View style={{ flex: 1 }} />}

    <View style={s.slot}>
      {right === 'filter' && (
        <RoundIconButton
          icon={SlidersHorizontal}
          iconSize={22}
          color={D.primary}
          onPress={onRightPress}
          accessibilityLabel="Filter"
        />
      )}
    </View>
  </View>
);

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  slot: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
});

export default ContentCaptureTopBar;
