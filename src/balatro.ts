// 발라트로 하드 — 블라인드 세 단을 이어서 깨는 긴 판입니다.
//
// 이지(지금 조커 포커)는 한 판에 낼 기회 세 번으로 목표 하나를 넘기면 끝입니다.
// 하드는 **작은 · 큰 · 보스** 세 단을 모두 깨야 정산합니다. 단마다 목표가 다르고,
// 단 사이에는 상점이 열려 조커를 사거나 조커 칸을 늘리거나 족보를 키울 수 있습니다.
//
// ⚠️ **상점은 진짜 WC를 씁니다.** 그래서 한 판에 거는 돈이 도중에 늘어납니다.
// **배당은 처음 베팅에만 곱합니다.** 상점에서 쓴 돈은 배당에 안 들어가고 더 좋은 기회를 사는 값입니다.
// (건 돈 전체에 곱하면 무조건 사는 게 이득이 됩니다 — 맨 아래 배당 주석에 왜인지 적었습니다.)
// 이 때문에 이지의 배당표를 그대로 쓸 수 없어 시뮬레이션으로 다시 쟀습니다(맨 아래).
//
// 안 넣은 것: 타로 카드 · 바우처 · 덱 종류. 진짜 발라트로만큼은 안 갑니다.

import { createDeck, shuffleDeck, type Card } from './blackjack.ts';
import {
  cardChips, handBase, jokers, scoreHandType,
  type JokerHandType, type JokerId, type JokerScore,
} from './jokerpoker.ts';

export type BlindKind = '작은' | '큰' | '보스';
export const blindOrder: BlindKind[] = ['작은', '큰', '보스'];

/** 블라인드마다 넘겨야 하는 점수. 시뮬레이션으로 맞춘 값입니다(맨 아래 주석). */
export const blindTargets: Record<BlindKind, number> = { '작은': 2200, '큰': 3400, '보스': 4800 };

export const balatroHandSize = 8;
export const balatroPlays = 4;
export const balatroDiscards = 3;
export const balatroJokerSlots = 3;
export const balatroMaxJokerSlots = 5;

/** 족보 레벨이 한 단 오를 때 붙는 값. 칩은 기본의 절반, 배수는 +1입니다. */
export const levelChipStep = (type: JokerHandType) => Math.round(handBase[type].chips * 0.5);
export const levelMultStep = 1;

export type HandLevels = Record<JokerHandType, number>;
export const startingLevels = (): HandLevels => ({
  '하이 카드': 1, '원 페어': 1, '투 페어': 1, '트리플': 1,
  '스트레이트': 1, '플러시': 1, '풀하우스': 1, '포카드': 1, '스트레이트 플러시': 1,
});

/** 그 족보가 지금 레벨에서 주는 기본 칩과 배수입니다. */
export function leveledBase(type: JokerHandType, levels: HandLevels) {
  const level = Math.max(1, levels[type] ?? 1);
  const base = handBase[type];
  return { level, chips: base.chips + (level - 1) * levelChipStep(type), mult: base.mult + (level - 1) * levelMultStep };
}

// ── 보스 조건 ────────────────────────────────────────────────────────
// 보스 블라인드에만 붙습니다. **판을 시작할 때 미리 보여 줍니다** —
// 무엇이 막히는지 알아야 조커와 버리기를 거기에 맞출 수 있습니다.

export type BossId = '무늬봉인' | '버리기금지' | '한장덜' | '배수반' | '첫패버림';
export type Boss = { id: BossId; name: string; text: string; suit?: Card['suit'] };

const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];

export function makeBoss(id: BossId, suit?: Card['suit']): Boss {
  if (id === '무늬봉인') {
    const sealed = suit ?? '♠';
    return { id, name: `${sealed} 봉인`, text: `${sealed} 카드는 칩을 한 개도 안 줍니다`, suit: sealed };
  }
  if (id === '버리기금지') return { id, name: '버리기 금지', text: '이 판에서는 카드를 못 버립니다' };
  if (id === '한장덜') return { id, name: '한 장 덜', text: '손패가 여덟 장이 아니라 여섯 장입니다' };
  if (id === '배수반') return { id, name: '배수 반토막', text: '족보 기본 배수가 절반이 됩니다(올림)' };
  return { id, name: '첫 패 버림', text: '시작할 때 두 장이 버려진 채로 옵니다' };
}

