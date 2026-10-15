-- ============================================================================
-- LegacyLens Moderation Queue Seed Script: Authentic Cultural Blogs
-- Target Table: public.stories (method = 'WRITTEN', media_type IS NULL)
-- Supporting Tables: public.users, public.user_roles, public.story_regions, public.tags, public.story_tags
--
-- This script seeds authentic, richly detailed Sri Lankan cultural blog
-- submissions across all moderation lifecycle states (PENDING, REJECTED,
-- PUBLISHED, ARCHIVED) so the complete admin moderation workflow can be reviewed.
-- Safe to run multiple times (idempotent via ON CONFLICT).
-- ============================================================================

BEGIN;

-- 1. Ensure required author users exist with valid ELDER and CONTRIBUTOR roles
INSERT INTO public.users (
    id, full_name, phone_number, phone_verified, date_of_birth, nic_number,
    pin_hash, fingerprint_enabled, failed_pin_attempts, account_status,
    tutorial_completed, created_at, updated_at
) VALUES
    ('d3af4205-cc9b-4d6a-887e-baf31a5bd45e', 'Mrs. Kamala Wijesinghe', '+94770000001', true, '1952-04-12', '195210300001', '$2a$10$dummyHashForSeedDataNotUsedDirectly0000000000000000000', false, 0, 'ACTIVE', true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days'),
    ('2b8bf12a-3e6b-45fa-b911-dfd3f09504e7', 'Mr. Lasith Gunasekara', '+94770000002', true, '1948-09-25', '194826800002', '$2a$10$dummyHashForSeedDataNotUsedDirectly0000000000000000000', false, 0, 'ACTIVE', true, NOW() - INTERVAL '50 days', NOW() - INTERVAL '5 days'),
    ('88fc55f0-88be-48c0-a031-9d99bfdf65f6', 'Gurunnanse Yohan Helitha', '+94770000003', true, '1955-11-18', '195532200003', '$2a$10$dummyHashForSeedDataNotUsedDirectly0000000000000000000', false, 0, 'ACTIVE', true, NOW() - INTERVAL '40 days', NOW() - INTERVAL '2 days'),
    ('ecb3f5f6-2870-4875-a256-d0e97c794f6e', 'Arani Inothma', '+94770000004', true, '2001-07-03', '200168500004', '$2a$10$dummyHashForSeedDataNotUsedDirectly0000000000000000000', false, 0, 'ACTIVE', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
    ('09a1f924-65d2-4819-85a6-e7ea41abd0d1', 'Shyama Damayanthi', '+94770000005', true, '1985-02-14', '198504500005', '$2a$10$dummyHashForSeedDataNotUsedDirectly0000000000000000000', false, 0, 'ACTIVE', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    account_status = EXCLUDED.account_status,
    phone_verified = EXCLUDED.phone_verified;

-- Ensure Elder role mappings exist
INSERT INTO public.user_roles (id, user_id, role_type, status, activated_at)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'd3af4205-cc9b-4d6a-887e-baf31a5bd45e', 'ELDER', 'ACTIVE', NOW() - INTERVAL '60 days'),
    ('c0000001-0000-0000-0000-000000000002', '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7', 'ELDER', 'ACTIVE', NOW() - INTERVAL '50 days'),
    ('c0000001-0000-0000-0000-000000000003', '88fc55f0-88be-48c0-a031-9d99bfdf65f6', 'ELDER', 'ACTIVE', NOW() - INTERVAL '40 days'),
    ('c0000001-0000-0000-0000-000000000004', 'ecb3f5f6-2870-4875-a256-d0e97c794f6e', 'YOUTH_CREATOR', 'ACTIVE', NOW() - INTERVAL '30 days'),
    ('c0000001-0000-0000-0000-000000000005', '09a1f924-65d2-4819-85a6-e7ea41abd0d1', 'GENERAL_USER', 'ACTIVE', NOW() - INTERVAL '20 days')
ON CONFLICT (user_id, role_type) DO UPDATE SET
    status = EXCLUDED.status;


-- ============================================================================
-- 2. Seed Written Blog Stories (method = 'WRITTEN', media_type = NULL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ITEM 1 [PENDING]: Sacred Geometry & Kaduru Timber of Ambalangoda Kolam Masks
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000001',
    'd3af4205-cc9b-4d6a-887e-baf31a5bd45e',
    'd3af4205-cc9b-4d6a-887e-baf31a5bd45e',
    'Sacred Geometry and Timber Selection of Ambalangoda Kolam Masks',
    'An authentic master artisan guide into harvesting coastal Kaduru timber, saline seasoning rituals, and natural mineral pigmentation in southern Sri Lankan mask carving.',
    'The tradition of Kolam mask carving in Ambalangoda is far more than an ornamental craft; it is an esoteric ritual discipline deeply entwined with regional cosmology, healing drama, and coastal ecology. 

Every authentic mask begins with the sacred Kaduru tree (Strychnos nux-vomica), which grows abundantly along the brackish margins of the Madu Ganga and coastal wetlands. Master carvers harvest the timber exclusively during the waning moon (Awa Pasa), when sap circulation is lowest, significantly reducing the likelihood of wood rot and boring insect infestation. Once felled, the timber is segmented into uniform logs and submerged into coastal alluvial river mud for twenty-one days. This subterranean seasoning draws out remaining organic sap and infuses the cellular structure of the timber with natural mineral salts. Following the bath, the wood is transferred to the smoke-shelf suspended above the family kitchen hearth (Dumbara attic), where month-long gentle warmth cures the logs until they become remarkably feather-light, buoyant, and shatter-resistant.

The carving process adheres strictly to the ancient Palm-Span (Viyatha) canon preserved across generations of the Wijesuriya and Subasinghe lineages. The master carver uses seven hand-forged gouges (Niyan) to outline the facial contours—whether capturing the regal nobility of the Maha Sammata king, the comical grotesque realism of the Nonchi Akka comedic troupe, or the fierce flaring nostrils of the Gurulu Raksha (bird demon). Each curvature is carved in deliberate symmetry, balancing weight so the masked ritual dancer can perform vigorously for five continuous hours without neck strain.

Finishing the mask demands organic binders and mineral pigments. Pure white clay (Makulu matti) dredged from dry riverbeds serves as the foundational primer. Yellow tones are ground from local ochre stones, brilliant greens are coaxed from crushed wild betel leaves and lime juice, and rich ceremonial vermilion is produced by grinding cinnabar crystals with refined Dorana oil. Finally, the finished mask is sealed with a clear resin extracted from the Hal tree, granting an enduring luster that withstands the tropical humidity of southern coastal healing ceremonies for over a century.',
    'WRITTEN',
    NULL,
    'PENDING',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200',
    '{Mask Carving,Kolam,Ambalangoda,Traditional Crafts,Southern Heritage}',
    'Southern Province',
    'Galle',
    24,
    6,
    182,
    NULL,
    NULL,
    NOW() - INTERVAL '1 day' - INTERVAL '4 hours',
    NOW() - INTERVAL '1 day',
    NULL
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district;


-- ----------------------------------------------------------------------------
-- ITEM 2 [PENDING]: The Bisokotuwa Sluice: Ancient Hydraulic Revolution
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000002',
    '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7',
    '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7',
    'The Bisokotuwa Sluice: Sri Lanka''s 3rd Century BCE Hydraulic Revolution',
    'Unraveling how ancient engineers designed the stone valve-pit to dissipate devastating hydrostatic pressure, enabling sustainable cascade irrigation across the Dry Zone.',
    'Long before European hydraulic engineers solved the mathematical complexities of regulating high-pressure water discharge from massive reservoirs, the ancient hydraulic masters of Anuradhapura had perfected the valve pit, known in Sinhala as the Bisokotuwa (literally "queenly enclosure" or reservoir womb).

Constructed as early as the 3rd century BCE and reaching pinnacle sophistication under King Dhatusena at Kalawewa, the Bisokotuwa is a rectangular vertical shaft constructed inside the upstream embankment of an artificial lake. Built from gigantic, hand-dressed granite monoliths fitted together with tongue-and-groove joints without mortar, the shaft penetrated the full depth of the reservoir bed. The core hydraulic breakthrough was deceptively elegant: rather than venting pressurized water directly through an opening in the dam wall—which would inevitably tear through the earthen bund and cause catastrophic dam failure—water was forced into the vertical chamber of the Bisokotuwa.

Inside this stone chamber, rising water encountered heavy timber or stone regulatory baffles that absorbed the furious kinetic energy of the hydrostatic head. The water swirled, lost its destructive momentum, and spilled calmly through underground brick-lined conduits (Kalingu) into distribution channels at a steady, manageable velocity. 

This technological marvel allowed ancient Sri Lankan civilizations to build reservoirs holding hundreds of millions of cubic meters of water across flat, arid topographies. Connected through the Ellangawa (cascade tank village system), water cascaded sequentially from micro-tanks to major reservoirs without scouring agricultural topsoil. The Bisokotuwa stands today as undeniable proof of an indigenous engineering civilization whose ecological sensitivity matched its monumental ambition.',
    'WRITTEN',
    NULL,
    'PENDING',
    'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=1200',
    '{Ancient Engineering,Irrigation,Anuradhapura,Bisokotuwa,Heritage Architecture}',
    'North Central Province',
    'Anuradhapura',
    41,
    9,
    310,
    NULL,
    NULL,
    NOW() - INTERVAL '2 days' - INTERVAL '6 hours',
    NOW() - INTERVAL '2 days',
    NULL
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district;


-- ----------------------------------------------------------------------------
-- ITEM 3 [PENDING]: Korathota Angam Maduwa: Secret Lineages of Combat & Healing
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000003',
    '88fc55f0-88be-48c0-a031-9d99bfdf65f6',
    '88fc55f0-88be-48c0-a031-9d99bfdf65f6',
    'Korathota Angam Maduwa: Secret Lineages of Indigenous Combat & Healing',
    'Oral testimonies from the subterranean training pits of Kaduwela, detailing Angampora pressure-point strikes (Maru Kala) and the sacred healer-warrior ethos.',
    'Following the crushing suppression of the 1818 Great Uva Rebellion, the British colonial governor Sir Robert Brownrigg issued a draconian proclamation declaring the indigenous martial art of Angampora illegal, ordering every practitioner shot in the knee and every training arena burned to ashes. To preserve their heritage, the Korathota masters retreated into subterranean caverns and concealed training arenas known as Angam Madu.

An authentic Angam Maduwa is constructed three feet beneath ground level and enclosed by thick earthen clay walls and thatched palm fronds, ensuring that neither weapon clatter nor training chants could carry into the surrounding forest. The training floor consists of fine red riverbed sand mixed with sea salt and powdered neem leaves, creating an antiseptic, shock-absorbing surface that conditioned the bare feet of the martial artists.

The discipline comprises three inseparable pillars:
1. Angam (Unarmed Combat): Specializing in Gataputtu (complex joint locks), Porabada (indigenous wrestling), and the deadly Maru Kala—the knowledge of 107 vital nerve pressure points capable of causing instantaneous paralysis, sensory disruption, or resuscitation.
2. Ilangam (Armed Combat): Mastery over thirty-two traditional weapons, most famously the Velayudhaya—a flexible, four-bladed whip-sword forged from tempered spring steel, worn coiled as a belt and swung in blinding concentric arcs.
3. Maya Angam (Spiritual & Mental Conditioning): Mantras, breath retention (Pranayama), and meditational focus anchored in Buddhist cosmology.

Crucially, an Angam apprentice was forbidden from learning lethal offensive strikes until they had first mastered Deshiya Chikitsa (indigenous medicine). For every disabling lock, the warrior had to know the herbal compress (pattu), oil massage (nila thelum), and herbal decoction required to restore mobility. This profound synergy ensured that the art remained a defensive, life-preserving cultural treasure rather than an instrument of mindless violence.',
    'WRITTEN',
    NULL,
    'PENDING',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200',
    '{Angampora,Martial Arts,Indigenous Medicine,Western Province,Oral History}',
    'Western Province',
    'Colombo',
    56,
    14,
    445,
    NULL,
    NULL,
    NOW() - INTERVAL '3 days' - INTERVAL '2 hours',
    NOW() - INTERVAL '3 days',
    NULL
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district;


-- ----------------------------------------------------------------------------
-- ITEM 4 [PENDING]: Beeralu Lace of Galle Fort: Bobbin Lace in Coastal Hands
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000004',
    'd3af4205-cc9b-4d6a-887e-baf31a5bd45e',
    'd3af4205-cc9b-4d6a-887e-baf31a5bd45e',
    'Beeralu Lace of Galle Fort: Portuguese Bobbin Lace Through Coastal Hands',
    'On the breezy verandas of Magalle, master lace-makers manipulate dozens of wooden bobbins over stuffed cylindrical pillows to create intricate maritime lace tapestries.',
    'Walk through the shaded alleyways of Galle Fort and along the coastal hamlet of Magalle in the late afternoon, and you will hear a hypnotic, rhythmic music: the rapid wooden clicking of dozens of hand-turned bobbins dancing across a stuffed cylindrical pillow. This is the centuries-old art of Beeralu renda (bobbin lace).

Introduced to coastal Sri Lanka by Portuguese noblewomen in the late 16th century and later refined under Dutch colonial rule, bobbin lace found its truest home in the hands of southern maritime women. Over three hundred years, these coastal artisans transformed European lace-making conventions by infusing distinct island motifs into the delicate web of threads.

The setup requires deceptive simplicity yet extraordinary mathematical precision. At the center rests the Gondata—a heavy, cylindrical pillow tightly packed with dried coconut husk fibers and wrapped in unbleached cotton. Over this pillow is pinned a stiff paper stencil (Kalisama) marked with geometric prickings. Suspended from brass pins are between twenty to sixty Beeralu: small, ergonomic bobbins carved from ebony, tamarind wood, or polished coconut palm timber.

With nimble fingers moving in practiced coordination, the artisan twists (karakawilla) and crosses (getagaseema) pairs of fine cotton or silk threads. Unlike needle lace, which builds from single stitches, Beeralu forms an intricate openwork mesh simultaneously. Indigenous motifs dominate the work: the delicate Pichcha Mal (jasmine blossoms), coconut fronds, coastal waves, and swirling temple creepers. A single decorative table runner or wedding veil border can require up to four months of uninterrupted concentration, standing as a testament to the patient grace of Sri Lanka''s coastal craftswomen.',
    'WRITTEN',
    NULL,
    'PENDING',
    'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?q=80&w=1200',
    '{Beeralu Lace,Galle,Handicrafts,Southern Province,Textile Heritage}',
    'Southern Province',
    'Galle',
    33,
    5,
    215,
    NULL,
    NULL,
    NOW() - INTERVAL '3 days' - INTERVAL '8 hours',
    NOW() - INTERVAL '3 days',
    NULL
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district;


-- ----------------------------------------------------------------------------
-- ITEM 5 [REJECTED]: Lakegala Acoustic Levitation & Vimana Runways
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000005',
    'ecb3f5f6-2870-4875-a256-d0e97c794f6e',
    'ecb3f5f6-2870-4875-a256-d0e97c794f6e',
    'Lakegala Acoustic Levitation and King Ravana''s Dandu Monara Runways',
    'A speculative narrative attempting to correlate the pyramidal geometry of Lakegala peak with aeronautical runways and electromagnetic lodestone flight pads.',
    'Rising with dramatic triangular symmetry above the mist-shrouded valleys of Meemure, Lakegala has long captivated mountain travelers and folklore enthusiasts. This submission claims that recent amateur geological measurements prove the peak was artificial—cut with advanced sonic lasers and served as an interstellar airstrip for King Ravana''s mythical flying chariot, the Dandu Monara.

According to the author''s claims, the bedrock of Lakegala contains unnatural concentrations of quartz crystals that resonated with low-frequency acoustic chants, allowing multi-ton granite blocks to levitate effortlessly into the clouds...',
    'WRITTEN',
    NULL,
    'REJECTED',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200',
    '{Folklore,Lakegala,Knuckles Range,Central Highlands,Myths}',
    'Central Province',
    'Matale',
    8,
    3,
    95,
    'Historical Inaccuracy / Unverified Pseudoscientific Claims',
    'The submission asserts that granite monoliths at Lakegala were constructed as acoustic electromagnetic flight runways for mythical aircraft without archaeological or textual documentation. While mythological folklore is welcome, it must be submitted under the Folk Tales category with appropriate framing rather than presented as verified historical engineering.',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days',
    NULL
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    rejection_reason = EXCLUDED.rejection_reason,
    rejection_notes = EXCLUDED.rejection_notes;


-- ----------------------------------------------------------------------------
-- ITEM 6 [REJECTED]: Fast-Track Commercial Chemical Patination for Brass
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000006',
    '09a1f924-65d2-4819-85a6-e7ea41abd0d1',
    '09a1f924-65d2-4819-85a6-e7ea41abd0d1',
    'Fast-Track Commercial Chemical Patination for Antique Brass Souvenirs',
    'A guide recommending modern commercial synthetic acids to artificially age brass ornaments for the tourist souvenir market in Pilimathalawa.',
    'For modern metal workshops in Pilimathalawa looking to maximize turnover for visiting tour groups, waiting weeks for natural tamarind acid oxidation is no longer viable. This article details how to purchase commercial grade chemical salts and nitric acid mixtures to strip the surface of fresh cast brass and apply a fake verdigris antique finish in under thirty minutes...',
    'WRITTEN',
    NULL,
    'REJECTED',
    'https://images.unsplash.com/photo-1461696114087-397271a7aedc?q=80&w=1200',
    '{Brass Craft,Pilimathalawa,Commercial Methods,Souvenirs}',
    'Central Province',
    'Kandy',
    4,
    1,
    62,
    'Commercial Promotion & Departure from Heritage Preservation',
    'This post promotes commercial synthetic acids (brand-specific solutions) to artificially age brass ornaments for the tourist souvenir market. Our repository is strictly dedicated to documenting authentic lost-wax casting (Cire Perdue), natural tamarind bath etching, and traditional beeswax polishing techniques.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    NULL
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    rejection_reason = EXCLUDED.rejection_reason,
    rejection_notes = EXCLUDED.rejection_notes;


-- ----------------------------------------------------------------------------
-- ITEM 7 [PUBLISHED]: Pure Ceylon Cinnamon: Bark Peeling of Weligama Bay
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000007',
    'd3af4205-cc9b-4d6a-887e-baf31a5bd45e',
    'd3af4205-cc9b-4d6a-887e-baf31a5bd45e',
    'The Art of Peeling Pure Ceylon Cinnamon in Weligama Bay',
    'From shaving the rugged green cuticle to hand-rolling paper-thin golden quills (Alba grade), how southern peeling masters preserve the sweetest spice on Earth.',
    'True Ceylon Cinnamon (Cinnamomum verum) is indigenous solely to the southern coastal hills and alluvial valleys of Sri Lanka. What distinguishes true cinnamon from common cassia bark found across Southeast Asia is not merely its delicate, subtle sweetness and remarkably low coumarin content—it is the centuries-old, artisanal technique of peeling and quill-making passed down exclusively through familial guilds in Weligama, Mirissa, and Galle.

The harvest commences at the onset of the monsoon rains, when moist tropical air softens the inner cambium layer of the trees. Skilled peelers select straight three-year-old shoots that have reached the thickness of an adult thumb. After trimming branches and leaves, the peeler uses a specialized curved brass scraper (Koketta) to carefully shave off the bitter, coarse outer bark without nicking the fragrant parchment beneath.

Then begins the Vitimilla—the friction rubbing. The artisan rubs the stripped green stick firmly and evenly with a solid brass rod. The heat generated by this rhythmic friction causes volatile essential oils to circulate, loosening the paper-thin inner phloem from the central woody stem. With surgical precision, two lengthwise incisions are made, and the exquisite golden sheet of inner bark is lifted intact in delicate sheets.

These fragile sheets are layered telescopically inside one another on wooden trestles, creating a dense, multi-layered quill four feet long. Transferred to breezy, shaded curing sheds, the quills curl naturally as they dry in the maritime breezes, turning a warm golden amber. Once dry, they are cut with brass shears into uniform lengths, graded as the prized Alba grade—a legacy of agricultural mastery that made Sri Lanka the coveted crown jewel of the historic global spice trade.',
    'WRITTEN',
    NULL,
    'PUBLISHED',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200',
    '{Ceylon Cinnamon,Agriculture,Southern Province,Weligama,Traditional Knowledge}',
    'Southern Province',
    'Matara',
    89,
    19,
    720,
    NULL,
    NULL,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    published_at = EXCLUDED.published_at;


-- ----------------------------------------------------------------------------
-- ITEM 8 [PUBLISHED]: Geta Beraya: Acoustic Anatomy of the Kandyan Drum
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000008',
    '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7',
    '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7',
    'Geta Beraya: Sacred Acoustic Anatomy of the Kandyan Drum',
    'Exploring the dual sonic hemispheres of the royal court drum: tuning the left Idama bass with herbal rice paste and the right Dahina with fine monkey parchment.',
    'In the sacred ritual acoustics of Kandyan culture, the Geta Beraya (the bossed or knotted drum) is regarded as the heartbeat of the temple ceremony. Shaped like an elongated barrel that bulges generously in the center and tapers toward both drum heads, the Geta Beraya produces two distinctly complementary tonal spectrums that guide the dancer''s steps through complex five-beat and seven-beat rhythmic cycles (Vannam).

The body (Kodhaya) is hollowed out from seasoned Kohomba (neem), Ehala (golden shower), or Jak timber. The internal acoustic cavity is not symmetrical; the left chamber is scooped wider to amplify resonant low frequencies, while the right chamber is carved narrow and conical to accentuate sharp, penetrating transients.

The two drumheads represent an astonishing feat of natural material science:
- The Left Face (Idama): Made from cured cow stomach lining or thick steer hide. To tune this surface to a deep, cavernous bass, the master drummer applies the "Kala Dama"—a circular paste made from boiled rice, lead filings, and the charcoal of Kohomba seeds pressed firmly into the center of the skin.
- The Right Face (Dahina): Covered with dried monkey parchment or calf skin, producing a crisp, metallic treble crack that cuts through the trumpeting of temple conches and horn melodies.

The drumheads are bound to the timber body with circular hoops of mountain creeper vines and laced together with braided deer-hide thongs (Varapata) wound in an intricate zigzag pattern. Drummers fine-tune the tension before performances at the Temple of the Tooth by adjusting braided brass sliding rings (Kinkini) along the hide thongs. When played by a master artist, the Geta Beraya does not merely accompany dance—it speaks a tonal language that has summoned deities and blessed harvest fields for over two millennia.',
    'WRITTEN',
    NULL,
    'PUBLISHED',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200',
    '{Traditional Drums,Geta Beraya,Kandy,Performing Arts,Temple of the Tooth}',
    'Central Province',
    'Kandy',
    112,
    27,
    890,
    NULL,
    NULL,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    published_at = EXCLUDED.published_at;


-- ----------------------------------------------------------------------------
-- ITEM 9 [PUBLISHED]: Veddah Honey Gathering: Descent of the Bambara Cliffs
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000009',
    '88fc55f0-88be-48c0-a031-9d99bfdf65f6',
    '88fc55f0-88be-48c0-a031-9d99bfdf65f6',
    'Veddah Honey Gathering: The Sacred Descent of Bambara Cliffs',
    'Ancient honey songs, smoked creeper bundles, and perilous cliff ladders used by Dambana clans to harvest wild rock bee hives without angering forest spirits.',
    'High on the sheer granite precipices of the Nilgala and Dambana forests, giant rock bees (Apis dorsata, known as Bambara) construct crescent-shaped honeycombs measuring up to six feet across beneath overhanging rock ledges. For the indigenous Wanniya-laeto (Veddah community), gathering this wild honey is not simply sustenance; it is a sacred seasonal communion governed by ancestral codes, ancient forest songs, and extraordinary courage.

Before a honey expedition begins, the clan elder leads the Kande Yakka invocation, offering wild betel and resin incense to seek protection from the guardian spirit of the mountains. The gathering party then braids the Yothaya—a terrifyingly long ladder fashioned entirely from wild jungle creeper vines (wal-del). The ladder is anchored securely to mature ironwood trees at the cliff edge, cascading hundreds of feet down the sheer rock face.

At twilight, the designated honey harvester (Bambara Kapanne) descends barefoot down the swaying ladder. In one hand he carries the "Dandu Kanda"—a smoking bundle of moist green leaves and wild pepper vine that pacifies the thousands of defensive bees without incinerating their wings or destroying the hive. Singing the traditional Bambara Kavi in low rhythmic murmurs to calm the colony, he slices the golden honeycomb with a carved bone blade.

Crucially, indigenous ethics require that the lower third of the comb—the brood comb containing the young larvae—is left entirely undisturbed. The harvester collects the amber honey into a deerskin pouch (Gona Pota) and is hauled back up the cliff by his clan brothers. The harvested honey is shared equally among every family in the village, remaining an enduring symbol of ecological balance and mutual survival.',
    'WRITTEN',
    NULL,
    'PUBLISHED',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200',
    '{Indigenous Culture,Veddah,Dambana,Forest Lore,Honey Gathering}',
    'Uva Province',
    'Badulla',
    75,
    11,
    630,
    NULL,
    NULL,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    published_at = EXCLUDED.published_at;


-- ----------------------------------------------------------------------------
-- ITEM 10 [ARCHIVED]: Dumbara Rush Mat Weaving: Royal Geometric Patterns
-- ----------------------------------------------------------------------------
INSERT INTO public.stories (
    id, author_id, author_user_id, title, description, body_content,
    method, media_type, status, image_url, tags,
    region, district, likes_count, comments_count, view_count,
    rejection_reason, rejection_notes, created_at, updated_at, published_at
) VALUES (
    'e0000001-0001-4000-8000-000000000010',
    '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7',
    '2b8bf12a-3e6b-45fa-b911-dfd3f09504e7',
    'Dumbara Rush Mat Weaving: Royal Geometric Patterns of Senkadagala',
    'Archival record: The extraction of Hana plant fibers, mud dyeing techniques, and royal floor tapestry motifs from the artisan hamlet of Kalasirigama.',
    'Historically produced in the picturesque Dumbara Valley outside Kandy, the woven mats and tapestries (Kalala) of the Kinnara artisanal community were considered so exceptional that they were reserved for the Royal Court of Kandy as tribute.

The craft begins with the spiky foliage of the Hana plant (Furcraea foetida). Artisans strip the fleshy green pulp from the long leaves using blunt wooden scrapers to extract long, shimmering cream-colored fibers known for their remarkable tensile strength. These fibers are washed in running mountain streams, sun-bleached on grass mats, and naturally dyed using boiling infusions of Aralu bark (yielding charcoal black), Sappan wood (yielding deep royal crimson), and raw turmeric rhizomes.

Woven on flat horizontal ground looms (Alavanna), Dumbara mats are celebrated for their intricate double-sided geometric motifs: the Hansa Puttuwa (intertwined sacred swans), the flower-box (Mal Gaha), and stylized elephants. This archival documentation preserves the geometric formulas and weaving songs recorded during the last master guild assemblies in Kalasirigama.',
    'WRITTEN',
    NULL,
    'ARCHIVED',
    'https://images.unsplash.com/photo-1586075010591-e48a1a6f6dfd?q=80&w=1200',
    '{Dumbara Mats,Weaving,Central Province,Royal Heritage,Textiles}',
    'Central Province',
    'Kandy',
    18,
    2,
    140,
    NULL,
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    image_url = EXCLUDED.image_url,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    published_at = EXCLUDED.published_at;


-- ============================================================================
-- 3. Sync Story Regions (Table: story_regions)
-- ============================================================================
INSERT INTO public.story_regions (id, story_id, region, district, region_code, created_at, updated_at)
VALUES
    ('d0000001-0001-0000-0000-000000000001', 'e0000001-0001-4000-8000-000000000001', 'Southern Province', 'Galle', 'LK-SP-GAL', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000002', 'e0000001-0001-4000-8000-000000000002', 'North Central Province', 'Anuradhapura', 'LK-NCP-ANU', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000003', 'e0000001-0001-4000-8000-000000000003', 'Western Province', 'Colombo', 'LK-WP-COL', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000004', 'e0000001-0001-4000-8000-000000000004', 'Southern Province', 'Galle', 'LK-SP-GAL', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000005', 'e0000001-0001-4000-8000-000000000005', 'Central Province', 'Matale', 'LK-CP-MTL', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000006', 'e0000001-0001-4000-8000-000000000006', 'Central Province', 'Kandy', 'LK-CP-KDY', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000007', 'e0000001-0001-4000-8000-000000000007', 'Southern Province', 'Matara', 'LK-SP-MAT', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000008', 'e0000001-0001-4000-8000-000000000008', 'Central Province', 'Kandy', 'LK-CP-KDY', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000009', 'e0000001-0001-4000-8000-000000000009', 'Uva Province', 'Badulla', 'LK-UVA-BAD', NOW(), NOW()),
    ('d0000001-0001-0000-0000-000000000010', 'e0000001-0001-4000-8000-000000000010', 'Central Province', 'Kandy', 'LK-CP-KDY', NOW(), NOW())
ON CONFLICT (story_id) DO UPDATE SET
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    region_code = EXCLUDED.region_code,
    updated_at = NOW();

COMMIT;

