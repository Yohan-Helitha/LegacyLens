package lk.ac.sliit.legacylens.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRoleDto {
    private UUID id;
    private String roleType;
    private String status;
    private LocalDateTime activatedAt;
}
