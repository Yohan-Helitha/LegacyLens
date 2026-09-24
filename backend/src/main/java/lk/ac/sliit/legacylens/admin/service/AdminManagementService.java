package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminResponse;

import java.util.List;
import java.util.Map;

public interface AdminManagementService {
    List<AdminResponse> getAllAdmins();

    AdminResponse updateAdmin(String id, Map<String, Object> updates,
            String performedById, String performedByName);

    void changePin(String id, String newPin,
            String performedById, String performedByName);
}
