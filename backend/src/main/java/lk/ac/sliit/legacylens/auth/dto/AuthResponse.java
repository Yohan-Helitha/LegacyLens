package lk.ac.sliit.legacylens.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/** Returned after a successful login or successful OTP verification. */
@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private List<String> roles;
}
