/**
 * VoiceSearchModal
 *
 * Uses a hidden WebView to run the browser's Web Speech API.
 * Works in standard Expo Go on both Android and iOS.
 * When a backend STT API is available later, swap the WebView HTML
 * with an API call to the endpoint.
 *
 * Props:
 *  visible       — controls modal visibility
 *  onClose       — called when user dismisses
 *  onResult(txt) — called with final recognised text
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../theme';

// ─── Speech recognition HTML (runs inside the hidden WebView) ────────────────
const SPEECH_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body { margin:0; background:transparent; }</style>
</head>
<body>
<script>
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unsupported' }));
    return;
  }

  var recognition = new SR();
  recognition.lang           = 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous     = false;

  recognition.onstart = function () {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'start' }));
  };

  recognition.onresult = function (event) {
    var interim = '';
    var final   = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var t = event.results[i][0].transcript;
      if (event.results[i].isFinal) { final += t; }
      else                           { interim += t; }
    }
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'result', interim: interim, final: final })
    );
  };

  recognition.onspeechend = function () {
    recognition.stop();
  };

  recognition.onend = function () {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
  };

  recognition.onerror = function (event) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'error', code: event.error })
    );
  };

  recognition.start();
})();
</script>
</body>
</html>
`;

// ─── Types ────────────────────────────────────────────────────────────────────
type VoiceState = 'idle' | 'listening' | 'done' | 'error' | 'unsupported';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

const { width: SW } = Dimensions.get('window');

// ─── Component ────────────────────────────────────────────────────────────────
export const VoiceSearchModal: React.FC<Props> = ({ visible, onClose, onResult }) => {
  const [state, setState]         = useState<VoiceState>('idle');
  const [interimText, setInterim] = useState('');
  const [finalText, setFinal]     = useState('');
  const [errorMsg, setErrorMsg]   = useState('');

  // Pulse animation for the listening ring
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === 'listening') {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.7, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      pulse.setValue(1);
    }
  }, [state]);

  // Reset when closed
  useEffect(() => {
    if (!visible) {
      setState('idle');
      setInterim('');
      setFinal('');
      setErrorMsg('');
    }
  }, [visible]);

  // Handle messages from WebView
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string; interim?: string; final?: string; code?: string;
      };

      switch (msg.type) {
        case 'start':
          setState('listening');
          break;

        case 'result':
          if (msg.interim) setInterim(msg.interim);
          if (msg.final)   setFinal(msg.final);
          break;

        case 'end': {
          setState('done');
          const result = finalText || interimText;
          if (result.trim()) {
            // Short delay so user sees the "Done" state
            setTimeout(() => {
              onResult(result.trim());
              onClose();
            }, 700);
          }
          break;
        }

        case 'error':
          if (msg.code === 'no-speech') {
            setErrorMsg('No speech detected. Please try again.');
          } else if (msg.code === 'not-allowed') {
            setErrorMsg('Microphone access denied. Allow it in device settings.');
          } else {
            setErrorMsg(`Error: ${msg.code ?? 'unknown'}`);
          }
          setState('error');
          break;

        case 'unsupported':
          setErrorMsg('Voice search is not supported on this device.');
          setState('unsupported');
          break;
      }
    } catch {
      /* ignore parse errors */
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const micColor =
    state === 'done'    ? Colors.secondary :
    state === 'error'   ? '#ba1a1a'        : '#0f5c5c';

  const micIcon: keyof typeof MaterialIcons.glyphMap =
    state === 'done'  ? 'check' :
    state === 'error' ? 'mic-off' : 'mic';

  const headlineText =
    state === 'idle'        ? 'Starting…'  :
    state === 'listening'   ? 'Listening…' :
    state === 'done'        ? 'Got it!'    :
    state === 'error'       ? 'Oops!'      :
    state === 'unsupported' ? 'Not supported' : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside to dismiss */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Mic with pulse ring */}
          <View style={styles.micWrapper}>
            {state === 'listening' && (
              <Animated.View
                style={[styles.pulseRing, { transform: [{ scale: pulse }] }]}
              />
            )}
            <View style={[styles.micCircle, { backgroundColor: micColor }]}>
              <MaterialIcons name={micIcon} size={44} color="#fff" />
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>{headlineText}</Text>

          {/* Live transcript */}
          <View style={styles.transcriptBox}>
            {finalText ? (
              <Text style={styles.finalText}>{finalText}</Text>
            ) : interimText ? (
              <Text style={styles.interimText}>{interimText}</Text>
            ) : state === 'listening' ? (
              <Text style={styles.hintText}>Speak now…</Text>
            ) : state === 'error' || state === 'unsupported' ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}
          </View>

          {/* Dismiss hint */}
          {(state === 'listening' || state === 'idle') && (
            <Text style={styles.tapHint}>Tap outside or wait for auto-stop</Text>
          )}

          {/* Hidden WebView — only mounted when modal is visible */}
          {visible && (
            <WebView
              style={styles.hiddenWebView}
              source={{ html: SPEECH_HTML }}
              onMessage={handleMessage}
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              // Android: grant mic permissions to the WebView
              onPermissionRequest={
                Platform.OS === 'android'
                  ? (req: any) => req.grant(req.resources)
                  : undefined
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
    alignItems: 'center',
    minHeight: 340,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 6,
  },
  micWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(15, 92, 92, 0.15)',
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  transcriptBox: {
    minHeight: 60,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  finalText: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  interimText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: '#b0bec5',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
  },
  tapHint: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
});

export default VoiceSearchModal;
