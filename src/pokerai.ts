import { createDeck, type Card } from './blackjack.ts';
import { compareHands, evaluateFive, evaluateHoldem, evaluateOmaha, type PokerHand } from './texasholdem.ts';
import { evaluateLow, compareLow } from './highlow.ts';
import { opponentKeepCards } from './fivecarddraw.ts';
import { type HwatuCard } from './hwatu.ts';
import { compareSeotda, createSeotdaDeck, evaluateSeotda, type SeotdaRules } from './seotda.ts';
import { compareDori, evaluateDori } from './dorijitgottaeng.ts';

/**
 * 컴퓨터 상대의 베팅 판단.
 *
 * 두 단계로 나뉩니다.
 *  1) 지금 손이 이길 확률(에퀴티)을 몬테카를로로 추정합니다.
 *  2) 그 확률과 팟 오즈를 비교해 폴드·체크·콜·레이즈를 고릅니다.
 *
 * 확률을 실제로 계산하기 때문에 "항상 콜"이 아니라 좋은 패는 올리고
 * 나쁜 패는 접습니다.
 */

export type PokerAction =
  | { kind: 'fold' }
  | { kind: 'check' }
  | { kind: 'call'; amount: number }
  | { kind: 'raise'; amount: number };

export type PokerVariant = 'holdem' | 'omaha' | 'seven' | 'draw' | 'highlow';

/** 이미 보이는 카드를 뺀 남은 덱. id로 비교합니다. */
export function remainingDeck(used: Card[]): Card[] {
  const seen = new Set(used.map((card) => card.id));
  return createDeck().filter((card) => !seen.has(card.id));
}

function pickWithout(deck: Card[], count: number, random: () => number): Card[] {
  // 덱을 통째로 섞지 않고 필요한 만큼만 뽑습니다(판마다 수백 번 부르기 때문).
  const copy = [...deck];
  const picked: Card[] = [];
  for (let index = 0; index < count && copy.length > 0; index += 1) {
    const at = Math.floor(random() * copy.length);
    picked.push(copy[at]);
    copy[at] = copy[copy.length - 1];
    copy.pop();
  }
  return picked;
}

const bestOfSeven = (cards: Card[]): PokerHand => {
  if (cards.length === 5) return evaluateFive(cards);
  if (cards.length === 7) return evaluateHoldem(cards);
  // 6장 이하/8장 이상은 5장 조합을 직접 비교합니다.
  let best: PokerHand | null = null;
  const choose = (start: number, picked: Card[]) => {
    if (picked.length === 5) { const hand = evaluateFive(picked); if (!best || compareHands(hand, best) > 0) best = hand; return; }
    for (let index = start; index < cards.length; index += 1) choose(index + 1, [...picked, cards[index]]);
  };
  choose(0, []);
  return best!;
};

/**
 * 내 손이 이길 확률. 상대 손은 모르는 것으로 두고 남은 덱에서 무작위로 채워 봅니다.
 * 무승부는 0.5판으로 셉니다.
 */
export function estimateEquity(args: {
  variant: PokerVariant;
  /** 내 개인 카드 */
  hole: Card[];
  /** 공용 카드(홀덤·오마하). 세븐포커·드로우는 빈 배열 */
  community?: Card[];
  /** 상대가 이미 보여 준 카드(세븐포커의 공개 카드 등) */
  opponentKnown?: Card[];
  /** 상대가 받게 될 카드 수(내가 못 본 것) */
  opponentHidden: number;
  /** 내가 앞으로 더 받게 될 카드 수(세븐 포커·하이로우처럼 개인 카드가 더 오는 경우) */
  holeToCome?: number;
  /** 앞으로 더 열릴 공용 카드 수 */
  communityToCome?: number;
  trials?: number;
  random?: () => number;
}): number {
  const random = args.random ?? Math.random;
  const community = args.community ?? [];
  const opponentKnown = args.opponentKnown ?? [];
  const communityToCome = args.communityToCome ?? 0;
  const holeToCome = args.holeToCome ?? 0;
  const trials = Math.max(1, args.trials ?? 240);
  const deck = remainingDeck([...args.hole, ...community, ...opponentKnown]);

  let score = 0;
  for (let trial = 0; trial < trials; trial += 1) {
    const drawn = pickWithout(deck, args.opponentHidden + holeToCome + communityToCome, random);
    const opponentHole = [...opponentKnown, ...drawn.slice(0, args.opponentHidden)];
    const myHole = [...args.hole, ...drawn.slice(args.opponentHidden, args.opponentHidden + holeToCome)];
    const board = [...community, ...drawn.slice(args.opponentHidden + holeToCome)];

    let mine: PokerHand;
    let theirs: PokerHand;
    if (args.variant === 'omaha') {
      mine = evaluateOmaha(myHole, board);
      theirs = evaluateOmaha(opponentHole, board);
    } else {
      mine = bestOfSeven([...myHole, ...board]);
      theirs = bestOfSeven([...opponentHole, ...board]);
    }

    if (args.variant === 'highlow') {
      // 하이로우는 팟을 절반씩 나누므로 하이와 로우를 각각 세어 평균을 냅니다.
      const myLow = evaluateLow([...myHole, ...board]);
      const theirLow = evaluateLow([...opponentHole, ...board]);
      const high = compareHands(mine, theirs);
      const highShare = high > 0 ? 1 : high < 0 ? 0 : 0.5;
      const lowShare = myLow && theirLow ? (compareLow(myLow, theirLow) < 0 ? 1 : compareLow(myLow, theirLow) > 0 ? 0 : 0.5)
        : myLow ? 1 : theirLow ? 0 : highShare;
      score += (highShare + lowShare) / 2;
      continue;
    }

    const compared = compareHands(mine, theirs);
    score += compared > 0 ? 1 : compared < 0 ? 0 : 0.5;
  }
  return score / trials;
}

