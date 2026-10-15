package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkMaterial;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PublishedWorkTest {

    private Job job;
    private JobWorkProgress progress;

    @BeforeEach
    void setUp() {
        User creator = new User();
        creator.setId(UUID.randomUUID());
        job = new Job();
        job.setId(UUID.randomUUID());
        job.setTitle("Making of Clay Lamps");
        job.setCreator(creator);

        progress = new JobWorkProgress();
        progress.setJob(job);
        progress.setIntroduction("  An intro  ");
        progress.setStory("The story");
        progress.setSeoSummary("A short summary");
        progress.setSeoKeywords("clay, lamps , ,craft");
    }

    private static JobWorkMaterial material(String name) {
        JobWorkMaterial m = new JobWorkMaterial();
        m.setFileName(name);
        m.setFileUrl("https://example.supabase.co/storage/v1/object/public/work-materials/" + name);
        return m;
    }

    @Test
    void writtenWorkWithNoRecordingBecomesAWrittenStoryWithTheCreatorsOwnWords() {
        PublishedWork work = PublishedWork.from(job, progress, List.of());

        assertThat(work.type()).isEqualTo("BLOG");
        assertThat(work.title()).isEqualTo("Making of Clay Lamps");
        assertThat(work.description()).isEqualTo("A short summary");
        assertThat(work.body()).isEqualTo("An intro\n\nThe story");
        assertThat(work.keywords()).containsExactly("clay", "lamps", "craft");
        assertThat(work.creatorId()).isEqualTo(job.getCreator().getId());
        assertThat(work.mediaUrl()).isNull();
    }

    @Test
    void aVideoMakesItAVideoPost_andAPhotoBecomesItsCoverImage() {
        PublishedWork work = PublishedWork.from(job, progress,
                List.of(material("cover.jpg"), material("making.mp4"), material("voice.m4a")));

        assertThat(work.type()).isEqualTo("VIDEO");
        assertThat(work.mediaUrl()).endsWith("making.mp4");
        assertThat(work.mediaMimeType()).isEqualTo("video/mp4");
        assertThat(work.imageUrl()).endsWith("cover.jpg");
    }

    @Test
    void aRecordingWithNoVideoMakesItAnAudioPost() {
        PublishedWork work = PublishedWork.from(job, progress, List.of(material("voice.m4a")));

        assertThat(work.type()).isEqualTo("AUDIO");
        assertThat(work.mediaUrl()).endsWith("voice.m4a");
        assertThat(work.mediaMimeType()).isEqualTo("audio/mp4");
        assertThat(work.imageUrl()).isNull();
    }

    @Test
    void theDescriptionFallsBackToTheIntroductionThenTheStoryWhenThereIsNoSummary() {
        progress.setSeoSummary(null);
        assertThat(PublishedWork.from(job, progress, List.of()).description()).isEqualTo("An intro");

        progress.setIntroduction(" ");
        assertThat(PublishedWork.from(job, progress, List.of()).description()).isEqualTo("The story");
        assertThat(PublishedWork.from(job, progress, List.of()).body()).isEqualTo("The story");
    }
}
