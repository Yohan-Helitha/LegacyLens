jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The icon library ships as an ES module Jest doesn't transform; the checkmark isn't what's under test.
jest.mock('lucide-react-native', () => ({ Check: () => null }));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import '../../src/i18n';
import { LanguagePickerSheet } from '../../src/components/common/LanguagePickerSheet';
import { LOCALE_NATIVE_NAMES, useLocaleStore } from '../../src/store/localeStore';

describe('LanguagePickerSheet', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en', hasChosenLanguage: true });
  });

  it('lists all three languages in their own script and marks the current one', () => {
    const { getByLabelText } = render(<LanguagePickerSheet visible onClose={jest.fn()} />);

    expect(getByLabelText(LOCALE_NATIVE_NAMES.en).props.accessibilityState).toEqual({ checked: true });
    expect(getByLabelText(LOCALE_NATIVE_NAMES.si).props.accessibilityState).toEqual({ checked: false });
    expect(getByLabelText(LOCALE_NATIVE_NAMES.ta).props.accessibilityState).toEqual({ checked: false });
  });

  it('switches the app language and closes when a language is picked', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(<LanguagePickerSheet visible onClose={onClose} />);

    fireEvent.press(getByLabelText(LOCALE_NATIVE_NAMES.si));

    expect(useLocaleStore.getState().locale).toBe('si');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while hidden', () => {
    const { queryByLabelText } = render(<LanguagePickerSheet visible={false} onClose={jest.fn()} />);

    expect(queryByLabelText(LOCALE_NATIVE_NAMES.si)).toBeNull();
  });
});
