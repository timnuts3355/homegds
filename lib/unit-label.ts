// Stored unit values remain compatible with existing products, history and CSV files.
const UNIT_KEYS: Record<string, string> = {
  個: 'piece', 本: 'bottle', 袋: 'bag', 箱: 'box', 缶: 'can', 枚: 'sheet',
  g: 'g', kg: 'kg', ml: 'ml', L: 'L', その他: 'other',
};
export function unitLabel(unit: string, t: (key: string) => string): string {
  const key = UNIT_KEYS[unit];
  return key ? t(`units.${key}`) : unit;
}
