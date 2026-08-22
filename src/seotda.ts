import { createHwatuDeck, shuffleHwatu, type HwatuCard } from './hwatu.ts';

/**
 * 섰다.
 *
 * 화투 48장 중 1~10월만, 월마다 두 장씩 모두 20장을 씁니다.
 * 각자 두 장을 받아 족보를 겨루고, 같은 족보면 비깁니다.
 */

export type SeotdaRules = {
  /** 땡잡이(3·7) — 상대의 땡을 이깁니다 */
  ddaengJabi: boolean;
  /** 암행어사(4·7) — 상대의 광땡을 이깁니다 */
  amhaeng: boolean;
  /** 멍텅구리구사(4·9) — 상대가 더 높으면 무효로 만들어 다시 돌립니다 */
  guSa: boolean;
};
export const DEFAULT_SEOTDA_RULES: SeotdaRules = { ddaengJabi: false, amhaeng: false, guSa: false };
export const seotdaRuleLabels: Record<keyof SeotdaRules, { title: string; detail: string }> = {
  ddaengJabi: { title: '땡잡이 (3·7)', detail: '상대가 땡이면 그 땡을 이깁니다' },
  amhaeng: { title: '암행어사 (4·7)', detail: '상대가 광땡이면 그 광땡을 이깁니다' },
  guSa: { title: '멍텅구리구사 (4·9)', detail: '상대가 더 높으면 판을 무효로 만듭니다' },
};

/** 족보. rank가 클수록 강합니다. */
export type SeotdaHand = {
  name: string;
  rank: number;
  /** 같은 이름 안에서의 서열(땡 숫자, 끗 수) */
  tier: number;
  detail: string;
  /** 특수패 표시 */
  special?: 'ddaengJabi' | 'amhaeng' | 'guSa';
};

/** 섰다에 쓰는 20장(1~10월 각 2장). 광·열끗·띠 구분은 광땡 판정에만 씁니다. */
export function createSeotdaDeck(): HwatuCard[] {
  const byMonth = new Map<number, HwatuCard[]>();
  createHwatuDeck().forEach((card) => {
    if (card.month > 10) return;
    const list = byMonth.get(card.month) ?? [];
    // 광이 있는 달은 광을 반드시 포함해야 광땡이 성립합니다.
    list.push(card);
    byMonth.set(card.month, list);
  });
  const deck: HwatuCard[] = [];
  for (let month = 1; month <= 10; month += 1) {
    const cards = byMonth.get(month) ?? [];
    const bright = cards.find((card) => card.kind === '광');
    const rest = cards.filter((card) => card !== bright);
    deck.push(...(bright ? [bright, rest[0]] : [rest[0], rest[1]]));
  }
  return deck;
}

export const seotdaKkeut = (cards: HwatuCard[]) => cards.reduce((sum, card) => sum + card.month, 0) % 10;

const RANK = {
  amhaeng: 200,
  ddaengJabi: 190,
  brightPair: 180,   // 광땡
  ddaeng: 170,       // 땡
  named: 160,        // 알리·독사·구삥·장삥·장사·세륙
  guSa: 150,
  kkeut: 100,        // 갑오(9끗) ~ 망통(0끗)
} as const;

/** 두 장짜리 조합 이름. 월 두 개를 정렬해 맞춥니다. */
const namedPairs: { months: [number, number]; name: string; tier: number }[] = [
  { months: [1, 2], name: '알리', tier: 6 },
  { months: [1, 4], name: '독사', tier: 5 },
  { months: [1, 9], name: '구삥', tier: 4 },
  { months: [1, 10], name: '장삥', tier: 3 },
  { months: [4, 10], name: '장사', tier: 2 },
  { months: [4, 6], name: '세륙', tier: 1 },
];

const kkeutName = (value: number) => (value === 9 ? '갑오' : value === 0 ? '망통' : `${value}끗`);

