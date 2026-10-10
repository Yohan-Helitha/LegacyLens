package lk.ac.sliit.legacylens.notifications.service;

import java.util.UUID;

public interface PushNotificationService {

    /** Remembers a phone for this user. The same token registered again is moved to the current user. */
    void registerDevice(UUID userId, String token, String platform);

    /** Forgets a phone, for example when the user signs out of it. */
    void unregisterDevice(String token);

    /** Sends to every phone the user has registered. Does nothing, quietly, when there are none. */
    void sendToUser(UUID userId, PushMessage message);
}
