package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.users.entity.City;

import java.util.Locale;
import java.util.OptionalDouble;

import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.containsStem;
import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.hasText;

/**
 * How close is the creator to where the work happens? Distance, not "same city
 * or not": a creator one town over is still a good match.
 *
 * <pre>
 *   under 10 km (or the same city) 1.0  |  10-30 km 0.8  |  30-60 km 0.6  |  60-100 km 0.4  |  100 km+ 0.2
 * </pre>
 *
 * "Remote OK" work scores 1.0 for everyone. When a town is not on the distance
 * list the creator's province is compared instead, and when the location of
 * either side is unknown the score is a cautious 0.4.
 */
final class LocationFactor implements MatchFactor {

    private static final double UNKNOWN = 0.4;

    private final int weight;

    LocationFactor(int weight) {
        this.weight = weight;
    }

    @Override
    public int weight() {
        return weight;
    }

    @Override
    public FactorScore evaluate(MatchContext context) {
        OpportunityNeeds needs = context.needs();
        City creatorCity = context.candidate().city();

        if (needs.remote()) {
            return FactorScore.of(1.0, context.say("Can work on this remotely", "You can do this remotely"));
        }
        if (creatorCity == null) {
            return FactorScore.of(UNKNOWN, null);
        }

        String where = creatorCity.getName();
        City workCity = needs.city();
        String location = context.opportunity().getLocation();

        // The location text names the creator's own city even though it is not in the cities table.
        boolean namedInText = workCity == null && hasText(location) && hasText(where)
                && containsStem(location.toLowerCase(Locale.ROOT), where.toLowerCase(Locale.ROOT));
        if (namedInText || (workCity != null && sameCity(creatorCity, workCity))) {
            return FactorScore.of(1.0, context.say(
                    "Lives in " + where + ", where this takes place",
                    "This takes place in your city, " + where));
        }
        if (workCity == null) {
            return FactorScore.of(UNKNOWN, null);
        }

        OptionalDouble km = CityDistance.kilometres(where, workCity.getName());
        if (km.isPresent()) {
            double distance = km.getAsDouble();
            double fraction = distance < 10 ? 1.0 : distance < 30 ? 0.8 : distance < 60 ? 0.6 : distance < 100 ? 0.4 : 0.2;
            String reason = fraction >= 0.6
                    ? context.say("Lives about " + Math.round(distance) + " km away in " + where,
                                  "About " + Math.round(distance) + " km from you")
                    : null;
            return FactorScore.of(fraction, reason);
        }
        if (hasText(creatorCity.getRegion()) && hasText(workCity.getRegion())) {
            boolean sameRegion = creatorCity.getRegion().trim().equalsIgnoreCase(workCity.getRegion().trim());
            String region = creatorCity.getRegion().trim();
            return FactorScore.of(sameRegion ? 0.6 : 0.2,
                    sameRegion ? context.say("Lives nearby in " + where + " (" + region + ")",
                                             "In your province, " + region) : null);
        }
        return FactorScore.of(UNKNOWN, null);
    }

    private static boolean sameCity(City a, City b) {
        if (a.getId() != null && b.getId() != null) {
            return a.getId().equals(b.getId());
        }
        return a.getName() != null && a.getName().equalsIgnoreCase(b.getName());
    }
}
