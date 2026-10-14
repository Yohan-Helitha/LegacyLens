package lk.ac.sliit.legacylens.admin.validation.admin_management;

import lk.ac.sliit.legacylens.admin.dto.UpdateAdminRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class AdminProfileFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return UpdateAdminRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        UpdateAdminRequest request = (UpdateAdminRequest) target;

        if (request.getFullName() != null && request.getFullName().trim().isEmpty()) {
            errors.rejectValue("fullName", "field.required", "Full name is required");
        } else if (request.getFullName() != null && request.getFullName().length() > 150) {
            errors.rejectValue("fullName", "field.invalid", "Full name must not exceed 150 characters");
        }

        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            if (!request.getPhoneNumber().matches("^\\+?[0-9]{9,15}$")) {
                errors.rejectValue("phoneNumber", "field.invalid", "Enter a valid phone number");
            }
        }

        if (request.getNicNumber() != null && !request.getNicNumber().isEmpty()) {
            if (!request.getNicNumber().matches("^([0-9]{9}[vVxX]|[0-9]{12})$")) {
                errors.rejectValue("nicNumber", "field.invalid", "Enter a valid NIC number");
            }
        }
    }
}
