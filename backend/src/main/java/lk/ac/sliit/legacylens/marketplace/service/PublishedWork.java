package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkMaterial;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * What a creator's approved work looks like as something users can read, watch or listen to: the text the
 * creator wrote, and at most one lead photo and one lead recording, picked from the files they attached.
 * A video makes it a video post, otherwise a recording makes it an audio post, otherwise it is a written story.
 *
 * @param type VIDEO, AUDIO or BLOG
 */
public record PublishedWork(
        UUID jobId,
        UUID creatorId,
        String title,
        String description,
        String body,
        List<String> keywords,
        String type,
        String mediaUrl,
        String mediaMimeType,
        String imageUrl) {

    private static final Pattern IMAGE = Pattern.compile(".*\\.(jpe?g|png|gif|webp|heic|heif|bmp)(\\?.*)?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern VIDEO = Pattern.compile(".*\\.(mp4|mov|m4v|webm|3gp|mkv)(\\?.*)?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern AUDIO = Pattern.compile(".*\\.(mp3|m4a|aac|wav|ogg|opus|amr)(\\?.*)?$", Pattern.CASE_INSENSITIVE);

    public static PublishedWork from(Job job, JobWorkProgress progress, List<JobWorkMaterial> materials) {
        JobWorkMaterial video = firstOf(materials, VIDEO);
        JobWorkMaterial audio = video == null ? firstOf(materials, AUDIO) : null;
        JobWorkMaterial image = firstOf(materials, IMAGE);
        JobWorkMaterial media = video != null ? video : audio;

        String introduction = clean(progress.getIntroduction());
        String story = clean(progress.getStory());
        String summary = clean(progress.getSeoSummary());

        String body = introduction != null && story != null ? introduction + "\n\n" + story
                : introduction != null ? introduction : story;
        String description = summary != null ? summary : introduction != null ? introduction : story;

        return new PublishedWork(
                job.getId(),
                job.getCreator().getId(),
                job.getTitle(),
                description,
                body,
                keywords(progress.getSeoKeywords()),
                video != null ? "VIDEO" : audio != null ? "AUDIO" : "BLOG",
                media != null ? media.getFileUrl() : null,
                media != null ? mimeOf(media.getFileUrl()) : null,
                image != null ? image.getFileUrl() : null);
    }

    private static JobWorkMaterial firstOf(List<JobWorkMaterial> materials, Pattern kind) {
        if (materials == null) return null;
        return materials.stream()
                .filter(m -> (m.getFileUrl() != null && kind.matcher(m.getFileUrl()).matches())
                        || (m.getFileName() != null && kind.matcher(m.getFileName()).matches()))
                .findFirst()
                .orElse(null);
    }

    private static String clean(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    private static List<String> keywords(String stored) {
        if (stored == null || stored.isBlank()) return List.of();
        return Arrays.stream(stored.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** The file type from its extension - the shared bucket links do not carry one any other way. */
    static String mimeOf(String url) {
        String lower = url == null ? "" : url.toLowerCase(Locale.ROOT).split("\\?")[0];
        if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
        if (lower.endsWith(".mov")) return "video/quicktime";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".3gp")) return "video/3gpp";
        if (lower.endsWith(".mkv")) return "video/x-matroska";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".m4a")) return "audio/mp4";
        if (lower.endsWith(".aac")) return "audio/aac";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".ogg") || lower.endsWith(".opus")) return "audio/ogg";
        if (lower.endsWith(".amr")) return "audio/amr";
        return null;
    }
}
