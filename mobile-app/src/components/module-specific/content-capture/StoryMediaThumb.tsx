import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FileText, Mic, Play } from 'lucide-react-native';
import { Radii } from '../../../theme';
import type { StoryMediaType } from '../../../types/story';
import { ContentCaptureColors as D } from './tokens';

interface StoryMediaThumbProps {
  /** null means a written/text story — there's no media to preview. */
  mediaType: StoryMediaType | null;
  variant: 'hero' | 'list';
}

/**
 * The visual identity of a story in the My Stories list (Screen 6). Video
 * gets a warm gradient "hero" treatment with a play affordance — there's no
 * real frame-thumbnail pipeline yet (that would mean adding video-frame
 * extraction, either client-side or as a new backend job), so this is a
 * deliberate, warm-toned stand-in rather than a flat icon-on-white. Audio
 * and text stories, which have no visual to preview at all, instead get a
 * softly tinted card — teal for audio, mango for text — so the list still
 * reads with gentle color variation instead of a flat repeating pattern.
 */
export const StoryMediaThumb: React.FC<StoryMediaThumbProps> = ({ mediaType, variant }) => {
  const isHero = variant === 'hero';
  const [size, setSize] = useState({ width: 0, height: 0 });

  if (mediaType === 'VIDEO') {
    return (
      <View
        style={[s.base, isHero ? s.heroBase : s.listBase]}
        onLayout={(e) => setSize(e.nativeEvent.layout)}
      >
        {size.width > 0 && size.height > 0 && (
          <Svg style={StyleSheet.absoluteFillObject} width={size.width} height={size.height}>
            <Defs>
              <LinearGradient id="videoThumbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={D.secondaryContainer} />
                <Stop offset="100%" stopColor={D.primary} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#videoThumbGrad)" />
          </Svg>
        )}
        <View style={[s.playWrap, isHero ? s.playWrapHero : s.playWrapList]}>
          <Play
            size={isHero ? 26 : 16}
            color="#ffffff"
            fill="#ffffff"
            strokeWidth={0}
            style={{ marginLeft: 2 }}
          />
        </View>
      </View>
    );
  }

  const isAudio = mediaType === 'AUDIO';
  const Icon = isAudio ? Mic : FileText;

  return (
    <View
      style={[
        s.base,
        isHero ? s.heroBase : s.listBase,
        { backgroundColor: isAudio ? D.audioTint : D.textTint },
      ]}
    >
      <View
        style={[
          s.iconWrap,
          isHero ? s.iconWrapHero : s.iconWrapList,
          { backgroundColor: isAudio ? 'rgba(15,92,92,0.14)' : 'rgba(254,137,62,0.16)' },
        ]}
      >
        <Icon
          size={isHero ? 30 : 18}
          color={isAudio ? D.primary : D.secondary}
          strokeWidth={2}
        />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroBase: { width: '100%', height: 168 },
  listBase: { width: 72, height: 72, borderRadius: Radii.lg },

  playWrap: {
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playWrapHero: { width: 56, height: 56 },
  playWrapList: { width: 32, height: 32 },

  iconWrap: { borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  iconWrapHero: { width: 60, height: 60 },
  iconWrapList: { width: 40, height: 40 },
});

export default StoryMediaThumb;