/** 콜에 필요한 금액 대비 팟의 크기. 이 값보다 승률이 높아야 콜이 이득입니다. */
export function potOdds(toCall: number, pot: number) {
  if (toCall <= 0) return 0;
  return toCall / (pot + toCall);
}

export type PokerPolicyArgs = {
  /** 0~1. estimateEquity 결과 */
  equity: number;
  /** 콜하려면 더 넣어야 하는 금액. 0이면 체크 가능 */
  toCall: number;
  /** 지금까지 쌓인 팟(양쪽 합계) */
  pot: number;
  /** 레이즈 한 번의 크기 */
  raiseSize: number;
  /** 레이즈할 코인이 남아 있고 이번 라운드 레이즈 한도도 남았는지 */
  canRaise: boolean;
  /** 0부터 시작하는 라운드 번호. 뒤로 갈수록 과감해집니다 */
  street: number;
  random?: () => number;
};

/**
 * 팟 오즈 기반 판단.
 *  - 승률이 팟 오즈보다 확실히 낮으면 폴드
 *  - 확실히 높으면 레이즈
 *  - 그 사이면 콜/체크
 * 낮은 확률로 블러프를 섞어 매번 같은 선택만 하지 않게 합니다.
 */
export function decidePokerAction(args: PokerPolicyArgs): PokerAction {
  const random = args.random ?? Math.random;
  const { equity, toCall, pot, raiseSize, canRaise } = args;
  const odds = potOdds(toCall, pot);
  // 라운드가 뒤로 갈수록 정보가 많아져 강한 손을 더 밀어붙입니다.
  const raiseLine = Math.max(0.58, 0.72 - args.street * 0.03);

  if (toCall <= 0) {
    if (canRaise && equity >= raiseLine && random() < 0.55 + (equity - raiseLine)) return { kind: 'raise', amount: raiseSize };
    // 약한 손으로도 가끔 걸어 봅니다(세미 블러프).
    if (canRaise && equity < 0.35 && random() < 0.08) return { kind: 'raise', amount: raiseSize };
    return { kind: 'check' };
  }

  // 콜 금액이 팟에 비해 아주 작으면 조금 더 관대하게 봅니다.
  const tolerance = toCall <= pot * 0.12 ? 0.06 : 0.02;
  if (equity + tolerance < odds) {
    // 아주 싼 콜은 가끔 받아 줍니다.
    if (toCall <= pot * 0.1 && random() < 0.25) return { kind: 'call', amount: toCall };
    return { kind: 'fold' };
  }
  if (canRaise && equity >= raiseLine + 0.05 && random() < 0.5) return { kind: 'raise', amount: raiseSize };
  return { kind: 'call', amount: toCall };
}

/** 화면에 그대로 쓸 수 있는 한국어 문구. */
export function pokerActionLabel(action: PokerAction) {
  if (action.kind === 'fold') return '폴드';
  if (action.kind === 'check') return '체크';
  if (action.kind === 'call') return `콜 ${action.amount.toLocaleString()} WC`;
  return `레이즈 +${action.amount.toLocaleString()} WC`;
}

