import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { useTreasureHunt } from '../../../context/TreasureHuntContext';
import { useFocusEffect } from '@react-navigation/native';
import { mapApi } from '../../../services/api/mapApi';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

// ─────────────────────────────────────────────────────────────────────────────
// Game Progression Data
// ─────────────────────────────────────────────────────────────────────────────
const BADGE_IMAGES: Record<string, any> = {
  '1.png': require('../../../../assets/badges/1.png'),
  '2.png': require('../../../../assets/badges/2.png'),
  '3.png': require('../../../../assets/badges/3.png'),
  '4.png': require('../../../../assets/badges/4.png'),
  '5.png': require('../../../../assets/badges/5.png'),
  '6.png': require('../../../../assets/badges/6.png'),
  '7.png': require('../../../../assets/badges/7.png'),
  '8.png': require('../../../../assets/badges/8.png'),
  '9.png': require('../../../../assets/badges/9.png'),
  '10.png': require('../../../../assets/badges/10.png'),
  '11.png': require('../../../../assets/badges/11.png'),
};



// ─────────────────────────────────────────────────────────────────────────────
// HTML for Mapbox
// ─────────────────────────────────────────────────────────────────────────────
const buildTreasureMapHTML = (token: string, stages: any[], currentIndex: number) => {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
<style>
  :root {
    --marker-scale: 0.35;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; overflow: hidden; }
  
  .mapboxgl-canvas {
    filter: sepia(0.5) grayscale(0.7) contrast(1.15) brightness(0.9);
  }
  
  .treasure-marker {
    width: calc(70px * var(--marker-scale));
    height: calc(70px * var(--marker-scale));
    border-radius: calc(35px * var(--marker-scale));
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 calc(4px * var(--marker-scale)) calc(6px * var(--marker-scale)) rgba(0,0,0,0.3);
    position: relative;
    background-size: 70%;
    background-position: center;
    background-repeat: no-repeat;
  }
  .marker-active {
    width: calc(110px * var(--marker-scale));
    height: calc(110px * var(--marker-scale));
    border-radius: calc(55px * var(--marker-scale));
    background-size: 100%;
    animation: pulse 1.5s infinite;
    cursor: pointer;
    z-index: 10;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.6); }
    70% { box-shadow: 0 0 0 calc(40px * var(--marker-scale)) rgba(212, 175, 55, 0); }
    100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
mapboxgl.accessToken = '${token}';
const SL_BOUNDS = [[79.5, 5.85], [81.95, 9.9]];

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [80.7, 7.3],
  zoom: 6.8,
  pitch: 0,
  minZoom: 6.0,
  maxZoom: 14,
  maxBounds: SL_BOUNDS,
  attributionControl: false
});

