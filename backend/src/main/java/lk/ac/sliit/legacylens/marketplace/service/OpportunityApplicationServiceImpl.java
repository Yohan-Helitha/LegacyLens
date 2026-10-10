package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.BookApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.event.ApplicationDecidedEvent;
import lk.ac.sliit.legacylens.marketplace.matching.LanguageSkills;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.messaging.service.ConversationOpener;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Owns the "apply to an opportunity" lifecycle: saving/editing a draft,
 * listing a creator's own applications, submitting, and deleting. There is
 * no approval step here yet — a knowledge holder/admin review UI for these
 * applications is a separate, not-yet-built feature (same gap noted on
 * Opportunity and Job), so PENDING is the terminal state for now.
 */
@Service
public class OpportunityApplicationServiceImpl implements OpportunityApplicationService {

    private static final DateTimeFormatter TIME_LABEL_FORMAT = DateTimeFormatter.ofPattern("h:mm a");

    private final OpportunityApplicationRepository opportunityApplicationRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ConversationOpener conversationOpener;
    private final OpportunityApplicationResponseMapper responseMapper;
    private final ApplicationEventPublisher events;

    public OpportunityApplicationServiceImpl(
            OpportunityApplicationRepository opportunityApplicationRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository,
            JobRepository jobRepository,
            ConversationOpener conversationOpener,
            OpportunityApplicationResponseMapper responseMapper,
            ApplicationEventPublisher events) {
        this.opportunityApplicationRepository = opportunityApplicationRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.conversationOpener = conversationOpener;
        this.responseMapper = responseMapper;
        this.events = events;
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse saveDraft(UUID creatorId, OpportunityApplicationRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Opportunity opportunity = opportunityRepository
                .findByIdAndStatus(request.getOpportunityId(), OpportunityStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        OpportunityApplication application = opportunityApplicationRepository
                .findByCreatorIdAndOpportunityId(creatorId, request.getOpportunityId())
                .orElseGet(OpportunityApplication::new);

        if (application.getId() != null && application.getStatus() != OpportunityApplicationStatus.SAVED) {
            throw new InvalidApplicationStateException(
                    "This application has already been submitted and can no longer be edited.");
        }

        // Checked before anything is stored: a language without a level is a mistake, not a draft.
        List<String> languages = request.getLanguages();
        application.setLanguages(languages == null || languages.isEmpty()
                ? ""
                : LanguageSkills.serialize(LanguageSkills.parseSubmitted(languages)));

        application.setCreator(creator);
        application.setOpportunity(opportunity);
        application.setSkills(joinOrEmpty(request.getSkills()));
        application.setExperienceText(request.getExperienceText());
        application.setApproachText(request.getApproachText());
        application.setAvailabilityConfirmed(request.isAvailabilityConfirmed());
        application.setEquipment(joinOrEmpty(request.getEquipment()));
        application.setStatus(OpportunityApplicationStatus.SAVED);

        OpportunityApplication saved = opportunityApplicationRepository.save(application);
        return responseMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityApplicationResponse> getMyApplications(UUID creatorId) {
        return opportunityApplicationRepository.findByCreatorIdOrderBySavedAtDesc(creatorId).stream()
                .map(responseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OpportunityApplicationResponse> getByOpportunity(UUID creatorId, UUID opportunityId) {
        return opportunityApplicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId)
                .map(responseMapper::toResponse);
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse submitApplication(UUID creatorId, UUID applicationId) {
        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != OpportunityApplicationStatus.SAVED) {
            throw new InvalidApplicationStateException("Only a saved draft can be submitted.");
        }

        application.setStatus(OpportunityApplicationStatus.PENDING);
        application.setSubmittedAt(LocalDateTime.now());

        return responseMapper.toResponse(opportunityApplicationRepository.save(application));
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse approveApplication(UUID creatorId, UUID applicationId) {
        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != OpportunityApplicationStatus.PENDING) {
            throw new InvalidApplicationStateException("Only a submitted (pending) application can be approved.");
        }

        application.setStatus(OpportunityApplicationStatus.APPROVED);

        OpportunityApplicationResponse response = responseMapper.toResponse(opportunityApplicationRepository.save(application));
        announceDecision(application, OpportunityApplicationStatus.APPROVED);
        return response;
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse rejectApplication(UUID creatorId, UUID applicationId) {
        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != OpportunityApplicationStatus.PENDING) {
            throw new InvalidApplicationStateException("Only a submitted (pending) application can be rejected.");
        }

        application.setStatus(OpportunityApplicationStatus.REJECTED);

        OpportunityApplicationResponse response = responseMapper.toResponse(opportunityApplicationRepository.save(application));
        announceDecision(application, OpportunityApplicationStatus.REJECTED);
        return response;
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse bookApplication(
            UUID creatorId, UUID applicationId, BookApplicationRequest request) {

        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != OpportunityApplicationStatus.APPROVED) {
            throw new InvalidApplicationStateException("Only an approved application can be booked.");
        }

        Opportunity opportunity = application.getOpportunity();

        Job job = new Job();
        job.setCreator(application.getCreator());
        job.setElder(opportunity.getElder());
        job.setTitle(opportunity.getTitle());
        job.setDescription(opportunity.getDescription());
        job.setLocation(opportunity.getLocation());
        job.setOfferedAmount(opportunity.getOfferedAmount());
        job.setStatus(JobStatus.UPCOMING);
        job.setScheduledAt(LocalDateTime.of(request.getConfirmedDate(), request.getStartTime()));
        job.setTimeWindowText(formatTimeWindow(request.getStartTime(), request.getEndTime()));
        job.setOpportunityId(opportunity.getId());
        job.setApplicationId(application.getId());
        jobRepository.save(job);

        // A booked job always gets a chat with the elder, so the two can plan the visit.
        conversationOpener.openConversation(opportunity.getElder().getId(), application.getCreator().getId(), opportunity.getId());

        application.setStatus(OpportunityApplicationStatus.BOOKED);

        return responseMapper.toResponse(opportunityApplicationRepository.save(application));
    }

    /** Same phone notification the knowledge holder's real decision sends, so the temporary test buttons exercise it too. */
    private void announceDecision(OpportunityApplication application, OpportunityApplicationStatus decision) {
        events.publishEvent(new ApplicationDecidedEvent(
                application.getCreator().getId(), application.getId(), application.getOpportunity().getTitle(), decision));
    }

    private static String formatTimeWindow(LocalTime start, LocalTime end) {
        return start.format(TIME_LABEL_FORMAT) + " - " + end.format(TIME_LABEL_FORMAT);
    }

    @Override
    @Transactional
    public void deleteApplication(UUID creatorId, UUID applicationId) {
        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        opportunityApplicationRepository.delete(application);
    }

    private static String joinOrEmpty(List<String> items) {
        return items == null ? "" : String.join(", ", items);
    }
}