/**
 * 파이브 카드 드로우에서 "상대가 몇 장을 바꿨는지"까지 반영한 승률.
 *
 * 교환 장수는 공짜로 얻는 정보입니다. 적게 바꿨다는 건 이미 뭔가 맞았다는 뜻이라
 * 그냥 무작위 5장과 비교하면 상대를 과소평가하게 됩니다.
 *
 * 그래서 상대 손을 만들 때, 무작위 5장을 뽑아 보고 그 손이라면 몇 장을 바꿨을지
 * 계산한 뒤 실제 교환 장수와 다르면 버립니다(기각 표본). 상대가 합리적으로
 * 교환한다는 가정 위에서만 성립하는 추정이고, 표본을 못 채우면 조건 없이 계산한
 * 값으로 돌아갑니다.
 */
export function estimateDrawEquity(args: {
  /** 내 5장(교환까지 끝난 손) */
  hole: Card[];
  /** 상대가 바꾼 장수. 모르면 undefined */
  opponentDrawCount?: number;
  trials?: number;
  random?: () => number;
}): number {
  const random = args.random ?? Math.random;
  const trials = Math.max(1, args.trials ?? 220);
  const deck = remainingDeck(args.hole);
  const mine = evaluateFive(args.hole);

  let score = 0;
  let counted = 0;
  // 기각이 이어져도 무한정 돌지 않도록 시도 횟수를 묶어 둡니다.
  const maxAttempts = trials * 12;
  for (let attempt = 0; attempt < maxAttempts && counted < trials; attempt += 1) {
    const before = pickWithout(deck, 5, random);
    let after = before;
    if (args.opponentDrawCount !== undefined) {
      const keep = opponentKeepCards(before);
      const exchanged = keep.filter((value) => !value).length;
      if (exchanged !== args.opponentDrawCount) continue;
      const replacements = pickWithout(remainingDeck([...args.hole, ...before]), exchanged, random);
      let next = 0;
      after = before.map((card, index) => keep[index] ? card : replacements[next++]);
    }
    const compared = compareHands(mine, evaluateFive(after));
    score += compared > 0 ? 1 : compared < 0 ? 0 : 0.5;
    counted += 1;
  }
  // 조건에 맞는 표본을 하나도 못 모으면 교환 장수를 무시하고 다시 계산합니다.
  if (counted === 0) return estimateDrawEquity({ hole: args.hole, trials, random });
  return score / counted;
}

/**
 * 섰다에서 내 두 장이 이길 확률.
 *
 * 상대 두 장은 남은 18장에서 나올 수 있는 조합을 전부 세어 계산합니다.
 * 경우의 수가 153가지뿐이라 무작위 시뮬레이션이 아니라 완전 탐색입니다.
 */
export function seotdaEquity(mine: HwatuCard[], rules: SeotdaRules): number {
  const seen = new Set(mine.map((card) => card.id));
  const rest = createSeotdaDeck().filter((card) => !seen.has(card.id));
  const myHand = evaluateSeotda(mine, rules);
  let score = 0;
  let count = 0;
  for (let a = 0; a < rest.length; a += 1) {
    for (let b = a + 1; b < rest.length; b += 1) {
      const theirs = evaluateSeotda([rest[a], rest[b]], rules);
      const compared = compareSeotda(myHand, theirs);
      // 구사로 무효가 되는 판은 비긴 것으로 셉니다.
      const voided = (myHand.special === 'guSa' && compared < 0) || (theirs.special === 'guSa' && compared > 0);
      score += voided ? 0.5 : compared > 0 ? 1 : compared < 0 ? 0 : 0.5;
      count += 1;
    }
  }
  return count === 0 ? 0.5 : score / count;
}

/**
 * 도리짓고땡에서 내 다섯 장이 이길 확률.
 *
 * 남은 15장에서 상대가 받을 다섯 장을 고르는 경우가 3,003가지뿐이라
 * 무작위 시뮬레이션 없이 전부 세어 계산합니다.
 */
export function doriEquity(mine: HwatuCard[]): number {
  const seen = new Set(mine.map((card) => card.id));
  const rest = createSeotdaDeck().filter((card) => !seen.has(card.id));
  const myHand = evaluateDori(mine);
  let score = 0;
  let count = 0;
  const pick = (start: number, chosen: HwatuCard[]) => {
    if (chosen.length === 5) {
      const compared = compareDori(myHand, evaluateDori(chosen));
      score += compared > 0 ? 1 : compared < 0 ? 0 : 0.5;
      count += 1;
      return;
    }
    // 남은 자리보다 카드가 모자라면 더 볼 필요가 없습니다.
    for (let index = start; index <= rest.length - (5 - chosen.length); index += 1) {
      chosen.push(rest[index]);
      pick(index + 1, chosen);
      chosen.pop();
    }
  };
  pick(0, []);
  return count === 0 ? 0.5 : score / count;
}