export const bossIds: BossId[] = ['무늬봉인', '버리기금지', '한장덜', '배수반', '첫패버림'];

export function drawBoss(random: () => number = Math.random): Boss {
  const id = bossIds[Math.floor(random() * bossIds.length)] ?? '무늬봉인';
  return makeBoss(id, suits[Math.floor(random() * suits.length)] ?? '♠');
}

// ── 점수 ─────────────────────────────────────────────────────────────

export type BalatroScore = { score: number; chips: number; mult: number; hand: JokerScore; level: number };

/**
 * 낸 패의 점수. 이지와 다른 곳은 **족보 레벨**과 **보스 조건**입니다.
 * 순서는 발라트로와 같습니다 — 족보 기본값 → 카드 칩 → 조커.
 */
export function balatroScoreHand(cards: Card[], held: JokerId[], levels: HandLevels, boss?: Boss): BalatroScore {
  const hand = scoreHandType(cards);
  const base = leveledBase(hand.type, levels);
  // 봉인된 무늬는 칩을 안 줍니다. 족보에는 그대로 들어갑니다 — 스트레이트가 깨지면 너무 셉니다.
  const sealed = boss?.id === '무늬봉인' ? boss.suit : undefined;
  let chips = base.chips + hand.scoring.reduce((sum, card) => sum + (card.suit === sealed ? 0 : cardChips(card)), 0);
  let mult = boss?.id === '배수반' ? Math.ceil(base.mult / 2) : base.mult;
  const sameRank = new Set(cards.map((card) => card.rank)).size < cards.length;
  const sameSuit = cards.length > 1 && new Set(cards.map((card) => card.suit)).size === 1;
  // 짝수는 이지와 같게 셉니다 — A는 11이 아니라 **14로 쳐서 짝수**입니다(`rankValue`).
  const even = (card: Card) => ['2', '4', '6', '8', '10', 'Q', 'A'].includes(card.rank);
  for (const id of held) {
    if (id === '광대') mult += 4;
    else if (id === '계산가') chips += 40;
    else if (id === '막내') chips += hand.scoring.length * 12;
    else if (id === '쌍둥이') { if (sameRank) mult *= 2; }
    else if (id === '무늬꾼') { if (sameSuit) mult *= 3; }
    else if (id === '짝수쟁이') mult += hand.scoring.filter(even).length * 2;
    else if (id === '홀수쟁이') mult += hand.scoring.filter((card) => !even(card)).length * 2;
    else if (id === '욕심쟁이') mult += hand.scoring.filter((card) => card.suit === '♦').length * 3;
  }
  return { score: Math.round(chips * mult), chips, mult, hand, level: base.level };
}

// ── 한 블라인드 ──────────────────────────────────────────────────────

export type BalatroRound = {
  deck: Card[];
  hand: Card[];
  playsLeft: number;
  discardsLeft: number;
  score: number;
  log: { type: JokerHandType; chips: number; mult: number; score: number }[];
};

const handSizeFor = (boss?: Boss) => (boss?.id === '한장덜' ? 6 : balatroHandSize);

export function startBlind(blind: BlindKind, boss: Boss, random: () => number = Math.random): BalatroRound {
  const withBoss = blind === '보스' ? boss : undefined;
  const size = handSizeFor(withBoss);
  const deck = shuffleDeck(createDeck(), random);
  // 첫 패 버림: 두 장이 이미 버려진 채로 옵니다. 손패는 그대로 채워집니다.
  const skip = withBoss?.id === '첫패버림' ? 2 : 0;
  return {
    deck: deck.slice(size + skip),
    hand: deck.slice(skip, size + skip),
    playsLeft: balatroPlays,
    discardsLeft: withBoss?.id === '버리기금지' ? 0 : balatroDiscards,
    score: 0,
    log: [],
  };
}

const refill = (round: BalatroRound, kept: Card[], size: number) => {
  const need = size - kept.length;
  return { hand: [...kept, ...round.deck.slice(0, need)], deck: round.deck.slice(need) };
};

// ── 한 판 전체 ───────────────────────────────────────────────────────

