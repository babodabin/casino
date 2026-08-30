import { createDeck, shuffleDeck, type Card, type Rank } from './blackjack.ts';
import { compareHands, evaluateHoldem, type PokerHand } from './texasholdem.ts';

const lowRank: Record<Rank, number> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

export type LowHand = { label: string; values: number[]; cards: Card[] };
export type HighLowResult = {
  result: 'win' | 'loss' | 'push';
  share: number;
  playerHigh: PokerHand;
  opponentHigh: PokerHand;
  playerLow: LowHand | null;
  opponentLow: LowHand | null;
  highWinner: 'player' | 'opponent' | 'tie';
  lowWinner: 'player' | 'opponent' | 'tie' | 'none';
};

const combinations = (cards: Card[]) => {
  const result: Card[][] = [];
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 4; b++) for (let c = b + 1; c < 5; c++) for (let d = c + 1; d < 6; d++) for (let e = d + 1; e < 7; e++) result.push([cards[a], cards[b], cards[c], cards[d], cards[e]]);
  return result;
};

export function evaluateLow(cards: Card[]): LowHand | null {
  if (cards.length !== 7) throw new Error('하이로우 판정에는 7장이 필요합니다.');
  const candidates = combinations(cards).flatMap((hand) => {
    const values = hand.map((card) => lowRank[card.rank]);
    if (new Set(values).size !== 5 || Math.max(...values) > 8) return [];
    const ordered = [...values].sort((a, b) => b - a);
    const orderedCards = ordered.map((value) => hand.find((card) => lowRank[card.rank] === value)!);
    return [{ values: ordered, cards: orderedCards }];
  });
  candidates.sort((a, b) => {
    for (let i = 0; i < 5; i++) if (a.values[i] !== b.values[i]) return a.values[i] - b.values[i];
    return 0;
  });
  const best = candidates[0];
  return best ? { ...best, label: `${best.values[0]} 로우` } : null;
}

export function compareLow(a: LowHand, b: LowHand) {
  for (let i = 0; i < 5; i++) if (a.values[i] !== b.values[i]) return Math.sign(b.values[i] - a.values[i]);
  return 0;
}

export function dealHighLow(random: () => number = Math.random) {
  const deck = shuffleDeck(createDeck(), random);
  return { player: deck.slice(0, 7), opponent: deck.slice(7, 14) };
}

export function resolveHighLow(player: Card[], opponent: Card[]): HighLowResult {
  const playerHigh = evaluateHoldem(player); const opponentHigh = evaluateHoldem(opponent);
  const highCompared = compareHands(playerHigh, opponentHigh);
  const highWinner = highCompared > 0 ? 'player' as const : highCompared < 0 ? 'opponent' as const : 'tie' as const;
  const playerLow = evaluateLow(player); const opponentLow = evaluateLow(opponent);
  const lowWinner = !playerLow && !opponentLow ? 'none' as const : playerLow && !opponentLow ? 'player' as const : !playerLow && opponentLow ? 'opponent' as const : compareLow(playerLow!, opponentLow!) > 0 ? 'player' as const : compareLow(playerLow!, opponentLow!) < 0 ? 'opponent' as const : 'tie' as const;
  let share = highWinner === 'player' ? 0.5 : highWinner === 'tie' ? 0.25 : 0;
  if (lowWinner === 'none') share = highWinner === 'player' ? 1 : highWinner === 'tie' ? 0.5 : 0;
  else share += lowWinner === 'player' ? 0.5 : lowWinner === 'tie' ? 0.25 : 0;
  return { result: share > 0.5 ? 'win' : share < 0.5 ? 'loss' : 'push', share, playerHigh, opponentHigh, playerLow, opponentLow, highWinner, lowWinner };
}

/** 여러 명이 할 때 몫을 나눕니다. 0번이 나입니다. 일곱 장씩이라 일곱 명까지 됩니다. */
export function dealHighLowTable(players: number, random: () => number = Math.random): Card[][] {
  if (players < 2 || players > 7) throw new Error('하이로우는 두 명에서 일곱 명까지 합니다.');
  const deck = shuffleDeck(createDeck(), random);
  return Array.from({ length: players }, (_, index) => deck.slice(index * 7, (index + 1) * 7));
}

export type HighLowTableResult = {
  highWinners: number[];
  /** 8 이하 로우를 만든 사람이 아무도 없으면 빈 배열이고, 그때는 하이가 팟을 다 가져갑니다. */
  lowWinners: number[];
  /** 자리별 팟 몫. 살아 있는 사람들 몫을 다 더하면 1입니다. */
  shares: number[];
};

/**
 * 여러 명의 승부. 하이 절반 · 로우 절반이고 같은 세기가 여럿이면 그 안에서 다시 나눕니다.
 * live에는 폴드하지 않고 끝까지 간 자리만 넘깁니다.
 */
export function resolveHighLowTable(hands: Card[][], live: number[]): HighLowTableResult {
  if (live.length === 0) throw new Error('승부할 사람이 없습니다.');
  const highs = new Map(live.map((seat) => [seat, evaluateHoldem(hands[seat])]));
  let highWinners = [live[0]];
  for (const seat of live.slice(1)) {
    const compared = compareHands(highs.get(seat)!, highs.get(highWinners[0])!);
    if (compared > 0) highWinners = [seat];
    else if (compared === 0) highWinners.push(seat);
  }

  const qualified = live.map((seat) => ({ seat, low: evaluateLow(hands[seat]) })).filter((item): item is { seat: number; low: LowHand } => item.low !== null);
  let lowWinners: number[] = [];
  if (qualified.length > 0) {
    let best = [qualified[0]];
    for (const item of qualified.slice(1)) {
      const compared = compareLow(item.low, best[0].low);
      if (compared > 0) best = [item];
      else if (compared === 0) best.push(item);
    }
    lowWinners = best.map((item) => item.seat);
  }

  const shares = hands.map(() => 0);
  if (lowWinners.length === 0) highWinners.forEach((seat) => { shares[seat] += 1 / highWinners.length; });
  else {
    highWinners.forEach((seat) => { shares[seat] += 0.5 / highWinners.length; });
    lowWinners.forEach((seat) => { shares[seat] += 0.5 / lowWinners.length; });
  }
  return { highWinners, lowWinners, shares };
}