map.on('load', () => {
  const style = map.getStyle();
  if (style && style.layers) {
    style.layers.forEach(layer => {
      if (
        layer.id.includes('road') || 
        layer.id.includes('bridge') || 
        layer.id.includes('tunnel') || 
        layer.id.includes('path') || 
        layer.id.includes('label') ||
        layer.id.includes('place') ||
        layer.id.includes('poi') ||
        layer.id.includes('boundary')
      ) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    });
  }

  const stages = ${JSON.stringify(stages)};
  const currentIndex = ${currentIndex};
  
  stages.forEach((stage, index) => {
    // Show earned badges and the active badge
    if (index > currentIndex) return;
    
    const el = document.createElement('div');
    el.className = 'treasure-marker' + (index === currentIndex ? ' marker-active' : '');
    el.style.backgroundImage = 'url(' + stage.imageUri + ')';
    
    el.addEventListener('click', () => {
      map.flyTo({ center: [stage.lng, stage.lat - 0.025], zoom: 12.5, duration: 1500, pitch: 0 });
      if (index === currentIndex) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'MARKER_PRESS', id: stage.id })
        );
      }
    });
    
    new mapboxgl.Marker({ element: el, pitchAlignment: 'map', rotationAlignment: 'map' })
      .setLngLat([stage.lng, stage.lat])
      .addTo(map);
  });
  
  const updateMarkerScale = () => {
    const scale = Math.max(0.35, Math.min(1, (map.getZoom() - 6.5) / 5.5));
    document.documentElement.style.setProperty('--marker-scale', scale);
  };
  map.on('zoom', updateMarkerScale);
  updateMarkerScale();
  
  window.map = map;
});
</script>
</body>
</html>`;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TreasureHuntProps {
  onNavigate?: (tab: string) => void;
}

export const TreasureHuntScreen: React.FC<TreasureHuntProps> = ({ onNavigate }) => {
  const [isReady, setIsReady] = useState(false);
  const { unlockBadge, unlockedBadges, fetchBadges } = useTreasureHunt();

  useFocusEffect(
    React.useCallback(() => {
      fetchBadges();
    }, [fetchBadges])
  );
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400); // 400ms delay to lazy load mapbox webview
    return () => clearTimeout(timer);
  }, []);

  const [adventureStages, setAdventureStages] = useState<any[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [showObjective, setShowObjective] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showJourney, setShowJourney] = useState<boolean>(false);
  const [showBadgeUnlock, setShowBadgeUnlock] = useState<boolean>(false);
  const [showQuestIntro, setShowQuestIntro] = useState<boolean>(false);

  useEffect(() => {
    const loadStages = async () => {
      try {
        const landmarks = await mapApi.getLandmarks();
        const stages = landmarks
          .filter(l => l.badge && l.quests && l.quests.length > 0)
          .map(l => ({
            id: l.id,
            badgeId: l.badge!.id,
            title: l.badge!.title,
            badgeImage: BADGE_IMAGES[l.badge!.image] || BADGE_IMAGES['1.png'],
            location: l.name,
            lng: l.lng,
            lat: l.lat,
            questId: l.quests[0].id,
            questions: []
          }));

        // Enforce the intended linear progression by sorting by quest ID (insertion order)
        stages.sort((a, b) => a.questId - b.questId);
        setAdventureStages(stages);
      } catch (err) {
        console.log('Failed to fetch landmarks for adventure stages', err);
      }
    };
    loadStages();
  }, []);

  const isGameActive = useRef(false);

  useEffect(() => {
    if (!isGameActive.current && adventureStages.length > 0) {
      const nextUnfinishedIdx = adventureStages.findIndex(s => !unlockedBadges.includes(s.badgeId));
      const indexToSet = nextUnfinishedIdx === -1 ? Math.max(adventureStages.length - 1, 0) : nextUnfinishedIdx;
      setCurrentStageIndex(indexToSet);
    }
  }, [unlockedBadges, adventureStages]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const activeStage = adventureStages[currentStageIndex];
      if (activeStage && activeStage.questId && activeStage.questions.length === 0) {
        try {
          const questions = await mapApi.getQuestQuestions(activeStage.questId);
          setAdventureStages(prev => {
            const next = [...prev];
            if (next[currentStageIndex]) {
              next[currentStageIndex] = { ...next[currentStageIndex], questions };
            }
            return next;
          });
        } catch (err) {
          console.log('Failed to fetch questions for quest', activeStage.questId, err);
        }
      }
    };
    fetchQuestions();
  }, [currentStageIndex, adventureStages]);

  const analyzeBtnScale = useRef(new Animated.Value(1)).current;
  const badgeGlowAnim = useRef(new Animated.Value(1)).current;
  const introAnimY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const puzzleAnimY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const journeyAnimY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    const playMusic = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../../assets/sounds/inside-map/treasure-hunt-music.mp3'),
          { shouldPlay: true, isLooping: true, volume: 0.45 }
        );
        soundRef.current = sound;
      } catch (err) {
        console.log('Failed to play treasure hunt music', err);
      }
    };
    playMusic();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    Animated.spring(introAnimY, { toValue: showIntro ? 0 : SCREEN_HEIGHT, useNativeDriver: true, friction: 8, tension: 40 }).start();
  }, [showIntro]);

  useEffect(() => {
    if (showBadgeUnlock) {
      const playUnlockSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../../../assets/sounds/inside-map/badge-unlocked.mp3'),
            { shouldPlay: true, volume: 1.0 }
          );
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (err) {
          console.log('Failed to play unlock sound', err);
        }
      };
      playUnlockSound();

      Animated.loop(
        Animated.sequence([
          Animated.timing(badgeGlowAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(badgeGlowAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      badgeGlowAnim.setValue(1);
    }
  }, [showBadgeUnlock]);

  useEffect(() => {
    Animated.spring(puzzleAnimY, { toValue: showObjective ? 0 : SCREEN_HEIGHT, useNativeDriver: true, friction: 8, tension: 40 }).start();
  }, [showObjective]);

  useEffect(() => {
    Animated.spring(journeyAnimY, { toValue: showJourney ? 0 : SCREEN_HEIGHT, useNativeDriver: true, friction: 8, tension: 40 }).start();
  }, [showJourney]);

  const activeStage = adventureStages[currentStageIndex];
  const isGameComplete = currentStageIndex >= adventureStages.length && adventureStages.length > 0;

  const handleAnalyzeChoice = () => {
    if (!selectedChoiceId || isGameComplete) return;

    if (isAnswerRevealed) {
      const currentQuestion = activeStage?.questions?.[currentQuestionIndex];
      const choice = (currentQuestion?.choices || activeStage.choices)?.find((c: any) => c.id === selectedChoiceId);
      
      if (choice?.isCorrect) {
        if (activeStage.questions && currentQuestionIndex + 1 < activeStage.questions.length) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedChoiceId(null);
          setIsAnswerRevealed(false);
        } else {
          unlockBadge(activeStage.badgeId);
          setShowBadgeUnlock(true);
          setShowObjective(false);
        }
      } else {
        setSelectedChoiceId(null);
        setIsAnswerRevealed(false);
      }
      return;
    }

    setIsAnswerRevealed(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {MAPBOX_TOKEN && isReady && adventureStages.length > 0 ? (
        <WebView
          ref={webviewRef}
          source={{ html: buildTreasureMapHTML(MAPBOX_TOKEN, adventureStages.map(s => ({ ...s, imageUri: Image.resolveAssetSource(s.badgeImage).uri })), currentStageIndex) }}
          style={StyleSheet.absoluteFillObject}
          onMessage={(event) => { try { const data = JSON.parse(event.nativeEvent.data); if (data.type === 'MARKER_PRESS') setShowObjective(true); } catch (e) {} }}
        />
      ) : null}

      <TouchableOpacity style={styles.floatingBackBtn} onPress={() => onNavigate && onNavigate('map')}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.secondary} />
      </TouchableOpacity>

      <View style={styles.hudOverlay}>
        <View style={styles.hudPill}>
          <MaterialIcons name="stars" size={20} color={Colors.accent} />
          <Text style={styles.hudText}>{Math.min(currentStageIndex, adventureStages.length)} / {adventureStages.length}</Text>
        </View>
        <TouchableOpacity 
          style={styles.targetBtn} 
          onPress={() => {
            const stage = adventureStages[currentStageIndex];
            if (!stage) return;
            webviewRef.current?.injectJavaScript(`
              if (window.map) {
                window.map.flyTo({ center: [${stage.lng}, ${stage.lat} - 0.025], zoom: 12.5, duration: 1500, pitch: 0 });
              }
              true;
            `);
          }}
        >
          <MaterialIcons name="my-location" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.targetBtn} 
          onPress={() => {
            webviewRef.current?.injectJavaScript(`
              if (window.map) {
                window.map.flyTo({ center: [80.7, 7.3], zoom: 6.8, duration: 2000, pitch: 0 });
              }
              true;
            `);
          }}
        >
          <MaterialIcons name="public" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.targetBtn} 
          onPress={() => setShowJourney(true)}
        >
          <MaterialIcons name="format-list-bulleted" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: introAnimY }] }]}>
        <View style={styles.heroSection}>
          <Image source={require('../../../../assets/map/treasure-hunt-modal.jpg')} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradientOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTagline}>ISLAND EXPEDITION</Text>
            <Text style={styles.heroTitle}>The Heritage Trail</Text>
            <Text style={styles.heroSubtitle}>Solve riddles to unearth cultural relics.</Text>
            <TouchableOpacity 
              style={[styles.startJourneyBtn, adventureStages.length === 0 && { opacity: 0.7 }]} 
              disabled={adventureStages.length === 0}
              onPress={() => {
              isGameActive.current = true;
              
              // Ensure we have the latest index based on fetched badges before starting
              const nextUnfinishedIdx = adventureStages.findIndex(s => !unlockedBadges.includes(s.badgeId));
              const indexToSet = nextUnfinishedIdx === -1 ? Math.max(adventureStages.length - 1, 0) : nextUnfinishedIdx;
              setCurrentStageIndex(indexToSet);

              setShowIntro(false);
              setTimeout(() => {
                setShowQuestIntro(true);
              }, 400);
            }}>
              <Text style={styles.startJourneyText}>
                {adventureStages.length === 0 ? 'Loading Journey...' : 'Start Journey'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: puzzleAnimY }] }]}>
        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowObjective(false)}>
          <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.textMuted} />
        </TouchableOpacity>
        <ScrollView style={styles.objectiveSection} contentContainerStyle={{ paddingBottom: Spacing.xl * 2 }}>
          <Text style={styles.clueTitle}>
            {activeStage?.title} {activeStage?.questions && activeStage.questions.length > 1 ? `(${currentQuestionIndex + 1}/${activeStage.questions.length})` : ''}
          </Text>
          <Text style={styles.instructionPrompt}>{activeStage?.questions?.[currentQuestionIndex]?.riddle || activeStage?.riddle}</Text>
          
          {activeStage?.questions?.[currentQuestionIndex]?.image && (
            <Image 
              source={{ uri: activeStage.questions[currentQuestionIndex].image }} 
              style={{ width: '100%', height: 160, borderRadius: Radii.lg, marginBottom: Spacing.lg }}
              resizeMode="cover" 
            />
          )}

          <View style={styles.choicesGrid}>
            {(activeStage?.questions?.[currentQuestionIndex]?.choices || activeStage?.choices)?.map((item: any) => {
              const isSelected = selectedChoiceId === item.id;
              
              let cardStyle: any = [styles.choiceCard];
              let textColor: string = Colors.textMuted;
              
              if (isAnswerRevealed) {
                if (item.isCorrect) {
                  cardStyle.push({ borderColor: '#27AE60', backgroundColor: 'rgba(39, 174, 96, 0.05)' });
                  textColor = '#27AE60';
                } else if (isSelected && !item.isCorrect) {
                  cardStyle.push({ borderColor: '#EB5757', backgroundColor: 'rgba(235, 87, 87, 0.05)' });
                  textColor = '#EB5757';
                }
              } else if (isSelected) {
                cardStyle.push(styles.choiceCardSelected);
                textColor = Colors.accent;
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => !isAnswerRevealed && setSelectedChoiceId(item.id)}
                  style={cardStyle}
                  activeOpacity={isAnswerRevealed ? 1 : 0.7}
                >
                  {item.icon && <MaterialIcons name={item.icon as any} size={28} color={textColor} style={{ marginBottom: 8 }} />}
                  <Text style={[styles.choiceLabel, (isSelected || isAnswerRevealed) && { color: textColor, fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeChoice}>
            <Text style={styles.analyzeButtonText}>
              {isAnswerRevealed ? ((activeStage?.questions?.[currentQuestionIndex]?.choices || activeStage?.choices)?.find((c:any) => c.id === selectedChoiceId)?.isCorrect ? 'Next' : 'Try Again') : 'Submit'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: journeyAnimY }] }]}>
        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowJourney(false)}>
          <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.objectiveSection}>
          <Text style={styles.clueTitle}>Your Journey</Text>
          <Text style={styles.instructionPrompt}>Relics you've unearthed so far:</Text>
          <ScrollView horizontal style={{ marginBottom: Spacing.xl }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, alignItems: 'center' }}>
            {adventureStages.slice(0, currentStageIndex).map((stage, idx, arr) => (
              <View key={stage.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ alignItems: 'center', width: 90 }}
                  onPress={() => {
                    setShowJourney(false);
                    webviewRef.current?.injectJavaScript(`
                      if (window.map) {
                        window.map.flyTo({ center: [${stage.lng}, ${stage.lat} - 0.025], zoom: 12.5, duration: 2000, pitch: 0 });
                      }
                      true;
                    `);
                  }}
                >
                  <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: 'rgba(232, 121, 46, 0.05)' }}>
                    <Image source={stage.badgeImage} style={{ width: 60, height: 60 }} resizeMode="contain" />
                  </View>
                  <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: Colors.secondary, textAlign: 'center' }} numberOfLines={2}>{stage.location}</Text>
                </TouchableOpacity>
                {idx !== arr.length - 1 && (
                  <View style={{ width: 30, height: 2, backgroundColor: Colors.accent, marginHorizontal: 4, transform: [{ translateY: -18 }] }} />
                )}
              </View>
            ))}
            {currentStageIndex === 0 && (
              <Text style={{ fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginLeft: Spacing.sm }}>No relics unearthed yet. Solve your first riddle!</Text>
            )}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── Badge Unlocked Modal ─────────────────────────────── */}
      <Modal visible={showBadgeUnlock} transparent animationType="fade">
        <View style={styles.fullscreenOverlay}>
          <Text style={styles.badgeUnlockHeading}>✨ BADGE UNLOCKED ✨</Text>
          <Text style={styles.badgeUnlockSubheading}>Incredible work! You solved all riddles.</Text>
          
          <Animated.View style={[styles.badgeGlowContainer, { transform: [{ scale: badgeGlowAnim }] }]}>
            <View style={styles.badgeGlowBg} />
            <Image source={activeStage?.badgeImage} style={styles.unlockedBadgeImage} resizeMode="contain" />
          </Animated.View>
          
          <Text style={styles.badgeUnlockTitle}>{activeStage?.title}</Text>
          <Text style={styles.badgeUnlockLocation}>{activeStage?.location}</Text>
          
          <TouchableOpacity 
            style={styles.continueQuestBtn}
            onPress={() => {
              setShowBadgeUnlock(false);
              const nextStageIndex = currentStageIndex + 1;
              if (nextStageIndex < adventureStages.length) {
                setCurrentStageIndex(nextStageIndex);
                setCurrentQuestionIndex(0);
                setSelectedChoiceId(null);
                setIsAnswerRevealed(false);
                setShowQuestIntro(true);
              } else {
                onNavigate?.('map');
              }
            }}
          >
            <Text style={styles.continueQuestText}>Continue Journey</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.continueQuestBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.white, marginTop: Spacing.sm }]}
            onPress={() => {
              setShowBadgeUnlock(false);
              onNavigate?.('map');
            }}
          >
            <Text style={[styles.continueQuestText, { color: Colors.white }]}>Exit Quest</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Next Quest Intro Modal ───────────────────────────── */}
      <Modal visible={showQuestIntro} transparent animationType="fade">
        <View style={styles.fullscreenOverlayDark}>
          <Text style={styles.questIntroHeading}>NEXT QUEST</Text>
          
          <View style={styles.lockedBadgeContainer}>
            <Image source={adventureStages[currentStageIndex]?.badgeImage} style={styles.lockedBadgeImage} resizeMode="contain" />
            <MaterialIcons name="lock" size={48} color="rgba(255,255,255,0.9)" style={{ position: 'absolute' }} />
          </View>
          
          <Text style={styles.questIntroTitle}>{adventureStages[currentStageIndex]?.title}</Text>
          <Text style={styles.questIntroLocation}>{adventureStages[currentStageIndex]?.location}</Text>
          
          <TouchableOpacity 
            style={styles.beginQuestBtn}
            onPress={() => {
              setShowQuestIntro(false);
              const stage = adventureStages[currentStageIndex];
              webviewRef.current?.injectJavaScript(`
                if (window.map) {
                  window.map.flyTo({ center: [${stage?.lng || 80}, ${stage?.lat || 7} - 0.025], zoom: 12.5, duration: 2500, pitch: 0 });
                }
                true;
              `);
            }}
          >
            <Text style={styles.beginQuestText}>Begin Quest</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.beginQuestBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.white, marginTop: Spacing.sm }]}
            onPress={() => {
              setShowQuestIntro(false);
              onNavigate?.('map');
            }}
          >
            <Text style={[styles.beginQuestText, { color: Colors.white }]}>Exit Quest</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 36,
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 100,
  },
  hudOverlay: {
    position: 'absolute',
    top: 36,
    right: Spacing.md,
    zIndex: 100,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  targetBtn: {
    backgroundColor: Colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginTop: Spacing.md,
    alignSelf: 'flex-end',
  },
  hudText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
    fontWeight: '700',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: Spacing.sm,
    zIndex: 10,
  },

  // ── Hero Section (Intro) ───────────────────────────────────────────────────
  heroSection: {
    height: 280,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.white,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  heroTagline: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 28,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  startJourneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Radii.md,
    gap: 8,
  },
  startJourneyText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.white,
    fontWeight: '700',
  },

  // ── Objective Section (Puzzle Modal) ───────────────────────────────────────
  objectiveSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    maxHeight: Dimensions.get('window').height * 0.7,
    flexGrow: 0,
  },
  clueTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  instructionPrompt: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  choicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.secondarySubtle,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  choiceCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  choiceLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: Radii.full,
    gap: 8,
  },
  analyzeButtonText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // ── New Modals ─────────────────────────────────────────────────────────────
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 92, 92, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 2000,
  },
  fullscreenOverlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 61, 61, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 2000,
  },
  badgeUnlockHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: '#D4AF37',
    marginBottom: Spacing.xs,
    letterSpacing: 2,
    textAlign: 'center',
  },
  badgeUnlockSubheading: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xl * 1.5,
    textAlign: 'center',
  },
  badgeGlowContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  badgeGlowBg: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  unlockedBadgeImage: {
    width: 180,
    height: 180,
    zIndex: 2,
  },
  badgeUnlockTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeUnlockLocation: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: Spacing.xl * 1.5,
  },
  continueQuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: Radii.full,
    gap: 12,
  },
  continueQuestText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.white,
    fontWeight: '700',
  },
  questIntroHeading: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
    letterSpacing: 3,
    marginBottom: Spacing.xl,
  },
  lockedBadgeContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  lockedBadgeImage: {
    width: 160,
    height: 160,
    opacity: 0.2,
    tintColor: Colors.white,
  },
  questIntroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 28,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  questIntroLocation: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: Spacing.xl * 1.5,
  },
  beginQuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: Radii.full,
    gap: 12,
  },
  beginQuestText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.secondary,
    fontWeight: '700',
  },
});

export default TreasureHuntScreen;
