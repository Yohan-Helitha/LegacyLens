package lk.ac.sliit.legacylens.notifications.service;

import java.util.Map;

/**
 * What appears in the phone's notification bar, plus a little data the app reads when the
 * notification is tapped (for example which screen to open).
 */
public record PushMessage(String title, String body, Map<String, String> data) {

    public PushMessage {
        data = data == null ? Map.of() : Map.copyOf(data);
    }
}
