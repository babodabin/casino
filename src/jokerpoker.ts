// 조커 포커(발라트로) — 포커 족보로 점수를 쌓아 목표를 넘기는 게임입니다.
//
// 여덟 장을 들고 시작합니다. 그중 다섯 장까지 골라 내면 그 족보로 점수가 붙고,
// 낸 자리는 새 카드로 채워집니다. 낼 기회는 세 번, 버릴 기회는 두 번입니다.
//
// 점수는 (족보 칩 + 낸 카드의 칩) × 배수입니다.
// 판을 시작할 때 조커 셋을 무작위로 받는데, 조커가 칩이나 배수를 올려 줍니다.
// 어떤 조커를 받았는지에 따라 노려야 할 족보가 달라지는 것이 이 게임의 핵심입니다.
//
// 이름은 발라트로에서 왔고 규칙도 크게 줄여 옮긴 것입니다. 조커 종류와 점수는 여기서 정한 값입니다.

import { createDeck, shuffleDeck, type Card, type Rank } from './blackjack.ts';

export type JokerHandType = '하이 카드' | '원 페어' | '투 페어' | '트리플' | '스트레이트' | '플러시' | '풀하우스' | '포카드' | '스트레이트 플러시';
export type JokerScore = { type: JokerHandType; chips: number; mult: number; scoring: Card[] };
export type JokerId = '광대' | '계산가' | '쌍둥이' | '무늬꾼' | '짝수쟁이' | '홀수쟁이' | '막내' | '욕심쟁이';
export type Joker = { id: JokerId; name: string; text: string };

export const jokerHandSize = 8;
export const jokerPlays = 3;
export const jokerDiscards = 2;
export const jokerCount = 3;

