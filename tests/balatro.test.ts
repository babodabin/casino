import test from 'node:test';
import assert from 'node:assert/strict';
import {
  balatroPayout, balatroReturn, balatroScoreHand, balatroSpendCap, balatroStake,
  blindOrder, blindTargets, buyShopOffer, discardBalatroCards, leaveShop, leveledBase,
  makeBoss, playBalatroHand, playOutBalatroRun, startBalatroRun, startBlind, startingLevels,
  shopCost, targetOf, type BalatroRun,
} from '../src/balatro.ts';
import { createDeck, type Card } from '../src/blackjack.ts';

const deck = createDeck();
const card = (rank: Card['rank'], suit: Card['suit']) => {
  const found = deck.find((item) => item.rank === rank && item.suit === suit);
  if (!found) throw new Error(`${rank}${suit} 없음`);
  return found;
};

/** 같은 판이 다시 나오게 하는 난수입니다. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test('블라인드는 작은 · 큰 · 보스 세 단이고 뒤로 갈수록 목표가 크다', () => {
  assert.deepEqual(blindOrder, ['작은', '큰', '보스']);
  assert.equal(blindTargets['작은'] < blindTargets['큰'], true);
  assert.equal(blindTargets['큰'] < blindTargets['보스'], true);
});

test('족보 레벨이 오르면 기본 칩과 배수가 같이 오른다', () => {
  const levels = startingLevels();
  const first = leveledBase('원 페어', levels);
  const second = leveledBase('원 페어', { ...levels, '원 페어': 3 });
  assert.equal(second.level, 3);
  assert.equal(second.chips > first.chips, true);
  assert.equal(second.mult, first.mult + 2);
});

test('낸 족보는 한 단 오른다', () => {
  const random = seeded(7);
  const run = startBalatroRun(random);
  const pair = [card('K', '♠'), card('K', '♥')];
  const seeded1: BalatroRun = { ...run, round: { ...run.round, hand: [...pair, ...run.round.hand.slice(0, 6)] } };
  const after = playBalatroHand(seeded1, pair, random);
  assert.equal(after.levels['원 페어'], 2);
});

test('보스 조건이 실제로 점수와 판에 걸린다', () => {
  const levels = startingLevels();
  const spades = [card('K', '♠'), card('K', '♠') === card('Q', '♠') ? card('Q', '♠') : card('K', '♥')];
  // 무늬 봉인: 봉인된 무늬의 카드는 칩을 안 줍니다.
  const plain = balatroScoreHand(spades, [], levels);
  const sealed = balatroScoreHand(spades, [], levels, makeBoss('무늬봉인', '♠'));
  assert.equal(sealed.chips < plain.chips, true);
  // 배수 반토막: 기본 배수가 절반(올림)이 됩니다.
  const halved = balatroScoreHand(spades, [], levels, makeBoss('배수반'));
  assert.equal(halved.mult, Math.ceil(plain.mult / 2));
  // 버리기 금지 · 한 장 덜 · 첫 패 버림은 판을 시작할 때 걸립니다.
  assert.equal(startBlind('보스', makeBoss('버리기금지')).discardsLeft, 0);
  assert.equal(startBlind('보스', makeBoss('한장덜')).hand.length, 6);
  assert.equal(startBlind('보스', makeBoss('첫패버림')).hand.length, 8);
  // 작은 · 큰 블라인드에는 보스 조건이 안 걸립니다.
  assert.equal(startBlind('작은', makeBoss('버리기금지')).discardsLeft > 0, true);
});

test('상점은 조커 · 조커 칸 · 족보를 팔고 쓴 돈이 쌓인다', () => {
  const random = seeded(11);
  let run = startBalatroRun(random);
  // 목표를 넘겨 상점을 엽니다.
  run = { ...run, round: { ...run.round, score: targetOf(run) } };
  const pair = [card('A', '♠'), card('A', '♥')];
  run = playBalatroHand({ ...run, round: { ...run.round, hand: [...pair, ...run.round.hand.slice(0, 6)] } }, pair, random);
  assert.equal(run.phase, 'shop');
  const slot = run.shop.find((offer) => offer.kind === 'slot');
  if (slot) {
    const before = run.slots;
    run = buyShopOffer(run, slot);
    assert.equal(run.slots, before + 1);
    assert.equal(run.spent, shopCost.slot);
  }
  const back = leaveShop(run, random);
  assert.equal(back.phase, 'play');
  assert.equal(back.blindIndex, 1);
  assert.equal(back.round.score, 0);
});

test('상점에 쓸 수 있는 돈에는 한도가 있다', () => {
  const random = seeded(3);
  let run = startBalatroRun(random);
  run = { ...run, phase: 'shop', spent: balatroSpendCap, shop: [{ kind: 'level', type: '원 페어', cost: shopCost.level }] };
  assert.throws(() => buyShopOffer(run, run.shop[0]), /쓸 수 있는 돈/);
});

test('세 단을 다 깨야 돈이 나오고, 이겨도 손해 보는 일은 없다', () => {
  const random = seeded(5);
  const run = startBalatroRun(random);
  assert.equal(balatroReturn({ ...run, phase: 'lost' }), 0);
  assert.equal(balatroReturn({ ...run, phase: 'play' }), 0);
  assert.equal(balatroReturn({ ...run, phase: 'won' }), balatroPayout);
  // 상점에 한도까지 다 써도 배당이 건 돈보다 큽니다.
  assert.equal(balatroPayout > balatroStake({ ...run, spent: balatroSpendCap }), true);
});

test('버리기는 손패를 다시 채우고 횟수를 하나 줄인다', () => {
  const random = seeded(9);
  const run = startBalatroRun(random);
  const before = run.round.discardsLeft;
  const after = discardBalatroCards(run, run.round.hand.slice(0, 3));
  assert.equal(after.round.discardsLeft, before - 1);
  assert.equal(after.round.hand.length, run.round.hand.length);
});

test('환급률이 90~100% 사이에 들어온다', () => {
  const rounds = 200;
  let staked = 0;
  let paid = 0;
  for (let index = 0; index < rounds; index += 1) {
    const random = seeded(index * 7919 + 17);
    const run = playOutBalatroRun(startBalatroRun(random), random);
    staked += balatroStake(run);
    paid += balatroReturn(run);
  }
  const rate = paid / staked;
  assert.equal(rate > 0.9 && rate < 1.0, true, `환급률 ${(rate * 100).toFixed(1)}%`);
});
