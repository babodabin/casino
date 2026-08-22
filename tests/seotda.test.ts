import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeotdaDeck, compareSeotda, dealSeotda, evaluateSeotda, resolveSeotda, seotdaKkeut, DEFAULT_SEOTDA_RULES, type SeotdaRules } from '../src/seotda.ts';
import { type HwatuCard } from '../src/hwatu.ts';

const deck = createSeotdaDeck();
/** 월로 카드를 고릅니다. bright=true면 그 달의 광을 고릅니다. */
const pick = (month: number, bright = false): HwatuCard => {
  const cards = deck.filter((card) => card.month === month);
  const found = bright ? cards.find((card) => card.kind === '광') : cards.find((card) => card.kind !== '광') ?? cards[0];
  if (!found) throw new Error(`${month}월 카드를 찾지 못했습니다 (광=${bright})`);
  return found;
};
const hand = (a: number, b: number, brights: [boolean, boolean] = [false, false]) => [pick(a, brights[0]), pick(b, brights[1])];
const all: SeotdaRules = { ddaengJabi: true, amhaeng: true, guSa: true };

test('섰다 덱은 1~10월 각 두 장, 모두 20장이다', () => {
  assert.equal(deck.length, 20);
  for (let month = 1; month <= 10; month += 1) {
    assert.equal(deck.filter((card) => card.month === month).length, 2, `${month}월`);
  }
  assert.equal(deck.some((card) => card.month > 10), false);
});

test('광이 있는 달(1·3·8)은 광을 반드시 포함한다', () => {
  for (const month of [1, 3, 8]) {
    assert.equal(deck.filter((card) => card.month === month && card.kind === '광').length, 1, `${month}월 광`);
  }
});

test('끗은 두 월을 더해 10으로 나눈 나머지다', () => {
  assert.equal(seotdaKkeut(hand(3, 6)), 9);
  assert.equal(seotdaKkeut(hand(5, 5)), 0);
  assert.equal(seotdaKkeut(hand(7, 8)), 5);
});

test('광땡 세 가지가 순서대로 가장 높다', () => {
  const sam = evaluateSeotda(hand(3, 8, [true, true]));
  const ilSam = evaluateSeotda(hand(1, 3, [true, true]));
  const ilPal = evaluateSeotda(hand(1, 8, [true, true]));
  assert.equal(sam.name, '삼팔광땡');
  assert.equal(ilSam.name, '일삼광땡');
  assert.equal(ilPal.name, '일팔광땡');
  assert.equal(compareSeotda(sam, ilSam), 1);
  assert.equal(compareSeotda(ilSam, ilPal), 1);
  assert.equal(compareSeotda(ilPal, evaluateSeotda(hand(10, 10))), 1);
});

test('광이 아닌 3·8은 광땡이 아니라 그냥 한끗이다', () => {
  const plain = evaluateSeotda(hand(3, 8, [false, false]));
  assert.equal(plain.name, '1끗');
});

test('땡은 장땡이 가장 높고 1땡이 가장 낮다', () => {
  const jang = evaluateSeotda(hand(10, 10));
  assert.equal(jang.name, '장땡');
  assert.equal(compareSeotda(jang, evaluateSeotda(hand(9, 9))), 1);
  assert.equal(compareSeotda(evaluateSeotda(hand(2, 2)), evaluateSeotda(hand(1, 1))), 1);
  assert.equal(compareSeotda(evaluateSeotda(hand(1, 1)), evaluateSeotda(hand(1, 2))), 1, '1땡이 알리보다 높아야 합니다');
});

test('이름 있는 조합의 서열이 맞다', () => {
  const order = ['알리', '독사', '구삥', '장삥', '장사', '세륙'];
  const hands = [hand(1, 2), hand(1, 4), hand(1, 9), hand(1, 10), hand(4, 10), hand(4, 6)].map((cards) => evaluateSeotda(cards));
  assert.deepEqual(hands.map((item) => item.name), order);
  for (let i = 0; i + 1 < hands.length; i += 1) {
    assert.equal(compareSeotda(hands[i], hands[i + 1]), 1, `${hands[i].name}이 ${hands[i + 1].name}보다 높아야 합니다`);
  }
  assert.equal(compareSeotda(hands[5], evaluateSeotda(hand(4, 5))), 1, '세륙이 갑오보다 높아야 합니다');
});

