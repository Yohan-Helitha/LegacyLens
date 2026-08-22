package lk.ac.sliit.legacylens.learning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "flashcards")
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false)
    private String word;

    @Column(columnDefinition = "TEXT")
    private String meaning;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "cultural_note", columnDefinition = "TEXT")
    private String culturalNote;

    @Column(name = "recorded_by")
    private String recordedBy;

    public Flashcard() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getMeaning() {
        return meaning;
    }

    public void setMeaning(String meaning) {
        this.meaning = meaning;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public String getCulturalNote() {
        return culturalNote;
    }

    public void setCulturalNote(String culturalNote) {
        this.culturalNote = culturalNote;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(String recordedBy) {
        this.recordedBy = recordedBy;
    }
}