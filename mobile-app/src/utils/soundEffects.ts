import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

let audioConfigured = false;

async function ensureAudioConfigured() {
  if (!audioConfigured) {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      audioConfigured = true;
    } catch (e) {
      console.warn('Failed to configure audio mode:', e);
    }
  }
}

export const playActionSound = async (type: 'like' | 'save' | 'share') => {
  try {
    let source: any;
    if (type === 'like') {
      source = require('../../assets/sounds/heart.mp3');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === 'save') {
      source = 'https://www.soundjay.com/buttons/sounds/button-30.mp3';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'share') {
      source = 'https://www.soundjay.com/buttons/sounds/button-10.mp3';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await ensureAudioConfigured();
    const player = createAudioPlayer(source);
    player.play();

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub?.remove?.();
        player.remove();
      }
    });
  } catch (e) {
    console.log('Error playing sound:', e);
  }
};
