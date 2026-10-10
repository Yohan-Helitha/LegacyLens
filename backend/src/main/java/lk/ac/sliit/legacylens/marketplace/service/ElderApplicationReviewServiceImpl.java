package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ElderApplicationReviewServiceImpl implements ElderApplicationReviewService {

    /** A draft is the creator's own work in progress - the elder only sees what was actually sent. */
    private static final Set<OpportunityApplicationStatus> VISIBLE_TO_ELDER = Set.of(
            OpportunityApplicationStatus.PENDING,
            OpportunityApplicationStatus.APPROVED,
            OpportunityApplicationStatus.REJECTED,
            OpportunityApplicationStatus.BOOKED);

    private final OpportunityApplicationRepository applicationRepository;
    private final OpportunityApplicationResponseMapper responseMapper;

    public ElderApplicationReviewServiceImpl(
            OpportunityApplicationRepository applicationRepository,
            OpportunityApplicationResponseMapper responseMapper) {
        this.applicationRepository = applicationRepository;
        this.responseMapper = responseMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityApplicationResponse> getApplicationsForElder(UUID elderId) {
        return applicationRepository
                .findByOpportunityElderIdAndStatusInOrderBySubmittedAtDesc(elderId, VISIBLE_TO_ELDER)
                .stream()
                .map(responseMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse approve(UUID elderId, UUID applicationId) {
        return decide(elderId, applicationId, OpportunityApplicationStatus.APPROVED,
                "Only a submitted (pending) application can be approved.");
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse reject(UUID elderId, UUID applicationId) {
        return decide(elderId, applicationId, OpportunityApplicationStatus.REJECTED,
                "Only a submitted (pending) application can be rejected.");
    }

    private OpportunityApplicationResponse decide(
            UUID elderId, UUID applicationId, OpportunityApplicationStatus decision, String wrongStateMessage) {

        // Someone else's application is "not found", not "forbidden" - it should not even be confirmed to exist.
        OpportunityApplication application = applicationRepository
                .findByIdAndOpportunityElderId(applicationId, elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != OpportunityApplicationStatus.PENDING) {
            throw new InvalidApplicationStateException(wrongStateMessage);
        }

        application.setStatus(decision);
        return responseMapper.toResponse(applicationRepository.save(application));
    }
}
