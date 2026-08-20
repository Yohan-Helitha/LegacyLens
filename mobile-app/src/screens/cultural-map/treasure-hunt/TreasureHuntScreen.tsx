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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

// ─────────────────────────────────────────────────────────────────────────────
// Game Progression Data
// ─────────────────────────────────────────────────────────────────────────────
const ADVENTURE_STAGES = [
  {
    id: 's1',
    badgeId: 'galle-fort',
    title: 'Galle Fort Navigator',
    badgeImage: require('../../../../assets/badges/4.png'),
    location: 'Galle',
    lng: 80.2170,
    lat: 6.0267,
  },
  {
    id: 's2',
    badgeId: 'sigiriya-explorer',
    title: 'Sigiriya Explorer',
    badgeImage: require('../../../../assets/badges/2.png'),
    location: 'Sigiriya',
    lng: 80.7603,
    lat: 7.9570,
  },
  {
    id: 's3',
    badgeId: 'ceylon-tea',
    title: 'Ceylon Tea Master',
    badgeImage: require('../../../../assets/badges/3.png'),
    location: 'Nuwara Eliya',
    lng: 80.7828,
    lat: 6.9497,
  },
  {
    id: 's4',
    badgeId: 'temple-tooth',
    title: 'Temple of the Tooth',
    badgeImage: require('../../../../assets/badges/5.png'),
    location: 'Kandy',
    lng: 80.6416,
    lat: 7.2936,
    riddle:
      'I house a sacred relic guarded by generations, surrounded by the rhythm of the hills. Seek the vessel of gold.',
    choices: [
      { id: 'c1', label: 'Sacred Lotus', icon: 'local-florist', isCorrect: false },
      { id: 'c2', label: 'Golden Casket', icon: 'all-inclusive', isCorrect: true },
      { id: 'c3', label: 'Royal Tusk', icon: 'pets', isCorrect: false },
    ],
  },
  {
    id: 's5',
    badgeId: 'vesak-lantern',
    title: 'Vesak Illuminator',
    badgeImage: require('../../../../assets/badges/6.png'),
    location: 'Colombo',
    lng: 79.8612,
    lat: 6.9271,
    riddle:
      'Thousands of lights transform the night to honor enlightenment. Find the glowing geometry.',
    choices: [
      { id: 'c1', label: 'Clay Lamp', icon: 'wb-incandescent', isCorrect: false },
      { id: 'c2', label: 'Paper Lantern', icon: 'lightbulb', isCorrect: true },
      { id: 'c3', label: 'Temple Bell', icon: 'notifications', isCorrect: false },
    ],
  },
  {
    id: 's6',
    badgeId: 'nine-arch',
    title: 'Nine Arch Wanderer',
    badgeImage: require('../../../../assets/badges/11.png'),
    location: 'Ella',
    lng: 81.0608,
    lat: 6.8767,
    riddle:
      'A bridge of stone in the jungle deep, where the iron worm crawls while the forest sleeps.',
    choices: [
      { id: 'c1', label: 'Tea Train', icon: 'train', isCorrect: true },
      { id: 'c2', label: 'Stone Pillar', icon: 'account-balance', isCorrect: false },
      { id: 'c3', label: 'Ravana Cave', icon: 'landscape', isCorrect: false },
    ],
  },
];

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
    
    new mapboxgl.Marker(el)
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
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(3);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showObjective, setShowObjective] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showJourney, setShowJourney] = useState<boolean>(false);

  const analyzeBtnScale = useRef(new Animated.Value(1)).current;
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
    Animated.spring(puzzleAnimY, { toValue: showObjective ? 0 : SCREEN_HEIGHT, useNativeDriver: true, friction: 8, tension: 40 }).start();
  }, [showObjective]);

  useEffect(() => {
    Animated.spring(journeyAnimY, { toValue: showJourney ? 0 : SCREEN_HEIGHT, useNativeDriver: true, friction: 8, tension: 40 }).start();
  }, [showJourney]);

  const activeStage = ADVENTURE_STAGES[currentStageIndex];
  const isGameComplete = currentStageIndex >= ADVENTURE_STAGES.length;

  const handleAnalyzeChoice = () => {
    if (!selectedChoiceId || isGameComplete) return;
    const choice = activeStage.choices?.find((c) => c.id === selectedChoiceId);
    if (!choice) return;

    if (choice.isCorrect) {
      Alert.alert('✨ Badge Unlocked!', `Incredible work! You solved the riddle of ${activeStage.location}!`, [
        { text: 'Continue', onPress: () => { setCurrentStageIndex((prev) => prev + 1); setSelectedChoiceId(null); setShowObjective(false); } },
      ]);
    } else {
      Alert.alert('🔍 Incorrect', 'Try again!', [{ text: 'Try Again' }]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {MAPBOX_TOKEN ? (
        <WebView
          ref={webviewRef}
          source={{ html: buildTreasureMapHTML(MAPBOX_TOKEN, ADVENTURE_STAGES.map(s => ({ ...s, imageUri: Image.resolveAssetSource(s.badgeImage).uri })), currentStageIndex) }}
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
          <Text style={styles.hudText}>{Math.min(currentStageIndex, ADVENTURE_STAGES.length)} / {ADVENTURE_STAGES.length}</Text>
        </View>
        <TouchableOpacity 
          style={styles.targetBtn} 
          onPress={() => {
            const stage = ADVENTURE_STAGES[currentStageIndex];
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
            <TouchableOpacity style={styles.startJourneyBtn} onPress={() => {
              setShowIntro(false);
              const stage = ADVENTURE_STAGES[currentStageIndex];
              webviewRef.current?.injectJavaScript(`
                if (window.map) {
                  window.map.flyTo({ center: [${stage.lng}, ${stage.lat} - 0.025], zoom: 12.5, duration: 2500, pitch: 0 });
                }
                true;
              `);
            }}>
              <Text style={styles.startJourneyText}>Start Journey</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: puzzleAnimY }] }]}>
        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowObjective(false)}>
          <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.objectiveSection}>
          <Text style={styles.clueTitle}>{activeStage?.title}</Text>
          <Text style={styles.instructionPrompt}>{activeStage?.riddle}</Text>
          {activeStage?.choices?.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => setSelectedChoiceId(item.id)} style={[styles.choiceCard, selectedChoiceId === item.id && styles.choiceCardSelected]}>
              <Text style={styles.choiceLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeChoice}>
            <Text style={styles.analyzeButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: journeyAnimY }] }]}>
        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowJourney(false)}>
          <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.objectiveSection}>
          <Text style={styles.clueTitle}>Your Journey</Text>
          <Text style={styles.instructionPrompt}>Relics you've unearthed so far:</Text>
          <ScrollView horizontal style={{ marginBottom: Spacing.xl }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, alignItems: 'center' }}>
            {ADVENTURE_STAGES.slice(0, currentStageIndex).map((stage, idx, arr) => (
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
});

export default TreasureHuntScreen;
