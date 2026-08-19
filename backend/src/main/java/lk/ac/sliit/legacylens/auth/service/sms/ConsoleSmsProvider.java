package lk.ac.sliit.legacylens.auth.service.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Dev-only SmsProvider — logs the OTP to the console instead of sending a
 * real SMS, so you can finish and test the whole OTP flow without paying
 * for or registering with a gateway.
 *
 * When you're ready for a real provider: write e.g. TwilioSmsProvider
 * implementing SmsProvider, remove @Component from this class (or guard
 * both with @Profile("dev") / @Profile("prod")), and nothing else in the
 * auth module needs to change.
 */
@Slf4j
@Component
public class ConsoleSmsProvider implements SmsProvider {

    @Override
    public void sendOtp(String phoneNumber, String otpCode) {
        log.info("=== [DEV SMS] OTP for {} is: {} (valid for a few minutes) ===", phoneNumber, otpCode);
    }
}
