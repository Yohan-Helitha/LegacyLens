package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * How well a creator speaks a language, chosen on the "Become a Content
 * Creator" form. The credit is how much of the language score a creator
 * earns when the opportunity needs that language.
 */
public enum LanguageProficiency {
    BASIC(0.4),
    INTERMEDIATE(0.7),
    FLUENT(1.0);

    private final double credit;

    LanguageProficiency(double credit) {
        this.credit = credit;
    }

    public double credit() {
        return credit;
    }
}
