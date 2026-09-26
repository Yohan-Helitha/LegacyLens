package lk.ac.sliit.legacylens.admin.validation.admin_management;

import lk.ac.sliit.legacylens.admin.dto.ChangePinRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class ChangePinFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return ChangePinRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        ChangePinRequest request = (ChangePinRequest) target;

        if (request.getNewPin() == null || request.getNewPin().trim().isEmpty()) {
            errors.rejectValue("newPin", "field.required", "New PIN is required");
        } else if (!request.getNewPin().matches("^[0-9]{4}$")) {
            errors.rejectValue("newPin", "field.invalid", "PIN must be 4 digits");
        }
    }
}
