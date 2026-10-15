jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// The icon library ships as an ES module Jest doesn't transform; the icons aren't what's under test.
jest.mock('lucide-react-native', () => {
  const Icon = () => null;
  return {
    Home: Icon, BookOpen: Icon, Handshake: Icon, BadgeCheck: Icon, UserSearch: Icon, ClipboardList: Icon, ClipboardCheck: Icon,
    Star: Icon, Mic: Icon, Settings: Icon, LogOut: Icon, X: Icon,
  };
});

import React from 'react';
import { ScrollView } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../src/i18n';
import i18n from '../../src/i18n';
import { ElderNavDrawer } from '../../src/components/module-specific/content-capture/ElderNavDrawer';

const metrics = { frame: { x: 0, y: 0, width: 360, height: 720 }, insets: { top: 24, left: 0, right: 0, bottom: 16 } };

function renderDrawer(props: Partial<React.ComponentProps<typeof ElderNavDrawer>> = {}) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ElderNavDrawer visible onClose={jest.fn()} {...props} />
    </SafeAreaProvider>,
  );
}

describe('ElderNavDrawer', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('keeps every item, including Log out, in one scrolling area so nothing can overlap when labels wrap', () => {
    const screen = renderDrawer();
    const scroll = screen.UNSAFE_getByType(ScrollView);

    for (const label of ['Home', 'My Stories', 'Hire a Creator', 'My Requests', 'Submitted Work', 'Voice Help', 'Settings', 'Log out']) {
      expect(within(scroll).getByLabelText(label)).toBeTruthy();
    }
  });

  it('keeps the close button outside the scrolling area so it is always reachable', () => {
    const screen = renderDrawer();
    const scroll = screen.UNSAFE_getByType(ScrollView);

    expect(screen.getAllByLabelText('Close navigation').length).toBeGreaterThan(0);
    expect(within(scroll).queryByLabelText('Close navigation')).toBeNull();
  });

  it('calls onLogout when Log out is pressed', () => {
    const onLogout = jest.fn();
    const screen = renderDrawer({ onLogout });

    fireEvent.press(screen.getByLabelText('Log out'));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows the items in Sinhala when that language is chosen', async () => {
    await i18n.changeLanguage('si');

    const screen = renderDrawer();

    expect(screen.queryByLabelText('Log out')).toBeNull();
    expect(screen.getByLabelText(i18n.t('drawer.logOut', { ns: 'contentCapture' }))).toBeTruthy();
  });
});
