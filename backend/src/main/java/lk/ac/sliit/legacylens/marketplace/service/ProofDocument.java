package lk.ac.sliit.legacylens.marketplace.service;

import java.nio.file.Path;

/** A stored verification document, ready to be streamed back to its owner. */
public record ProofDocument(Path file, String contentType) {
}
