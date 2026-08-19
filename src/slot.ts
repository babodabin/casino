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

export const pachislotSymbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣', '🔁'] as const;
export type PachislotSymbol = typeof pachislotSymbols[number];
export type PachislotResult = { reels: [PachislotSymbol, PachislotSymbol, PachislotSymbol]; payout: number; replay: boolean; bonusSpins: number; label: string };

export function spinPachislotReels(random: () => number = Math.random): [PachislotSymbol, PachislotSymbol, PachislotSymbol] {
  const pick = () => pachislotSymbols[Math.floor(random() * pachislotSymbols.length)];
  return [pick(), pick(), pick()];
}

export function evaluatePachislot(reels: [PachislotSymbol, PachislotSymbol, PachislotSymbol], bet: number): PachislotResult {
  const [first, second, third] = reels;
  if (first === '🔁' && second === '🔁' && third === '🔁') return { reels, payout: 0, replay: true, bonusSpins: 0, label: 'REPLAY · 다음 회전 무료' };
  if (first === '7️⃣' && second === '7️⃣' && third === '7️⃣') return { reels, payout: bet * 10, replay: false, bonusSpins: 8, label: 'BIG BONUS · 8회' };
  if (first === '🔔' && second === '🔔' && third === '🔔') return { reels, payout: bet * 5, replay: false, bonusSpins: 4, label: 'REGULAR BONUS · 4회' };
  if (first === second && second === third) return { reels, payout: bet * 4, replay: false, bonusSpins: 0, label: '그림 3개 · 4배 당첨' };
  if (first === second || second === third || first === third) return { reels, payout: Math.floor(bet * 1.5), replay: false, bonusSpins: 0, label: '그림 2개 · 작은 보너스' };
  return { reels, payout: 0, replay: false, bonusSpins: 0, label: '다음 게임에 도전하세요' };
}
