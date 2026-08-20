package lk.ac.sliit.legacylens.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class RegisterResponse {

    private UUID userId;
    private String phoneNumber;
    private String message;
}
