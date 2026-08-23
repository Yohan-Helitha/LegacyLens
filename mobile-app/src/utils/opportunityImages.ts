import type { ImageSourcePropType } from 'react-native';

/**
 * A handful of opportunities are seeded with a bundled placeholder photo
 * instead of a real elder-submitted upload (that upload flow doesn't exist
 * yet — see Opportunity's backend javadoc). Those rows store a "local:<key>"
 * marker in heroImageUrl instead of a real URL; everything else is a normal
 * remote URI.
 */
const LOCAL_OPPORTUNITY_IMAGES: Record<string, ImageSourcePropType> = {
  'stilt-fishing': require('../../assets/images/opportunities/stilt-fishing.jpg'),
  'galle-coast': require('../../assets/images/opportunities/galle-coast.jpg'),
  'recipe-plating': require('../../assets/images/opportunities/recipe-plating.jpg'),
};

export function resolveOpportunityImage(heroImageUrl: string | null): ImageSourcePropType | undefined {
  if (!heroImageUrl) return undefined;

  if (heroImageUrl.startsWith('local:')) {
    const key = heroImageUrl.slice('local:'.length);
    return LOCAL_OPPORTUNITY_IMAGES[key];
  }

  return { uri: heroImageUrl };
}
