package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.users.entity.City;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.containsStem;
import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.nullToEmpty;
import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.splitTags;

/** Reads an opportunity (category, title, tasks, admin Required Skills, location) and works out what it needs. */
public final class OpportunityNeedsAnalyser {

    private OpportunityNeedsAnalyser() {
    }

    /** The admin's "Preservation Category" chips (see CreateOpportunityScreen) → topic, when the words alone don't reveal it. */
    private static final Map<String, ContentTopic> CATEGORY_TOPICS = Map.of(
            "craft", ContentTopic.CRAFT,
            "food", ContentTopic.FOOD,
            "language", ContentTopic.LANGUAGE,
            "tradition", ContentTopic.RITUAL,
            "music", ContentTopic.MUSIC,
            "dance", ContentTopic.DANCE,
            "agriculture", ContentTopic.LIVELIHOOD,
            "ritual", ContentTopic.RITUAL,
            "folk knowledge", ContentTopic.STORY);

    /** Admin "Required Skills" labels (see CreateOpportunityScreen) → creator skills. */
    private static final Map<String, CreatorSkill> ADMIN_SKILLS = Map.of(
            "photography", CreatorSkill.PHOTOGRAPHY,
            "videography", CreatorSkill.VIDEOGRAPHY,
            "documentation", CreatorSkill.WRITING,
            "translation", CreatorSkill.TRANSLATION,
            "interviews", CreatorSkill.INTERVIEWING);

    /** Works out what the opportunity needs. {@code cities} resolves its location to a city/province. */
    public static OpportunityNeeds analyse(Opportunity opportunity, List<City> cities) {
        String text = String.join(" ",
                nullToEmpty(opportunity.getCategory()),
                nullToEmpty(opportunity.getTitle()),
                nullToEmpty(opportunity.getDescription()),
                nullToEmpty(opportunity.getPreservationGoal()),
                nullToEmpty(opportunity.getTasks())).toLowerCase(Locale.ROOT);

        Set<ContentTopic> found = topicsOf(opportunity.getCategory(), text);
        List<ContentTopic> topics = new ArrayList<>(found);

        Set<CreatorSkill> mustHave = EnumSet.noneOf(CreatorSkill.class);
        Set<CreatorSkill> helpful = EnumSet.noneOf(CreatorSkill.class);

        Set<CreatorSkill> adminSkills = adminRequiredSkills(opportunity.getRequiredSkills());
        boolean fromAdmin = !adminSkills.isEmpty();
        if (fromAdmin) {
            mustHave.addAll(adminSkills);
            topics.forEach(topic -> helpful.addAll(topic.helpful));
        } else {
            topics.forEach(topic -> {
                mustHave.addAll(topic.mustHave);
                helpful.addAll(topic.helpful);
            });
            // An explicit ask in the opportunity's own words always makes that skill a must-have.
            if (containsStem(text, "photograph") || containsStem(text, "photo")) mustHave.add(CreatorSkill.PHOTOGRAPHY);
            if (containsStem(text, "video") || containsStem(text, "film")) mustHave.add(CreatorSkill.VIDEOGRAPHY);
            if (containsStem(text, "interview")) mustHave.add(CreatorSkill.INTERVIEWING);
            if (containsStem(text, "transcri") || containsStem(text, "article")) mustHave.add(CreatorSkill.WRITING);
            if (containsStem(text, "translat")) mustHave.add(CreatorSkill.TRANSLATION);
        }
        helpful.removeAll(mustHave);

        String locationType = nullToEmpty(opportunity.getLocationType()).toLowerCase(Locale.ROOT);
        boolean remote = locationType.contains("remote");

        return new OpportunityNeeds(
                mustHave, helpful, List.copyOf(topics), fromAdmin, mustHave.isEmpty(),
                resolveCity(opportunity.getLocation(), cities), remote);
    }

    /**
     * What a piece of work is about: the topic its category names (the most
     * deliberate signal, so it leads) followed by every topic its words mention.
     * {@code lowerText} must already be lower case.
     */
    static Set<ContentTopic> topicsOf(String category, String lowerText) {
        Set<ContentTopic> found = new LinkedHashSet<>();
        ContentTopic categoryTopic = CATEGORY_TOPICS.get(nullToEmpty(category).trim().toLowerCase(Locale.ROOT));
        if (categoryTopic != null) {
            found.add(categoryTopic);
        }
        for (ContentTopic topic : ContentTopic.values()) {
            if (topic.mentionedIn(lowerText)) {
                found.add(topic);
            }
        }
        return found;
    }

    private static Set<CreatorSkill> adminRequiredSkills(String requiredSkills) {
        Set<CreatorSkill> skills = EnumSet.noneOf(CreatorSkill.class);
        for (String tag : splitTags(requiredSkills)) {
            String lower = tag.toLowerCase(Locale.ROOT);
            ADMIN_SKILLS.entrySet().stream()
                    .filter(entry -> lower.startsWith(entry.getKey()))
                    .findFirst()
                    .map(Map.Entry::getValue)
                    .or(() -> matchSkill(lower))
                    .ifPresent(skills::add);
        }
        return skills;
    }

    private static Optional<CreatorSkill> matchSkill(String lowerTag) {
        for (CreatorSkill skill : CreatorSkill.values()) {
            if (skill.matches(lowerTag)) {
                return Optional.of(skill);
            }
        }
        return Optional.empty();
    }

    /** The known city named in a free-text location — longest name first, so "Nuwara Eliya" beats "Eliya". */
    static City resolveCity(String location, List<City> cities) {
        if (location == null || location.isBlank() || cities == null) {
            return null;
        }
        String lower = location.toLowerCase(Locale.ROOT);
        return cities.stream()
                .filter(city -> city.getName() != null && !city.getName().isBlank())
                .sorted(Comparator.comparingInt((City city) -> city.getName().length()).reversed())
                .filter(city -> containsStem(lower, city.getName().toLowerCase(Locale.ROOT)))
                .findFirst()
                .orElse(null);
    }
}
