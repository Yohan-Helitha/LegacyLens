/** Short count for tight spots: 950 → "950", 1,200 → "1.2K", 3,400,000 → "3.4M". */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10}K`;
  }
  return `${Math.round((value / 1_000_000) * 10) / 10}M`;
}

export default formatCount;
