package lk.ac.sliit.legacylens.admin.service;

import jakarta.annotation.PostConstruct;
import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.marketplace.event.OpportunityPublishedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ac.sliit.legacylens.admin.dto.OpportunityTranscriptionResponse;
import lk.ac.sliit.legacylens.moderation.service.GroqAiService;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResponse;
import lk.ac.sliit.legacylens.speech.service.TranscriptionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminOpportunityServiceImpl implements AdminOpportunityService {

    private static final Logger log = LoggerFactory.getLogger(AdminOpportunityServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final OpportunityAudioRepository opportunityAudioRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;
    private final ApplicationEventPublisher events;
    private final JobRequestRepository jobRequestRepository;
    private final TranscriptionService transcriptionService;
    private final GroqAiService groqAiService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AdminOpportunityServiceImpl(
            OpportunityAudioRepository opportunityAudioRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository,
            AdminAuditService auditService,
            ApplicationEventPublisher events,
            JobRequestRepository jobRequestRepository,
            TranscriptionService transcriptionService,
            GroqAiService groqAiService,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.opportunityAudioRepository = opportunityAudioRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.events = events;
        this.jobRequestRepository = jobRequestRepository;
        this.transcriptionService = transcriptionService;
        this.groqAiService = groqAiService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Auto-sync any unsynced elder job requests from job_requests table into opportunity_audios table
     * so the admin opportunity intake queue always reflects live db data.
     * Also ensure database schema allows large base64 image data URLs and titles.
     */
    @PostConstruct
    public void syncExistingJobRequestsOnStartup() {
        try {
            jdbcTemplate.execute("ALTER TABLE opportunities ALTER COLUMN hero_image_url TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE opportunities ALTER COLUMN title TYPE VARCHAR(500)");
            log.info("Verified/updated opportunities table columns: hero_image_url -> TEXT, title -> VARCHAR(500)");
        } catch (Exception e) {
            log.warn("Could not alter opportunities table columns: {}", e.getMessage());
        }

        try {
            List<JobRequest> requests = jobRequestRepository.findAll();
            for (JobRequest jr : requests) {
                syncJobRequestToOpportunityAudio(jr);
            }
            log.info("Synchronized {} job_requests into opportunity_audios table on startup.", requests.size());
        } catch (Exception e) {
            log.warn("Startup sync of job_requests to opportunity_audios skipped or failed: {}", e.getMessage());
        }
    }

    private void syncJobRequestToOpportunityAudio(JobRequest jr) {
        if (jr == null || jr.getElder() == null) {
            return;
        }
        try {
            String audioUrl = jr.getVoiceNoteUrl();
            if (audioUrl == null || audioUrl.isBlank()) {
                audioUrl = "job-request://" + jr.getId();
            }

            Optional<OpportunityAudio> existing = opportunityAudioRepository.findByAudioUrl(audioUrl);
            if (existing.isPresent()) {
                return;
            }

            User elder = jr.getElder();
            OpportunityAudio audio = new OpportunityAudio();
            audio.setKnowledgeHolder(elder);
            audio.setElderName(elder.getFullName() != null ? elder.getFullName() : "Elder Knowledge Keeper");
            audio.setElderAvatarUrl(elder.getProfilePhotoUrl());
            audio.setVerified(elder.isPhoneVerified());

            String location = "Sri Lanka";
            if (elder.getCity() != null) {
                location = elder.getCity().getName() + (elder.getCity().getRegion() != null ? ", " + elder.getCity().getRegion() : "");
            }
            audio.setLocation(location);
            audio.setRecordedAt(jr.getCreatedAt() != null ? jr.getCreatedAt() : LocalDateTime.now());
            audio.setDuration("02:45");
            audio.setAudioUrl(audioUrl);
            audio.setTopic(jr.getTitle());
            audio.setTags("Oral History, Cultural Documentation, Traditional Heritage");
            audio.setTranscript(jr.getDescription() != null && !jr.getDescription().isBlank() ? jr.getDescription() : jr.getTitle());
            audio.setStatus(jr.getStatus() == JobRequestStatus.PUBLISHED ? AudioReviewStatus.FULLY_LISTENED : AudioReviewStatus.UNLISTENED);

            opportunityAudioRepository.save(audio);
        } catch (Exception e) {
            log.warn("Failed to sync job_request {} to opportunity_audios: {}", jr.getId(), e.getMessage());
        }
    }

    /** Tells the knowledge holder their opportunity is live; one with no knowledge holder has nobody to tell. */
    private void announcePublished(Opportunity opportunity) {
        if (opportunity.getElder() != null && opportunity.getId() != null) {
            events.publishEvent(new OpportunityPublishedEvent(
                    opportunity.getElder().getId(), opportunity.getId(), opportunity.getTitle()));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityAudioResponse> getAudioSubmissions(String statusFilter) {
        List<OpportunityAudio> audios;
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            audios = opportunityAudioRepository.findAll();
        } else {
            try {
                AudioReviewStatus status = AudioReviewStatus.valueOf(statusFilter.toUpperCase());
                audios = opportunityAudioRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid AudioReviewStatus filter '{}', returning all submissions", statusFilter);
                audios = opportunityAudioRepository.findAll();
            }
        }
        return audios.stream().map(this::mapAudioResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OpportunityAudioResponse getAudioSubmission(String id) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found: " + id));
        return mapAudioResponse(audio);
    }

    @Override
    @Transactional
    public OpportunityAudioResponse updateAudioStatus(String id, String status) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found: " + id));
        try {
            AudioReviewStatus reviewStatus = AudioReviewStatus.valueOf(status.toUpperCase());
            audio.setStatus(reviewStatus);
            OpportunityAudio saved = opportunityAudioRepository.save(audio);
            log.info("Updated audio submission {} status to {}", id, reviewStatus);
            return mapAudioResponse(saved);
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Invalid audio review status: " + status);
        }
    }

    @Override
    @Transactional
    public OpportunityTranscriptionResponse transcribeAudio(String id) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found: " + id));

        List<OpportunityTranscriptionResponse.TranscriptSegment> originalSegments = new ArrayList<>();
        List<OpportunityTranscriptionResponse.TranscriptSegment> translationSegments = new ArrayList<>();
        StringBuilder fullSinhala = new StringBuilder();
        StringBuilder fullEnglish = new StringBuilder();

        // 1. Run real speech extraction via Azure Fast Transcription (si-LK)
        if (audio.getAudioUrl() != null && audio.getAudioUrl().startsWith("http")) {
            try {
                byte[] audioBytes = downloadAudioBytes(audio.getAudioUrl());
                if (audioBytes != null && audioBytes.length > 0) {
                    MultipartFile multipart = new InMemoryMultipartFile(
                            "audio", "recording.mp3", "audio/mpeg", audioBytes);
                    TranscriptionResponse stt = transcriptionService.transcribe(multipart, "si-LK");
                    if (stt != null) {
                        if (stt.getPhrases() != null && !stt.getPhrases().isEmpty()) {
                            for (int i = 0; i < stt.getPhrases().size(); i++) {
                                lk.ac.sliit.legacylens.speech.dto.TranscriptionPhrase phrase = stt.getPhrases().get(i);
                                long offset = phrase.getOffsetMs() != null ? phrase.getOffsetMs() : 0;
                                long totalSec = offset / 1000;
                                String time = String.format("%02d:%02d", totalSec / 60, totalSec % 60);
                                String text = phrase.getText() != null ? phrase.getText().trim() : "";
                                if (!text.isBlank()) {
                                    originalSegments.add(new OpportunityTranscriptionResponse.TranscriptSegment(time, text, i == 0));
                                    fullSinhala.append(text).append(" ");
                                }
                            }
                        } else if (stt.getText() != null && !stt.getText().isBlank()) {
                            String[] sentences = stt.getText().split("(?<=[.!?\\n])\\s+");
                            for (int i = 0; i < sentences.length; i++) {
                                String text = sentences[i].trim();
                                if (!text.isBlank()) {
                                    String time = String.format("%02d:%02d", (i * 15) / 60, (i * 15) % 60);
                                    originalSegments.add(new OpportunityTranscriptionResponse.TranscriptSegment(time, text, i == 0));
                                    fullSinhala.append(text).append(" ");
                                }
                            }
                        }
                        log.info("Azure Speech successfully transcribed audio {} into {} verbatim Sinhala segments.", id, originalSegments.size());
                    }
                }
            } catch (Exception e) {
                log.warn("Azure audio transcription failed for audio {}: {}", id, e.getMessage());
                throw new IllegalStateException("Audio speech transcription failed: " + e.getMessage());
            }
        } else {
            throw new IllegalArgumentException("Audio URL is not a valid accessible HTTP stream.");
        }

        if (originalSegments.isEmpty()) {
            throw new IllegalStateException("No audible Sinhala speech could be recognized in this audio file.");
        }

        // 2. Translate verbatim Sinhala segments to English via Groq AI without summarizing
        List<String> sinhalaPhrases = originalSegments.stream()
                .map(OpportunityTranscriptionResponse.TranscriptSegment::getText)
                .toList();
        List<String> englishTranslations = groqAiService.translateLiteralSegments(sinhalaPhrases);

        for (int i = 0; i < originalSegments.size(); i++) {
            String time = originalSegments.get(i).getTime();
            String eng = (englishTranslations != null && i < englishTranslations.size() && !englishTranslations.get(i).isBlank())
                    ? englishTranslations.get(i)
                    : originalSegments.get(i).getText();
            translationSegments.add(new OpportunityTranscriptionResponse.TranscriptSegment(time, eng, i == 0));
            fullEnglish.append(eng).append(" ");
        }

        // 3. Save verbatim transcript in database
        audio.setTranscript(fullSinhala.toString().trim());
        opportunityAudioRepository.save(audio);

        return OpportunityTranscriptionResponse.builder()
                .audioId(audio.getId().toString())
                .fullSinhalaText(fullSinhala.toString().trim())
                .fullEnglishText(fullEnglish.toString().trim())
                .transcriptOriginal(originalSegments)
                .transcriptTranslation(translationSegments)
                .build();
    }

    private byte[] downloadAudioBytes(String urlString) {
        if (urlString == null || !urlString.startsWith("http")) {
            return null;
        }
        try {
            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .connectTimeout(java.time.Duration.ofSeconds(10))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlString))
                    .timeout(java.time.Duration.ofSeconds(20))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 200) {
                return response.body();
            }
        } catch (Exception e) {
            log.warn("Failed to download audio from {}: {}", urlString, e.getMessage());
        }
        return null;
    }

    private static class InMemoryMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] bytes;

        public InMemoryMultipartFile(String name, String originalFilename, String contentType, byte[] bytes) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.bytes = bytes != null ? bytes : new byte[0];
        }

        @Override public String getName() { return name; }
        @Override public String getOriginalFilename() { return originalFilename; }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return bytes.length == 0; }
        @Override public long getSize() { return bytes.length; }
        @Override public byte[] getBytes() { return bytes; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(bytes); }
        @Override public void transferTo(File dest) throws IOException, IllegalStateException {
            Files.write(dest.toPath(), bytes);
        }
    }

    @Override
    @Transactional
    public AdminOpportunityResponse createOpportunity(CreateOpportunityRequest request, String performedById, String performedByName) {
        Opportunity opportunity = mapToEntity(request);
        String statusStr = request.getStatus();
        if (statusStr == null || statusStr.isBlank()) {
            opportunity.setStatus(OpportunityStatus.DRAFT);
        } else {
            try {
                opportunity.setStatus(OpportunityStatus.valueOf(statusStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                opportunity.setStatus(OpportunityStatus.DRAFT);
            }
        }
        Opportunity saved = opportunityRepository.save(opportunity);
        auditService.logAction(AuditActionType.CREATED, "Opportunity", saved.getId() != null ? saved.getId().toString() : null, request.getTitle(), performedById, performedByName, "New opportunity created");
        if (saved.getStatus() == OpportunityStatus.PUBLISHED) {
            announcePublished(saved);
        }
        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse publishFromAudio(String audioId, CreateOpportunityRequest request, String performedById, String performedByName) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(audioId))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found"));

        Opportunity opportunity = mapToEntity(request);
        opportunity.setStatus(OpportunityStatus.PUBLISHED);
        if (opportunity.getElder() == null && audio.getKnowledgeHolder() != null) {
            opportunity.setElder(audio.getKnowledgeHolder());
        }
        Opportunity saved = opportunityRepository.save(opportunity);
        auditService.logAction(AuditActionType.PUBLISHED, "Opportunity", saved.getId() != null ? saved.getId().toString() : null, request.getTitle(), performedById, performedByName, "Opportunity published from audio submission: " + audioId);
        announcePublished(saved);

        audio.setStatus(AudioReviewStatus.FULLY_LISTENED);
        opportunityAudioRepository.save(audio);

        // Sync status back to corresponding JobRequest if present
        try {
            if (audio.getAudioUrl() != null && !audio.getAudioUrl().isBlank()) {
                jobRequestRepository.findAll().stream()
                        .filter(jr -> audio.getAudioUrl().equals(jr.getVoiceNoteUrl()) || audio.getAudioUrl().contains(jr.getId().toString()))
                        .findFirst()
                        .ifPresent(jr -> {
                            jr.setStatus(JobRequestStatus.PUBLISHED);
                            jobRequestRepository.save(jr);
                            log.info("Updated JobRequest {} status to PUBLISHED", jr.getId());
                        });
            }
        } catch (Exception e) {
            log.warn("Could not sync published status back to JobRequest: {}", e.getMessage());
        }

        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminOpportunityResponse> getAllOpportunities(String statusFilter) {
        List<Opportunity> opportunities;
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            opportunities = opportunityRepository.findAll();
        } else {
            try {
                OpportunityStatus status = OpportunityStatus.valueOf(statusFilter.toUpperCase());
                opportunities = opportunityRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid OpportunityStatus filter '{}', returning all opportunities", statusFilter);
                opportunities = opportunityRepository.findAll();
            }
        }
        return opportunities.stream().map(this::mapToAdminResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOpportunityResponse getOpportunity(String id) {
        Opportunity opportunity = opportunityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        return mapToAdminResponse(opportunity);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse updateOpportunity(String id, CreateOpportunityRequest request, String performedById, String performedByName) {
        Opportunity opportunity = opportunityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with ID: " + id));

        OpportunityStatus before = opportunity.getStatus();

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            opportunity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            opportunity.setDescription(request.getDescription());
        }
        if (request.getHeroImageUrl() != null && !request.getHeroImageUrl().isBlank()) {
            opportunity.setHeroImageUrl(request.getHeroImageUrl());
        }
        if (request.getLocation() != null) {
            opportunity.setLocation(request.getLocation());
        }
        if (request.getCategory() != null) {
            opportunity.setCategory(request.getCategory());
        }
        if (request.getLocationType() != null) {
            opportunity.setLocationType(request.getLocationType());
        }
        if (request.getMatchPercentage() != null) {
            opportunity.setMatchPercentage(request.getMatchPercentage());
        }
        if (request.getUrgent() != null) {
            opportunity.setUrgent(request.getUrgent());
        }
        if (request.getDueAt() != null) {
            opportunity.setDueAt(request.getDueAt());
        }
        if (request.getScheduledDate() != null) {
            opportunity.setScheduledDate(request.getScheduledDate());
        }
        if (request.getDurationText() != null) {
            opportunity.setDurationText(request.getDurationText());
        }
        if (request.getTimeWindowText() != null) {
            opportunity.setTimeWindowText(request.getTimeWindowText());
        }
        if (request.getLanguage() != null) {
            opportunity.setLanguage(request.getLanguage());
        }
        if (request.getOfferedAmount() != null) {
            opportunity.setOfferedAmount(request.getOfferedAmount());
        }
        if (request.getPreservationGoal() != null) {
            opportunity.setPreservationGoal(request.getPreservationGoal());
        }
        if (request.getTasks() != null) {
            opportunity.setTasks(request.getTasks());
        }
        if (request.getRequiredSkills() != null) {
            opportunity.setRequiredSkills(request.getRequiredSkills());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                opportunity.setStatus(OpportunityStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }

        User elder = null;
        if (request.getElderId() != null && !request.getElderId().isBlank()) {
            try {
                UUID elderUuid = UUID.fromString(request.getElderId());
                elder = userRepository.findById(elderUuid).orElse(null);
            } catch (IllegalArgumentException ignored) {}
        }
        if (elder == null && request.getElderName() != null && !request.getElderName().isBlank()) {
            elder = userRepository.findByFullName(request.getElderName().trim()).orElse(null);
        }
        if (elder != null) {
            opportunity.setElder(elder);
        }

        Opportunity saved = opportunityRepository.save(opportunity);
        auditService.logAction(
                saved.getStatus() == OpportunityStatus.PUBLISHED ? AuditActionType.PUBLISHED : AuditActionType.UPDATED,
                "Opportunity",
                id,
                saved.getTitle(),
                performedById,
                performedByName,
                "Opportunity updated, status: " + saved.getStatus()
        );

        if (before != OpportunityStatus.PUBLISHED && saved.getStatus() == OpportunityStatus.PUBLISHED) {
            announcePublished(saved);
        }

        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse updateOpportunityStatus(String id, UpdateOpportunityStatusRequest request, String performedById, String performedByName) {
        Opportunity opportunity = opportunityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        OpportunityStatus before = opportunity.getStatus();
        opportunity.setStatus(OpportunityStatus.valueOf(request.getStatus().toUpperCase()));
        Opportunity saved = opportunityRepository.save(opportunity);
        if (before != OpportunityStatus.PUBLISHED && saved.getStatus() == OpportunityStatus.PUBLISHED) {
            announcePublished(saved);
        }
        auditService.logAction(AuditActionType.UPDATED, "Opportunity", id, saved.getTitle(), performedById, performedByName, "Status changed to: " + request.getStatus());
        return mapToAdminResponse(saved);
    }

    private Opportunity mapToEntity(CreateOpportunityRequest request) {
        Opportunity opportunity = new Opportunity();
        opportunity.setTitle(request.getTitle());
        opportunity.setDescription(request.getDescription());
        opportunity.setHeroImageUrl(request.getHeroImageUrl());
        opportunity.setLocation(request.getLocation());
        opportunity.setCategory(request.getCategory());
        opportunity.setLocationType(request.getLocationType());
        opportunity.setMatchPercentage(request.getMatchPercentage());
        opportunity.setUrgent(request.getUrgent() != null && request.getUrgent());
        opportunity.setDueAt(request.getDueAt());
        opportunity.setScheduledDate(request.getScheduledDate());
        opportunity.setDurationText(request.getDurationText());
        opportunity.setTimeWindowText(request.getTimeWindowText());
        opportunity.setLanguage(request.getLanguage());
        opportunity.setOfferedAmount(request.getOfferedAmount());
        opportunity.setPreservationGoal(request.getPreservationGoal());
        opportunity.setTasks(request.getTasks());
        opportunity.setRequiredSkills(request.getRequiredSkills());

        User elder = null;
        if (request.getElderId() != null && !request.getElderId().isBlank()) {
            try {
                UUID elderUuid = UUID.fromString(request.getElderId());
                elder = userRepository.findById(elderUuid).orElse(null);
            } catch (IllegalArgumentException ignored) {}
        }
        if (elder == null && request.getElderName() != null && !request.getElderName().isBlank()) {
            elder = userRepository.findByFullName(request.getElderName().trim()).orElse(null);
        }
        opportunity.setElder(elder);

        return opportunity;
    }

    private OpportunityAudioResponse mapAudioResponse(OpportunityAudio audio) {
        return OpportunityAudioResponse.builder()
                .id(audio.getId() != null ? audio.getId().toString() : null)
                .elderName(audio.getElderName())
                .elderAvatarUrl(audio.getElderAvatarUrl())
                .verified(audio.isVerified())
                .location(audio.getLocation())
                .recordedAt(audio.getRecordedAt() != null ? audio.getRecordedAt().format(DATE_FORMATTER) : null)
                .duration(audio.getDuration())
                .audioUrl(audio.getAudioUrl())
                .topic(audio.getTopic())
                .tags(audio.getTags())
                .status(audio.getStatus() != null ? audio.getStatus().name() : null)
                .createdAt(audio.getCreatedAt() != null ? audio.getCreatedAt().format(DATE_FORMATTER) : null)
                .transcript(audio.getTranscript())
                .build();
    }

    private AdminOpportunityResponse mapToAdminResponse(Opportunity opportunity) {
        User elder = opportunity.getElder();
        return AdminOpportunityResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .location(opportunity.getLocation())
                .category(opportunity.getCategory())
                .locationType(opportunity.getLocationType())
                .matchPercentage(opportunity.getMatchPercentage())
                .urgent(opportunity.isUrgent())
                .dueAt(opportunity.getDueAt() != null ? opportunity.getDueAt().format(DATE_FORMATTER) : null)
                .scheduledDate(opportunity.getScheduledDate())
                .durationText(opportunity.getDurationText())
                .timeWindowText(opportunity.getTimeWindowText())
                .language(opportunity.getLanguage())
                .offeredAmount(opportunity.getOfferedAmount())
                .preservationGoal(opportunity.getPreservationGoal())
                .tasks(opportunity.getTasks())
                .status(opportunity.getStatus() != null ? opportunity.getStatus().name() : null)
                .elderId(elder != null && elder.getId() != null ? elder.getId().toString() : null)
                .elderName(elder != null ? elder.getFullName() : null)
                .createdAt(
                        opportunity.getCreatedAt() != null ? opportunity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(
                        opportunity.getUpdatedAt() != null ? opportunity.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
