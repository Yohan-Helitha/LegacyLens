package lk.ac.sliit.legacylens.admin.validation.verification;

import lk.ac.sliit.legacylens.admin.dto.UpdateUserVerificationRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class VerificationFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return UpdateUserVerificationRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        UpdateUserVerificationRequest request = (UpdateUserVerificationRequest) target;

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            errors.rejectValue("status", "field.required", "Status is required");
            return;
        }

        String status = request.getStatus().trim().toUpperCase();
        if (!status.equals("VERIFIED") && !status.equals("REJECTED") &&
            !status.equals("PENDING") && !status.equals("ACTIVE") &&
            !status.equals("INACTIVE") && !status.equals("SUSPENDED")) {
            errors.rejectValue("status", "field.invalid",
                    "Status must be one of: VERIFIED, REJECTED, PENDING, ACTIVE, INACTIVE, SUSPENDED");
        }

        if (request.getNotes() != null && request.getNotes().length() > 1000) {
            errors.rejectValue("notes", "field.invalid", "Notes must not exceed 1000 characters");
        }
    }
}
