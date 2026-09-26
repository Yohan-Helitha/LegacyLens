package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateAdminRequest;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminManagementServiceImpl implements AdminManagementService {

    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminResponse> getAllAdmins() {
        List<User> users = userRepository.findAllAdminsWithRoles();
        List<AdminResponse> admins = new ArrayList<>();

        for (User user : users) {
            UserRole adminRole = user.getRoles().stream()
                    .filter(role -> role.getRoleType() == RoleType.ADMIN)
                    .findFirst()
                    .orElse(null);

            String cityName = user.getCity() != null ? user.getCity().getName() : null;
            String cityRegion = user.getCity() != null ? user.getCity().getRegion() : null;

            AdminResponse response = AdminResponse.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .phoneNumber(user.getPhoneNumber())
                    .phoneVerified(user.isPhoneVerified())
                    .nicNumber(user.getNicNumber())
                    .dateOfBirth(user.getDateOfBirth())
                    .profilePhotoUrl(user.getProfilePhotoUrl())
                    .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                    .cityName(cityName)
                    .cityRegion(cityRegion)
                    .fingerprintEnabled(user.isFingerprintEnabled())
                    .failedPinAttempts(user.getFailedPinAttempts())
                    .roleType(adminRole != null && adminRole.getRoleType() != null ? adminRole.getRoleType().name()
                            : null)
                    .roleStatus(
                            adminRole != null && adminRole.getStatus() != null ? adminRole.getStatus().name() : null)
                    .activatedAt(adminRole != null ? adminRole.getActivatedAt() : null)
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .build();

            admins.add(response);
        }

        return admins;
    }

    @Override
    @Transactional
    public AdminResponse updateAdmin(String id, UpdateAdminRequest updates,
            String performedById, String performedByName) {
        User user = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Administrator not found with id " + id));

        if (updates.getFullName() != null && !updates.getFullName().isBlank()) {
            user.setFullName(updates.getFullName());
        }
        if (updates.getPhoneNumber() != null && !updates.getPhoneNumber().isBlank()) {
            user.setPhoneNumber(updates.getPhoneNumber());
        }
        if (updates.getNicNumber() != null && !updates.getNicNumber().isBlank()) {
            user.setNicNumber(updates.getNicNumber());
        }
        if (updates.getAccountStatus() != null && !updates.getAccountStatus().isBlank()) {
            try {
                user.setAccountStatus(AccountStatus.valueOf(updates.getAccountStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // ignore invalid status
            }
        }
        if (updates.getCityName() != null || updates.getCityRegion() != null) {
            String cityName = updates.getCityName();
            String cityRegion = updates.getCityRegion();
            City city = null;
            if (cityName != null && !cityName.isBlank()) {
                city = cityRepository.findAll().stream()
                        .filter(c -> cityName.equalsIgnoreCase(c.getName()))
                        .findFirst()
                        .orElse(null);
            }
            user.setCity(city);
        }

        User saved = userRepository.save(user);

        UserRole adminRole = saved.getRoles().stream()
                .filter(role -> role.getRoleType() == RoleType.ADMIN)
                .findFirst()
                .orElse(null);

        String cityName = saved.getCity() != null ? saved.getCity().getName() : null;
        String cityRegion = saved.getCity() != null ? saved.getCity().getRegion() : null;

        // Determine specific action description
        String actionNote = "Admin profile updated";
        if (updates.getAccountStatus() != null && !updates.getAccountStatus().isBlank()) {
            String status = updates.getAccountStatus().toUpperCase();
            if ("SUSPENDED".equals(status) || "DEACTIVATED".equals(status)) {
                actionNote = "Admin account suspended";
            }
        }
        auditService.logAction(AuditActionType.UPDATED, "Admin Account",
                id, saved.getFullName(), performedById, performedByName, actionNote);

        return AdminResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .phoneNumber(saved.getPhoneNumber())
                .phoneVerified(saved.isPhoneVerified())
                .nicNumber(saved.getNicNumber())
                .dateOfBirth(saved.getDateOfBirth())
                .profilePhotoUrl(saved.getProfilePhotoUrl())
                .accountStatus(saved.getAccountStatus() != null ? saved.getAccountStatus().name() : null)
                .cityName(cityName)
                .cityRegion(cityRegion)
                .fingerprintEnabled(saved.isFingerprintEnabled())
                .failedPinAttempts(saved.getFailedPinAttempts())
                .roleType(adminRole != null && adminRole.getRoleType() != null ? adminRole.getRoleType().name() : null)
                .roleStatus(adminRole != null && adminRole.getStatus() != null ? adminRole.getStatus().name() : null)
                .activatedAt(adminRole != null ? adminRole.getActivatedAt() : null)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void changePin(String id, String newPin, String performedById, String performedByName) {
        User user = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Administrator not found with id " + id));
        user.setPinHash(passwordEncoder.encode(newPin));
        userRepository.save(user);
        auditService.logAction(AuditActionType.UPDATED, "Admin Account",
                id, user.getFullName(), performedById, performedByName, "Admin PIN changed");
    }
}
