import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Share, Animated, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme';
import { styles } from './WordOfTheDay.styles';
import { homeApi, WordOfTheDayResponse } from '../../services/api/homeApi';

export const WordOfTheDay = () => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const saveTranslateY = useRef(new Animated.Value(0)).current;
  const shareScale = useRef(new Animated.Value(1)).current;

  const [wordData, setWordData] = useState<WordOfTheDayResponse | null>(null);

  useEffect(() => {
    const fetchWord = async () => {
      try {
        const data = await homeApi.getWordOfToday();
        setWordData(data);
      } catch (error) {
        console.error('Error fetching word of the day:', error);
      }
    };
    fetchWord();

    return () => {
      Speech.stop();
    };
  }, []);

  const likePlayer = useAudioPlayer(require('../../../assets/sounds/heart.mp3'));
  const savePlayer = useAudioPlayer({ uri: 'https://www.soundjay.com/buttons/sounds/button-30.mp3' });
  const sharePlayer = useAudioPlayer({ uri: 'https://www.soundjay.com/buttons/sounds/button-10.mp3' });

  if (!wordData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', minHeight: 200 }]}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  const { word, transliteration, definition } = wordData;

  const playSound = async (type: 'like' | 'save' | 'share') => {
    try {
      await setAudioModeAsync({ playsInSilentModeIOS: true });
      if (type === 'like') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        likePlayer.seekTo(0);
        likePlayer.play();
      } else if (type === 'save') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        savePlayer.seekTo(0);
        savePlayer.play();
      } else if (type === 'share') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        sharePlayer.seekTo(0);
        sharePlayer.play();
      }
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    if (newLiked) {
      playSound('like');
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.25, duration: 100, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true })
      ]).start();
    }
  };

  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);
    if (newSaved) {
      playSound('save');
      saveTranslateY.setValue(-8);
      Animated.spring(saveTranslateY, { toValue: 0, friction: 4, tension: 40, useNativeDriver: true }).start();
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(`${transliteration}. Meaning: ${definition}`, {
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  const handleShare = async () => {
    try {
      playSound('share');
      Animated.sequence([
        Animated.timing(shareScale, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(shareScale, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
      await Share.share({
        message: `Word of the Day: ${word} - ${transliteration}\nMeaning: ${definition}\n\nShared via LegacyLens`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.wordCard}>
        <View style={styles.wordCardHeader}>
          <Text style={styles.wordTagText}>WORD OF THE DAY</Text>
          <TouchableOpacity onPress={handleShare}>
            <Animated.View style={{ transform: [{ scale: shareScale }] }}>
              <MaterialIcons name="share" size={28} color={Colors.textMuted} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.wordBodyCol}>
          <View style={styles.wordMainContainer}>
            <Text style={styles.sinhalaWord}>{word}</Text>
            <Text style={styles.transliteration}>{transliteration}</Text>
          </View>
          
          <View style={styles.definitionBox}>
            <Text style={styles.definitionText}>
              {definition}
            </Text>
          </View>
        </View>

        <View style={styles.wordFooter}>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <TouchableOpacity onPress={handleLike} activeOpacity={0.8}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <MaterialIcons name={liked ? "favorite" : "favorite-border"} size={28} color={liked ? "#FF4B4B" : Colors.textMuted} />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSpeak}>
              <MaterialIcons name="volume-up" size={28} color={isSpeaking ? Colors.secondary : Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave}>
            <Animated.View style={{ transform: [{ translateY: saveTranslateY }] }}>
              <MaterialIcons name={saved ? "bookmark" : "bookmark-border"} size={28} color={saved ? "#fe893e" : Colors.textMuted} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


