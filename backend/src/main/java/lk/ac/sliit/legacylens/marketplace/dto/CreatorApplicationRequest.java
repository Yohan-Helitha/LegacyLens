package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Bound from the multipart/form-data "Become a Content Creator" submission.
 *
 * full_name / phone_number / city / nic_number are deliberately absent here
 * — the server fills those in from the authenticated user's own profile
 * (see CreatorApplicationServiceImpl), so a client can never submit someone
 * else's identity details.
 */
@Data
public class CreatorApplicationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @NotBlank(message = "Tell us about yourself")
    @Size(max = 2000, message = "About you must not exceed 2000 characters")
    private String aboutYou;

    @NotEmpty(message = "Select at least one skill")
    private List<String> skills;

    @NotEmpty(message = "Select at least one interest")
    private List<String> interests;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotBlank(message = "Tell us about your experience")
    @Size(max = 2000, message = "Experience description must not exceed 2000 characters")
    private String experienceDescription;

    @NotNull(message = "A verification proof file is required")
    private MultipartFile proofDocument;
}
