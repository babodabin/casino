// 빅투(Big Two) — 손에 든 카드를 먼저 다 내려놓으면 이기는 게임입니다.
// 숫자는 3이 가장 약하고 2가 가장 셉니다(3<4<…<K<A<2). 같은 숫자면 무늬로 갈리고 ♦<♣<♥<♠ 순입니다.
// ♦3을 가진 사람이 먼저 내며 첫 장에는 반드시 ♦3이 들어가야 합니다.
// 앞사람이 낸 것과 같은 장수로만 받아칠 수 있고, 더 세야 합니다. 낼 게 없으면 넘깁니다.
// 나머지가 모두 넘기면 마지막에 낸 사람이 아무거나 새로 냅니다.

import { createDeck, shuffleDeck, type Card, type Rank, type Suit } from './blackjack.ts';
import { type OpponentLevel } from './opponent.ts';

export type BigTwoComboType = '싱글' | '페어' | '트리플' | '스트레이트' | '플러시' | '풀하우스' | '포카드' | '스트레이트 플러시';
export type BigTwoCombo = { type: BigTwoComboType; power: number; cards: Card[] };
export type BigTwoState = {
  hands: Card[][];
  turn: number;
  current: BigTwoCombo | null;
  leader: number;      // 마지막으로 낸 사람. 나머지가 다 넘기면 이 사람이 새로 냅니다.
  passes: number;      // 연속으로 넘긴 사람 수
  opening: boolean;    // 아직 첫 장을 내지 않았습니다 (♦3을 넣어야 합니다)
  winner: number | null;
  log: string[];
};

