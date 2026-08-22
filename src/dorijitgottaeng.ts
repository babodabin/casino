import { type HwatuCard } from './hwatu.ts';
import { createSeotdaDeck, seotdaKkeut } from './seotda.ts';
import { shuffleHwatu } from './hwatu.ts';

/**
 * 도리짓고땡.
 *
 * 화투 20장(1~10월 각 두 장)에서 다섯 장을 받아,
 * 그중 **세 장으로 10의 배수를 지어** 내려놓고 남은 두 장으로 겨룹니다.
 * 세 장으로 10의 배수를 못 만들면 그 판은 참여할 수 없습니다("못 지음").
 *
 * 남은 두 장은 섰다와 같은 방식이지만 광땡과 알리·독사 같은 조합은 쓰지 않고,
 * 땡(같은 달 두 장)과 끗만 겨룹니다.
 */

export type DoriHand = {
  /** 10의 배수를 만든 세 장 */
  build: HwatuCard[];
  /** 남은 두 장 */
  pair: HwatuCard[];
  /** 땡이면 그 달, 아니면 null */
  ddaeng: number | null;
  /** 끗(0~9). 땡이면 쓰지 않습니다 */
  kkeut: number;
  name: string;
  detail: string;
};

export type DoriResult =
  | { kind: 'hand'; hand: DoriHand }
  /** 세 장으로 10의 배수를 못 만든 경우 */
  | { kind: 'none'; reason: string };

const kkeutName = (value: number) => (value === 9 ? '갑오' : value === 0 ? '망통' : `${value}끗`);
const ddaengName = (month: number) => `${month === 10 ? '장' : month}땡`;

/** 세 장을 고르는 모든 방법. 다섯 장이므로 열 가지뿐입니다. */
function triples(cards: HwatuCard[]): number[][] {
  const out: number[][] = [];
  for (let a = 0; a < cards.length; a += 1)
    for (let b = a + 1; b < cards.length; b += 1)
      for (let c = b + 1; c < cards.length; c += 1) out.push([a, b, c]);
  return out;
}

/** 남은 두 장의 세기. 땡이 끗보다 무조건 높습니다. */
const pairScore = (pair: HwatuCard[]) =>
  pair[0].month === pair[1].month ? 100 + pair[0].month : seotdaKkeut(pair);

/**
 * 다섯 장을 가장 좋은 모양으로 나눕니다.
 * 10의 배수를 만드는 방법이 여럿이면 남는 두 장이 가장 센 쪽을 고릅니다.
 */
export function evaluateDori(cards: HwatuCard[]): DoriResult {
  if (cards.length !== 5) throw new Error('도리짓고땡은 다섯 장으로 판정합니다.');
  let best: DoriHand | null = null;
  for (const picked of triples(cards)) {
    const sum = picked.reduce((total, index) => total + cards[index].month, 0);
    if (sum % 10 !== 0) continue;
    const build = picked.map((index) => cards[index]);
    const pair = cards.filter((_, index) => !picked.includes(index));
    const ddaeng = pair[0].month === pair[1].month ? pair[0].month : null;
    const kkeut = seotdaKkeut(pair);
    const hand: DoriHand = {
      build, pair, ddaeng, kkeut,
      name: ddaeng !== null ? ddaengName(ddaeng) : kkeutName(kkeut),
      detail: `${build.map((card) => card.month).join('+')} = ${sum} 지음 · 남은 ${pair.map((card) => card.month).join('·')}월`,
    };
    if (!best || pairScore(hand.pair) > pairScore(best.pair)) best = hand;
  }
  if (!best) return { kind: 'none', reason: '세 장으로 10의 배수를 만들 수 없습니다' };
  return { kind: 'hand', hand: best };
}

/** 1이면 a가 이김, -1이면 b가 이김, 0이면 비김. 못 지은 쪽은 무조건 집니다. */
export function compareDori(a: DoriResult, b: DoriResult) {
  if (a.kind === 'none' && b.kind === 'none') return 0;
  if (a.kind === 'none') return -1;
  if (b.kind === 'none') return 1;
  const left = pairScore(a.hand.pair);
  const right = pairScore(b.hand.pair);
  return left === right ? 0 : left > right ? 1 : -1;
}

export function dealDori(random: () => number = Math.random) {
  const deck = shuffleHwatu(createSeotdaDeck(), random);
  return { player: deck.slice(0, 5), opponent: deck.slice(5, 10), rest: deck.slice(10) };
}

export function resolveDori(player: HwatuCard[], opponent: HwatuCard[]) {
  const playerHand = evaluateDori(player);
  const opponentHand = evaluateDori(opponent);
  const compared = compareDori(playerHand, opponentHand);
  return {
    result: compared > 0 ? 'win' as const : compared < 0 ? 'loss' as const : 'push' as const,
    playerHand, opponentHand,
  };
}
