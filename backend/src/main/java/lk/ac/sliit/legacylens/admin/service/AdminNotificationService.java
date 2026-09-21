package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminNotificationResponse;

import java.util.List;

public interface AdminNotificationService {
    List<AdminNotificationResponse> getAdminNotifications();
    void markNotificationAsRead(String type, String id);
    void markAllAsRead();
}

