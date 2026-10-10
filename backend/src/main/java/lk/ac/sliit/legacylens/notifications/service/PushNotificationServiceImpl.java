package lk.ac.sliit.legacylens.notifications.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.notifications.entity.PushDevice;
import lk.ac.sliit.legacylens.notifications.repository.PushDeviceRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PushNotificationServiceImpl implements PushNotificationService {

    private final PushDeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final PushGateway gateway;

    public PushNotificationServiceImpl(
            PushDeviceRepository deviceRepository, UserRepository userRepository, PushGateway gateway) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.gateway = gateway;
    }

    @Override
    @Transactional
    public void registerDevice(UUID userId, String token, String platform) {
        if (!ExpoPushTokens.isValid(token)) {
            throw new InvalidRequestException("That is not a valid push token");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PushDevice device = deviceRepository.findByToken(token).orElseGet(PushDevice::new);
        device.setUser(user);
        device.setToken(token);
        device.setPlatform(platform);
        deviceRepository.save(device);
    }

    @Override
    @Transactional
    public void unregisterDevice(String token) {
        deviceRepository.deleteByToken(token);
    }

    @Override
    @Transactional(readOnly = true)
    public void sendToUser(UUID userId, PushMessage message) {
        List<String> tokens = deviceRepository.findByUserId(userId).stream().map(PushDevice::getToken).toList();
        if (tokens.isEmpty()) {
            return;
        }
        gateway.send(tokens, message, deviceRepository::deleteByToken);
    }
}
