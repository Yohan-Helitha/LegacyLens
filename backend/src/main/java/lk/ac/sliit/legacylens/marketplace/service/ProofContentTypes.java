package lk.ac.sliit.legacylens.marketplace.service;

import java.util.Locale;

/** Works out a stored verification document's content type from its file extension (the only types accepted at upload). */
final class ProofContentTypes {

    private ProofContentTypes() {
    }

    static String forFile(String filename) {
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }
}
