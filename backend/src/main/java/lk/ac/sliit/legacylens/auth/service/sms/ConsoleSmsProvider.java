package lk.ac.sliit.legacylens.auth.service.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Dev-only SmsProvider — logs the OTP to the console instead of sending a
 * real SMS, so you can finish and test the whole OTP flow without paying
 * for or registering with a gateway.
 *
 * Active whenever app.sms.provider is unset or set to "console" — the
 * default, so nothing breaks for anyone who hasn't configured a real
 * provider yet. Set app.sms.provider=text-lk to switch to real SMS.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "console", matchIfMissing = true)
public class ConsoleSmsProvider implements SmsProvider {

    @Override
    public void sendOtp(String phoneNumber, String otpCode) {
        log.info("=== [DEV SMS] OTP for {} is: {} (valid for a few minutes) ===", phoneNumber, otpCode);
    }
}
