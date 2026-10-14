jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../src/services/api/translationApi', () => ({
  translationApi: { translate: jest.fn() },
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { resetTranslationCache, useTranslatedTexts } from '../../src/hooks/useTranslatedTexts';
import { translationApi } from '../../src/services/api/translationApi';
import { useLocaleStore } from '../../src/store/localeStore';

const translate = translationApi.translate as jest.Mock;

describe('useTranslatedTexts', () => {
  beforeEach(() => {
    resetTranslationCache();
    translate.mockReset();
    useLocaleStore.setState({ locale: 'si', hasChosenLanguage: true });
  });

  it('shows the original first, then swaps in the translation', async () => {
    translate.mockResolvedValue({ translations: ['TRANSLATED'] });

    const { result } = renderHook(() => useTranslatedTexts(['Lovely story']));
    expect(result.current.texts).toEqual(['Lovely story']);

    await waitFor(() => expect(result.current.texts).toEqual(['TRANSLATED']));
    expect(result.current.translated).toBe(true);
    expect(translate).toHaveBeenCalledWith(['Lovely story'], 'si');
  });

  it('lets the elder flip back to the original', async () => {
    translate.mockResolvedValue({ translations: ['TRANSLATED'] });
    const { result } = renderHook(() => useTranslatedTexts(['Lovely story']));
    await waitFor(() => expect(result.current.texts).toEqual(['TRANSLATED']));

    act(() => result.current.toggleOriginal());

    expect(result.current.texts).toEqual(['Lovely story']);
    expect(result.current.showOriginal).toBe(true);
  });

  it('does not ask again for a text it already has, even from another screen', async () => {
    translate.mockResolvedValue({ translations: ['TRANSLATED'] });
    const first = renderHook(() => useTranslatedTexts(['Lovely story']));
    await waitFor(() => expect(first.result.current.texts).toEqual(['TRANSLATED']));

    const second = renderHook(() => useTranslatedTexts(['Lovely story']));

    expect(second.result.current.texts).toEqual(['TRANSLATED']);
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('never sends text that is already in the elder language, or empty text', async () => {
    renderHook(() => useTranslatedTexts(['අවුරුදු සිරිත් විරිත්', '', null, undefined, '12 :)']));

    await act(async () => {});
    expect(translate).not.toHaveBeenCalled();
  });

  it('keeps the original and stops asking for a while when the service fails', async () => {
    translate.mockRejectedValue(new Error('503'));

    const { result } = renderHook(() => useTranslatedTexts(['Lovely story']));
    await waitFor(() => expect(translate).toHaveBeenCalledTimes(1));

    expect(result.current.texts).toEqual(['Lovely story']);
    expect(result.current.translated).toBe(false);

    renderHook(() => useTranslatedTexts(['Another comment']));
    await act(async () => {});
    expect(translate).toHaveBeenCalledTimes(1); // paused after the failure
  });

  it('translates into English for an English reader when the text is in Sinhala', async () => {
    useLocaleStore.setState({ locale: 'en' });
    translate.mockResolvedValue({ translations: ['Avurudu customs'] });

    const { result } = renderHook(() => useTranslatedTexts(['අවුරුදු සිරිත් විරිත්']));

    await waitFor(() => expect(result.current.texts).toEqual(['Avurudu customs']));
    expect(translate).toHaveBeenCalledWith(['අවුරුදු සිරිත් විරිත්'], 'en');
  });
});
