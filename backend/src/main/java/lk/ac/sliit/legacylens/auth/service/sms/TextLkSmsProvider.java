package lk.ac.sliit.legacylens.auth.service.sms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.common.exception.SmsDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Real SmsProvider backed by Text.lk (https://text.lk) — a Sri Lankan SMS
 * gateway. Sends to any phone number, not sandbox-restricted like a Twilio
 * trial account.
 *
 * Active only when app.sms.provider=text-lk is set in application.properties.
 * Uses Java's built-in HttpClient — no extra HTTP dependency needed since
 * Jackson (for JSON) is already pulled in transitively by spring-boot-starter-web.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "text-lk")
public class TextLkSmsProvider implements SmsProvider {

    private static final String SEND_SMS_URL = "https://app.text.lk/api/v3/sms/send";

    private final String apiKey;
    private final String senderId;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TextLkSmsProvider(
            @Value("${app.sms.text-lk.api-key}") String apiKey,
            @Value("${app.sms.text-lk.sender-id}") String senderId) {

        this.apiKey = apiKey;
        this.senderId = senderId;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void sendOtp(String phoneNumber, String otpCode) {
        String recipient = toTextLkFormat(phoneNumber);
        String message = "Your Legacy Lens verification code is " + otpCode + ". It expires shortly.";

        try {
            Map<String, String> body = Map.of(
                    "recipient", recipient,
                    "sender_id", senderId,
                    "type", "plain",
                    "message", message);

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SEND_SMS_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            handleResponse(recipient, response);
        } catch (SmsDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to send OTP SMS to {} via Text.lk", recipient, ex);
            throw new SmsDeliveryException("Could not send OTP SMS. Please try again in a moment.");
        }
    }

    private void handleResponse(String recipient, HttpResponse<String> response) throws Exception {
        JsonNode json = objectMapper.readTree(response.body());
        String status = json.path("status").asText();

        if (response.statusCode() != 200 || !"success".equals(status)) {
            String errorMessage = json.path("message").asText("Unknown error from Text.lk");
            log.error("Text.lk failed to deliver OTP to {}: {}", recipient, errorMessage);

            throw new SmsDeliveryException("SMS provider rejected the request: " + errorMessage);
        }

        log.info("OTP SMS sent to {} via Text.lk", recipient);
    }

    private String toTextLkFormat(String phoneNumber) {
        // Text.lk expects Sri Lankan numbers as 94XXXXXXXXX, no leading '+'.
        // The app accepts phone numbers in any of three shapes from the user:
        //   +94771234567 (E.164)      -> strip the '+'
        //   94771234567  (already ok) -> leave as-is
        //   0771234567   (local)      -> drop the leading 0, prefix 94
        if (phoneNumber.startsWith("+")) {
            return phoneNumber.substring(1);
        }
        if (phoneNumber.startsWith("0")) {
            return "94" + phoneNumber.substring(1);
        }
        return phoneNumber;
    }
}
