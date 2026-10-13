package lk.ac.sliit.legacylens.marketplace.dto;

import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * What a creator can change on their own profile after applying: contact email, extra phone numbers, the "about me"
 * text, skills, interests and experience. Languages have their own request, and the login phone number, NIC and
 * proof document are not changed here. Saving does not send the application back for review.
 */
@Data
public class UpdateCreatorDetailsRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 150, message = "Email must be 150 characters or fewer")
    private String email;

    @Size(max = 2000, message = "About you must be 2000 characters or fewer")
    private String aboutYou;

    @NotNull(message = "Skills are required")
    @Size(max = 20, message = "Choose at most 20 skills")
    private List<@NotBlank(message = "A skill cannot be empty") @Size(max = 40, message = "A skill must be 40 characters or fewer") String> skills;

    @NotNull(message = "Interests are required")
    @Size(max = 20, message = "Choose at most 20 interests")
    private List<@NotBlank(message = "An interest cannot be empty") @Size(max = 40, message = "An interest must be 40 characters or fewer") String> interests;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotBlank(message = "Please tell us about your experience")
    @Size(max = 2000, message = "Experience must be 2000 characters or fewer")
    private String experienceDescription;

    @Size(max = 3, message = "You can add up to 3 extra numbers")
    private List<@Pattern(regexp = "^\\+?[0-9]{9,14}$", message = "Enter a valid phone number, e.g. +94771234567") String> additionalPhoneNumbers;
}
