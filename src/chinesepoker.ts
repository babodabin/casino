// 차이니즈 포커(십삼수) — 열세 장을 뒷줄 5장·가운뎃줄 5장·앞줄 3장으로 나눠 상대와 줄마다 겨룹니다.
// 뒷줄이 가운뎃줄보다, 가운뎃줄이 앞줄보다 세야 하며 어기면 파울로 세 줄을 모두 내줍니다.
// 다섯 장 족보는 홀덤 판정을 그대로 쓰고, 앞줄 세 장만 여기서 따로 봅니다.

import { createDeck, shuffleDeck, type Card, type Rank } from './blackjack.ts';
import { compareHands, evaluateFive, type PokerHand } from './texasholdem.ts';

export type ChineseRowName = '앞줄' | '가운뎃줄' | '뒷줄';
export type ChineseLayout = { front: Card[]; middle: Card[]; back: Card[] };
export type ChineseArrangement = { layout: ChineseLayout; front: PokerHand; middle: PokerHand; back: PokerHand; foul: boolean };
export type ChineseRowOutcome = { row: ChineseRowName; outcome: 'win' | 'loss' | 'push' };
export type ChineseResult = {
  rows: ChineseRowOutcome[];
  units: number;
  scoop: 'player' | 'opponent' | null;
  playerFoul: boolean;
  opponentFoul: boolean;
  multiplier: number;
};

