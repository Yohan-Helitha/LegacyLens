import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../theme';

/**
 * A themed replacement for the grey system pop-up. `appAlert` takes the same arguments as
 * `Alert.alert`, so a screen switches by swapping the call; `<AppDialogHost />` (mounted once in
 * App.tsx) is what actually draws it.
 */
export interface AppDialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

type Tone = 'success' | 'danger' | 'warning' | 'info';

interface DialogState {
  title: string;
  message?: string;
  buttons: AppDialogButton[];
  tone: Tone;
}

const TONES: Record<Tone, { color: string; background: string }> = {
  success: { color: '#0F5C5C', background: '#E3F1F0' },
  danger:  { color: '#B3261E', background: '#FDECEA' },
  warning: { color: '#9E4A0D', background: '#FFF0E0' },
  info:    { color: '#0F5C5C', background: '#E3F1F0' },
};

/** Picks the icon colour from the wording, so callers need no extra argument. */
function toneFor(title: string, buttons: AppDialogButton[]): Tone {
  if (buttons.some((b) => b.style === 'destructive')) return 'danger';
  if (/fail|error|cannot|could not/i.test(title)) return 'danger';
  if (/required|needed|missing|incomplete/i.test(title)) return 'warning';
  if (/saved|success|submitted|done/i.test(title)) return 'success';
  return 'info';
}

let listener: ((state: DialogState | null) => void) | null = null;

export function appAlert(title: string, message?: string, buttons?: AppDialogButton[]): void {
  const resolved = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
  listener?.({ title, message, buttons: resolved, tone: toneFor(title, resolved) });
}

const ToneIcon: React.FC<{ tone: Tone; color: string }> = ({ tone, color }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {tone === 'success' && <Path d="M5 12.5l4.5 4.5L19 7.5" />}
    {tone === 'danger' && (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Line x1="12" y1="7.5" x2="12" y2="13" />
        <Line x1="12" y1="16.5" x2="12" y2="16.6" />
      </>
    )}
    {tone === 'warning' && (
      <>
        <Path d="M12 3l10 18H2L12 3z" />
        <Line x1="12" y1="10" x2="12" y2="14.5" />
        <Line x1="12" y1="18" x2="12" y2="18.1" />
      </>
    )}
    {tone === 'info' && (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Line x1="12" y1="11" x2="12" y2="16.5" />
        <Line x1="12" y1="7.8" x2="12" y2="7.9" />
      </>
    )}
  </Svg>
);

export const AppDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    listener = setDialog;
    return () => {
      listener = null;
    };
  }, []);

  if (!dialog) return null;
  const look = TONES[dialog.tone];
  const stacked = dialog.buttons.length > 2;

  const press = (button: AppDialogButton) => {
    setDialog(null);
    button.onPress?.();
  };

  const cancel = dialog.buttons.find((b) => b.style === 'cancel');

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={() => (cancel ? press(cancel) : setDialog(null))}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={[s.iconCircle, { backgroundColor: look.background }]}>
            <ToneIcon tone={dialog.tone} color={look.color} />
          </View>
          <Text style={s.title}>{dialog.title}</Text>
          {!!dialog.message && <Text style={s.message}>{dialog.message}</Text>}

          <View style={[s.buttons, stacked && s.buttonsStacked]}>
            {dialog.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDanger = button.style === 'destructive';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => press(button)}
                  style={({ pressed }) => [
                    s.button,
                    !stacked && s.buttonFlex,
                    isCancel ? s.buttonGhost : isDanger ? s.buttonDanger : s.buttonPrimary,
                    pressed && s.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                >
                  <Text style={[s.buttonText, isCancel ? s.buttonGhostText : s.buttonSolidText]}>{button.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(20, 30, 30, 0.55)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 24,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    alignItems: 'center', gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontFamily: Typography.fontDisplay, fontSize: 19, color: '#202428', textAlign: 'center' },
  message: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: '#4a5568', textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch', marginTop: Spacing.sm },
  buttonsStacked: { flexDirection: 'column' },
  button: {
    minHeight: 48, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md,
  },
  buttonFlex: { flex: 1 },
  buttonPrimary: { backgroundColor: '#0F5C5C' },
  buttonDanger: { backgroundColor: '#B3261E' },
  buttonGhost: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#E8792E' },
  buttonText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  buttonSolidText: { color: '#ffffff' },
  buttonGhostText: { color: '#E8792E' },
  pressed: { opacity: 0.8 },
});
