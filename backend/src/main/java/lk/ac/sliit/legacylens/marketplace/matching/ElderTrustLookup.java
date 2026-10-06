package lk.ac.sliit.legacylens.marketplace.matching;

import java.util.UUID;

/** How far an elder has earned the platform's trust - what lets a newer creator be recommended to them. */
public interface ElderTrustLookup {

    /** 0.0 (brand new) to 1.0 (highest level), or null when it cannot be worked out. */
    Double trustOf(UUID elderId);
}
