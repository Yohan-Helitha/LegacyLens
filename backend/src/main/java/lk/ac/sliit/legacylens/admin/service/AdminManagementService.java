package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateAdminRequest;

import java.util.List;

public interface AdminManagementService {
    List<AdminResponse> getAllAdmins();

    AdminResponse updateAdmin(String id, UpdateAdminRequest updates,
            String performedById, String performedByName);

    void changePin(String id, String newPin,
            String performedById, String performedByName);
}
