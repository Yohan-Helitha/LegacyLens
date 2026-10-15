import { formatCount } from '../../src/utils/formatCount';

describe('formatCount', () => {
  it('leaves counts under a thousand as they are', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(950)).toBe('950');
    expect(formatCount(999)).toBe('999');
  });

  it('abbreviates thousands with at most one decimal', () => {
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1200)).toBe('1.2K');
    expect(formatCount(15400)).toBe('15.4K');
  });

  it('drops the decimal once the thousands reach three digits', () => {
    expect(formatCount(120400)).toBe('120K');
  });

  it('abbreviates millions', () => {
    expect(formatCount(3_400_000)).toBe('3.4M');
  });
});
