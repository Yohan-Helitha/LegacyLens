package lk.ac.sliit.legacylens.notifications.service;

import java.util.Collection;
import java.util.function.Consumer;

/**
 * The outside push service. Sending never throws and never blocks the caller: a notification is a
 * courtesy, so a failure here must not undo whatever caused it.
 */
public interface PushGateway {

    /**
     * Sends the message to every token. Tokens the push service says are dead (the app was
     * uninstalled, say) are passed to {@code onDeadToken} so they can be forgotten.
     */
    void send(Collection<String> tokens, PushMessage message, Consumer<String> onDeadToken);
}