export type ShopOffer =
  | { kind: 'joker'; id: JokerId; cost: number }
  | { kind: 'slot'; cost: number }
  | { kind: 'level'; type: JokerHandType; cost: number };

/** 상점 값. **베팅 한 판 값의 몇 배**인지로 적습니다(진짜 WC는 화면에서 곱합니다). */
export const shopCost = { joker: 0.08, slot: 0.16, level: 0.07 } as const;

/**
 * 한 판에 상점에서 쓸 수 있는 돈의 한도. **베팅 한 판 값만큼**까지입니다.
 * ⚠️ 한도가 없으면 한 판에 거는 돈이 네 배까지 불어납니다. 얼마를 걸고 있는지
 * 모르게 되는 것이 제일 나쁩니다. 그래서 처음 베팅 + 상점 = **최대 두 배**로 묶었습니다.
 */
export const balatroSpendCap = 0.6;

export type BalatroRun = {
  blindIndex: number;
  boss: Boss;
  levels: HandLevels;
  held: JokerId[];
  slots: number;
  /** 상점에서 쓴 돈. 베팅 한 판 값의 몇 배인지입니다. */
  spent: number;
  round: BalatroRound;
  shop: ShopOffer[];
  phase: 'play' | 'shop' | 'won' | 'lost';
};

export const blindOf = (run: BalatroRun): BlindKind => blindOrder[Math.min(run.blindIndex, 2)];
export const targetOf = (run: BalatroRun): number => blindTargets[blindOf(run)];
/** 지금 블라인드에 걸린 보스. 보스 블라인드가 아니면 없습니다. */
export const bossOf = (run: BalatroRun): Boss | undefined => (blindOf(run) === '보스' ? run.boss : undefined);

export function drawShop(run: BalatroRun, random: () => number = Math.random): ShopOffer[] {
  const offers: ShopOffer[] = [];
  const missing = jokers.map((joker) => joker.id).filter((id) => !run.held.includes(id));
  if (missing.length) offers.push({ kind: 'joker', id: missing[Math.floor(random() * missing.length)], cost: shopCost.joker });
  if (run.slots < balatroMaxJokerSlots) offers.push({ kind: 'slot', cost: shopCost.slot });
  // 족보는 **써 본 것 중에서** 올려 줍니다. 안 쓰는 족보를 올려 봐야 소용이 없습니다.
  const used = run.round.log.map((entry) => entry.type);
  const pool = used.length ? used : (['원 페어', '투 페어', '트리플'] as JokerHandType[]);
  offers.push({ kind: 'level', type: pool[Math.floor(random() * pool.length)], cost: shopCost.level });
  return offers;
}

export function startBalatroRun(random: () => number = Math.random): BalatroRun {
  const boss = drawBoss(random);
  const held = shuffledJokers(random).slice(0, balatroJokerSlots);
  return {
    blindIndex: 0, boss, levels: startingLevels(), held, slots: balatroJokerSlots,
    spent: 0, round: startBlind('작은', boss, random), shop: [], phase: 'play',
  };
}

function shuffledJokers(random: () => number): JokerId[] {
  const pool = jokers.map((joker) => joker.id);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool;
}

/** 패를 냅니다. 목표를 넘기면 곧바로 다음 단으로 넘어갑니다. */
export function playBalatroHand(run: BalatroRun, cards: Card[], random: () => number = Math.random): BalatroRun {
  if (run.phase !== 'play') throw new Error('지금은 낼 수 없습니다.');
  if (run.round.playsLeft <= 0) throw new Error('더 낼 수 없습니다.');
  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== cards.length || !cards.every((card) => run.round.hand.some((item) => item.id === card.id))) throw new Error('손에 없는 카드는 낼 수 없습니다.');
  const boss = bossOf(run);
  const result = balatroScoreHand(cards, run.held, run.levels, boss);
  const size = handSizeFor(boss);
  const kept = run.round.hand.filter((card) => !ids.has(card.id));
  const { hand, deck } = refill(run.round, kept, size);
  // 낸 족보는 한 단 오릅니다. 같은 족보를 쓸수록 세집니다.
  const levels = { ...run.levels, [result.hand.type]: (run.levels[result.hand.type] ?? 1) + 1 };
  const round: BalatroRound = {
    ...run.round, hand, deck,
    playsLeft: run.round.playsLeft - 1,
    score: run.round.score + result.score,
    log: [...run.round.log, { type: result.hand.type, chips: result.chips, mult: result.mult, score: result.score }],
  };
  const next: BalatroRun = { ...run, levels, round };
  if (round.score >= targetOf(run)) return advanceBlind(next, random);
  if (round.playsLeft <= 0) return { ...next, phase: 'lost' };
  return next;
}

