import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

interface OtpBoxesProps {
  value: string;
  length: number;
  error?: boolean;
  focused: boolean;
}

/**
 * Row of boxes displaying an in-progress one-time code entry — pair with
 * a hidden `TextInput` that owns the actual keyboard focus and value.
 */
export const OtpBoxes: React.FC<OtpBoxesProps> = ({
  value,
  length,
  error,
  focused,
}) => (
  <View
    style={styles.row}
    accessible
    accessibilityLabel={`Code: ${value.length} of ${length} digits entered`}
  >
    {Array.from({ length }).map((_, i) => {
      const digit = value[i];
      const isCursor = focused && i === value.length;
      return (
        <View
          key={i}
          style={[
            styles.box,
            digit ? styles.boxFilled : styles.boxEmpty,
            isCursor && styles.boxActive,
            error && styles.boxError,
          ]}
        >
          <Text style={styles.digitText}>{digit ?? ''}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  box: {
    width: 44,
    height: 56,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: 'rgba(195, 198, 207, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  boxEmpty: {},
  boxFilled: {
    borderColor: Colors.secondary,
  },
  boxActive: {
    borderColor: Colors.accent,
  },
  boxError: {
    borderColor: '#ba1a1a',
    backgroundColor: '#fff0ef',
  },
  digitText: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 30,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default OtpBoxes;
