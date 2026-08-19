export const slotSymbols = ['🍒', '🍋', '🔔', '⭐', '💎', '🃏', '👑'] as const;
export type SlotSymbol = typeof slotSymbols[number];

export type SlotResult = {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  multiplier: number;
  payout: number;
  freeSpins: number;
  label: string;
};

const tripleMultipliers: Record<SlotSymbol, number> = {
  '🍒': 4,
  '🍋': 5,
  '🔔': 8,
  '⭐': 10,
  '💎': 15,
  '🃏': 20,
  '👑': 50,
};

export function randomSlotSymbol(random: () => number = Math.random): SlotSymbol {
  return slotSymbols[Math.floor(random() * slotSymbols.length)];
}

export function evaluateSlot(reels: [SlotSymbol, SlotSymbol, SlotSymbol], bet: number): SlotResult {
  const nonWild = reels.filter((symbol) => symbol !== '🃏');
  const tripleSymbol = nonWild.length === 0 || nonWild.every((symbol) => symbol === nonWild[0]) ? (nonWild[0] ?? '🃏') : null;
  if (tripleSymbol) {
    const multiplier = tripleMultipliers[tripleSymbol];
    return { reels, multiplier, payout: bet * multiplier, freeSpins: tripleSymbol === '⭐' ? 5 : 0, label: tripleSymbol === '👑' ? '잭팟!' : tripleSymbol === '⭐' ? '무료 회전 5회!' : `${multiplier}배 당첨!` };
  }

  const pair = reels.some((symbol, index) => reels.some((other, otherIndex) => index !== otherIndex && symbol === other));
  if (pair) return { reels, multiplier: 1.5, payout: Math.floor(bet * 1.5), freeSpins: 0, label: '같은 그림 2개 보너스!' };
  return { reels, multiplier: 0, payout: 0, freeSpins: 0, label: '아쉽지만 다음 회전에 도전하세요' };
}

export function spinSlot(bet: number, random: () => number = Math.random): SlotResult {
  return evaluateSlot([randomSlotSymbol(random), randomSlotSymbol(random), randomSlotSymbol(random)], bet);
}