export function discardBalatroCards(run: BalatroRun, cards: Card[]): BalatroRun {
  if (run.phase !== 'play') throw new Error('지금은 버릴 수 없습니다.');
  if (run.round.discardsLeft <= 0) throw new Error('더 버릴 수 없습니다.');
  if (cards.length === 0 || cards.length > 5) throw new Error('한 장에서 다섯 장까지 버릴 수 있습니다.');
  const ids = new Set(cards.map((card) => card.id));
  if (!cards.every((card) => run.round.hand.some((item) => item.id === card.id))) throw new Error('손에 없는 카드는 버릴 수 없습니다.');
  const size = handSizeFor(bossOf(run));
  const kept = run.round.hand.filter((card) => !ids.has(card.id));
  const { hand, deck } = refill(run.round, kept, size);
  return { ...run, round: { ...run.round, hand, deck, discardsLeft: run.round.discardsLeft - 1 } };
}

/** 한 단을 깼습니다. 보스까지 깼으면 이긴 것이고, 아니면 상점이 열립니다. */
function advanceBlind(run: BalatroRun, random: () => number): BalatroRun {
  if (run.blindIndex >= 2) return { ...run, phase: 'won' };
  const shop = drawShop(run, random);
  return { ...run, phase: 'shop', shop };
}

export function buyShopOffer(run: BalatroRun, offer: ShopOffer): BalatroRun {
  if (run.phase !== 'shop') throw new Error('상점이 열려 있지 않습니다.');
  if (!run.shop.some((item) => sameOffer(item, offer))) throw new Error('상점에 없는 물건입니다.');
  if (run.spent + offer.cost > balatroSpendCap + 1e-9) throw new Error('이 판에서 상점에 쓸 수 있는 돈을 다 썼습니다.');
  if (offer.kind === 'joker') {
    if (run.held.length >= run.slots) throw new Error('조커 칸이 꽉 찼습니다.');
    return { ...run, held: [...run.held, offer.id], spent: run.spent + offer.cost, shop: run.shop.filter((item) => !sameOffer(item, offer)) };
  }
  if (offer.kind === 'slot') {
    if (run.slots >= balatroMaxJokerSlots) throw new Error('조커 칸을 더 늘릴 수 없습니다.');
    return { ...run, slots: run.slots + 1, spent: run.spent + offer.cost, shop: run.shop.filter((item) => !sameOffer(item, offer)) };
  }
  const levels = { ...run.levels, [offer.type]: (run.levels[offer.type] ?? 1) + 1 };
  return { ...run, levels, spent: run.spent + offer.cost, shop: run.shop.filter((item) => !sameOffer(item, offer)) };
}

const sameOffer = (left: ShopOffer, right: ShopOffer) =>
  left.kind === right.kind
  && (left.kind !== 'joker' || right.kind !== 'joker' || left.id === right.id)
  && (left.kind !== 'level' || right.kind !== 'level' || left.type === right.type);

/** 상점을 닫고 다음 단을 시작합니다. */
export function leaveShop(run: BalatroRun, random: () => number = Math.random): BalatroRun {
  if (run.phase !== 'shop') throw new Error('상점이 열려 있지 않습니다.');
  const blindIndex = run.blindIndex + 1;
  const blind = blindOrder[blindIndex];
  return { ...run, blindIndex, shop: [], phase: 'play', round: startBlind(blind, run.boss, random) };
}

