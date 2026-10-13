package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class WorkMaterialResponse {

    private UUID id;
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}
