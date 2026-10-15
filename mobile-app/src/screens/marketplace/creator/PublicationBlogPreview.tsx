import React from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../../theme';
import { styles } from '../../content-details/blog-detail/BlogDetailScreen.styles';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';
import { resolveImageUrl } from '../../../constants/api';
import type { JobResponse } from '../../../types/creatorDashboard';
import type { WorkProgressResponse } from '../../../types/workProgress';

const IMAGE = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;

const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

/** Splits the written description into paragraphs; blank lines separate them. */
function paragraphsOf(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

/**
 * The blog layout of a published story - the same arrangement as BlogDetailScreen (hero with place and
 * category tags, drop-cap body, "explore connections" chips) filled from what the creator saved on the
 * Continue My Work page: the introduction, the story, the search summary and keywords, and the photos.
 */
export const PublicationBlogPreview: React.FC<{ job: JobResponse; progress: WorkProgressResponse; publishedOn: string | null }> = ({ job, progress, publishedOn }) => {
  const paragraphs = [...paragraphsOf(progress.introduction ?? ''), ...paragraphsOf(progress.story ?? '')];
  const [first, ...rest] = paragraphs;
  const photos = progress.materials.filter(m => IMAGE.test(m.fileName) || IMAGE.test(m.fileUrl));
  const cover = photos.length > 0 ? { uri: resolveImageUrl(photos[0].fileUrl) ?? '' } : (resolveOpportunityImage(job.heroImageUrl ?? null) ?? GENERIC_HERO_IMAGE);
  const gallery = photos.slice(1);
  const tags = [job.category, ...progress.seoKeywords].filter((t): t is string => !!t);

  return (
    <View style={{ backgroundColor: '#fdfaf6' }}>
      <View style={[styles.heroSection, { minHeight: 340, height: 340 }]}>
        <ImageBackground source={cover} style={styles.heroImg}>
          <View style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <View style={styles.heroTags}>
                {!!job.location && (
                  <View style={styles.heroTagBorder}>
                    <Text style={styles.heroTagText}>{job.location}</Text>
                  </View>
                )}
                {!!job.category && (
                  <View style={styles.heroTagSolid}>
                    <Text style={styles.heroTagTextSolid}>{job.category}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTitle}>{job.title}</Text>
              <View style={styles.authorRow}>
                <View style={styles.authorGroup}>
                  <View style={[styles.authorImg, { backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>{(job.elderName || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.authorName}>{job.elderName}</Text>
                </View>
                {!!publishedOn && (
                  <>
                    <View style={styles.dotSeparator} />
                    <View style={styles.timeGroup}>
                      <MaterialIcons name="event" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.timeText}>{publishedOn}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={[styles.bodyContent, { alignSelf: 'stretch' }]}>
        {!!first && (
          <View style={[styles.paragraph, { marginBottom: 4 }]}>
            <Text style={styles.dropCap}>{first.charAt(0)}</Text>
            <Text style={styles.bodyText}>{first.slice(1)}</Text>
          </View>
        )}
        {rest.map((p, i) => (
          <Text key={i} style={[styles.bodyText, { marginBottom: 8 }]}>{p}</Text>
        ))}

        {!!progress.seoSummary?.trim() && (
          <View style={styles.quoteBlock}>
            <Text style={[styles.quoteText, { fontSize: 20, lineHeight: 30 }]}>{progress.seoSummary.trim()}</Text>
          </View>
        )}

        {gallery.map(m => (
          <Image key={m.id} source={{ uri: resolveImageUrl(m.fileUrl) ?? '' }} style={[styles.fullImg, { height: 220, borderRadius: 16, marginVertical: 8 }]} />
        ))}

        {tags.length > 0 && (
          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>EXPLORE CONNECTIONS</Text>
            <View style={styles.exploreTags}>
              {tags.map((tag, idx) => (
                <View key={tag} style={styles.exploreTag}>
                  <MaterialIcons
                    name={idx === 0 ? 'category' : 'tag'}
                    size={16}
                    color={Colors.secondary}
                  />
                  <Text style={styles.exploreTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
