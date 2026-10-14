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
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

import { Colors } from '../../theme';
import { styles } from './CulturalMapScreen.styles';

// Reads from EXPO_PUBLIC_MAPBOX_TOKEN in your .env file
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.28;

import { mapApi, MapLandmarkResponse } from '../../services/api/mapApi';
import { useTreasureHunt } from '../../context/TreasureHuntContext';

type Mode = 'explore' | 'treasure_hunt';

const REGIONS = [
  { id: 'all', label: 'All Regions', desc: 'Explore the entire island', lng: 80.85, lat: 7.8, zoom: 7.2, regionName: 'All' },
  { id: 'r1', label: 'Northern Sri Lanka', desc: 'Jaffna / Mannar / Kilinochchi / Mullaitivu', lng: 80.4, lat: 9.3, zoom: 7.5, regionName: 'Northern Province' },
  { id: 'r2', label: 'North Central', desc: 'Anuradhapura / Polonnaruwa', lng: 80.5, lat: 8.2, zoom: 8.2, regionName: 'North Central Province' },
  { id: 'r3', label: 'Eastern Sri Lanka', desc: 'Trincomalee / Batticaloa / Ampara', lng: 81.4, lat: 7.8, zoom: 7.5, regionName: 'Eastern Province' },
  { id: 'r4', label: 'North Western', desc: 'Puttalam / Kurunegala', lng: 80.1, lat: 7.7, zoom: 8.2, regionName: 'North Western Province' },
  { id: 'r5', label: 'Central Highlands', desc: 'Kandy / Matale / Nuwara Eliya', lng: 80.7, lat: 7.1, zoom: 8.5, regionName: 'Central Highlands' },
  { id: 'r6', label: 'Uva & Eastern Highlands', desc: 'Badulla / Monaragala', lng: 81.2, lat: 6.9, zoom: 8.2, regionName: 'Uva Province' },
  { id: 'r7', label: 'Western Sri Lanka', desc: 'Colombo / Gampaha / Kalutara', lng: 80.0, lat: 6.9, zoom: 8.5, regionName: 'Western Province' },
  { id: 'r8', label: 'Southern & Sabaragamuwa', desc: 'Galle / Matara / Ratnapura / Kegalle', lng: 80.5, lat: 6.3, zoom: 8.2, regionName: 'Southern Province' }
];

// ── Mapbox HTML injected into WebView ─────────────────────────────────────────
const buildMapHTML = (token: string, areas: MapLandmarkResponse[]) => {
  const geojsonFeatures = areas.map(a => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
    properties: {
      id: a.id,
      name: a.name,
      icon: a.icon,
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
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; overflow: hidden; }
  .landmark-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }
  .landmark-model-wrap {
    width: 90px;
    height: 90px;
    position: relative;
  }
  .landmark-label {
    background: #004343;
    color: #fff;
    border: 1.5px solid #fff;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 10px;
    font-family: sans-serif;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    margin-top: -10px;
    position: relative;
    z-index: 2;
  }
  .landmark-pin {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 10px solid #004343;
    position: relative;
    z-index: 2;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
mapboxgl.accessToken = '${token}';

var SL_BOUNDS = [
  [79.5, 5.85],
  [81.95, 9.9]
];

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [80.85, 7.8],
  zoom: 7.2,
  pitch: 50,
  bearing: 0,
  minZoom: 6.8,
  maxZoom: 14,
  maxBounds: SL_BOUNDS,
});

var features = ${JSON.stringify(geojsonFeatures)};
var htmlMarkers = [];

map.on('load', function() {
  // 3D terrain
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });

  map.setFog({
    color: 'rgba(220, 240, 255, 0.6)',
    'high-color': '#b0d4e8',
    'horizon-blend': 0.06,
  });

  // HTML model-viewer markers for landmarks WITH a 3D model
  features.forEach(function(f) {
    var props = f.properties;
    if (!props.modelUrl) return;

    var el = document.createElement('div');
    el.className = 'landmark-marker';

    var wrap = document.createElement('div');
    wrap.className = 'landmark-model-wrap';

    var mv = document.createElement('model-viewer');
    mv.setAttribute('src', props.modelUrl);
    mv.setAttribute('loading', 'eager');
    mv.setAttribute('reveal', 'auto');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('disable-zoom', '');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('exposure', '1.1');
    mv.setAttribute('min-camera-orbit', 'auto 75deg auto');
    mv.setAttribute('max-camera-orbit', 'auto 75deg auto');
    mv.setAttribute('field-of-view', '30deg');
    mv.style.cssText = 'width:100%;height:100%;background:transparent;outline:none;pointer-events:none;';
    wrap.appendChild(mv);
    el.appendChild(wrap);

    var label = document.createElement('div');
    label.className = 'landmark-label';
    label.textContent = props.name;
    el.appendChild(label);

    var pin = document.createElement('div');
    pin.className = 'landmark-pin';
    el.appendChild(pin);

    el.addEventListener('click', function() {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'MARKER_PRESS', id: props.id })
      );
    });

    var marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([f.geometry.coordinates[0], f.geometry.coordinates[1]])
      .addTo(map);

    htmlMarkers.push({ marker: marker, id: props.id, region: props.region });
  });

  map.once('idle', function() {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'MAP_LOADED' })
    );
  });
});

