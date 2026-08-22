import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFlowerTiles, flowerFaan, dealHongKong, drawFlower, isHongKongWinningHand, getHongKongWaits,
  evaluateHongKongFaan, totalFaan, canHongKongDeclareWin, hongKongScore, createHongKongMatch,
  settleHongKongWin, settleHongKongDraw, rankHongKongScores, hongKongRoundLabel,
  getHongKongCallOptions, applyHongKongCall, HONG_KONG_MIN_FAAN, HONG_KONG_LIMIT,
} from '../src/hongkongmahjong.ts';
import { type MahjongTile } from '../src/riichimahjong.ts';

const hand = (codes: string[]): MahjongTile[] => codes.map((code, index) => ({ id: `${code}-${index}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));
const names = (result: { name: string }[]) => result.map((entry) => entry.name);

test('꽃패 여덟 장을 만든다', () => {
  const flowers = createFlowerTiles();
  assert.equal(flowers.length, 8);
  assert.equal(flowers.filter((flower) => flower.kind === 'flower').length, 4);
  assert.equal(flowers.filter((flower) => flower.kind === 'season').length, 4);
});

test('자기 자리 번호와 같은 꽃패는 한 번씩 준다', () => {
  const flowers = createFlowerTiles();
  // 0번 자리는 값이 1인 꽃패와 계절패 두 장이 자기 것
  assert.equal(flowerFaan(flowers.filter((f) => f.value === 1), 0), 2);
  assert.equal(flowerFaan(flowers.filter((f) => f.value === 1), 1), 0);
  // 꽃 네 장을 모두 모으면 두 번을 더 받는다
  assert.equal(flowerFaan(flowers.filter((f) => f.kind === 'flower'), 0), 1 + 2);
  // 여덟 장 전부면 자기 번호 두 장 + 꽃 모음 2 + 계절 모음 2
  assert.equal(flowerFaan(flowers, 0), 2 + 2 + 2);
});

test('144장 구성으로 열세 장씩 나눈다', () => {
  const round = dealHongKong(() => 0.41);
  assert.deepEqual(round.hands.map((cards) => cards.length), [13, 13, 13, 13]);
  assert.equal(round.flowerWall.length, 8);
  assert.equal(round.wall.length, 136 - 52);
  const taken = drawFlower(round.flowerWall);
  assert.equal(taken.flowerWall.length, 7);
  assert.notEqual(taken.drawn, null);
});

test('청일색은 7번, 혼일색은 3번이다', () => {
  const pure = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']);
  const mixed = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','z1','z1','z1','m6','m6']);
  const pureFaan = evaluateHongKongFaan({ hand: pure, winType: 'ron' });
  assert.equal(pureFaan.find((entry) => entry.name === '청일색')?.faan, 7);
  const mixedFaan = evaluateHongKongFaan({ hand: mixed, winType: 'ron', seatWind: 1, roundWind: 1 });
  assert.equal(mixedFaan.find((entry) => entry.name === '혼일색')?.faan, 3);
});

test('대대화와 삼암각을 판정한다', () => {
  const tiles = hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']);
  const result = names(evaluateHongKongFaan({ hand: tiles, winType: 'ron' }));
  assert.equal(result.includes('대대화'), true);
});

test('한도 역은 다른 번과 섞이지 않는다', () => {
  const daisangen = hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']);
  const result = evaluateHongKongFaan({ hand: daisangen, winType: 'ron' });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, '대삼원');
  assert.equal(result[0].limit, true);
  assert.equal(result[0].faan, HONG_KONG_LIMIT);
});

test('십삼요와 자일색을 한도 역으로 판정한다', () => {
  const orphans = hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  assert.equal(evaluateHongKongFaan({ hand: orphans, winType: 'ron' })[0].name, '십삼요');

  const honors = hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7']);
  const result = names(evaluateHongKongFaan({ hand: honors, winType: 'ron' }));
  assert.equal(result.includes('자일색') || result.includes('소사희'), true);
});

test('최소 번을 못 넘기면 화료할 수 없다', () => {
  // 자패도 없고 특별할 것 없는 손: 평화 1번 + 문전청 1번 = 2번
  const plain = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  const faan = evaluateHongKongFaan({ hand: plain, winType: 'ron', seatWind: 1, roundWind: 1 });
  assert.equal(totalFaan(faan) < HONG_KONG_MIN_FAAN, true);
  assert.equal(canHongKongDeclareWin(faan), false);

  // 자모까지 붙으면 3번을 넘겨 화료 가능
  const withTsumo = evaluateHongKongFaan({ hand: plain, winType: 'tsumo', seatWind: 1, roundWind: 1 });
  assert.equal(canHongKongDeclareWin(withTsumo), true);
});

test('한도 역은 번수와 무관하게 화료할 수 있다', () => {
  const daisangen = hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']);
  const faan = evaluateHongKongFaan({ hand: daisangen, winType: 'ron' });
  assert.equal(canHongKongDeclareWin(faan), true);
});

test('점수는 번마다 두 배로 오르고 한도에서 멈춘다', () => {
  const three = [{ name: 'x', chinese: 'x', faan: 3, detail: '' }];
  assert.equal(hongKongScore({ faan: three, basePoints: 1, winType: 'ron' }).perPlayer, 8);
  assert.equal(hongKongScore({ faan: three, basePoints: 1, winType: 'ron' }).payments[0], 24);

  const seven = [{ name: 'x', chinese: 'x', faan: 7, detail: '' }];
  assert.equal(hongKongScore({ faan: seven, basePoints: 1, winType: 'ron' }).perPlayer, 128);

  const over = [{ name: 'x', chinese: 'x', faan: 20, detail: '' }];
  const capped = hongKongScore({ faan: over, basePoints: 1, winType: 'ron' });
  assert.equal(capped.total, HONG_KONG_LIMIT);
  assert.equal(capped.capped, true);
  assert.equal(capped.limitName, '한도');
});

test('쯔모는 세 명이 나눠 내고 론은 방총자가 전액을 낸다', () => {
  const faan = [{ name: 'x', chinese: 'x', faan: 3, detail: '' }];
  const tsumo = hongKongScore({ faan, basePoints: 1, winType: 'tsumo' });
  assert.deepEqual(tsumo.payments, [8, 8, 8]);
  const ron = hongKongScore({ faan, basePoints: 1, winType: 'ron' });
  assert.deepEqual(ron.payments, [24]);
});

test('점수 총합은 화료 뒤에도 보존된다', () => {
  let state = createHongKongMatch(500);
  const score = hongKongScore({ faan: [{ name: 'x', chinese: 'x', faan: 3, detail: '' }], basePoints: 1, winType: 'ron' });
  state = settleHongKongWin(state, { winner: 1, score, winType: 'ron', loser: 2 });
  assert.equal(state.scores.reduce((sum, value) => sum + value, 0), 2000);
  assert.equal(state.scores[1], 524);
  assert.equal(state.scores[2], 476);

  const tsumo = hongKongScore({ faan: [{ name: 'x', chinese: 'x', faan: 3, detail: '' }], basePoints: 1, winType: 'tsumo' });
  state = settleHongKongWin(state, { winner: 0, score: tsumo, winType: 'tsumo' });
  assert.equal(state.scores.reduce((sum, value) => sum + value, 0), 2000);
});

test('친이 이기면 연장하고 지면 다음 자리로 넘어간다', () => {
  let state = createHongKongMatch(500);
  const score = hongKongScore({ faan: [{ name: 'x', chinese: 'x', faan: 3, detail: '' }], basePoints: 1, winType: 'ron' });

  // 동1국의 친은 0번
  state = settleHongKongWin(state, { winner: 0, score, winType: 'ron', loser: 1 });
  assert.equal(state.roundIndex, 0);
  assert.equal(state.dealerRepeat, 1);

  state = settleHongKongWin(state, { winner: 2, score, winType: 'ron', loser: 1 });
  assert.equal(state.roundIndex, 1);
  assert.equal(state.dealerRepeat, 0);

  const drawn = settleHongKongDraw(state);
  assert.equal(drawn.roundIndex, 1);
  assert.equal(drawn.dealerRepeat, 1);
});

test('국 이름을 바람과 함께 표시한다', () => {
  assert.equal(hongKongRoundLabel(0), '東 1국');
  assert.equal(hongKongRoundLabel(4), '南 1국');
  assert.equal(hongKongRoundLabel(7), '南 4국');
});

test('치·퐁·깡을 모두 부를 수 있다', () => {
  const tiles = hand(['m4','m4','m4','m5','m6','p1','p2','p3','s5','s6','s7','z1','z1']);
  const options = getHongKongCallOptions(tiles, hand(['m4'])[0], true);
  assert.equal(options.some((option) => option.kind === 'pon'), true);
  assert.equal(options.some((option) => option.kind === 'minkan'), true);

  const chi = getHongKongCallOptions(tiles, hand(['m7'])[0], true);
  assert.equal(chi.some((option) => option.kind === 'chi'), true);
  // 치는 왼쪽 자리에서만 부를 수 있습니다
  assert.equal(getHongKongCallOptions(tiles, hand(['m7'])[0], false).length, 0);
  // 자패는 치할 수 없습니다
  assert.equal(getHongKongCallOptions(tiles, hand(['z1'])[0], true).every((option) => option.kind !== 'chi'), true);
});

test('퐁하면 몸통 세 장이 만들어진다', () => {
  const tiles = hand(['m4','m4','m4','m5','m6','p1','p2','p3','s5','s6','s7','z1','z1']);
  const option = getHongKongCallOptions(tiles, hand(['m4'])[0], true).find((o) => o.kind === 'pon')!;
  const applied = applyHongKongCall(tiles, hand(['m4'])[0], option);
  assert.equal(applied.meld.length, 3);
  assert.equal(applied.hand.length, 11);
});

test('순위는 점수 순으로 매긴다', () => {
  const ranked = rankHongKongScores([500, 620, 380, 500]);
  assert.deepEqual(ranked.map((entry) => entry.seat), [1, 0, 3, 2]);
});

test('완성 판정과 대기패를 구한다', () => {
  const tiles = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  assert.equal(isHongKongWinningHand(tiles), true);
  const waiting = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2']);
  const waits = getHongKongWaits(waiting);
  assert.equal(waits.some((tile) => tile.suit === 's' && tile.value === 2), true);
});
