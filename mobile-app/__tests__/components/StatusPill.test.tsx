jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// The icon library ships as an ES module Jest doesn't transform; the icons aren't what's under test.
jest.mock('lucide-react-native', () => ({ Archive: () => null, Check: () => null }));

import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import '../../src/i18n';
import i18n from '../../src/i18n';
import { StatusPill } from '../../src/components/module-specific/content-capture/StatusPill';
import type { StoryStatus } from '../../src/types/story';

const STATUSES: StoryStatus[] = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

describe('StatusPill', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it.each(STATUSES)('lets the %s label wrap instead of overflowing its card (long Sinhala/Tamil words)', (status) => {
    const { getByText } = render(<StatusPill status={status} />);
    const label = i18n.t(`status.${status.toLowerCase()}`, { ns: 'contentCapture' });

    const text = getByText(label);

    expect(text.props.numberOfLines).toBe(2);
    expect(StyleSheet.flatten(text.props.style).flexShrink).toBe(1);
  });

  it('shows the label in the chosen language', async () => {
    await i18n.changeLanguage('si');

    const { getByText } = render(<StatusPill status="PUBLISHED" />);

    expect(getByText(i18n.t('status.published', { ns: 'contentCapture' }))).toBeTruthy();
    expect(i18n.t('status.published', { ns: 'contentCapture' })).not.toBe('Published');
  });
});