/** 두 장을 족보로 바꿉니다. */
export function evaluateSeotda(cards: HwatuCard[], rules: SeotdaRules = DEFAULT_SEOTDA_RULES): SeotdaHand {
  if (cards.length !== 2) throw new Error('섰다는 두 장으로 판정합니다.');
  const months = cards.map((card) => card.month).sort((a, b) => a - b) as [number, number];
  const [low, high] = months;
  const brights = cards.filter((card) => card.kind === '광').length;

  // 광땡: 두 장 모두 광이어야 합니다. 3·8이 가장 높습니다.
  if (brights === 2) {
    if (low === 3 && high === 8) return { name: '삼팔광땡', rank: RANK.brightPair, tier: 3, detail: '3광과 8광' };
    if (low === 1 && high === 3) return { name: '일삼광땡', rank: RANK.brightPair, tier: 2, detail: '1광과 3광' };
    if (low === 1 && high === 8) return { name: '일팔광땡', rank: RANK.brightPair, tier: 1, detail: '1광과 8광' };
  }

  if (low === high) return { name: `${low === 10 ? '장' : low}땡`, rank: RANK.ddaeng, tier: low, detail: `${low}월 두 장` };

  // 특수패는 제 역할을 못 하면 원래 끗으로 돌아가므로, tier에 끗을 담아 둡니다.
  const special = seotdaKkeut(cards);
  if (rules.amhaeng && low === 4 && high === 7) {
    return { name: '암행어사', rank: RANK.amhaeng, tier: special, detail: '상대가 광땡이면 이깁니다', special: 'amhaeng' };
  }
  if (rules.ddaengJabi && low === 3 && high === 7) {
    return { name: '땡잡이', rank: RANK.ddaengJabi, tier: special, detail: '상대가 땡이면 이깁니다', special: 'ddaengJabi' };
  }
  if (rules.guSa && low === 4 && high === 9) {
    return { name: '멍텅구리구사', rank: RANK.guSa, tier: special, detail: '상대가 더 높으면 판이 무효가 됩니다', special: 'guSa' };
  }

  const named = namedPairs.find((pair) => pair.months[0] === low && pair.months[1] === high);
  if (named) return { name: named.name, rank: RANK.named, tier: named.tier, detail: `${low}월과 ${high}월` };

  const value = seotdaKkeut(cards);
  return { name: kkeutName(value), rank: RANK.kkeut, tier: value, detail: `${low}월 + ${high}월 = ${value}끗` };
}

/** 두 족보를 비교합니다. 1이면 a가 이김, -1이면 b가 이김, 0이면 비김. */
export function compareSeotda(a: SeotdaHand, b: SeotdaHand) {
  // 특수패는 상대가 무엇이냐에 따라 결과가 달라집니다.
  if (a.special === 'amhaeng' && b.rank === RANK.brightPair) return 1;
  if (b.special === 'amhaeng' && a.rank === RANK.brightPair) return -1;
  if (a.special === 'ddaengJabi' && b.rank === RANK.ddaeng) return 1;
  if (b.special === 'ddaengJabi' && a.rank === RANK.ddaeng) return -1;
  // 특수패가 제 역할을 못 하면 원래 끗수로 겨룹니다(tier에 끗이 들어 있습니다).
  const rankOf = (hand: SeotdaHand) => (hand.special ? RANK.kkeut : hand.rank);
  if (rankOf(a) !== rankOf(b)) return rankOf(a) > rankOf(b) ? 1 : -1;
  if (a.tier !== b.tier) return a.tier > b.tier ? 1 : -1;
  return 0;
}

export type SeotdaResult = {
  result: 'win' | 'loss' | 'push';
  /** 멍텅구리구사로 판이 무효가 된 경우 */
  voided: boolean;
  playerHand: SeotdaHand;
  opponentHand: SeotdaHand;
};

export function resolveSeotda(player: HwatuCard[], opponent: HwatuCard[], rules: SeotdaRules = DEFAULT_SEOTDA_RULES): SeotdaResult {
  const playerHand = evaluateSeotda(player, rules);
  const opponentHand = evaluateSeotda(opponent, rules);
  const compared = compareSeotda(playerHand, opponentHand);
  // 구사는 자기가 지고 있을 때만 판을 무효로 만듭니다.
  const voided = (playerHand.special === 'guSa' && compared < 0) || (opponentHand.special === 'guSa' && compared > 0);
  if (voided) return { result: 'push', voided: true, playerHand, opponentHand };
  return { result: compared > 0 ? 'win' : compared < 0 ? 'loss' : 'push', voided: false, playerHand, opponentHand };
}

export function dealSeotda(random: () => number = Math.random) {
  const deck = shuffleHwatu(createSeotdaDeck(), random);
  return { player: deck.slice(0, 2), opponent: deck.slice(2, 4), rest: deck.slice(4) };
}
