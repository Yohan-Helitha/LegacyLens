package lk.ac.sliit.legacylens.admin.validation.auth;

import lk.ac.sliit.legacylens.auth.dto.LoginRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class AdminLoginFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return LoginRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        LoginRequest request = (LoginRequest) target;

        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
            errors.rejectValue("phoneNumber", "field.required", "Phone number is required");
        }

        if (request.getPin() == null || request.getPin().trim().isEmpty()) {
            errors.rejectValue("pin", "field.required", "PIN is required");
        } else if (!request.getPin().matches("^[0-9]{4}$")) {
            errors.rejectValue("pin", "field.invalid", "PIN must be 4 digits");
        }
    }
}
