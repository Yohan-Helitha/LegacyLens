package lk.ac.sliit.legacylens.admin.validation.auth;

import lk.ac.sliit.legacylens.auth.dto.RegisterRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class AdminRegisterFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return RegisterRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        RegisterRequest request = (RegisterRequest) target;

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            errors.rejectValue("fullName", "field.required", "Full name is required");
        } else if (request.getFullName().length() > 150) {
            errors.rejectValue("fullName", "field.invalid", "Full name must not exceed 150 characters");
        }

        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
            errors.rejectValue("phoneNumber", "field.required", "Phone number is required");
        } else if (!request.getPhoneNumber().matches("^\\+?[0-9]{9,15}$")) {
            errors.rejectValue("phoneNumber", "field.invalid", "Enter a valid phone number");
        }

        if (request.getDateOfBirth() == null) {
            errors.rejectValue("dateOfBirth", "field.required", "Date of birth is required");
        }

        if (request.getNicNumber() == null || request.getNicNumber().trim().isEmpty()) {
            errors.rejectValue("nicNumber", "field.required", "NIC number is required");
        } else if (request.getNicNumber().length() > 20) {
            errors.rejectValue("nicNumber", "field.invalid", "NIC number must not exceed 20 characters");
        }

        if (request.getCityId() == null) {
            errors.rejectValue("cityId", "field.required", "City is required");
        }

        if (request.getPin() == null || request.getPin().trim().isEmpty()) {
            errors.rejectValue("pin", "field.required", "PIN is required");
        } else if (!request.getPin().matches("^[0-9]{4}$")) {
            errors.rejectValue("pin", "field.invalid", "PIN must be 4 digits");
        }
    }
}
