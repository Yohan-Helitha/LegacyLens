package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;

import java.util.List;
import java.util.UUID;

public interface AdminOpportunityService {
    List<OpportunityAudioResponse> getAudioSubmissions(String statusFilter);
    OpportunityAudioResponse getAudioSubmission(String id);
    AdminOpportunityResponse createOpportunity(CreateOpportunityRequest request);
    AdminOpportunityResponse publishFromAudio(String audioId, CreateOpportunityRequest request);
    List<AdminOpportunityResponse> getAllOpportunities(String statusFilter);
    AdminOpportunityResponse getOpportunity(String id);
    AdminOpportunityResponse updateOpportunityStatus(String id, UpdateOpportunityStatusRequest request);
}