// ── 배당 ─────────────────────────────────────────────────────────────
//
// ⚠️ **이지의 사다리를 쓰면 안 됩니다.** 하드는 세 단을 다 깨야 돈이 나오고,
// 상점에서 진짜 WC를 더 겁니다. scripts/balatro-rtp.ts 로 6,000판씩 재서 맞췄습니다.
//
// **배당은 처음 베팅에만 곱합니다.** 상점에서 쓴 돈은 배당에 안 들어갑니다 —
// 더 좋은 기회를 사는 값입니다.
// ⚠️ 건 돈 전체에 곱하면 **상점에서 쓸수록 상금도 같이 커져** 무조건 사는 게 이득이 됩니다.
// 처음에 그렇게 짰다가 사는 사람 105% · 안 사는 사람 75%로 갈라져서 고쳤습니다.
//
// 값은 사는 사람과 안 사는 사람의 환급률이 **같아지게** 맞췄습니다.
//   다 사는 사람 : 세 단 다 깸 66.1% · 상점 평균 0.463배 · 환급률 95.3%
//   안 사는 사람 : 세 단 다 깸 44.9% · 상점 0배 · 환급률 94.6%
// 상점 값(0.08 · 0.16 · 0.07)이 이 균형을 만듭니다. **값을 바꾸면 둘이 갈라집니다** —
// 바꾸면 스크립트를 다시 돌려 배당을 다시 재세요.
//
// ⚠️ 이겨도 손해 보는 일은 없습니다 — 상점에 한도(0.6배)까지 다 써도 건 돈이 1.6배인데
// 배당이 2.08배입니다.
export const balatroPayout = 2.08;

/** 이 판에 실제로 건 돈(베팅 한 판 값의 몇 배). 처음 1 + 상점에서 쓴 것입니다. */
export const balatroStake = (run: BalatroRun): number => 1 + run.spent;

/** 세 단을 다 깨면 건 돈 전체에 배당을 곱해 돌려받습니다. 못 깨면 0입니다. */
export function balatroReturn(run: BalatroRun): number {
  return run.phase === 'won' ? balatroPayout : 0;
}

// ── 컴퓨터가 끝까지 두는 방식 (환급률을 잴 때 씁니다) ────────────────

/** 이 점수에 못 미치면 버리고 다시 봅니다. 단이 올라갈수록 눈을 높입니다. */
export const balatroDiscardBelow = (blind: BlindKind) => (blind === '작은' ? 600 : blind === '큰' ? 800 : 1000);

export function bestBalatroPlay(hand: Card[], held: JokerId[], levels: HandLevels, boss?: Boss) {
  let best: { cards: Card[]; score: number } = { cards: [hand[0]], score: 0 };
  const walk = (start: number, picked: Card[]) => {
    if (picked.length > 0) {
      const score = balatroScoreHand(picked, held, levels, boss).score;
      if (score > best.score) best = { cards: [...picked], score };
    }
    if (picked.length === 5) return;
    for (let index = start; index < hand.length; index += 1) walk(index + 1, [...picked, hand[index]]);
  };
  walk(0, []);
  return best;
}

/** 컴퓨터가 한 판(세 단)을 끝까지 두는 방식입니다. */
export function playOutBalatroRun(start: BalatroRun, random: () => number = Math.random): BalatroRun {
  let run = start;
  let guard = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && guard < 60) {
    guard += 1;
    if (run.phase === 'shop') {
      // 조커 → 칸 → 족보 순으로, 살 수 있으면 삽니다. 안 사면 다음 단이 그만큼 어렵습니다.
      let shopped = run;
      for (const offer of run.shop) {
        try { shopped = buyShopOffer(shopped, offer); } catch { /* 못 사면 넘어갑니다 */ }
      }
      run = leaveShop(shopped, random);
      continue;
    }
    const boss = bossOf(run);
    const best = bestBalatroPlay(run.round.hand, run.held, run.levels, boss);
    const need = targetOf(run) - run.round.score;
    // 남은 낼 기회로 목표를 채울 만한지 보고, 시원찮으면 버리고 다시 봅니다.
    const enough = best.score >= need || best.score >= balatroDiscardBelow(blindOf(run));
    if (run.round.discardsLeft > 0 && !enough) {
      const keep = new Set(best.cards.map((card) => card.id));
      const trash = run.round.hand.filter((card) => !keep.has(card.id)).slice(0, 5);
      if (trash.length > 0) { run = discardBalatroCards(run, trash); continue; }
    }
    run = playBalatroHand(run, best.cards, random);
  }
  return run;
}
