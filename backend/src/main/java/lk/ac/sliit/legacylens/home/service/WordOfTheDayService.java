package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayResponse;
import lk.ac.sliit.legacylens.home.entity.WordOfTheDay;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.home.repository.WordOfTheDayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WordOfTheDayService {

    private final WordOfTheDayRepository repository;

    private static class WordSeed {
        final String word;
        final String transliteration;
        final String definition;
        final String partOfSpeech;
        final String language;

        WordSeed(String word, String transliteration, String definition, String partOfSpeech, String language) {
            this.word = word;
            this.transliteration = transliteration;
            this.definition = definition;
            this.partOfSpeech = partOfSpeech;
            this.language = language;
        }
    }

    @PostConstruct
    public void seedData() {
        if (repository.count() < 15) {
            try {
                repository.deleteAll();
                LocalDate today = LocalDate.now();

                List<WordSeed> seeds = List.of(
                    new WordSeed(
                        "ගොවියා",
                        "Goviya (The Custodian of Soil)",
                        "Traditionally revered as the sovereign steward of the paddy field, embodying devotion to ancestral agriculture and sustaining communal life.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "සාමූහිකත්වය",
                        "Samuhikatwaya (Communal Harmony)",
                        "The time-honored Sri Lankan ethos of collective unity, mutual labor support (Kaiya), and shared village resilience.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "කමත",
                        "Kamatha (Sacred Threshing Floor)",
                        "The circular ground where harvested paddy is ritually threshed, treated with sacred sanctity and governed by its own respectful dialect (Kamath Basa).",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "නැකත",
                        "Nekatha (Auspicious Moment)",
                        "An astrologically aligned sacred timeframe observed when undertaking milestone journeys, lighting hearth fires, and commencing planting seasons.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "පින්කම",
                        "Pinkama (Meritorious Gathering)",
                        "A spiritual community congregation and benevolent undertaking dedicated to charity, moral upliftment, and peace for all living beings.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "අමුත්තා",
                        "Amuththa (The Honored Guest)",
                        "The bedrock of Sri Lankan cultural hospitality, where every arriving visitor is cherished with open arms, cool water, and nourishing food.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "බුලත්හුරැල්ල",
                        "Bulath Hurulla (Sheaf of Betel Leaves)",
                        "A ritual offering of betel leaves presented with clasped hands as a token of deep generational reverence, sincere greeting, or reconciliation.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "යාය",
                        "Yaya (Vast Paddy Expanse)",
                        "An uninterrupted expanse of emerald-green or shimmering golden rice terraces rippling beneath the gentle tropical breeze.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "වෙදකම",
                        "Wedakama (Indigenous Hela Medicine)",
                        "Sri Lanka's ancestral lineage of holistic botanical medicine and wellness, formulated with endemic forest flora, herbal oils, and ancient lore.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "සත්කාරය",
                        "Sathkaraya (Warm Welcoming)",
                        "The revered traditional virtue of providing genuine care, refreshing hospitality, and feast to all who cross the family threshold.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "වැව",
                        "Wewa (Ancient Hydraulic Reservoir)",
                        "The ingenious ancient water reservoirs designed by ancient Sri Lankan kings, nourishing agrarian civilizations and regional biodiversity for millennia.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "වනපෙත",
                        "Wanapetha (Sacred Forest Canopy)",
                        "The pristine woodland canopy flourishing in perpetual balance beside heritage rural hamlets and peaceful mountain hermitages.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "පැල්පත",
                        "Pelpatha (Traditional Rural Homestead)",
                        "A tranquil earthen cottage roofed with hand-woven coconut palm cadjans, offering natural cooling and humble closeness to Mother Nature.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "පෙරහැර",
                        "Perahera (Cultural Pageant)",
                        "A spectacular sacred cultural pageant vibrant with thunderous drum beats, acrobatic whip-crackers, fire dancers, and venerated cultural relics.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "விருந்தோம்பல்",
                        "Virunthombal (Selfless Hospitality)",
                        "The celebrated Tamil cultural virtue of welcoming guests warmly and offering celebratory cuisine before tending to oneself.",
                        "Noun",
                        "Tamil"
                    ),
                    new WordSeed(
                        "பொங்கல்",
                        "Pongal (Overflowing Abundance)",
                        "The auspicious harvest tradition of boiling fresh rice and milk in earthen pots until it overflows, greeting the sun with thanksgiving.",
                        "Noun",
                        "Tamil"
                    ),
                    new WordSeed(
                        "கோலம்",
                        "Kolam (Auspicious Threshold Art)",
                        "Intricate geometric rice-flour motifs hand-drawn at doorsteps at dawn to bestow spiritual blessing, beauty, and tranquility upon the home.",
                        "Noun",
                        "Tamil"
                    ),
                    new WordSeed(
                        "කුළුපග",
                        "Kulupaga (Intimately Kindred)",
                        "A poetic classical descriptor celebrating friendships, neighbors, and allies whose bonds and loyalties are as deep as family.",
                        "Adjective",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "කැවුම්",
                        "Kevum (Festive Oil Cake)",
                        "The quintessential festive delicacy crafted from seasoned rice flour and kithul palm treacle, crowned with an artisan hand-sculpted spire.",
                        "Noun",
                        "Sinhala"
                    ),
                    new WordSeed(
                        "ආයුබෝවන්",
                        "Ayubowan (May You Live Long)",
                        "The iconic Sri Lankan traditional greeting accompanied by a gentle bow with palms pressed together, invoking long life, vitality, and peace.",
                        "Phrase",
                        "Sinhala"
                    )
                );

                for (int i = 0; i < seeds.size(); i++) {
                    WordSeed seed = seeds.get(i);
                    WordOfTheDay item = new WordOfTheDay();
                    item.setWord(seed.word);
                    item.setTransliteration(seed.transliteration);
                    item.setDefinition(seed.definition);
                    item.setPartOfSpeech(seed.partOfSpeech);
                    item.setLanguage(seed.language);
                    item.setStatus("Published");
                    item.setActiveDate(today.plusDays(i));
                    repository.save(item);
                }
                log.info("Successfully seeded {} curated Word of the Day entries starting from {}", seeds.size(), today);
            } catch (Exception e) {
                log.error("Failed to seed Word of the Day entries: {}", e.getMessage(), e);
            }
        }
    }

    @Transactional(readOnly = true)
    public WordOfTheDayResponse getWordOfToday() {
        LocalDate today = LocalDate.now();

        // 1. First priority: look for a word explicitly scheduled for today's calendar date
        Optional<WordOfTheDay> explicitToday = repository.findByActiveDate(today);
        if (explicitToday.isPresent()) {
            return mapToResponse(explicitToday.get());
        }

        // 2. Deterministic calendar rotation:
        // When today's explicit date is beyond the seeded dates (or on arbitrary days),
        // use epochDay % totalWords to guarantee:
        // - Exactly 1 word is shown for the entire 24-hour day
        // - It advances daily at midnight
        // - It rotates through all available words without consecutive repetition
        List<WordOfTheDay> allWords = repository.findAll(Sort.by("id"));
        if (!allWords.isEmpty()) {
            int dayIndex = (int) (Math.abs(today.toEpochDay()) % allWords.size());
            return mapToResponse(allWords.get(dayIndex));
        }

        throw new ResourceNotFoundException("No Word of the Day found");
    }

    @Transactional
    public WordOfTheDayResponse createWord(WordOfTheDayRequest request) {
        WordOfTheDay word = repository.findByActiveDate(request.getActiveDate()).orElse(new WordOfTheDay());
        word.setLanguage(request.getLanguage() != null && !request.getLanguage().isBlank() ? request.getLanguage() : "Sinhala");
        word.setWord(request.getWord());
        word.setTransliteration(request.getTransliteration());
        word.setDefinition(request.getDefinition());
        word.setPartOfSpeech(request.getPartOfSpeech());
        word.setAudioFilename(request.getAudioFilename());
        word.setActiveDate(request.getActiveDate());

        WordOfTheDay saved = repository.save(word);
        return mapToResponse(saved);
    }

    private WordOfTheDayResponse mapToResponse(WordOfTheDay word) {
        return WordOfTheDayResponse.builder()
                .id(word.getId())
                .word(word.getWord())
                .transliteration(word.getTransliteration())
                .definition(word.getDefinition())
                .partOfSpeech(word.getPartOfSpeech())
                .audioFilename(word.getAudioFilename())
                .activeDate(word.getActiveDate())
                .language(word.getLanguage())
                .build();
    }
}
