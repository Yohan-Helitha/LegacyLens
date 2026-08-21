import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors } from '../../theme';
import { styles } from './CulturalMapScreen.styles';

// Reads from EXPO_PUBLIC_MAPBOX_TOKEN in your .env file
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.57;

type Mode = 'explore' | 'treasure_hunt';

import mockData from '../admin/mockData.json';

interface CulturalArea {
  id: string;
  name: string;
  description: string;
  lng: number;
  lat: number;
  icon: string;
  isEvent?: boolean;
  image?: string;
  modelUrl?: string;
  region: string;
}

const AREAS: CulturalArea[] = mockData.mapLocations;

const TREASURE_HUNT = {
  clues: [
    'I rise from the jungle as a mighty rock fortress. Kings once lived atop me. Find me in the north-central plains.',
    'You found Sigiriya! Now head south to the city of gems — precious stones have been mined here for over 2,000 years.',
  ],
  targets: ['sigiriya', 'ratnapura'],
  reward: 250,
};

const REGIONS = [
  {
    id: 'all',
    label: 'All Regions',
    desc: 'Explore the entire island',
    lng: 80.85,
    lat: 7.8,
    zoom: 7.2,
    regionName: 'All',
  },
  {
    id: 'r1',
    label: 'Northern Sri Lanka',
    desc: 'Jaffna / Mannar / Kilinochchi / Mullaitivu',
    lng: 80.4,
    lat: 9.3,
    zoom: 7.5,
    regionName: 'Northern Province',
  },
  {
    id: 'r2',
    label: 'North Central',
    desc: 'Anuradhapura / Polonnaruwa',
    lng: 80.5,
    lat: 8.2,
    zoom: 8.2,
    regionName: 'North Central Province',
  },
  {
    id: 'r3',
    label: 'Eastern Sri Lanka',
    desc: 'Trincomalee / Batticaloa / Ampara',
    lng: 81.4,
    lat: 7.8,
    zoom: 7.5,
    regionName: 'Eastern Province',
  },
  {
    id: 'r4',
    label: 'North Western',
    desc: 'Puttalam / Kurunegala',
    lng: 80.1,
    lat: 7.7,
    zoom: 8.2,
    regionName: 'North Western Province',
  },
  {
    id: 'r5',
    label: 'Central Highlands',
    desc: 'Kandy / Matale / Nuwara Eliya',
    lng: 80.7,
    lat: 7.1,
    zoom: 8.5,
    regionName: 'Central Highlands',
  },
  {
    id: 'r6',
    label: 'Uva & Eastern Highlands',
    desc: 'Badulla / Monaragala',
    lng: 81.2,
    lat: 6.9,
    zoom: 8.2,
    regionName: 'Uva Province',
  },
  {
    id: 'r7',
    label: 'Western Sri Lanka',
    desc: 'Colombo / Gampaha / Kalutara',
    lng: 80.0,
    lat: 6.9,
    zoom: 8.5,
    regionName: 'Western Province',
  },
  {
    id: 'r8',
    label: 'Southern & Sabaragamuwa',
    desc: 'Galle / Matara / Ratnapura / Kegalle',
    lng: 80.5,
    lat: 6.3,
    zoom: 8.2,
    regionName: 'Southern Province',
  },
];

// ── Mapbox HTML injected into WebView ─────────────────────────────────────────
const buildMapHTML = (token: string, areas: CulturalArea[]) => {
  const geojsonFeatures = areas.map(a => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
    properties: {
      id: a.id,
      name: a.name,
      icon: a.icon,
      isEvent: a.isEvent ?? false,
      image: a.image,
      modelUrl: a.modelUrl,
      region: a.region,
    },
  }));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; overflow: hidden; }
  .marker-bubble.event { border-color: #FE893E; background: #FFF5F0; }
</style>
</head>
<body>
<div id="map"></div>
<script>
mapboxgl.accessToken = '${token}';

const SL_BOUNDS = [
  [79.5, 5.85],  // SW — Very tight bounds to prevent seeing India
  [81.95, 9.9]   // NE
];

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [80.85, 7.8],
  zoom: 7.2,
  pitch: 50,
  bearing: 0,
  minZoom: 6.8,
  maxZoom: 14,
  maxBounds: SL_BOUNDS,
});

