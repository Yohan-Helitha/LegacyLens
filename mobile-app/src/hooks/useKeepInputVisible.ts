import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput } from 'react-native';

/**
 * Keeps the text box being typed in above the on-screen keyboard. On many Android phones the keyboard
 * simply covers the bottom of the screen, so the line being typed ends up hidden behind it. Attach
 * `scrollProps` to the ScrollView and spread `inputProps('name')` onto each TextInput: as the keyboard
 * opens, and as a box grows with every new line, the page scrolls just far enough to keep the bottom of
 * that box in view. `keyboardHeight` is room to add under the content so the last box can scroll up too.
 */
export function useKeepInputVisible() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const focused = useRef<TextInput | null>(null);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const reveal = useCallback(() => {
    const input = focused.current;
    const top = keyboardTop.current;
    if (!input || top == null) return;
    input.measureInWindow((_x, y, _w, height) => {
      const hidden = y + height - (top - 24);
      if (hidden > 0) {
        scrollRef.current?.scrollTo({ y: scrollY.current + hidden, animated: true });
      }
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(reveal, 120);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  const inputProps = (name: string) => ({
    ref: (node: TextInput | null) => {
      inputs.current[name] = node;
    },
    onFocus: () => {
      focused.current = inputs.current[name] ?? null;
      setTimeout(reveal, 200);
    },
    onContentSizeChange: reveal,
  });

  const scrollProps = {
    ref: scrollRef,
    onScroll: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    scrollEventThrottle: 16,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  return { scrollProps, inputProps, keyboardHeight };
}

export default useKeepInputVisible;
