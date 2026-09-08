package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminUserRoleDto;
import lk.ac.sliit.legacylens.admin.dto.AdminUserVerificationResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateUserVerificationRequest;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminUserVerificationServiceImpl implements AdminUserVerificationService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserVerificationServiceImpl.class);

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public AdminUserVerificationServiceImpl(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserVerificationResponse> getAllVerifications(String roleFilter, String statusFilter) {
        log.info("Fetching user verifications with roleFilter='{}' and statusFilter='{}'", roleFilter, statusFilter);

        List<User> users = userRepository.findAll();
        List<AdminUserVerificationResponse> responses = new ArrayList<>();

        for (User user : users) {
            List<UserRole> roles = userRoleRepository.findByUserId(user.getId());

            // Exclude users holding the ADMIN role from Community Profiles & Verification
            boolean isAdmin = roles.stream().anyMatch(r -> r.getRoleType() == RoleType.ADMIN);
            if (isAdmin) {
                continue;
            }

            AdminUserVerificationResponse response = mapToVerificationResponse(user, roles);

            if (matchesFilter(response, roleFilter, statusFilter)) {
                responses.add(response);
            }
        }

        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserVerificationResponse getVerificationByUserId(UUID userId) {
        log.info("Fetching verification details for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<UserRole> roles = userRoleRepository.findByUserId(userId);
        return mapToVerificationResponse(user, roles);
    }

    @Override
    @Transactional
    public AdminUserVerificationResponse updateVerificationStatus(UUID userId, UpdateUserVerificationRequest request) {
        log.info("Updating verification status for user ID: {} with status: {}", userId, request.getStatus());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<UserRole> roles = userRoleRepository.findByUserId(userId);

        String normalizedStatus = request.getStatus().toUpperCase().trim();

        if ("VERIFIED".equals(normalizedStatus) || "APPROVED".equals(normalizedStatus)
                || "ACTIVE".equals(normalizedStatus)) {
            user.setAccountStatus(AccountStatus.ACTIVE);

            for (UserRole role : roles) {
                if (request.getRoleType() == null || request.getRoleType().isBlank()
                        || role.getRoleType().name().equalsIgnoreCase(request.getRoleType())) {
                    role.setStatus(RoleStatus.ACTIVE);
                    if (role.getActivatedAt() == null) {
                        role.setActivatedAt(LocalDateTime.now());
                    }
                }
            }
            userRoleRepository.saveAll(roles);
            userRepository.save(user);

        } else if ("REJECTED".equals(normalizedStatus) || "INACTIVE".equals(normalizedStatus)) {
            for (UserRole role : roles) {
                if (request.getRoleType() == null || request.getRoleType().isBlank()
                        || role.getRoleType().name().equalsIgnoreCase(request.getRoleType())) {
                    role.setStatus(RoleStatus.INACTIVE);
                }
            }
            userRoleRepository.saveAll(roles);

        } else if ("SUSPENDED".equals(normalizedStatus) || "DEACTIVATED".equals(normalizedStatus)) {
            try {
                user.setAccountStatus(AccountStatus.valueOf(normalizedStatus));
                for (UserRole role : roles) {
                    role.setStatus(RoleStatus.INACTIVE);
                }
                userRoleRepository.saveAll(roles);
                userRepository.save(user);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid account status: {}", normalizedStatus);
            }
        }

        return mapToVerificationResponse(user, roles);
    }

    @Override
    @Transactional
    public AdminUserVerificationResponse approveUser(UUID userId, String note) {
        UpdateUserVerificationRequest request = UpdateUserVerificationRequest.builder()
                .status("VERIFIED")
                .notes(note)
                .build();
        return updateVerificationStatus(userId, request);
    }

    @Override
    @Transactional
    public AdminUserVerificationResponse rejectUser(UUID userId, String reason) {
        UpdateUserVerificationRequest request = UpdateUserVerificationRequest.builder()
                .status("REJECTED")
                .notes(reason)
                .build();
        return updateVerificationStatus(userId, request);
    }

    @Override
    @Transactional
    public AdminUserVerificationResponse suspendUser(UUID userId, String reason) {
        log.info("Suspending user account with ID: {}, reason: {}", userId, reason);
        UpdateUserVerificationRequest request = UpdateUserVerificationRequest.builder()
                .status("SUSPENDED")
                .notes(reason)
                .build();
        return updateVerificationStatus(userId, request);
    }

    @Override
    @Transactional
    public AdminUserVerificationResponse reactivateUser(UUID userId) {
        log.info("Reactivating user account with ID: {}", userId);
        UpdateUserVerificationRequest request = UpdateUserVerificationRequest.builder()
                .status("ACTIVE")
                .notes("Reactivated by administrator")
                .build();
        return updateVerificationStatus(userId, request);
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        log.warn("Permanently deleting user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<UserRole> roles = userRoleRepository.findByUserId(userId);
        if (roles != null && !roles.isEmpty()) {
            userRoleRepository.deleteAll(roles);
        }

        userRepository.delete(user);
    }

    private AdminUserVerificationResponse mapToVerificationResponse(User user, List<UserRole> roles) {
        List<AdminUserRoleDto> roleDtos = roles.stream()
                .map(r -> AdminUserRoleDto.builder()
                        .id(r.getId())
                        .roleType(r.getRoleType() != null ? r.getRoleType().name() : null)
                        .status(r.getStatus() != null ? r.getStatus().name() : null)
                        .activatedAt(r.getActivatedAt())
                        .build())
                .collect(Collectors.toList());

        List<String> roleNames = roles.stream()
                .map(r -> r.getRoleType() != null ? r.getRoleType().name() : "")
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toList());

        String verificationStatus = determineVerificationStatus(user, roles);
        String roleCategory = determineRoleCategory(roles);
        String applyingTitle = determineApplyingTitle(roles);

        String cityName = user.getCity() != null ? user.getCity().getName() : null;
        String cityRegion = user.getCity() != null ? user.getCity().getRegion() : null;
        Integer cityId = user.getCity() != null ? user.getCity().getId() : null;

        return AdminUserVerificationResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .phoneVerified(user.isPhoneVerified())
                .nicNumber(user.getNicNumber())
                .dateOfBirth(user.getDateOfBirth())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .cityId(cityId)
                .cityName(cityName)
                .cityRegion(cityRegion)
                .fingerprintEnabled(user.isFingerprintEnabled())
                .failedPinAttempts(user.getFailedPinAttempts())
                .roles(roleNames)
                .roleDetails(roleDtos)
                .verificationStatus(verificationStatus)
                .roleCategory(roleCategory)
                .applyingTitle(applyingTitle)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String determineVerificationStatus(User user, List<UserRole> roles) {
        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            return "REJECTED";
        }
        if (user.getAccountStatus() == AccountStatus.DEACTIVATED) {
            return "REJECTED";
        }

        boolean hasInactiveSpecialRole = roles.stream()
                .anyMatch(r -> r.getStatus() == RoleStatus.INACTIVE && r.getRoleType() != RoleType.GENERAL_USER);

        if (hasInactiveSpecialRole) {
            return "PENDING";
        }

        boolean hasActiveSpecialRole = roles.stream()
                .anyMatch(r -> r.getStatus() == RoleStatus.ACTIVE && r.getRoleType() != RoleType.GENERAL_USER);

        if (hasActiveSpecialRole) {
            return "VERIFIED";
        }

        return user.isPhoneVerified() ? "VERIFIED" : "PENDING";
    }

    private String determineRoleCategory(List<UserRole> roles) {
        boolean isElder = roles.stream().anyMatch(r -> r.getRoleType() == RoleType.ELDER);
        if (isElder) return "Elder";

        boolean isCreator = roles.stream().anyMatch(r -> r.getRoleType() == RoleType.YOUTH_CREATOR);
        if (isCreator) return "Artisan";

        boolean isLearner = roles.stream().anyMatch(r -> r.getRoleType() == RoleType.YOUTH_LEARNER);
        if (isLearner) return "Historian";

        return "General User";
    }

    private String determineApplyingTitle(List<UserRole> roles) {
        if (roles.stream().anyMatch(r -> r.getRoleType() == RoleType.ELDER)) {
            return "Elder Knowledge Holder";
        }
        if (roles.stream().anyMatch(r -> r.getRoleType() == RoleType.YOUTH_CREATOR)) {
            return "Content Creator & Artisan";
        }
        if (roles.stream().anyMatch(r -> r.getRoleType() == RoleType.YOUTH_LEARNER)) {
            return "Youth Cultural Researcher";
        }
        return "Community Member";
    }

    private boolean matchesFilter(AdminUserVerificationResponse response, String roleFilter, String statusFilter) {
        if (roleFilter != null && !roleFilter.isBlank() && !"ALL".equalsIgnoreCase(roleFilter)) {
            boolean matchesRole = response.getRoles().stream()
                    .anyMatch(r -> r.equalsIgnoreCase(roleFilter))
                    || (response.getRoleCategory() != null && response.getRoleCategory().equalsIgnoreCase(roleFilter));
            if (!matchesRole) {
                return false;
            }
        }

        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            if (response.getVerificationStatus() == null || !response.getVerificationStatus().equalsIgnoreCase(statusFilter)) {
                return false;
            }
        }

        return true;
    }
}
