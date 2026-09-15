package lk.ac.sliit.legacylens.moderation.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.moderation.dto.StoryQuizDTO;
import lk.ac.sliit.legacylens.moderation.dto.StoryQuizOptionDTO;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.entity.StoryQuiz;
import lk.ac.sliit.legacylens.moderation.entity.StoryQuizOption;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.moderation.repository.StoryQuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoryQuizService {

        private final StoryQuizRepository quizRepository;
        private final ModerationQueueRepository storyRepository;

        @Transactional(readOnly = true)
        public StoryQuizDTO getQuizByStoryId(UUID storyId) {
                return quizRepository.findByStoryId(storyId)
                                .map(this::mapToDTO)
                                .orElse(null);
        }

        @Transactional
        public StoryQuizDTO saveOrUpdateQuiz(UUID storyId, StoryQuizDTO dto) {
                // Ensure story exists
                storyRepository.findById(storyId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Story not found with ID: " + storyId));

                StoryQuiz quiz = quizRepository.findByStoryId(storyId)
                                .orElseGet(() -> {
                                        StoryQuiz newQuiz = new StoryQuiz();
                                        newQuiz.setStoryId(storyId);
                                        return newQuiz;
                                });

                quiz.setQuestion(dto.getQuestion() != null ? dto.getQuestion().trim() : "Knowledge Check");
                quiz.setExplanation(dto.getExplanation());

                // Replace options
                quiz.getOptions().clear();

                if (dto.getOptions() != null) {
                        String[] defaultKeys = { "A", "B", "C", "D" };
                        int idx = 0;
                        for (StoryQuizOptionDTO optDto : dto.getOptions()) {
                                StoryQuizOption option = new StoryQuizOption();
                                option.setOptionKey(optDto.getOptionKey() != null && !optDto.getOptionKey().isBlank()
                                                ? optDto.getOptionKey().toUpperCase().trim()
                                                : (idx < defaultKeys.length ? defaultKeys[idx]
                                                                : String.valueOf((char) ('A' + idx))));
                                option.setOptionText(
                                                optDto.getOptionText() != null ? optDto.getOptionText().trim() : "");
                                option.setDescription(optDto.getDescription());
                                option.setCorrect(optDto.isCorrect());
                                quiz.addOption(option);
                                idx++;
                        }
                }

                StoryQuiz saved = quizRepository.save(quiz);
                return mapToDTO(saved);
        }

        @Transactional
        public StoryQuizDTO generateAiQuiz(UUID storyId,
                        lk.ac.sliit.legacylens.moderation.dto.AiGenerateQuizRequest request) {
                String title = "";
                String desc = "";
                String body = "";
                List<String> tags = new ArrayList<>();

                if (request != null) {
                        if (request.getTitle() != null && !request.getTitle().isBlank())
                                title = request.getTitle();
                        if (request.getDescription() != null && !request.getDescription().isBlank())
                                desc = request.getDescription();
                        if (request.getBodyContent() != null && !request.getBodyContent().isBlank())
                                body = request.getBodyContent();
                        if (request.getTags() != null)
                                tags = request.getTags();
                }

                // If description or title still empty, fallback to DB record
                if (desc.isBlank() || title.isBlank()) {
                        ModerationQueueItem story = storyRepository.findById(storyId).orElse(null);
                        if (story != null) {
                                if (title.isBlank() && story.getTitle() != null)
                                        title = story.getTitle();
                                if (desc.isBlank() && story.getDescription() != null)
                                        desc = story.getDescription();
                                if (body.isBlank() && story.getBodyContent() != null)
                                        body = story.getBodyContent();
                                if (tags.isEmpty() && story.getTags() != null)
                                        tags = List.of(story.getTags());
                        }
                }

                StoryQuizDTO aiQuiz = generateQuizFromDescription(title, desc, body, tags);
                aiQuiz.setStoryId(storyId.toString());

                return aiQuiz;
        }

        public StoryQuizDTO generateAiQuiz(UUID storyId) {
                return generateAiQuiz(storyId, null);
        }

        private StoryQuizDTO generateQuizFromDescription(String title, String description, String body,
                        List<String> tags) {
                String cleanDesc = (description != null ? description.trim() : "");
                String cleanTitle = (title != null ? title.trim() : "Cultural Story");
                String fullContent = (cleanTitle + " " + cleanDesc + " " + (body != null ? body.trim() : "") + " "
                                + (tags != null ? String.join(" ", tags) : "")).toLowerCase();

                // 1. Traditional Mask Making & Ritual Performances (Kolam, Sanni Yakuma,
                // Ambalangoda)
                if (fullContent.contains("mask") || fullContent.contains("ambalangoda") || fullContent.contains("kolam")
                                || fullContent.contains("sanni") || fullContent.contains("kaduru")) {
                        return StoryQuizDTO.builder()
                                        .question("According to this story, which traditional wild timber is required for authentic mask carving in Ambalangoda?")
                                        .explanation("Kaduru wood (Nux vomica) is traditionally seasoned in smoke and carved because its featherweight, porous texture allows ritual dancers and healers to wear the masks for hours during Sanni Yakuma and Kolam performances without neck fatigue.")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Kaduru Wood (Wild Timber)")
                                                                        .description("Lightweight, soft, and easy to carve with fine chisels; authentic for ceremonial wear.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Treated Industrial Mahogany")
                                                                        .description("Dense and heavy, causing acute fatigue and strain during sacred ritual movements.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Molded Synthetic Epoxy")
                                                                        .description("Modern plastic compound lacking ancestral consecration and handcraft artistry.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Imported Plywood Layers")
                                                                        .description("Prone to moisture warping and splitting along chemical adhesive seams.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 2. Beeralu Lace Weaving & Traditional Textiles
                if (fullContent.contains("lace") || fullContent.contains("beeralu") || fullContent.contains("bobbin")
                                || fullContent.contains("pillow") || fullContent.contains("matara")
                                || fullContent.contains("galle")) {
                        return StoryQuizDTO.builder()
                                        .question("Based on the craft description, how do traditional Beeralu lace masters memorize and execute complex patterns?")
                                        .explanation("In Southern Sri Lankan Beeralu lace making, intricate mathematical patterns are retained and passed down through melodic rhythmic verses (Kambiliya) chanted by the artisan while maneuvering wooden bobbins across the lace pillow.")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Rhythmic Oral Pattern Chants (Kambiliya)")
                                                                        .description("Chanted melodic verses that guide the exact timing and crossing of wooden bobbins.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Automated Computer Loom Punch Cards")
                                                                        .description("Industrial machine technology not used in authentic artisanal pillow lace.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Pre-printed Synthetic Mesh Overlays")
                                                                        .description("Mass-market shortcut that replaces manual hand-tangled precision.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Chemical Adhesive Binding")
                                                                        .description("Glues that stiffen thread and ruin the delicate openwork texture of lace.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 3. Dumbara & Reed Mat Weaving (Hana fiber, Pan Kalawa)
                if (fullContent.contains("dumbara") || fullContent.contains("reed") || fullContent.contains("mat")
                                || fullContent.contains("hana") || fullContent.contains("pan")
                                || fullContent.contains("rush")) {
                        return StoryQuizDTO.builder()
                                        .question("What traditional organic material and dyeing method gives Dumbara and reed mats their lasting durability?")
                                        .explanation("Authentic Dumbara mats use natural Hana (Agave) and marsh reed fibers soaked and dyed with indigenous botanical pigments (such as Korakaha leaves and wood boiled bark) before hand-weaving on pit looms.")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Boiled Hana Fiber with Botanical Herbal Pigments")
                                                                        .description("Natural leaf and root extracts that penetrate organic fibers without brittle degradation.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Synthetic Acrylic Fibers with Solvent Inks")
                                                                        .description("Petrochemical fibers that lack natural humidity cooling properties.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Bleached Plastic Polypropylene Straps")
                                                                        .description("Cheap commercial plastic that frays quickly in tropical weather.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Industrial Vinyl Lamination")
                                                                        .description("Modern seal that traps moisture and destroys breathable weave texture.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 4. Brassware, Metal Casting & Oil Lamps (Pilimathalawa)
                if (fullContent.contains("brass") || fullContent.contains("pilimathalawa")
                                || fullContent.contains("metal") || fullContent.contains("bronze")
                                || fullContent.contains("casting") || fullContent.contains("lamp")) {
                        return StoryQuizDTO.builder()
                                        .question("Which ancestral metallurgy technique described in this heritage is used to create intricate hollow brassware?")
                                        .explanation("The Lost-Wax (Cire Perdue) casting method, practiced for generations in Pilimathalawa, employs carved beeswax forms enveloped in ant-hill clay before being displaced by molten yellow brass.")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Lost-Wax (Cire Perdue) Clay Mold Casting")
                                                                        .description("Ancestral technique utilizing carved beeswax melted out by molten metal inside clay.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Cold Hydraulic Sheet Stamping")
                                                                        .description("Industrial pressing that cannot replicate dynamic three-dimensional sculptural filigree.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("High-Temperature Arc Welding Fusion")
                                                                        .description("Modern electric jointing method unrelated to ancient foundry casting.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Galvanized Iron Electroplating")
                                                                        .description("Surface chemical dip that produces a fake metallic sheen rather than solid bronze.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 5. Traditional Pottery, Terracotta & Clay Craft
                if (fullContent.contains("pottery") || fullContent.contains("clay")
                                || fullContent.contains("terracotta") || fullContent.contains("kiln")
                                || fullContent.contains("wheel") || fullContent.contains("kelaniya")) {
                        return StoryQuizDTO.builder()
                                        .question("According to traditional pottery knowledge, why is natural clay tempered with fine river sand before firing?")
                                        .explanation("Sri Lankan master potters blend purified ant-hill or river clay with fine silica sand to balance elasticity and prevent cracking during wood-fired kiln baking at high temperatures.")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Prevents Thermal Shrinkage Cracking in Kiln")
                                                                        .description("Silica sand stabilizes clay body contraction as moisture evaporates during firing.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Artificially Speeds Up Chemical Drying")
                                                                        .description("Quick artificial drying causes uneven tension and structural breakage.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Eliminates Need for Wood-Fired Baking")
                                                                        .description("Raw clay will dissolve in water unless properly vitrified through heat firing.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Adds Commercial Glaze Pigment")
                                                                        .description("Sand is a structural stabilizer, not a colorful decorative ceramic glaze.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 6. Traditional Drums, Music & Performing Arts (Geta Bera, Yak Bera, Kandyan
                // Dance)
                if (fullContent.contains("drum") || fullContent.contains("bera") || fullContent.contains("dance")
                                || fullContent.contains("kandyan") || fullContent.contains("ves")
                                || fullContent.contains("perahera") || fullContent.contains("rhythm")) {
                        return StoryQuizDTO.builder()
                                        .question("In traditional drumming and percussion heritage, what natural materials produce the distinct acoustic pitch of each drum head?")
                                        .explanation("Traditional drums like the Geta Bera use Kohomba (Margosa) or Jak wood bodies fitted with different animal membranes (monkey/cow skin on the left for low resonance, and goat/ox on the right for sharp high pitch).")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Dual Tuned Animal Membranes over Kohomba Wood")
                                                                        .description("Contrasting hide thicknesses on Jak or Margosa wood create harmonious resonant frequencies.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Synthetic Plastic Mylar Drumheads")
                                                                        .description("Modern industrial drumheads that produce a harsh tone lacking deep organic warmth.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Hollow Steel Pipe Shells")
                                                                        .description("Metallic bodies that echo erratically and fail ritual acoustic sacredness.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Industrial Rubber Tension Rings")
                                                                        .description("Elastic bands that sag in tropical humidity unlike treated leather cords.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 7. Traditional Agriculture, Threshing & Kamath Rituals (Goyam Kavi, Rice
                // Cultivation)
                if (fullContent.contains("farming") || fullContent.contains("kamath") || fullContent.contains("paddy")
                                || fullContent.contains("rice") || fullContent.contains("harvest")
                                || fullContent.contains("goyam") || fullContent.contains("agriculture")) {
                        return StoryQuizDTO.builder()
                                        .question("Why do traditional farmers observe sacred Kamatha language (Kamath Bhashawa) and rituals during harvesting?")
                                        .explanation("The sacred Kamatha threshing floor is treated as a consecrated space. Kamath Bhashawa (special symbolic terminology) is spoken to show deep reverence to nature and ward off unseen negative influences (Goya).")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Consecrated Reverence & Spiritual Protection (Kamath Bhashawa)")
                                                                        .description("Ancient linguistic discipline showing gratitude to nature and preserving ritual sanctity.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Speeding Up Mechanical Tractor Threshing")
                                                                        .description("Rituals are spiritual and cultural traditions, not mechanized speed shortcuts.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Commercially Grading Grain for Export")
                                                                        .description("Modern commodity sorting that has no connection to sacred folk harvest customs.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Replacing Organic Composting with Chemicals")
                                                                        .description("Synthetic agrochemicals run counter to ancestral sustainable farming ethos.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 8. Indigenous Medicine, Ayurveda & Hela Wedakama
                if (fullContent.contains("ayurveda") || fullContent.contains("medicine") || fullContent.contains("herb")
                                || fullContent.contains("healing") || fullContent.contains("wedakama")
                                || fullContent.contains("ola") || fullContent.contains("decoction")) {
                        return StoryQuizDTO.builder()
                                        .question("What core principle governs the preparation of herbal decoctions (Kashaya) in Hela Wedakama?")
                                        .explanation("Indigenous medicine emphasizes boiling carefully gathered fresh herbs down to a precise fraction (such as 8 cups reduced to 1 cup) to extract active phyto-compounds while chanting healing blessings (Seth Shanthi).")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Precise Reduction Boiling (8 to 1 Ratio) of Fresh Herbs")
                                                                        .description("Concentrates volatile herbal principles without destroying biological vitality.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Flash Chemical Solvent Extraction")
                                                                        .description("Modern industrial process using synthetic reagents that alter organic balance.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("Raw Powder Pill Compression")
                                                                        .description("Dry tablets lack the bio-available hot water decoction synergy of Kashaya.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Adding Artificial Preservative Salts")
                                                                        .description("Synthetic additives that counter the holistic balancing goals of Wedakama.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 9. Traditional Food, Sweetmeats, Kithul Treacle & Cooking (Kavum, Kokis,
                // Jaggery)
                if (fullContent.contains("food") || fullContent.contains("kavum") || fullContent.contains("kokis")
                                || fullContent.contains("kithul") || fullContent.contains("treacle")
                                || fullContent.contains("sweet") || fullContent.contains("jaggery")
                                || fullContent.contains("culinary")) {
                        return StoryQuizDTO.builder()
                                        .question("Based on traditional culinary knowledge, what natural sweetener is essential for authentic Sri Lankan heritage confectionery?")
                                        .explanation("Pure Kithul palm treacle (Pani) and Jaggery, tapped from wild Caryota urens inflorescences, provide the signature smoky caramel aroma and natural preservation essential for festive Kavum and Aluwa.")
                                        .options(List.of(
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("A")
                                                                        .optionText("Pure Wild Kithul Palm Treacle (Pani)")
                                                                        .description("Unrefined sap boiled to thick amber syrup delivering authentic aroma and taste.")
                                                                        .isCorrect(true)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("B")
                                                                        .optionText("Refined White Cane Sugar Crystals")
                                                                        .description("Processed sweetener lacking the distinct earthy floral notes of wild palm.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("C")
                                                                        .optionText("High-Fructose Synthetic Corn Syrup")
                                                                        .description("Industrial liquid sweetener that alters the delicate dough consistency of oil cakes.")
                                                                        .isCorrect(false)
                                                                        .build(),
                                                        StoryQuizOptionDTO.builder()
                                                                        .optionKey("D")
                                                                        .optionText("Artificial Caramel Flavor Drops")
                                                                        .description("Chemical coloring without the natural preserving enzymes of freshly tapped sap.")
                                                                        .isCorrect(false)
                                                                        .build()))
                                        .build();
                }

                // 10. Dynamic Synthesized Quiz from Description Text
                String firstSentence = cleanDesc.contains(".") ? cleanDesc.substring(0, cleanDesc.indexOf('.')).trim()
                                : cleanDesc;
                if (firstSentence.length() > 100)
                        firstSentence = firstSentence.substring(0, 100) + "...";
                if (firstSentence.isBlank())
                        firstSentence = cleanTitle;

                return StoryQuizDTO.builder()
                                .question("What is the central cultural significance highlighted in \"" + cleanTitle
                                                + "\"?")
                                .explanation("Living heritage is safeguarded through authentic hands-on community transmission, maintaining material fidelity and spiritual connection across generations: \""
                                                + firstSentence + "\".")
                                .options(List.of(
                                                StoryQuizOptionDTO.builder()
                                                                .optionKey("A")
                                                                .optionText("Master-to-Apprentice Living Lineage (Parampara)")
                                                                .description("Direct oral and physical transmission ensuring spiritual and technique fidelity.")
                                                                .isCorrect(true)
                                                                .build(),
                                                StoryQuizOptionDTO.builder()
                                                                .optionKey("B")
                                                                .optionText("Mass Commercial Factory Duplication")
                                                                .description("Commercial automated replication that separates the craft from its sacred roots.")
                                                                .isCorrect(false)
                                                                .build(),
                                                StoryQuizOptionDTO.builder()
                                                                .optionKey("C")
                                                                .optionText("Replacing Traditional Materials with Synthetic Substitutes")
                                                                .description("Alters the texture, acoustic qualities, and symbolic meaning of the heritage.")
                                                                .isCorrect(false)
                                                                .build(),
                                                StoryQuizOptionDTO.builder()
                                                                .optionKey("D")
                                                                .optionText("Passive Archiving in Books without Practice")
                                                                .description("Theoretical storage alone without active community practice leads to lost traditions.")
                                                                .isCorrect(false)
                                                                .build()))
                                .build();
        }

        private StoryQuizDTO mapToDTO(StoryQuiz entity) {
                return StoryQuizDTO.builder()
                                .id(entity.getId() != null ? entity.getId().toString() : null)
                                .storyId(entity.getStoryId() != null ? entity.getStoryId().toString() : null)
                                .question(entity.getQuestion())
                                .explanation(entity.getExplanation())
                                .options(entity.getOptions() != null ? entity.getOptions().stream()
                                                .map(opt -> StoryQuizOptionDTO.builder()
                                                                .id(opt.getId() != null ? opt.getId().toString() : null)
                                                                .optionKey(opt.getOptionKey())
                                                                .optionText(opt.getOptionText())
                                                                .description(opt.getDescription())
                                                                .isCorrect(opt.isCorrect())
                                                                .build())
                                                .collect(Collectors.toList()) : new ArrayList<>())
                                .build();
        }
}
