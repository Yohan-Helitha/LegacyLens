package lk.ac.sliit.legacylens.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class OpportunityAudioResponse {
    private String id;
    private String elderName;
    private String elderAvatarUrl;
    private boolean verified;
    private String location;
    private String recordedAt;
    private String duration;
    private String audioUrl;
    private String topic;
    private String tags;
    private String status;
    private String createdAt;
}
