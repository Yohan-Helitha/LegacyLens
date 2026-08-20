const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mobile-app/src/screens/home/HomeScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the index of `interface SpotlightItem {`
const idxStart = content.indexOf('interface SpotlightItem {');
if (idxStart === -1) {
  console.log('Could not find interface SpotlightItem');
  process.exit(1);
}

// Find where HomeScreen states start, e.g., `const [isPlayingAudio`
const idxEnd = content.indexOf('const [isPlayingAudio');
if (idxEnd === -1) {
  console.log('Could not find const [isPlayingAudio');
  process.exit(1);
}

// Extract everything before idxStart and after idxEnd
const before = content.substring(0, idxStart);
const after = content.substring(idxEnd);

// Define the correct missing content
const missing = `interface SpotlightItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

const SPOTLIGHT_ITEMS: SpotlightItem[] = [
  {
    id: '1',
    title: 'Nallur Festival',
    category: 'Tradition',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUFQOi6JTQxYufZD5r4T7feOJWcR-TowUyE5hz5brgj36kChsmmdmheJIiaV0Mslesw6MwYzJy41JFS0Sth1BRDeicDZ9woltwMnSQiuAhvrJSOVCkVpIE0ZZzvxWbE0CLlrcGcEVbALBlN0MDhLCPKoIspc1yNUmTkjy1gl7aimiTsXfb1S6r2W3HT62L3vCLIUEhIXu2FAXmTx7MW0dAzMPA2Sbfu8T710zathuocbHmf2AlsLmI',
  },
  {
    id: '2',
    title: 'Palmyra Crafts',
    category: 'Artisans',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDIKeFplu_8V74siKko3f5h_D0X2Y0xnVq6jnd-yWLz-y5sfsZVl4rGy8Ze28cxpDszMIH3rQ5ZvMqFxaCcrCTIpWevyw4hpaNHai8NNlieaZ5c9MPcKu-vppTFUnPAKmAuzf4idjqaTz8bXypu2bhqNQxYmUPzJLesAok48R5KEKMf_qCMM95nUmFhOP-awvI3X7-ReDQfs9DbywiUU7NutnaiCtL8iZSXoCrUvi_9fxRmPT1sT0e4',
  },
  {
    id: '3',
    title: 'Odiyal Kool',
    category: 'Cuisine',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSAF6va7clah5r0l7SWtHkDuIlDVFP0khY70SKJ8gXxGzKwGpaIZ-a_jHd4dBUZZSBT1Z7R5fYxxjKx6cMPSGJTXFM-EXi8S2BKuPUeNsFbkx10roi1bi4JNWbPTUmZeI_HiYexDnEc64xzeuxx0DwZG5Ed5lrWxFv42U5LlCpGbY3YLxbBItmlBqB9tKuP8JIE66btR-ji9ubQHi1dCtsmK73tGj-T17zl5i3kksHX_a9ISdLHmMX',
  },
];

const loadedVideoIds = new Set<string>();

const VideoLoader = () => {
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

  const getTLBR = (anim: any) => anim.interpolate({
    inputRange: [0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000],
    outputRange: [0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0]
  });
  const getTRBL = (anim: any) => anim.interpolate({
    inputRange: [0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000],
    outputRange: [0, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 0]
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
            borderTopLeftRadius: tlbr,
            borderBottomRightRadius: tlbr,
            borderTopRightRadius: trbl,
            borderBottomLeftRadius: trbl,
          }
        ]}
      />
    );
  };

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderGrid}>
        {renderSquare(p1_time, 'tl')}
        {renderSquare(p2_time, 'tr')}
        {renderSquare(p2_time, 'bl')}
        {renderSquare(p1_time, 'br')}
      </View>
    </View>
  );
};

const VideoCard = ({ v, isPlaying, item, setActivePostId, setCommentModalVisible }: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(() => loadedVideoIds.has(v.id));
  const [showLoader, setShowLoader] = useState(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isReady) {
      timer = setTimeout(() => setShowLoader(true), 500);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <View style={styles.authorInitialBubble}>
            <Text style={styles.authorInitialText}>{v.author[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.authorName, { flexShrink: 1 }]} adjustsFontSizeToFit={true} minimumFontScale={0.6} numberOfLines={1}>{v.author}</Text>
              <MaterialIcons name="verified" size={14} color="#fe893e" />
            </View>
            <Text style={styles.timeAgo}>Video</Text>
          </View>
        </View>
        <FollowButton />
      </View>

      <View style={styles.videoHeroContainer}>
        {showLoader && !isReady && <VideoLoader />}
        <Video
          source={{ uri: v.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4" }}
          style={[styles.videoThumbnail, !isReady && { opacity: 0 }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping
          isMuted={isMuted}
          useNativeControls={false}
          onReadyForDisplay={() => {
            setIsReady(true);
            loadedVideoIds.add(v.id);
          }}
          onLoadStart={() => {
            if (!loadedVideoIds.has(v.id)) {
              setIsReady(false);
            }
          }}
        />
        <View style={styles.videoBadgesRow}>
          <View style={styles.glassBadge}>
            <MaterialIcons name="schedule" size={13} color="#fff" />
            <Text style={styles.glassBadgeText}>{v.duration}</Text>
          </View>
          {v.location && (
            <View style={styles.glassBadge}>
              <MaterialIcons name="location-on" size={13} color="#fff" />
              <Text style={styles.glassBadgeText}>{v.location}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.muteButton}
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.8}
        >
          <MaterialIcons name={isMuted ? "volume-off" : "volume-up"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoBottomOverlay}>
        <Text style={[styles.videoTitle, { color: Colors.text }]} numberOfLines={2}>{v.title}</Text>
      </View>

      <FeedCardActions
        initialLikes={Math.floor(Math.random() * 500) + 20}
        initialComments={Math.floor(Math.random() * 100) + 5}
        onCommentPress={() => {
          setActivePostId(item.id);
          setCommentModalVisible(true);
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Definition
// ─────────────────────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Explore all');
  const [refreshing, setRefreshing] = useState(false);

  // Voice Search
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  // Comment Modal
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activePostId, setActivePostId] = useState('');

  // Missing states & callbacks
  `;

const newContent = before + missing + after;
fs.writeFileSync(filePath, newContent);
console.log('Fixed HomeScreen.tsx');