map.on('load', () => {
  // ── 3D terrain ───────────────────────────────────────────────────────────
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });

  // Sky atmosphere
  map.setFog({
    color: 'rgba(220, 240, 255, 0.6)',
    'high-color': '#b0d4e8',
    'horizon-blend': 0.06,
  });

  // Hide roads, transit lines, and default labels (cities/POIs/countries)
  const style = map.getStyle();
  if (style && style.layers) {
    style.layers.forEach(layer => {
      if (
        layer.id.includes('road') || 
        layer.id.includes('bridge') || 
        layer.id.includes('tunnel') || 
        layer.id.includes('path') || 
        layer.id.includes('transit') ||
        layer.id.includes('aeroway') ||
        layer.id.includes('label') ||
        layer.id.includes('place') ||
        layer.id.includes('poi') ||
        layer.id.includes('admin') ||
        layer.id.includes('country')
      ) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    });
  }

  // ── Place cultural markers as native WebGL points ─────────────────────
  const features = ${JSON.stringify(geojsonFeatures)};
  
  map.addSource('cultural-landmarks', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features
    }
  });

  // ── Load 3D Models dynamically ─────────────────────────────────────
  const uniqueModels = new Set();
  features.forEach(f => {
    if (f.properties.modelUrl) uniqueModels.add(f.properties.modelUrl);
  });
  uniqueModels.forEach(url => {
    map.addModel(url, url);
  });

  // Draw the 3D models
  map.addLayer({
    id: 'landmark-models',
    type: 'model',
    source: 'cultural-landmarks',
    filter: ['has', 'modelUrl'],
    layout: {
      'model-id': ['get', 'modelUrl']
    },
    paint: {
      // Scale reduced so it acts like a normal map pin
      'model-scale': [1800, 1800, 1800],
      'model-rotation': [0, 0, 0]
    }
  });

  // Fallback points (circles) for locations without models
  map.addLayer({
    id: 'landmark-points',
    type: 'circle',
    source: 'cultural-landmarks',
    filter: ['!', ['has', 'modelUrl']],
    paint: {
      'circle-radius': 7,
      'circle-color': '#FE893E',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-pitch-alignment': 'map'
    }
  });

  // Draw the text labels under the points
  map.addLayer({
    id: 'landmark-labels',
    type: 'symbol',
    source: 'cultural-landmarks',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 13,
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 1.5,
      'text-justify': 'auto',
      'text-allow-overlap': false
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#0e1823',
      'text-halo-width': 2
    }
  });

  // Handle clicking on models or points
  const clickHandler = (e) => {
    if (!e.features.length) return;
    const feature = e.features[0];
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'MARKER_PRESS', id: feature.properties.id })
    );
  };
  map.on('click', 'landmark-models', clickHandler);
  map.on('click', 'landmark-points', clickHandler);

  // Change cursor on hover
  const enterHandler = () => { map.getCanvas().style.cursor = 'pointer'; };
  const leaveHandler = () => { map.getCanvas().style.cursor = ''; };
  map.on('mouseenter', 'landmark-models', enterHandler);
  map.on('mouseleave', 'landmark-models', leaveHandler);
  map.on('mouseenter', 'landmark-points', enterHandler);
  map.on('mouseleave', 'landmark-points', leaveHandler);
  
  // Wait until everything is fully loaded and rendered before hiding the loading screen
  map.once('idle', () => {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'MAP_LOADED' })
    );
  });
});

// Forward zoom events to RN
map.on('zoom', () => {
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: 'ZOOM', zoom: map.getZoom() })
  );
});

