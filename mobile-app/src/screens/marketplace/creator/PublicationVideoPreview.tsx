import React from 'react';
import { ImageBackground, Text, View } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../../theme';
import { styles } from '../../content-details/video-detail/VideoDetailScreen.styles';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';
import { resolveImageUrl } from '../../../constants/api';
import type { JobResponse } from '../../../types/creatorDashboard';
import type { WorkProgressResponse } from '../../../types/workProgress';

const IMAGE = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm|3gp|mkv)$/i;

const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

/**
 * The video layout of a published story - the same arrangement as VideoDetailScreen (player, title and
 * meta, knowledge-keeper card, "Why This Matters", places and tradition tiles) filled from what the
 * creator saved on the Continue My Work page: the uploaded video, the introduction and story, and the
 * search keywords.
 */
export const PublicationVideoPreview: React.FC<{ job: JobResponse; progress: WorkProgressResponse; publishedOn: string | null }> = ({ job, progress, publishedOn }) => {
  const video = progress.materials.find(m => VIDEO.test(m.fileName) || VIDEO.test(m.fileUrl));
  const photo = progress.materials.find(m => IMAGE.test(m.fileName) || IMAGE.test(m.fileUrl));
  const poster = photo ? { uri: resolveImageUrl(photo.fileUrl) ?? '' } : (resolveOpportunityImage(job.heroImageUrl ?? null) ?? GENERIC_HERO_IMAGE);
  const text = [progress.introduction, progress.story].map(x => x?.trim()).filter(Boolean).join('\n\n');
  const initial = (job.elderName || '?').charAt(0).toUpperCase();
  const tags = [job.category, ...progress.seoKeywords].filter((t): t is string => !!t);

  return (
    <View style={{ backgroundColor: '#fdfaf6' }}>
      <View style={[styles.heroVideo, { height: 220 }]}>
        {video ? (
          <Video source={{ uri: resolveImageUrl(video.fileUrl) ?? '' }} style={styles.heroImg} useNativeControls resizeMode={ResizeMode.COVER} posterSource={poster} usePoster />
        ) : (
          <ImageBackground source={poster} style={styles.heroImg} />
        )}
      </View>

      <View style={styles.contentBody}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{job.title}</Text>

          <View style={styles.metaRow}>
            {!!job.location && (
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color={Colors.secondary} />
                <Text style={styles.metaText}>{job.location}</Text>
              </View>
            )}
            {!!publishedOn && (
              <View style={styles.metaItem}>
                <MaterialIcons name="event" size={16} color={Colors.secondary} />
                <Text style={styles.metaText}>{publishedOn}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }}>{initial}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, fontWeight: '700', color: Colors.text }}>{job.elderName}</Text>
              <Text style={{ fontFamily: Typography.fontBody, fontSize: 12, color: Colors.textMuted }}>Knowledge Keeper</Text>
            </View>
          </View>

          {tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 }}>
              {tags.map(tag => (
                <View
                  key={tag}
                  style={{
                    backgroundColor: 'rgba(254, 137, 62, 0.1)', paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(254, 137, 62, 0.2)',
                  }}
                >
                  <Text style={{ fontSize: 12, color: Colors.accent, fontFamily: Typography.fontBodyMed }}>#{tag.replace(/\s+/g, '')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.profileDeco} />
            <View style={styles.rowCenterHead}>
              <MaterialIcons name="psychology" size={18} color={Colors.secondary} />
              <Text style={styles.profileHeadText}>KNOWLEDGE KEEPER</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <View style={[styles.profileAvatarBox, { backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '700' }}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{job.elderName}</Text>
                <Text style={styles.profileRole}>Knowledge Keeper</Text>
              </View>
            </View>
          </View>
        </View>

        {!!text && (
          <View style={styles.section}>
            <View style={styles.contextHeader}>
              <View style={styles.contextLine} />
              <Text style={styles.sectionTitle}>Why This Matters</Text>
            </View>
            <View style={styles.contextBody}>
              <Text style={styles.bodyText}>{text}</Text>
            </View>
          </View>
        )}

        {(!!job.location || !!job.category) && (
          <View style={styles.section}>
            <Text style={styles.sectionSubhead}>Places & Traditions</Text>
            <View style={styles.bentoRow}>
              {!!job.location && (
                <View style={styles.bentoCardSmall}>
                  <View style={styles.bentoIconSecondary}>
                    <MaterialIcons name="location-on" size={20} color={Colors.accent} />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={1}>{job.location.split(',')[0]}</Text>
                  <Text style={styles.bentoDesc}>Cultural Location</Text>
                </View>
              )}
              {!!job.category && (
                <View style={styles.bentoCardSmall}>
                  <View style={styles.bentoIconTertiary}>
                    <MaterialIcons name="theater-comedy" size={20} color="#363c42" />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={1}>{job.category.toUpperCase()}</Text>
                  <Text style={styles.bentoDesc}>Living Tradition</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
