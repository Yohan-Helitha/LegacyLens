package lk.ac.sliit.legacylens.notifications.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.notifications.entity.PushDevice;
import lk.ac.sliit.legacylens.notifications.repository.PushDeviceRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceImplTest {

    private static final String TOKEN = "ExponentPushToken[abc123]";

    @Mock private PushDeviceRepository deviceRepository;
    @Mock private UserRepository userRepository;
    @Mock private PushGateway gateway;

    private PushNotificationServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new PushNotificationServiceImpl(deviceRepository, userRepository, gateway);
        user = new User();
        user.setId(UUID.randomUUID());
    }

    @Test
    void registerDevice_storesANewPhoneForTheUser() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(deviceRepository.findByToken(TOKEN)).thenReturn(Optional.empty());

        service.registerDevice(user.getId(), TOKEN, "android");

        ArgumentCaptor<PushDevice> saved = ArgumentCaptor.forClass(PushDevice.class);
        verify(deviceRepository).save(saved.capture());
        assertThat(saved.getValue().getToken()).isEqualTo(TOKEN);
        assertThat(saved.getValue().getUser()).isSameAs(user);
        assertThat(saved.getValue().getPlatform()).isEqualTo("android");
    }

    @Test
    void registerDevice_aPhoneAlreadyKnown_movesToTheUserWhoSignedInOnIt() {
        User previousOwner = new User();
        previousOwner.setId(UUID.randomUUID());
        PushDevice existing = new PushDevice();
        existing.setToken(TOKEN);
        existing.setUser(previousOwner);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(deviceRepository.findByToken(TOKEN)).thenReturn(Optional.of(existing));

        service.registerDevice(user.getId(), TOKEN, "ios");

        assertThat(existing.getUser()).isSameAs(user);
        verify(deviceRepository).save(existing);
    }

    @Test
    void registerDevice_rejectsSomethingThatIsNotAPushToken() {
        assertThrows(InvalidRequestException.class, () -> service.registerDevice(user.getId(), "not-a-token", "android"));
        assertThrows(InvalidRequestException.class, () -> service.registerDevice(user.getId(), null, "android"));
        verify(deviceRepository, never()).save(any());
    }

    @Test
    void sendToUser_sendsToEveryPhoneTheUserHas() {
        PushDevice phone = new PushDevice();
        phone.setToken(TOKEN);
        PushDevice tablet = new PushDevice();
        tablet.setToken("ExponentPushToken[def456]");
        when(deviceRepository.findByUserId(user.getId())).thenReturn(List.of(phone, tablet));
        PushMessage message = new PushMessage("Hi", "There", Map.of("type", "test"));

        service.sendToUser(user.getId(), message);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> tokens = ArgumentCaptor.forClass(Collection.class);
        verify(gateway).send(tokens.capture(), org.mockito.ArgumentMatchers.eq(message), any());
        assertThat(tokens.getValue()).containsExactlyInAnyOrder(TOKEN, "ExponentPushToken[def456]");
    }

    @Test
    void sendToUser_withNoPhones_doesNothing() {
        when(deviceRepository.findByUserId(user.getId())).thenReturn(List.of());

        service.sendToUser(user.getId(), new PushMessage("Hi", "There", Map.of()));

        verify(gateway, never()).send(anyCollection(), any(), any());
    }

    @Test
    void aDeadToken_reportedByTheGateway_isForgotten() {
        PushDevice phone = new PushDevice();
        phone.setToken(TOKEN);
        when(deviceRepository.findByUserId(user.getId())).thenReturn(List.of(phone));

        service.sendToUser(user.getId(), new PushMessage("Hi", "There", Map.of()));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Consumer<String>> onDead = ArgumentCaptor.forClass(Consumer.class);
        verify(gateway).send(anyCollection(), any(), onDead.capture());
        onDead.getValue().accept(TOKEN);

        verify(deviceRepository).deleteByToken(TOKEN);
    }

    @Test
    void tokenFormat() {
        assertThat(ExpoPushTokens.isValid("ExponentPushToken[abc123]")).isTrue();
        assertThat(ExpoPushTokens.isValid("ExpoPushToken[abc-123_x]")).isTrue();
        assertThat(ExpoPushTokens.isValid("ExponentPushToken[]")).isFalse();
        assertThat(ExpoPushTokens.isValid("ExponentPushToken[a b]")).isFalse();
        assertThat(ExpoPushTokens.isValid("fcm:abc")).isFalse();
        assertThat(ExpoPushTokens.isValid("")).isFalse();
    }
}