// Forward zoom events to RN
map.on('zoom', function() {
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: 'ZOOM', zoom: map.getZoom() })
  );
});

window.flyTo = function(lng, lat, zoom) {
  map.flyTo({ center: [lng, lat], zoom: zoom || 10, pitch: 55, duration: 1400, essential: true });
};
window.resetCamera = function() {
  map.flyTo({ center: [80.85, 7.8], zoom: 7.2, pitch: 50, duration: 1400, essential: true });
};
window.filterRegion = function(regionName, lng, lat, zoom) {
  // Show/hide HTML model-viewer markers by region
  htmlMarkers.forEach(function(m) {
    var visible = !regionName || regionName === 'All' || m.region === regionName;
    m.marker.getElement().style.display = visible ? 'flex' : 'none';
  });

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
  backdrop: { ...(StyleSheet.absoluteFill as object), backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 30 },
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
    paddingBottom: 20,
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
  onNavigateSearch?: (query: string) => void;
  isActive?: boolean;
  initialRegion?: string;
}

export const CulturalMapScreen: React.FC<CulturalMapProps> = ({
  onNavigate,
  onNavigateSearch,
  isActive = true,
  initialRegion,
}) => {
  const { unlockedBadges } = useTreasureHunt();
  const [mode, setMode] = useState<Mode>('explore');
  const [areas, setAreas] = useState<MapLandmarkResponse[]>([]);
  const [mapHtml, setMapHtml] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<MapLandmarkResponse | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [huntStep, setHuntStep] = useState(0);
  const [treasureFound, setTreasureFound] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const webViewRef = useRef<WebView>(null);



  React.useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const response = await mapApi.getLandmarks();
        if (response && response.length > 0) {
          setAreas(response);
          setMapHtml(buildMapHTML(MAPBOX_TOKEN, response));
        }
      } catch (e) {
        console.log('Failed to fetch landmarks', e);
      }
    };
    fetchLandmarks();
  }, []);

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

  const oceanPlayer = useAudioPlayer(require('../../../assets/sounds/ocean.mp3'));

  React.useEffect(() => {
    let isMounted = true;

    if (isActive) {
      try {
        oceanPlayer.loop = true;
        oceanPlayer.volume = 1.0;
        oceanPlayer.play();
      } catch (err) {
        console.log('Failed to play ocean sound', err);
      }
    } else {
      try {
        oceanPlayer.pause();
      } catch (_) {}
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isActive && isMounted) {
        try { oceanPlayer.play(); } catch (_) {}
      } else {
        try { oceanPlayer.pause(); } catch (_) {}
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
      try {
        oceanPlayer.pause();
      } catch (_) {}
    };
  }, [isActive, oceanPlayer]);
  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'MAP_LOADED') {
        setIsMapLoading(false);
        return;
      }
      if (msg.type === 'MARKER_PRESS') {
        const area = areas.find(a => a.id === msg.id);
        if (!area) return;

        // Treasure Hunt logic
        if (mode === 'treasure_hunt') {
          const targets = areas.filter(a => a.badge != null).map(a => a.id);
          const target = targets[huntStep];
          if (msg.id === target) {
            if (huntStep + 1 >= targets.length) {
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
    } catch (_) { }
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
      {mapHtml && (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: mapHtml }}
          originWhitelist={['*']}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          cacheEnabled={true}
        />
      )}

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
            <Text style={styles.hudBadgeText}>{unlockedBadges.length}</Text>
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

            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => {
                if (selectedArea) {
                  handleCloseSheet();
                  if (onNavigateSearch) {
                    onNavigateSearch(selectedArea.name);
                  } else if (onNavigate) {
                    onNavigate('search');
                  }
                }
              }}
            >
              <Text style={styles.exploreBtnText}>Explore Location</Text>
              <Feather name="arrow-right" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {treasureFound && (
          <View style={styles.treasureFoundContainer}>
            <Ionicons name="star" size={52} color={Colors.accent} />
            <Text style={styles.treasureTitle}>All Treasures Found!</Text>
            <Text style={styles.treasureReward}>+500 XP Earned</Text>
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
