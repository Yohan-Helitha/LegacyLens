jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// The icon library ships as an ES module Jest doesn't transform; the icons aren't what's under test.
jest.mock('lucide-react-native', () => ({ FileText: () => null, Mic: () => null, Play: () => null }));

import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { StoryMediaThumb } from '../../src/components/module-specific/content-capture/StoryMediaThumb';

describe('StoryMediaThumb', () => {
  it('shows the cover image when the story has one (a complete URL is used as is)', () => {
    const { UNSAFE_getByType } = render(
      <StoryMediaThumb mediaType="AUDIO" variant="list" imageUrl="https://cdn.example/story-thumbnails/a.jpg" />,
    );

    expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: 'https://cdn.example/story-thumbnails/a.jpg' });
  });

  it('shows no image for a story without a cover (the placeholder is used)', () => {
    const { UNSAFE_queryByType } = render(<StoryMediaThumb mediaType="AUDIO" variant="list" imageUrl={null} />);

    expect(UNSAFE_queryByType(Image)).toBeNull();
  });

  it('falls back to the placeholder if the image cannot be loaded', () => {
    const { UNSAFE_getByType, UNSAFE_queryByType } = render(
      <StoryMediaThumb mediaType="VIDEO" variant="hero" imageUrl="https://cdn.example/missing.jpg" />,
    );

    fireEvent(UNSAFE_getByType(Image), 'error');

    expect(UNSAFE_queryByType(Image)).toBeNull();
  });
});
