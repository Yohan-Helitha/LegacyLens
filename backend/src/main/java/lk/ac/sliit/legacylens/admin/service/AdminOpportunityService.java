package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;


import java.util.List;


public interface AdminOpportunityService {
    List<OpportunityAudioResponse> getAudioSubmissions(String statusFilter);
    OpportunityAudioResponse getAudioSubmission(String id);
    AdminOpportunityResponse createOpportunity(CreateOpportunityRequest request, String performedById, String performedByName);
    AdminOpportunityResponse publishFromAudio(String audioId, CreateOpportunityRequest request, String performedById, String performedByName);
    List<AdminOpportunityResponse> getAllOpportunities(String statusFilter);
    AdminOpportunityResponse getOpportunity(String id);
    AdminOpportunityResponse updateOpportunityStatus(String id, UpdateOpportunityStatusRequest request, String performedById, String performedByName);
}