const rankOrder: Record<Rank, number> = { '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, J: 9, Q: 10, K: 11, A: 12, '2': 13 };
const suitOrder: Record<Suit, number> = { '♦': 0, '♣': 1, '♥': 2, '♠': 3 };

export const bigTwoRank = (card: Card): number => rankOrder[card.rank];
/** 카드 한 장의 세기. 숫자를 먼저 보고 같으면 무늬로 갈립니다. */
export const bigTwoValue = (card: Card): number => rankOrder[card.rank] * 4 + suitOrder[card.suit];
export const bigTwoHandSize = 13;
export const diamondThreeId = '♦-3';

const fiveTypeOrder: Record<string, number> = { 스트레이트: 1, 플러시: 2, 풀하우스: 3, 포카드: 4, '스트레이트 플러시': 5 };

/** 낼 수 있는 모양이면 그 모양과 세기를, 아니면 null을 돌려줍니다. */
export function classifyBigTwo(cards: Card[]): BigTwoCombo | null {
  if (cards.length === 0) return null;
  const ordered = [...cards].sort((a, b) => bigTwoValue(a) - bigTwoValue(b));
  const top = ordered[ordered.length - 1];
  const ranks = ordered.map(bigTwoRank);
  const sameRank = new Set(ranks).size === 1;

  if (ordered.length === 1) return { type: '싱글', power: bigTwoValue(top), cards: ordered };
  if (ordered.length === 2) return sameRank ? { type: '페어', power: bigTwoValue(top), cards: ordered } : null;
  if (ordered.length === 3) return sameRank ? { type: '트리플', power: bigTwoValue(top), cards: ordered } : null;
  if (ordered.length !== 5) return null;

  const counts = new Map<number, number>();
  ranks.forEach((rank) => counts.set(rank, (counts.get(rank) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = new Set(ordered.map((card) => card.suit)).size === 1;
  const unique = [...new Set(ranks)].sort((a, b) => a - b);
  const straight = unique.length === 5 && unique[4] - unique[0] === 4;
  const five = (type: BigTwoComboType, inner: number): BigTwoCombo => ({ type, power: fiveTypeOrder[type] * 1000 + inner, cards: ordered });

  if (straight && flush) return five('스트레이트 플러시', bigTwoValue(top));
  if (groups[0][1] === 4) return five('포카드', groups[0][0]);
  if (groups[0][1] === 3 && groups[1][1] === 2) return five('풀하우스', groups[0][0]);
  if (flush) return five('플러시', bigTwoValue(top));
  if (straight) return five('스트레이트', bigTwoValue(top));
  return null;
}

export const canBeatBigTwo = (candidate: BigTwoCombo, current: BigTwoCombo | null): boolean =>
  current === null ? true : candidate.cards.length === current.cards.length && candidate.power > current.power;

const combinations = (cards: Card[], pick: number): Card[][] => {
  const out: Card[][] = [];
  const walk = (start: number, left: number, acc: Card[]) => {
    if (left === 0) { out.push(acc); return; }
    for (let index = start; index <= cards.length - left; index += 1) walk(index + 1, left - 1, [...acc, cards[index]]);
  };
  walk(0, pick, []);
  return out;
};

/** 지금 낼 수 있는 것을 모두 찾습니다. mustInclude가 있으면 그 카드가 들어간 것만 남깁니다. */
export function legalBigTwoPlays(hand: Card[], current: BigTwoCombo | null, mustInclude?: string): BigTwoCombo[] {
  const sizes = current ? [current.cards.length] : [1, 2, 3, 5];
  const plays: BigTwoCombo[] = [];
  for (const size of sizes) {
    if (size > hand.length) continue;
    for (const pick of combinations(hand, size)) {
      if (mustInclude && !pick.some((card) => card.id === mustInclude)) continue;
      const combo = classifyBigTwo(pick);
      if (combo && canBeatBigTwo(combo, current)) plays.push(combo);
    }
  }
  return plays.sort((a, b) => a.cards.length - b.cards.length || a.power - b.power);
}

/**
 * 컴퓨터의 선택. 낼 수 있는 것 중 가장 약한 것을 냅니다.
 * 이번에 내면 손이 비는 수가 있으면 그것을 먼저 잡습니다.
 */
export function chooseBigTwoPlay(hand: Card[], current: BigTwoCombo | null, mustInclude?: string, level: OpponentLevel = '보통', random: () => number = Math.random): BigTwoCombo | null {
  const plays = legalBigTwoPlays(hand, current, mustInclude);
  if (plays.length === 0) return null;
  const finishing = plays.find((play) => play.cards.length === hand.length);
  if (finishing) return finishing;

  /**
   * 전문가는 **짝을 깨지 않고 센 패를 아낍니다.**
   * 보통은 낼 수 있는 것 중 제일 약한 것을 그냥 냅니다. 그러면 페어의 한 장을 떼어
   * 한 장짜리로 내버리는 일이 잦고, 2(제일 센 패)도 아무 때나 나갑니다.
   */
  if (level === '전문가') {
    const rankCount = new Map<string, number>();
    for (const card of hand) rankCount.set(card.rank, (rankCount.get(card.rank) ?? 0) + 1);
    const cost = (play: BigTwoCombo) => {
      let penalty = 0;
      for (const card of play.cards) {
        const held = rankCount.get(card.rank) ?? 0;
        // 두 장 이상 쥔 숫자를 한 장만 떼어 내면 짝이 깨집니다.
        if (held > 1 && play.cards.filter((item) => item.rank === card.rank).length < held) penalty += 6;
        // 2는 판을 끊는 패입니다. 급하지 않으면 아낍니다.
        if (card.rank === '2') penalty += 8;
      }
      // 같은 값이면 약한 것부터, 그리고 여러 장을 터는 쪽이 낫습니다.
      return penalty + play.power * 0.02 - play.cards.length * 1.5;
    };
    return [...plays].sort((a, b) => cost(a) - cost(b))[0];
  }

  // 쉬움은 가끔 아무 수나 냅니다. 사람이 이길 구석이 있어야 합니다.
  if (level === '쉬움' && plays.length > 1 && random() < 0.3) return plays[Math.floor(random() * plays.length)];

  // 새로 시작하는 차례면 여러 장을 한 번에 털어내는 쪽이 낫습니다.
  if (!current) {
    const longest = Math.max(...plays.map((play) => play.cards.length));
    const wide = plays.filter((play) => play.cards.length === longest);
    return wide[0];
  }
  return plays[0];
}

export function dealBigTwo(players: number, random: () => number = Math.random): Card[][] {
  if (players < 2 || players > 4) throw new Error('빅투는 두 명에서 네 명까지 합니다.');
  const deck = shuffleDeck(createDeck(), random);
  return Array.from({ length: players }, (_, index) => deck.slice(index * bigTwoHandSize, (index + 1) * bigTwoHandSize).sort((a, b) => bigTwoValue(a) - bigTwoValue(b)));
}

export function startBigTwo(players: number, random: () => number = Math.random): BigTwoState {
  const hands = dealBigTwo(players, random);
  // ♦3을 가진 사람이 먼저입니다. 두세 명이면 ♦3이 아무에게도 없을 수 있어 그때는 가장 약한 카드를 가진 사람이 먼저 냅니다.
  const holder = hands.findIndex((hand) => hand.some((card) => card.id === diamondThreeId));
  const lowest = hands.reduce((best, hand, index) => (bigTwoValue(hand[0]) < bigTwoValue(hands[best][0]) ? index : best), 0);
  const turn = holder >= 0 ? holder : lowest;
  return { hands, turn, current: null, leader: turn, passes: 0, opening: true, winner: null, log: [] };
}

export const bigTwoOpeningCard = (state: BigTwoState): string | undefined =>
  state.opening && state.hands.some((hand) => hand.some((card) => card.id === diamondThreeId)) ? diamondThreeId : undefined;

const nextTurn = (state: BigTwoState): number => (state.turn + 1) % state.hands.length;

export function playBigTwo(state: BigTwoState, cards: Card[]): BigTwoState {
  if (state.winner !== null) throw new Error('이미 끝난 판입니다.');
  const hand = state.hands[state.turn];
  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== cards.length || !cards.every((card) => hand.some((item) => item.id === card.id))) throw new Error('손에 없는 카드는 낼 수 없습니다.');
  const combo = classifyBigTwo(cards);
  if (!combo) throw new Error('낼 수 없는 모양입니다.');
  if (!canBeatBigTwo(combo, state.current)) throw new Error('앞사람이 낸 것보다 세야 합니다.');
  const opening = bigTwoOpeningCard(state);
  if (opening && !cards.some((card) => card.id === opening)) throw new Error('첫 장에는 ♦3이 들어가야 합니다.');

  const hands = state.hands.map((item, index) => (index === state.turn ? item.filter((card) => !ids.has(card.id)) : item));
  const emptied = hands[state.turn].length === 0;
  const log = [...state.log, `${state.turn === 0 ? '나' : `컴퓨터 ${state.turn}`} · ${combo.type} ${combo.cards.map((card) => `${card.suit}${card.rank}`).join(' ')}`];
  return {
    ...state, hands, log,
    current: combo, leader: state.turn, passes: 0, opening: false,
    winner: emptied ? state.turn : null,
    turn: emptied ? state.turn : nextTurn(state),
  };
}

export function passBigTwo(state: BigTwoState): BigTwoState {
  if (state.winner !== null) throw new Error('이미 끝난 판입니다.');
  if (!state.current) throw new Error('새로 시작하는 차례에는 넘길 수 없습니다.');
  const passes = state.passes + 1;
  const log = [...state.log, `${state.turn === 0 ? '나' : `컴퓨터 ${state.turn}`} · 넘김`];
  // 나머지가 모두 넘기면 마지막에 낸 사람이 아무거나 새로 냅니다.
  if (passes >= state.hands.length - 1) return { ...state, log, current: null, passes: 0, turn: state.leader };
  return { ...state, log, passes, turn: nextTurn(state) };
}

/** 컴퓨터 차례를 한 번 진행합니다. */
export function stepBigTwo(state: BigTwoState, level: OpponentLevel = '보통', random: () => number = Math.random): BigTwoState {
  const play = chooseBigTwoPlay(state.hands[state.turn], state.current, bigTwoOpeningCard(state), level, random);
  return play ? playBigTwo(state, play.cards) : passBigTwo(state);
}

/** 벌점. 많이 남길수록 빠르게 커집니다. 여덟 장부터 두 배, 열 장부터 세 배, 열세 장은 네 배입니다. */
export const bigTwoPenalty = (remaining: number): number =>
  remaining <= 7 ? remaining : remaining <= 9 ? remaining * 2 : remaining <= 12 ? remaining * 3 : remaining * 4;

// 배당은 인원수마다 다릅니다. 사람이 많을수록 이기기 어려우니 배당이 커집니다.
// 6만 판을 돌려 승률과 '세 장 이하로 짐'이 나오는 빈도를 재고 환급률이 95%에 맞도록 정했습니다.
//   두 명  승률 50.6% · 세 장 이하 27.3% → 1.60배 · 환급률 94.6%
//   세 명  승률 33.5% · 세 장 이하 36.7% → 2.30배 · 환급률 95.3%
//   네 명  승률 25.4% · 세 장 이하 40.0% → 2.95배 · 환급률 95.1%
// 컴퓨터끼리 붙여 잰 값이라, 사람이 컴퓨터보다 잘 두면 환급률은 이보다 올라갑니다.
export const bigTwoWinPayout: Record<number, number> = { 2: 1.6, 3: 2.3, 4: 2.95 };
/** 져도 이만큼 이하로 털었으면 절반을 돌려받습니다. */
export const bigTwoCloseRemaining = 3;
export const bigTwoClosePayout = 0.5;

export function bigTwoMultiplier(players: number, won: boolean, myRemaining: number): number {
  if (won) {
    const payout = bigTwoWinPayout[players];
    if (!payout) throw new Error('두 명에서 네 명까지만 배당이 정해져 있습니다.');
    return payout;
  }
  return myRemaining <= bigTwoCloseRemaining ? bigTwoClosePayout : 0;
}

/** 컴퓨터끼리 끝까지 돌립니다. 환급률을 재거나 테스트할 때 씁니다. */
export function playOutBigTwo(state: BigTwoState, limit = 500): BigTwoState {
  let current = state;
  for (let step = 0; step < limit && current.winner === null; step += 1) current = stepBigTwo(current);
  if (current.winner === null) throw new Error('판이 끝나지 않았습니다.');
  return current;
}
