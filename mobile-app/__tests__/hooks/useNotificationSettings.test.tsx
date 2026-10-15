jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/services/pushNotifications', () => ({
  getPushStatus: jest.fn(),
  enablePushNotifications: jest.fn(),
  disablePushNotifications: jest.fn(),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useNotificationSettings } from '../../src/hooks/useNotificationSettings';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
} from '../../src/services/pushNotifications';
import { useAuthStore } from '../../src/store/authStore';
import { isNotificationsEnabledFor, useNotificationPrefStore } from '../../src/store/notificationPrefStore';

const getStatus = getPushStatus as jest.Mock;
const enable = enablePushNotifications as jest.Mock;
const disable = disablePushNotifications as jest.Mock;

const granted = { supported: true, permission: 'granted', canAskAgain: true };

describe('notificationPrefStore', () => {
  beforeEach(() => useNotificationPrefStore.setState({ disabledUserIds: [] }));

  it('is on by default and remembers who switched it off, per person', () => {
    expect(isNotificationsEnabledFor('elder-1')).toBe(true);

    useNotificationPrefStore.getState().setEnabled('elder-1', false);
    expect(isNotificationsEnabledFor('elder-1')).toBe(false);
    expect(isNotificationsEnabledFor('creator-2')).toBe(true);

    useNotificationPrefStore.getState().setEnabled('elder-1', true);
    expect(isNotificationsEnabledFor('elder-1')).toBe(true);
  });

  it('counts nobody signed in as enabled, so there is nothing to suppress', () => {
    expect(isNotificationsEnabledFor(null)).toBe(true);
  });
});

describe('useNotificationSettings', () => {
  beforeEach(() => {
    getStatus.mockReset().mockResolvedValue(granted);
    enable.mockReset();
    disable.mockReset();
    useNotificationPrefStore.setState({ disabledUserIds: [] });
    useAuthStore.setState({ user: { userId: 'elder-1', fullName: 'Elder', phoneNumber: '0', roles: [] } });
  });

  const load = async () => {
    const hook = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(getStatus).toHaveBeenCalled());
    return hook;
  };

  it('is on only when the phone allows it and the person has not switched it off', async () => {
    const { result } = await load();
    await waitFor(() => expect(result.current.state).toBe('on'));

    await act(async () => {
      useNotificationPrefStore.getState().setEnabled('elder-1', false);
    });
    await waitFor(() => expect(result.current.state).toBe('off'));
  });

  it('says blocked when the phone refuses and will not ask again, so the sheet can point to Settings', async () => {
    getStatus.mockResolvedValue({ supported: true, permission: 'denied', canAskAgain: false });
    const { result } = await load();
    await waitFor(() => expect(result.current.state).toBe('blocked'));
  });

  it('says unsupported on an emulator or a build without the notification module', async () => {
    getStatus.mockResolvedValue({ supported: false, permission: 'undetermined', canAskAgain: false });
    const { result } = await load();
    await waitFor(() => expect(result.current.state).toBe('unsupported'));
  });

  it('reports why switching on did not work instead of pretending it did', async () => {
    getStatus.mockResolvedValue({ supported: true, permission: 'undetermined', canAskAgain: true });
    enable.mockResolvedValue('blocked');
    const { result } = await load();

    await act(async () => {
      await result.current.toggle(true);
    });

    expect(enable).toHaveBeenCalledTimes(1);
    expect(result.current.problem).toBe('blocked');
  });

  it('reports a failure when the server could not be told to stop, and stays on', async () => {
    disable.mockResolvedValue(false);
    const { result } = await load();
    await waitFor(() => expect(result.current.state).toBe('on'));

    await act(async () => {
      await result.current.toggle(false);
    });

    expect(disable).toHaveBeenCalledTimes(1);
    expect(result.current.problem).toBe('failed');
    expect(result.current.state).toBe('on');
  });
});
