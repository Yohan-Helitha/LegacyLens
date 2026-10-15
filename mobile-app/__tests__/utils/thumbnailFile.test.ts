import { isRemoteUri, thumbnailFileFromUri } from '../../src/utils/thumbnailFile';

describe('thumbnailFileFromUri', () => {
  it('works out the type from the extension', () => {
    expect(thumbnailFileFromUri('file:///data/cache/ImagePicker/abc.PNG')).toEqual({
      uri: 'file:///data/cache/ImagePicker/abc.PNG',
      name: 'thumbnail.png',
      type: 'image/png',
    });
    expect(thumbnailFileFromUri('file:///x/y.jpeg').type).toBe('image/jpeg');
    expect(thumbnailFileFromUri('file:///x/y.webp').type).toBe('image/webp');
  });

  it('ignores a query string and falls back to JPEG for unknown extensions', () => {
    expect(thumbnailFileFromUri('file:///x/y.jpg?cache=1').name).toBe('thumbnail.jpg');
    expect(thumbnailFileFromUri('content://media/external/images/media/42')).toMatchObject({
      name: 'thumbnail.jpg',
      type: 'image/jpeg',
    });
  });
});

describe('isRemoteUri', () => {
  it('tells server pictures from locally picked ones', () => {
    expect(isRemoteUri('https://cdn.example/a.jpg')).toBe(true);
    expect(isRemoteUri('http://10.0.0.5:8081/uploads/a.jpg')).toBe(true);
    expect(isRemoteUri('file:///data/a.jpg')).toBe(false);
    expect(isRemoteUri('content://media/42')).toBe(false);
  });
});
