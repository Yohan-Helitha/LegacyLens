package lk.ac.sliit.legacylens.marketplace.matching;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.OptionalDouble;

/**
 * Straight-line distance between two Sri Lankan towns, so "nearby" can mean
 * kilometres instead of "same city or not". The cities table has no
 * coordinates, so the well-known towns are listed here by name.
 */
final class CityDistance {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /** name (lower case) -> {latitude, longitude}; longest names first so "nuwara eliya" is tried before "eliya". */
    private static final Map<String, double[]> TOWNS = new LinkedHashMap<>();

    static {
        Map<String, double[]> raw = new LinkedHashMap<>();
        raw.put("colombo", new double[] {6.9271, 79.8612});
        raw.put("kandy", new double[] {7.2906, 80.6337});
        raw.put("galle", new double[] {6.0535, 80.2210});
        raw.put("matara", new double[] {5.9549, 80.5550});
        raw.put("jaffna", new double[] {9.6615, 80.0255});
        raw.put("negombo", new double[] {7.2086, 79.8358});
        raw.put("anuradhapura", new double[] {8.3114, 80.4037});
        raw.put("polonnaruwa", new double[] {7.9403, 81.0188});
        raw.put("trincomalee", new double[] {8.5874, 81.2152});
        raw.put("batticaloa", new double[] {7.7310, 81.6747});
        raw.put("kurunegala", new double[] {7.4863, 80.3647});
        raw.put("ratnapura", new double[] {6.7056, 80.3847});
        raw.put("badulla", new double[] {6.9934, 81.0550});
        raw.put("nuwara eliya", new double[] {6.9497, 80.7891});
        raw.put("matale", new double[] {7.4675, 80.6234});
        raw.put("kegalle", new double[] {7.2513, 80.3464});
        raw.put("gampaha", new double[] {7.0873, 79.9925});
        raw.put("kalutara", new double[] {6.5854, 79.9607});
        raw.put("hambantota", new double[] {6.1241, 81.1185});
        raw.put("ampara", new double[] {7.2912, 81.6724});
        raw.put("monaragala", new double[] {6.8728, 81.3507});
        raw.put("puttalam", new double[] {8.0408, 79.8394});
        raw.put("kilinochchi", new double[] {9.3803, 80.3770});
        raw.put("mannar", new double[] {8.9810, 79.9044});
        raw.put("vavuniya", new double[] {8.7514, 80.4971});
        raw.put("mullaitivu", new double[] {9.2671, 80.8142});
        raw.put("chilaw", new double[] {7.5758, 79.7953});
        raw.put("dambulla", new double[] {7.8731, 80.6518});
        raw.put("sigiriya", new double[] {7.9570, 80.7603});
        raw.put("kataragama", new double[] {6.4137, 81.3345});
        raw.put("tangalle", new double[] {6.0240, 80.7970});
        raw.put("hikkaduwa", new double[] {6.1395, 80.1063});
        raw.put("weligama", new double[] {5.9744, 80.4298});
        raw.put("mirissa", new double[] {5.9483, 80.4716});
        raw.put("bentota", new double[] {6.4258, 79.9959});
        raw.put("panadura", new double[] {6.7132, 79.9026});
        raw.put("moratuwa", new double[] {6.7730, 79.8816});
        raw.put("dehiwala", new double[] {6.8518, 79.8650});
        raw.put("kotte", new double[] {6.8905, 79.9087});
        raw.put("maharagama", new double[] {6.8480, 79.9265});
        raw.put("nugegoda", new double[] {6.8649, 79.8997});
        raw.put("kelaniya", new double[] {6.9553, 79.9220});
        raw.put("wattala", new double[] {6.9895, 79.8913});
        raw.put("ja-ela", new double[] {7.0744, 79.8919});
        raw.put("horana", new double[] {6.7150, 80.0625});
        raw.put("avissawella", new double[] {6.9533, 80.2100});
        raw.put("peradeniya", new double[] {7.2562, 80.5970});
        raw.put("pilimathalawa", new double[] {7.2600, 80.5400});
        raw.put("gampola", new double[] {7.1640, 80.5700});
        raw.put("hatton", new double[] {6.8916, 80.5956});
        raw.put("bandarawela", new double[] {6.8328, 80.9877});
        raw.put("ella", new double[] {6.8667, 81.0466});
        raw.put("haputale", new double[] {6.7667, 80.9667});
        raw.put("embilipitiya", new double[] {6.3333, 80.8500});
        raw.put("kuliyapitiya", new double[] {7.4700, 80.0400});
        raw.put("akuressa", new double[] {6.0953, 80.4747});
        raw.put("deniyaya", new double[] {6.3410, 80.5530});
        raw.entrySet().stream()
                .sorted(Comparator.comparingInt((Map.Entry<String, double[]> e) -> e.getKey().length()).reversed())
                .forEach(e -> TOWNS.put(e.getKey(), e.getValue()));
    }

    private CityDistance() {
    }

    /** Kilometres between two towns by name, or empty when either is not a known town. */
    static OptionalDouble kilometres(String townA, String townB) {
        double[] a = coordinates(townA);
        double[] b = coordinates(townB);
        if (a == null || b == null) {
            return OptionalDouble.empty();
        }
        double dLat = Math.toRadians(b[0] - a[0]);
        double dLng = Math.toRadians(b[1] - a[1]);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a[0])) * Math.cos(Math.toRadians(b[0])) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return OptionalDouble.of(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
    }

    private static double[] coordinates(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        String lower = name.toLowerCase(Locale.ROOT);
        return TOWNS.entrySet().stream()
                .filter(entry -> lower.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }
}
