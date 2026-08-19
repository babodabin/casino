import { createDeck, shuffleDeck, type Card, type Rank } from './blackjack.ts';

export type VideoPokerResult = { key: string; label: string; multiplier: number };

const rankValue: Record<Rank, number> = { A: 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

export function dealVideoPoker(random: () => number = Math.random) {
  const deck = shuffleDeck(createDeck(), random);
  return { hand: deck.slice(0, 5), deck: deck.slice(5) };
}

export function exchangeVideoPoker(hand: Card[], deck: Card[], held: boolean[]) {
  const remaining = [...deck];
  const nextHand = hand.map((card, index) => held[index] ? card : remaining.shift()!);
  return { hand: nextHand, deck: remaining };
}

export function evaluateVideoPoker(hand: Card[]): VideoPokerResult {
  const values = hand.map((card) => rankValue[card.rank]).sort((a, b) => a - b);
  const suits = new Set(hand.map((card) => card.suit));
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = suits.size === 1;
  const wheel = values.join(',') === '2,3,4,5,14';
  const straight = wheel || (new Set(values).size === 5 && values[4] - values[0] === 4);
  const royal = values.join(',') === '10,11,12,13,14';

  if (flush && royal) return { key: 'royalFlush', label: '로열 플러시', multiplier: 250 };
  if (flush && straight) return { key: 'straightFlush', label: '스트레이트 플러시', multiplier: 50 };
  if (groups[0][1] === 4) return { key: 'fourKind', label: '포카드', multiplier: 25 };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { key: 'fullHouse', label: '풀하우스', multiplier: 9 };
  if (flush) return { key: 'flush', label: '플러시', multiplier: 6 };
  if (straight) return { key: 'straight', label: '스트레이트', multiplier: 4 };
  if (groups[0][1] === 3) return { key: 'threeKind', label: '트리플', multiplier: 3 };
  if (groups[0][1] === 2 && groups[1][1] === 2) return { key: 'twoPair', label: '투 페어', multiplier: 2 };
  if (groups[0][1] === 2 && groups[0][0] >= 11) return { key: 'jacksOrBetter', label: '잭 이상 원 페어', multiplier: 1 };
  return { key: 'noWin', label: '당첨 없음', multiplier: 0 };
}

export const videoPokerPayout = (stake: number, hand: Card[]) => stake * evaluateVideoPoker(hand).multiplier;
export const videoPokerNet = (stake: number, hand: Card[]) => videoPokerPayout(stake, hand) - stake;