const rankValue: Record<Rank, number> = { A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
/** 카드 한 장이 주는 칩. 그림과 10은 10칩, A는 11칩, 나머지는 숫자만큼입니다. */
export const cardChips = (card: Card): number => (card.rank === 'A' ? 11 : rankValue[card.rank] >= 10 ? 10 : rankValue[card.rank]);

/** 족보마다 기본 칩과 배수. 어려운 족보일수록 둘 다 큽니다. */
export const handBase: Record<JokerHandType, { chips: number; mult: number }> = {
  '하이 카드': { chips: 5, mult: 1 },
  '원 페어': { chips: 10, mult: 2 },
  '투 페어': { chips: 20, mult: 2 },
  '트리플': { chips: 30, mult: 3 },
  '스트레이트': { chips: 30, mult: 4 },
  '플러시': { chips: 35, mult: 4 },
  '풀하우스': { chips: 40, mult: 4 },
  '포카드': { chips: 60, mult: 7 },
  '스트레이트 플러시': { chips: 100, mult: 8 },
};

export const jokers: Joker[] = [
  { id: '광대', name: '광대', text: '배수 +4' },
  { id: '계산가', name: '계산가', text: '칩 +40' },
  { id: '쌍둥이', name: '쌍둥이', text: '같은 숫자가 있으면 배수 ×2' },
  { id: '무늬꾼', name: '무늬꾼', text: '무늬가 다 같으면 배수 ×3' },
  { id: '짝수쟁이', name: '짝수쟁이', text: '점수에 든 짝수 카드마다 배수 +2' },
  { id: '홀수쟁이', name: '홀수쟁이', text: '점수에 든 홀수 카드마다 배수 +2' },
  { id: '막내', name: '막내', text: '점수에 든 카드마다 칩 +12' },
  { id: '욕심쟁이', name: '욕심쟁이', text: '점수에 든 ◆마다 배수 +3' },
];

/**
 * 낸 카드의 족보를 봅니다. 한 장부터 다섯 장까지 낼 수 있습니다.
 * scoring은 점수에 들어가는 카드입니다. 페어를 내면 짝을 이룬 두 장만 들어가고
 * 스트레이트나 플러시는 다섯 장이 모두 들어갑니다. 발라트로와 같은 방식입니다.
 */
export function scoreHandType(cards: Card[]): JokerScore {
  if (cards.length === 0 || cards.length > 5) throw new Error('한 장에서 다섯 장까지 낼 수 있습니다.');
  const ordered = [...cards].sort((a, b) => rankValue[b.rank] - rankValue[a.rank]);
  const counts = new Map<number, Card[]>();
  for (const card of ordered) {
    const value = rankValue[card.rank];
    counts.set(value, [...(counts.get(value) ?? []), card]);
  }
  const groups = [...counts.entries()].sort((a, b) => b[1].length - a[1].length || b[0] - a[0]);
  const flush = ordered.length === 5 && new Set(ordered.map((card) => card.suit)).size === 1;
  const values = ordered.map((card) => rankValue[card.rank]);
  const unique = [...new Set(values)].sort((a, b) => a - b);
  const wheel = unique.join(',') === '2,3,4,5,14';
  const straight = ordered.length === 5 && unique.length === 5 && (wheel || unique[4] - unique[0] === 4);

  const make = (type: JokerHandType, scoring: Card[]): JokerScore => ({ type, ...handBase[type], scoring });
  if (straight && flush) return make('스트레이트 플러시', ordered);
  if (groups[0][1].length === 4) return make('포카드', groups[0][1]);
  if (groups[0][1].length === 3 && groups[1]?.[1].length === 2) return make('풀하우스', ordered);
  if (flush) return make('플러시', ordered);
  if (straight) return make('스트레이트', ordered);
  if (groups[0][1].length === 3) return make('트리플', groups[0][1]);
  if (groups[0][1].length === 2 && groups[1]?.[1].length === 2) return make('투 페어', [...groups[0][1], ...groups[1][1]]);
  if (groups[0][1].length === 2) return make('원 페어', groups[0][1]);
  return make('하이 카드', [ordered[0]]);
}

/** 조커까지 얹은 실제 점수. */
export function scoreWithJokers(cards: Card[], held: JokerId[]): { score: number; chips: number; mult: number; hand: JokerScore } {
  const hand = scoreHandType(cards);
  let chips = hand.chips + hand.scoring.reduce((sum, card) => sum + cardChips(card), 0);
  let mult = hand.mult;
  const sameRank = new Set(cards.map((card) => card.rank)).size < cards.length;
  const sameSuit = cards.length > 1 && new Set(cards.map((card) => card.suit)).size === 1;
  for (const id of held) {
    if (id === '광대') mult += 4;
    else if (id === '계산가') chips += 40;
    else if (id === '막내') chips += hand.scoring.length * 12;
    else if (id === '쌍둥이') { if (sameRank) mult *= 2; }
    else if (id === '무늬꾼') { if (sameSuit) mult *= 3; }
    else if (id === '짝수쟁이') mult += hand.scoring.filter((card) => rankValue[card.rank] % 2 === 0).length * 2;
    else if (id === '홀수쟁이') mult += hand.scoring.filter((card) => rankValue[card.rank] % 2 === 1).length * 2;
    else if (id === '욕심쟁이') mult += hand.scoring.filter((card) => card.suit === '♦').length * 3;
  }
  return { score: Math.round(chips * mult), chips, mult, hand };
}

export type JokerRound = {
  deck: Card[];
  hand: Card[];
  held: JokerId[];
  playsLeft: number;
  discardsLeft: number;
  score: number;
  log: { type: JokerHandType; score: number }[];
};

/** 조커 여덟 종류 중 셋을 겹치지 않게 뽑습니다. */
export function drawJokers(random: () => number = Math.random, count: number = jokerCount): JokerId[] {
  const pool = jokers.map((joker) => joker.id);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, count);
}

export function startJokerRound(random: () => number = Math.random): JokerRound {
  const deck = shuffleDeck(createDeck(), random);
  return { deck: deck.slice(jokerHandSize), hand: deck.slice(0, jokerHandSize), held: drawJokers(random), playsLeft: jokerPlays, discardsLeft: jokerDiscards, score: 0, log: [] };
}

const refill = (round: JokerRound, kept: Card[]): { hand: Card[]; deck: Card[] } => {
  const need = jokerHandSize - kept.length;
  return { hand: [...kept, ...round.deck.slice(0, need)], deck: round.deck.slice(need) };
};