const rankValue: Record<Rank, number> = { A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

export const chineseRowSizes = { front: 3, middle: 5, back: 5 } as const;
/** 세 줄을 모두 이기면 세 줄 값에 더해 같은 크기의 보너스를 받습니다. */
export const chineseScoopBonus = 3;
/** 한 줄의 값. 세 줄을 다 이기면 3 + 보너스 3 = 6이 되어 베팅금의 두 배가 됩니다. */
export const chineseMaxUnits = 6;

/**
 * 앞줄 세 장 판정. 세 장으로는 스트레이트와 플러시를 세지 않는 것이 차이니즈 포커의 규칙이라
 * 트리플·원 페어·하이 카드만 나옵니다. 다섯 장 족보와 같은 번호를 써서 줄끼리 바로 비교됩니다.
 */
export function evaluateThree(cards: Card[]): PokerHand {
  if (cards.length !== 3) throw new Error('앞줄은 세 장이어야 합니다.');
  const ordered = [...cards].sort((a, b) => rankValue[b.rank] - rankValue[a.rank]);
  const values = ordered.map((card) => rankValue[card.rank]);
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const order = (rankOrder: number[]) => rankOrder.flatMap((value) => ordered.filter((card) => rankValue[card.rank] === value));
  if (groups[0][1] === 3) return { category: 3, label: '트리플', tiebreak: [groups[0][0]], cards: ordered };
  if (groups[0][1] === 2) return { category: 1, label: '원 페어', tiebreak: [groups[0][0], groups[1][0]], cards: order([groups[0][0], groups[1][0]]) };
  return { category: 0, label: '하이 카드', tiebreak: values, cards: ordered };
}

export const evaluateChineseRow = (cards: Card[]): PokerHand => (cards.length === 3 ? evaluateThree(cards) : evaluateFive(cards));

export function evaluateChineseArrangement(layout: ChineseLayout): ChineseArrangement {
  const { front, middle, back } = layout;
  if (front.length !== 3 || middle.length !== 5 || back.length !== 5) throw new Error('앞줄 3장, 가운뎃줄 5장, 뒷줄 5장으로 나눠야 합니다.');
  const ids = new Set([...front, ...middle, ...back].map((card) => card.id));
  if (ids.size !== 13) throw new Error('같은 카드를 두 줄에 놓을 수 없습니다.');
  const frontHand = evaluateThree(front), middleHand = evaluateFive(middle), backHand = evaluateFive(back);
  const foul = compareHands(backHand, middleHand) < 0 || compareHands(middleHand, frontHand) < 0;
  return { layout, front: frontHand, middle: middleHand, back: backHand, foul };
}

export const isValidChineseLayout = (layout: ChineseLayout): boolean => !evaluateChineseArrangement(layout).foul;

export function dealChinesePoker(random: () => number = Math.random): { player: Card[]; opponent: Card[] } {
  const deck = shuffleDeck(createDeck(), random);
  return { player: deck.slice(0, 13), opponent: deck.slice(13, 26) };
}

// 족보를 숫자 하나로 눌러 담습니다. 자동 배치에서 7만 가지 조합을 훑을 때 비교를 빠르게 하려는 것으로,
// 자리값이 15라 킥커까지 순서대로 반영됩니다.
const strengthOf = (hand: PokerHand): number =>
  hand.category * 15 ** 5 + hand.tiebreak.slice(0, 5).reduce((sum, value, index) => sum + value * 15 ** (4 - index), 0);

const maskCombinations = (size: number, pick: number): number[] => {
  const masks: number[] = [];
  const walk = (start: number, left: number, mask: number) => {
    if (left === 0) { masks.push(mask); return; }
    for (let index = start; index <= size - left; index += 1) walk(index + 1, left - 1, mask | (1 << index));
  };
  walk(0, pick, 0);
  return masks;
};

const cardsOfMask = (cards: Card[], mask: number): Card[] => cards.filter((_, index) => (mask >> index) & 1);

/**
 * 자동 배치. 유효한 배치 7만여 가지를 모두 보고 고릅니다.
 *
 * 어느 줄을 이기든 값은 똑같이 1이므로, 각 줄의 세기를 그 줄에서 가능한 최고 등급으로 나눠
 * 0~1로 맞춘 뒤 더합니다. 그래서 트리플은 앞줄에 놓을 때(3/4) 뒷줄에 놓을 때(3/9)보다 높게 쳐집니다.
 * 뒷줄은 남은 패로도 저절로 세지고 지나치게 세게 만들어 봐야 값이 늘지 않으므로 절반만 반영합니다.
 */
export function arrangeChinesePoker(cards: Card[]): ChineseLayout {
  if (cards.length !== 13) throw new Error('자동 배치에는 13장이 필요합니다.');
  const fiveStrength = new Map<number, number>();
  for (const mask of maskCombinations(13, 5)) fiveStrength.set(mask, strengthOf(evaluateFive(cardsOfMask(cards, mask))));
  const threeStrength = new Map<number, number>();
  for (const mask of maskCombinations(13, 3)) threeStrength.set(mask, strengthOf(evaluateThree(cardsOfMask(cards, mask))));

  const fiveMasks = [...fiveStrength.keys()];
  const all = (1 << 13) - 1;
  const scale5 = 9 * 15 ** 5, scale3 = 4 * 15 ** 5;
  let bestScore = -1, bestFront = 0, bestMiddle = 0;
  for (const [frontMask, front] of threeStrength) {
    for (const middleMask of fiveMasks) {
      if (middleMask & frontMask) continue;
      const middle = fiveStrength.get(middleMask)!;
      if (middle < front) continue;
      const backMask = all ^ frontMask ^ middleMask;
      const back = fiveStrength.get(backMask)!;
      if (back < middle) continue;
      const score = front / scale3 + middle / scale5 + (back / scale5) * 0.5;
      if (score > bestScore) { bestScore = score; bestFront = frontMask; bestMiddle = middleMask; }
    }
  }
  // 열세 장이면 가장 센 다섯 장을 뒷줄에 두는 배치가 언제나 하나는 성립하므로 여기까지 오면 답이 있습니다.
  return { front: cardsOfMask(cards, bestFront), middle: cardsOfMask(cards, bestMiddle), back: cardsOfMask(cards, all ^ bestFront ^ bestMiddle) };
}

export const chineseMultiplier = (units: number): number => Math.max(0, Math.min(2, 1 + units / chineseMaxUnits));

export function resolveChinesePoker(player: ChineseArrangement, opponent: ChineseArrangement): ChineseResult {
  const pairs: { row: ChineseRowName; mine: PokerHand; theirs: PokerHand }[] = [
    { row: '앞줄', mine: player.front, theirs: opponent.front },
    { row: '가운뎃줄', mine: player.middle, theirs: opponent.middle },
    { row: '뒷줄', mine: player.back, theirs: opponent.back },
  ];
  const rows: ChineseRowOutcome[] = pairs.map(({ row, mine, theirs }) => {
    const compared = compareHands(mine, theirs);
    return { row, outcome: compared > 0 ? 'win' : compared < 0 ? 'loss' : 'push' };
  });

  // 파울은 줄 비교를 하지 않고 세 줄을 통째로 내줍니다. 둘 다 파울이면 무승부입니다.
  if (player.foul || opponent.foul) {
    const bothFouled = player.foul && opponent.foul;
    const units = bothFouled ? 0 : player.foul ? -chineseMaxUnits : chineseMaxUnits;
    const outcome = units > 0 ? 'win' : units < 0 ? 'loss' : 'push';
    return {
      rows: rows.map(({ row }) => ({ row, outcome })),
      units,
      scoop: bothFouled ? null : player.foul ? 'opponent' : 'player',
      playerFoul: player.foul,
      opponentFoul: opponent.foul,
      multiplier: chineseMultiplier(units),
    };
  }

  const won = rows.filter((row) => row.outcome === 'win').length;
  const lost = rows.filter((row) => row.outcome === 'loss').length;
  const scoop = won === 3 ? 'player' : lost === 3 ? 'opponent' : null;
  const units = won - lost + (scoop === 'player' ? chineseScoopBonus : scoop === 'opponent' ? -chineseScoopBonus : 0);
  return { rows, units, scoop, playerFoul: false, opponentFoul: false, multiplier: chineseMultiplier(units) };
}
