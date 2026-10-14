package lk.ac.sliit.legacylens.notifications.service;

import java.util.regex.Pattern;

/** What an Expo push token looks like - checked before one is stored, so junk never reaches the push service. */
public final class ExpoPushTokens {

    private static final Pattern FORMAT = Pattern.compile("^Expo(nent)?PushToken\\[[^\\]\\s]+]$");

    private ExpoPushTokens() {
    }

    public static boolean isValid(String token) {
        return token != null && FORMAT.matcher(token).matches();
    }
}
