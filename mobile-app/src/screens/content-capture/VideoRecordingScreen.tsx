import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView } from 'expo-camera';
import { Video as VideoIcon } from 'lucide-react-native';
import {
  ContentCaptureTopBar,
  RecordingActionButtons,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { useVideoRecorder } from '../../hooks/useVideoRecorder';
import { Typography, Spacing, Radii } from '../../theme';

interface VideoRecordingScreenProps {
  onClose?: () => void;
  onFinish?: (result: { uri: string; durationMillis: number }) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Dedicated video-only recording screen — full-bleed camera preview, no
 * audio mode toggle (that lives on AudioRecordingScreen instead).
 */
export const VideoRecordingScreen: React.FC<VideoRecordingScreenProps> = ({ onClose, onFinish }) => {
  const {
    cameraRef,
    state,
    elapsedMs,
    isReady,
    cameraReady,
    onCameraReady,
    onMountError,
    requestPermissions,
    start,
    stop,
    restart,
  } = useVideoRecorder();
  const isRecording = state === 'recording';

  const handleFinish = async () => {
    const result = await stop();
    if (result) onFinish?.(result);
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="close" onLeftPress={onClose} />

      <View style={s.content}>
        <Text style={s.instructionText}>
          {isRecording
            ? "Tell your story on camera — tap Finish when you're done."
            : 'Frame your shot, then tap the button to start recording.'}
        </Text>

        <View style={s.stage}>
          {!isReady ? (
            <View style={s.permissionBox}>
              <VideoIcon size={32} color={D.onSurfaceVariant} strokeWidth={2} />
              <Text style={s.permissionText}>
                Legacy Lens needs camera and microphone access to record a video story.
              </Text>
              <Pressable
                onPress={requestPermissions}
                style={({ pressed }) => [s.permissionBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Grant camera and microphone access"
              >
                <Text style={s.permissionBtnText}>Grant access</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.cameraWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                mode="video"
                facing="back"
                onCameraReady={onCameraReady}
                onMountError={onMountError}
              />

              {!cameraReady && (
                <View style={s.cameraLoadingOverlay}>
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}

              <View style={s.timerPill} importantForAccessibility="no">
                {isRecording && <View style={s.recDot} />}
                <Text style={s.timerPillText}>{formatDuration(elapsedMs)}</Text>
              </View>
            </View>
          )}

          {isReady && cameraReady && !isRecording && (
            <View style={s.cameraOverlayBottom}>
              <Pressable
                onPress={start}
                style={({ pressed }) => [s.recordBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Start recording video"
              >
                <View style={s.recordBtnInner} />
              </Pressable>
            </View>
          )}
        </View>

        <RecordingActionButtons
          startOverLabel="Start Over"
          finishLabel="Use this recording"
          onStartOverPress={restart}
          onFinishPress={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  content: { flex: 1, padding: Spacing.md, gap: Spacing.lg },

  instructionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },

  stage: {
    flex: 1,
    backgroundColor: 'rgba(15,92,92,0.06)',
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,92,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  cameraWrap: { flex: 1, width: '100%' },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  timerPill: {
    position: 'absolute',
    top: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0453c' },
  cameraOverlayBottom: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0453c' },

  permissionBox: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  permissionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  permissionBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },

  pressed: { opacity: 0.85 },
});

export default VideoRecordingScreen;