export function playJokerHand(round: JokerRound, cards: Card[]): JokerRound {
  if (round.playsLeft <= 0) throw new Error('더 낼 수 없습니다.');
  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== cards.length || !cards.every((card) => round.hand.some((item) => item.id === card.id))) throw new Error('손에 없는 카드는 낼 수 없습니다.');
  const result = scoreWithJokers(cards, round.held);
  const kept = round.hand.filter((card) => !ids.has(card.id));
  const { hand, deck } = refill(round, kept);
  return { ...round, hand, deck, playsLeft: round.playsLeft - 1, score: round.score + result.score, log: [...round.log, { type: result.hand.type, score: result.score }] };
}

export function discardJokerCards(round: JokerRound, cards: Card[]): JokerRound {
  if (round.discardsLeft <= 0) throw new Error('더 버릴 수 없습니다.');
  if (cards.length === 0 || cards.length > 5) throw new Error('한 장에서 다섯 장까지 버릴 수 있습니다.');
  const ids = new Set(cards.map((card) => card.id));
  if (!cards.every((card) => round.hand.some((item) => item.id === card.id))) throw new Error('손에 없는 카드는 버릴 수 없습니다.');
  const kept = round.hand.filter((card) => !ids.has(card.id));
  const { hand, deck } = refill(round, kept);
  return { ...round, hand, deck, discardsLeft: round.discardsLeft - 1 };
}

export const isJokerRoundOver = (round: JokerRound): boolean => round.playsLeft <= 0;

// 목표와 배당은 시드 셋으로 각각 2만 판씩 돌려 맞췄습니다.
// 컴퓨터가 매번 가장 점수 높은 조합을 내고 시원찮으면 버리는 방식으로 두면
// 점수는 중간값 2673, 90%가 4294, 99%가 7036이 나옵니다.
// 목표 2650에 아래 사다리면 환급률이 92.8~94.5%입니다.
//   목표를 넘김 51% · 두 배 3.4% · 세 배 0.46%
// 사람이 조커에 맞춰 버릴 카드를 잘 고르면 이보다 올라갑니다.
export const jokerTarget = 2650;
export const jokerLadder: { at: number; payout: number }[] = [
  { at: 1, payout: 1.7 },
  { at: 2, payout: 3 },
  { at: 3, payout: 10 },
];

/** 목표의 몇 배를 냈는지로 배당이 갈립니다. 목표에 못 미치면 0입니다. */
export function jokerMultiplier(score: number): number {
  const ratio = score / jokerTarget;
  let payout = 0;
  for (const step of jokerLadder) if (ratio >= step.at) payout = step.payout;
  return payout;
}

/** 손에서 가장 점수가 높게 나오는 조합을 찾습니다. 화면의 '골라주기'와 환급률 계산에 씁니다. */
export function bestJokerPlay(hand: Card[], held: JokerId[]): { cards: Card[]; score: number } {
  let best: { cards: Card[]; score: number } = { cards: [hand[0]], score: 0 };
  const walk = (start: number, picked: Card[]) => {
    if (picked.length > 0) {
      const score = scoreWithJokers(picked, held).score;
      if (score > best.score) best = { cards: [...picked], score };
    }
    if (picked.length === 5) return;
    for (let index = start; index < hand.length; index += 1) walk(index + 1, [...picked, hand[index]]);
  };
  walk(0, []);
  return best;
}

/**
 * 이 점수에 못 미치면 컴퓨터가 버리고 다시 봅니다.
 * 목표 점수에서 끌어다 쓰면 목표를 조정할 때마다 컴퓨터 실력이 같이 바뀌어
 * 환급률을 맞출 수가 없습니다. 그래서 따로 둡니다.
 */
export const jokerDiscardBelow = 700;

/** 컴퓨터가 한 판을 끝까지 두는 방식. 환급률을 잴 때 씁니다. */
export function playOutJokerRound(round: JokerRound): JokerRound {
  let current = round;
  while (current.playsLeft > 0) {
    const best = bestJokerPlay(current.hand, current.held);
    // 아직 버릴 기회가 남았고 지금 패가 시원찮으면 점수에 안 들어가는 카드를 버립니다.
    if (current.discardsLeft > 0 && best.score < jokerDiscardBelow) {
      const keep = new Set(best.cards.map((card) => card.id));
      const trash = current.hand.filter((card) => !keep.has(card.id)).slice(0, 5);
      if (trash.length > 0) { current = discardJokerCards(current, trash); continue; }
    }
    current = playJokerHand(current, best.cards);
  }
  return current;
}