// Expose function so RN can fly camera
window.flyTo = (lng, lat, zoom) => {
  map.flyTo({ center: [lng, lat], zoom: zoom ?? 10, pitch: 55, duration: 1400, essential: true });
};
window.resetCamera = () => {
  map.flyTo({ center: [80.85, 7.8], zoom: 7.2, pitch: 50, duration: 1400, essential: true });
};
window.filterRegion = function(regionName, lng, lat, zoom) {
  var LAYERS = ['landmark-models', 'landmark-points', 'landmark-labels'];

  LAYERS.forEach(function(layerId) {
    if (!map.getLayer(layerId)) return;

    if (!regionName || regionName === 'All') {
      // Restore original layer defaults
      if (layerId === 'landmark-models') {
        map.setFilter(layerId, ['has', 'modelUrl']);
      } else if (layerId === 'landmark-points') {
        map.setFilter(layerId, ['!', ['has', 'modelUrl']]);
      } else {
        map.setFilter(layerId, null);
      }
    } else {
      // Show only features whose 'region' property matches
      if (layerId === 'landmark-models') {
        map.setFilter(layerId, ['all', ['has', 'modelUrl'], ['==', ['get', 'region'], regionName]]);
      } else if (layerId === 'landmark-points') {
        map.setFilter(layerId, ['all', ['!', ['has', 'modelUrl']], ['==', ['get', 'region'], regionName]]);
      } else {
        map.setFilter(layerId, ['==', ['get', 'region'], regionName]);
      }
    }
  });

  // Fly AFTER filter so the remaining landmarks are visible on arrival
  if (!regionName || regionName === 'All') {
    map.flyTo({ center: [80.85, 7.8], zoom: 7.2, pitch: 50, duration: 900, essential: true });
  } else {
    map.flyTo({ center: [lng, lat], zoom: zoom, pitch: 45, duration: 900, essential: true });
  }
};
</script>
</body>
</html>`;
};

// ── Cached module-level HTML — computed once, never rebuilt ──────────────────
const MAP_HTML = buildMapHTML(MAPBOX_TOKEN, AREAS);

// ── Animated Loading Square ───────────────────────────────────────────────────
const AnimatedLoader = () => {
  const time = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(time, {
        toValue: 4000,
        duration: 4000,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ).start();
  }, [time]);

  const getTLBR = (anim: any) =>
    anim.interpolate({
      inputRange: [
        0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000,
      ],
      outputRange: [0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0],
    });
  const getTRBL = (anim: any) =>
    anim.interpolate({
      inputRange: [
        0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000,
      ],
      outputRange: [0, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 0],
    });

  const p1_time = time;
  const p2_time = Animated.modulo(Animated.add(time, 1000), 4000);

  const renderSquare = (p_time: any, key: string) => {
    const tlbr = getTLBR(p_time);
    const trbl = getTRBL(p_time);
    return (
      <Animated.View
        key={key}
        style={[
          styles.loaderSquare,
          {
            borderTopLeftRadius: tlbr as any,
            borderBottomRightRadius: tlbr as any,
            borderTopRightRadius: trbl as any,
            borderBottomLeftRadius: trbl as any,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.loaderGrid}>
      {renderSquare(p1_time, 'tl')}
      {renderSquare(p2_time, 'tr')}
      {renderSquare(p2_time, 'bl')}
      {renderSquare(p1_time, 'br')}
    </View>
  );
};

// ── Simple slide-up panel ─────────────────────────────────────────────────────
function SlidePanel({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SHEET_HEIGHT * 0.3) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity style={panelStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[panelStyles.sheet, { transform: [{ translateY }] }]}
        {...pan.panHandlers}
      >
        <View style={panelStyles.handle} />
        {children}
      </Animated.View>
    </>
  );
}

const panelStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 30 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 40,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 16,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
interface CulturalMapProps {
  onNavigate?: (tab: string) => void;
  isActive?: boolean;
  initialRegion?: string;
}

export const CulturalMapScreen: React.FC<CulturalMapProps> = ({
  onNavigate,
  isActive = true,
  initialRegion,
}) => {
  const [mode, setMode] = useState<Mode>('explore');
  const [selectedArea, setSelectedArea] = useState<CulturalArea | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [huntStep, setHuntStep] = useState(0);
  const [treasureFound, setTreasureFound] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const webViewRef = useRef<WebView>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const soundIdRef = useRef(0);

  React.useEffect(() => {
    if (initialRegion && webViewRef.current && !isMapLoading) {
      const region = REGIONS.find(
        r => r.regionName === initialRegion || r.id === initialRegion || r.label === initialRegion
      );
      if (region) {
        // Adding a slight delay to ensure the map is ready for the javascript
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(
            `window.filterRegion(${JSON.stringify(region.regionName)}, ${region.lng}, ${region.lat}, ${region.zoom}); true;`
          );
        }, 500);
      }
    }
  }, [initialRegion, isMapLoading]);

  const sidebarAnimX = useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
    Animated.spring(sidebarAnimX, {
      toValue: filterVisible ? 0 : -300,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [filterVisible]);

  const stopSound = async () => {
    soundIdRef.current += 1;
    if (soundRef.current) {
      const sound = soundRef.current;
      soundRef.current = null;
      await sound.unloadAsync();
    }
  };

  const playOceanSound = async () => {
    const playId = ++soundIdRef.current;
    try {
      if (soundRef.current) {
        const sound = soundRef.current;
        soundRef.current = null;
        await sound.unloadAsync();
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(require('../../../assets/sounds/ocean.mp3'), {
        shouldPlay: false,
        isLooping: true,
        volume: 1.0,
      });
      if (playId === soundIdRef.current) {
        soundRef.current = sound;
        await sound.playAsync();
      } else {
        await sound.unloadAsync();
      }
    } catch (error) {
      console.warn('Error playing ocean sound', error);
    }
  };

  const playLocationSound = async (id: string) => {
    const playId = ++soundIdRef.current;
    try {
      if (soundRef.current) {
        const sound = soundRef.current;
        soundRef.current = null;
        await sound.unloadAsync();
      }

      let soundFile;
      if (id === 'ella' || id === 'nuwara' || id === 'ratnapura') {
        soundFile = require('../../../assets/sounds/waterfall.mp3');
      } else {
        soundFile = require('../../../assets/sounds/bells.mp3');
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: false,
        isLooping: true,
        volume: 1.0,
      });
      if (playId === soundIdRef.current) {
        soundRef.current = sound;
        await sound.playAsync();
      } else {
        await sound.unloadAsync();
      }
    } catch (error) {
      console.warn('Error playing location sound', error);
    }
  };

  React.useEffect(() => {
    if (isActive) {
      if (!selectedArea) {
        playOceanSound();
      } else {
        playLocationSound(selectedArea.id);
      }
    } else {
      stopSound();
    }

    return () => {
      stopSound();
    };
  }, [isActive, selectedArea]);

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'MAP_LOADED') {
        setIsMapLoading(false);
        return;
      }
      if (msg.type === 'MARKER_PRESS') {
        const area = AREAS.find(a => a.id === msg.id);
        if (!area) return;

        // Treasure Hunt logic
        if (mode === 'treasure_hunt') {
          const target = TREASURE_HUNT.targets[huntStep];
          if (msg.id === target) {
            if (huntStep + 1 >= TREASURE_HUNT.targets.length) {
              setTreasureFound(true);
            } else {
              setHuntStep(prev => prev + 1);
            }
          }
        }

        setSelectedArea(area);
        setSheetVisible(true);

        // Fly camera to marker
        webViewRef.current?.injectJavaScript(`flyTo(${area.lng}, ${area.lat}, 11); true;`);
      }
    } catch (_) {}
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setSelectedArea(null);
    // Fly back to Sri Lanka overview
    webViewRef.current?.injectJavaScript(`resetCamera(); true;`);
  };

  const handleResetMode = () => {
    setMode('explore');
    setHuntStep(0);
    setTreasureFound(false);
    setSheetVisible(false);
    setSelectedArea(null);
    webViewRef.current?.injectJavaScript(`resetCamera(); true;`);
  };

  return (
    <View style={styles.container}>
      {isMapLoading && (
        <View style={styles.loadingOverlay}>
          <AnimatedLoader />
          <Text style={styles.loadingText}>Initializing Cultural Terrain...</Text>
        </View>
      )}

      {/* ── Mapbox GL via WebView ──────────────────────────────────── */}
      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFill}
        source={{ html: MAP_HTML }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        cacheEnabled={true}
      />

      {/* ── Left Sidebar Filter ────────────────────────────────────── */}
      <Animated.View
        style={[styles.sidebarContainer, { transform: [{ translateX: sidebarAnimX }] }]}
      >
        <View style={styles.sidebarContent}>
          <Text style={styles.filterSheetTitle}>Explore Regions</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {REGIONS.map((region, idx) => (
              <TouchableOpacity
                key={region.id}
                style={[styles.filterItem, idx === REGIONS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  setFilterVisible(false);
                  const rn = region.regionName;
                  webViewRef.current?.injectJavaScript(
                    `window.filterRegion(${JSON.stringify(rn)}, ${region.lng}, ${region.lat}, ${region.zoom}); true;`
                  );
                }}
              >
                <Text style={styles.filterItemText}>{region.label}</Text>
                <Text style={[styles.sheetDescription, { marginBottom: 0, marginTop: 4 }]}>
                  {region.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.sidebarToggleBtn}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <Feather
            name={filterVisible ? 'chevron-left' : 'sliders'}
            size={24}
            color={Colors.secondary}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Top Right HUD Controls ─────────────────────────────────── */}
      <View style={styles.topRightControls}>
        <TouchableOpacity
          style={styles.hudButton}
          onPress={() => {
            if (onNavigate) {
              onNavigate('badges');
            } else {
              console.log('Badges opened');
            }
          }}
        >
          <Image
            source={require('../../../assets/map/badges.png')}
            style={{ width: 64, height: 64, resizeMode: 'contain' }}
          />
          <View style={styles.hudBadge}>
            <Text style={styles.hudBadgeText}>3</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hudButton}
          onPress={() => {
            if (onNavigate) {
              onNavigate('hunt');
            } else {
              setMode(mode === 'explore' ? 'treasure_hunt' : 'explore');
              if (mode === 'explore') setHuntStep(0);
            }
          }}
        >
          <Image
            source={require('../../../assets/map/treasure-hunt.png')}
            style={{
              width: 96,
              height: 96,
              resizeMode: 'contain',
              tintColor: mode === 'treasure_hunt' ? Colors.accent : undefined,
            }}
          />
          {mode === 'treasure_hunt' && (
            <View style={styles.hudBadge}>
              <Text style={styles.hudBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Slide-up detail panel ────────────────────────────────── */}
      <SlidePanel visible={sheetVisible} onClose={handleCloseSheet}>
        {selectedArea && !treasureFound && (
          <View style={styles.sheetContentWrapper}>
            {selectedArea.image && (
              <Image
                source={{ uri: selectedArea.image }}
                style={styles.sheetHeroImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetRegion}>{selectedArea.region}</Text>
              <Text style={{ fontSize: 24 }}>{selectedArea.icon}</Text>
            </View>

            <Text style={styles.sheetTitle}>{selectedArea.name}</Text>
            <Text style={styles.sheetDescription}>{selectedArea.description}</Text>

            <View style={styles.sheetStats}>
              <View style={styles.statBadge}>
                <Feather name="map-pin" size={14} color={Colors.secondary} />
                <Text style={styles.statText}>View on Map</Text>
              </View>
              <View style={styles.statBadge}>
                <Feather name="headphones" size={14} color={Colors.secondary} />
                <Text style={styles.statText}>Listen to Story</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.exploreBtn}>
              <Text style={styles.exploreBtnText}>Explore Location</Text>
              <Feather name="arrow-right" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {treasureFound && (
          <View style={styles.treasureFoundContainer}>
            <Ionicons name="star" size={52} color={Colors.accent} />
            <Text style={styles.treasureTitle}>All Treasures Found!</Text>
            <Text style={styles.treasureReward}>+{TREASURE_HUNT.reward} XP Earned</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={handleResetMode}>
              <Text style={styles.exploreBtnText}>Claim Reward</Text>
            </TouchableOpacity>
          </View>
        )}
      </SlidePanel>
    </View>
  );
};

export default CulturalMapScreen;