test('갑오는 9끗, 망통은 0끗이다', () => {
  assert.equal(evaluateSeotda(hand(4, 5)).name, '갑오');
  assert.equal(evaluateSeotda(hand(2, 8)).name, '망통');
  assert.equal(compareSeotda(evaluateSeotda(hand(4, 5)), evaluateSeotda(hand(2, 6))), 1);
  assert.equal(compareSeotda(evaluateSeotda(hand(2, 6)), evaluateSeotda(hand(2, 8))), 1);
});

test('같은 족보끼리는 비긴다', () => {
  assert.equal(compareSeotda(evaluateSeotda(hand(2, 6)), evaluateSeotda(hand(3, 5))), 0);
  assert.equal(resolveSeotda(hand(2, 6), hand(3, 5)).result, 'push');
});

test('특수패는 기본값이 꺼져 있어 그냥 끗으로 친다', () => {
  assert.deepEqual(DEFAULT_SEOTDA_RULES, { ddaengJabi: false, amhaeng: false, guSa: false });
  assert.equal(evaluateSeotda(hand(4, 7)).name, '1끗');
  assert.equal(evaluateSeotda(hand(3, 7)).name, '망통');
  assert.equal(evaluateSeotda(hand(4, 9)).name, '3끗');
});

test('암행어사는 광땡만 잡고 그 밖에는 끗으로 친다', () => {
  const amhaeng = evaluateSeotda(hand(4, 7), all);
  assert.equal(amhaeng.name, '암행어사');
  assert.equal(compareSeotda(amhaeng, evaluateSeotda(hand(3, 8, [true, true]), all)), 1);
  // 땡에는 못 이깁니다 (1끗이 되어 장땡에 패배)
  assert.equal(compareSeotda(amhaeng, evaluateSeotda(hand(10, 10), all)), -1);
});

test('땡잡이는 땡만 잡는다', () => {
  const jabi = evaluateSeotda(hand(3, 7), all);
  assert.equal(jabi.name, '땡잡이');
  assert.equal(compareSeotda(jabi, evaluateSeotda(hand(10, 10), all)), 1);
  assert.equal(compareSeotda(jabi, evaluateSeotda(hand(3, 8, [true, true]), all)), -1, '광땡은 못 잡습니다');
});

test('멍텅구리구사는 자기가 질 때만 판을 무효로 만든다', () => {
  const lose = resolveSeotda(hand(4, 9), hand(10, 10), all);
  assert.equal(lose.voided, true);
  assert.equal(lose.result, 'push');
  // 상대가 더 낮으면 구사는 그냥 3끗이라 이길 수도 있습니다
  const win = resolveSeotda(hand(4, 9), hand(2, 8), all);
  assert.equal(win.voided, false);
  assert.equal(win.result, 'win');
});

test('나눠준 네 장은 서로 겹치지 않는다', () => {
  let seed = 7;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 0; i < 200; i += 1) {
    const round = dealSeotda(random);
    const ids = [...round.player, ...round.opponent].map((card) => card.id);
    assert.equal(new Set(ids).size, 4);
    assert.equal(round.rest.length, 16);
  }
});

test('모든 두 장 조합에서 판정이 터지지 않는다', () => {
  let count = 0;
  for (let a = 0; a < deck.length; a += 1) {
    for (let b = a + 1; b < deck.length; b += 1) {
      const result = evaluateSeotda([deck[a], deck[b]], all);
      assert.equal(typeof result.name === 'string' && result.name.length > 0, true);
      count += 1;
    }
  }
  assert.equal(count, 190);
});

test('특수패가 제 역할을 못 하면 원래 끗으로 겨룬다', () => {
  // 구사(4·9)는 3끗, 암행어사(4·7)는 1끗, 땡잡이(3·7)는 망통
  assert.equal(evaluateSeotda(hand(4, 9), all).tier, 3);
  assert.equal(evaluateSeotda(hand(4, 7), all).tier, 1);
  assert.equal(evaluateSeotda(hand(3, 7), all).tier, 0);
  // 3끗인 구사는 망통 상대로 이기고, 5끗 상대에게는 집니다
  assert.equal(compareSeotda(evaluateSeotda(hand(4, 9), all), evaluateSeotda(hand(2, 8), all)), 1);
  assert.equal(compareSeotda(evaluateSeotda(hand(4, 9), all), evaluateSeotda(hand(7, 8), all)), -1);
});
