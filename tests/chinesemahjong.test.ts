import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dealChinese, isChineseWinningHand, getChineseWaits, evaluateChineseYaku, totalChinesePoints,
  canChineseDeclareWin, chineseScore, createChineseMatch, settleChineseWin, settleChineseDraw,
  rankChineseScores, chineseRoundLabel, CHINESE_MIN_POINTS, CHINESE_BASE_POINTS,
} from '../src/chinesemahjong.ts';
import { type MahjongTile } from '../src/riichimahjong.ts';

const hand = (codes: string[]): MahjongTile[] => codes.map((code, index) => ({ id: `${code}-${index}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));
const names = (result: { name: string }[]) => result.map((entry) => entry.name);

test('136장으로 열세 장씩 나눈다', () => {
  const round = dealChinese(() => 0.29);
  assert.deepEqual(round.hands.map((cards) => cards.length), [13, 13, 13, 13]);
  assert.equal(round.wall.length, 136 - 52);
});

test('완성 판정과 대기패를 구한다', () => {
  const tiles = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  assert.equal(isChineseWinningHand(tiles), true);
  const waits = getChineseWaits(hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2']));
  assert.equal(waits.some((tile) => tile.suit === 's' && tile.value === 2), true);
});

test('88점 역을 판정한다', () => {
  const daisangen = hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']);
  const result = evaluateChineseYaku({ hand: daisangen, winType: 'ron' });
  assert.equal(result.some((entry) => entry.name === '대삼원' && entry.points === 88), true);
  // 대삼원이 성립하면 역패 세 개는 따로 세지 않는다
  assert.equal(names(result).some((name) => name.startsWith('역패')), false);

  const orphans = hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  const thirteen = evaluateChineseYaku({ hand: orphans, winType: 'ron' });
  assert.equal(thirteen.length, 1);
  assert.equal(thirteen[0].points, 88);
});

test('큰 역에 포함되는 작은 역은 빼고 센다', () => {
  // 자일색은 혼일색·대대화·혼요구를 포함한다
  const honors = hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7']);
  const result = names(evaluateChineseYaku({ hand: honors, winType: 'ron', seatWind: 1, roundWind: 1 }));
  assert.equal(result.includes('자일색'), true);
  assert.equal(result.includes('혼일색'), false);
  assert.equal(result.includes('혼요구'), false);

  // 청요구는 대대화와 무자를 포함한다
  const terminals = hand(['m1','m1','m1','m9','m9','m9','p1','p1','p1','s9','s9','s9','p9','p9']);
  const pure = names(evaluateChineseYaku({ hand: terminals, winType: 'ron' }));
  assert.equal(pure.includes('청요구'), true);
  assert.equal(pure.includes('대대화'), false);
  assert.equal(pure.includes('무자'), false);
});

test('청일색과 청룡을 판정한다', () => {
  const dragon = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']);
  const result = names(evaluateChineseYaku({ hand: dragon, winType: 'ron' }));
  assert.equal(result.includes('청일색'), true);
  assert.equal(result.includes('청룡'), true);
  // 청일색이 있으면 무자는 빠진다
  assert.equal(result.includes('무자'), false);
});

test('8점을 넘겨야 화료할 수 있다', () => {
  // 아무 역도 없는 밋밋한 손
  const plain = hand(['m2','m3','m4','p4','p5','p6','s3','s4','s5','m6','m7','m8','s7','s7']);
  const faan = evaluateChineseYaku({ hand: plain, winType: 'ron', seatWind: 1, roundWind: 1 });
  assert.equal(totalChinesePoints(faan) < CHINESE_MIN_POINTS, true);
  assert.equal(canChineseDeclareWin(faan), false);

  // 청일색이면 24점이라 충분하다
  const pure = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']);
  assert.equal(canChineseDeclareWin(evaluateChineseYaku({ hand: pure, winType: 'ron' })), true);
});

test('쯔모는 세 명이 같은 금액을, 론은 방총자만 많이 낸다', () => {
  const yaku = [{ name: 'x', chinese: 'x', points: 24, detail: '' }];
  const tsumo = chineseScore({ yaku, winType: 'tsumo' });
  assert.deepEqual(tsumo.payments, [32, 32, 32]);
  assert.equal(tsumo.total, 96);

  const ron = chineseScore({ yaku, winType: 'ron' });
  assert.deepEqual(ron.payments, [32, 8, 8]);
  assert.equal(ron.total, 48);
});

test('꽃패는 점수에 더하되 최소 8점 계산에는 넣지 않는다', () => {
  const yaku = [{ name: 'x', chinese: 'x', points: 2, detail: '' }];
  // 역 자체는 2점이라 화료 불가
  assert.equal(canChineseDeclareWin(yaku), false);
  // 화료가 성립했다면 꽃패는 점수에 더해진다
  const score = chineseScore({ yaku, winType: 'ron', flowers: 3 });
  assert.equal(score.yakuPoints, 5);
  assert.equal(score.flowerPoints, 3);
  assert.deepEqual(score.payments, [13, 8, 8]);
});

test('점수 총합은 화료 뒤에도 보존된다', () => {
  let state = createChineseMatch(0);
  const yaku = [{ name: 'x', chinese: 'x', points: 24, detail: '' }];

  state = settleChineseWin(state, { winner: 0, score: chineseScore({ yaku, winType: 'ron' }), winType: 'ron', loser: 2 });
  assert.equal(state.scores.reduce((sum, value) => sum + value, 0), 0);
  assert.equal(state.scores[0], 48);
  assert.equal(state.scores[2], -32);
  assert.equal(state.scores[1], -8);
  assert.equal(state.scores[3], -8);

  state = settleChineseWin(state, { winner: 1, score: chineseScore({ yaku, winType: 'tsumo' }), winType: 'tsumo' });
  assert.equal(state.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('유국은 점수 이동 없이 다음 국으로 넘어간다', () => {
  const state = createChineseMatch(0);
  const next = settleChineseDraw(state);
  assert.deepEqual(next.scores, [0, 0, 0, 0]);
  assert.equal(next.roundIndex, 1);
});

test('열여섯 국을 마치면 끝난다', () => {
  let state = createChineseMatch(0);
  for (let i = 0; i < 16; i++) state = settleChineseDraw(state);
  assert.equal(state.finished, true);
});

test('국 이름을 바람과 함께 표시한다', () => {
  assert.equal(chineseRoundLabel(0), '东 1국');
  assert.equal(chineseRoundLabel(5), '南 2국');
});

test('자풍과 장풍을 자리에 맞게 판정한다', () => {
  const south = hand(['z2','z2','z2','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']);
  // 남2국의 남가: 같은 남 커쯔가 문풍각과 권풍각을 모두 만족해 2점씩 4점
  const both = evaluateChineseYaku({ hand: south, winType: 'ron', seatWind: 2, roundWind: 2 });
  assert.equal(names(both).includes('자풍 남'), true);
  assert.equal(names(both).includes('장풍 남'), true);
  assert.equal(both.filter((entry) => entry.name.includes('남')).reduce((sum, entry) => sum + entry.points, 0), 4);

  // 동장의 남가라면 자풍만 붙어 2점
  const seatOnly = evaluateChineseYaku({ hand: south, winType: 'ron', seatWind: 2, roundWind: 1 });
  assert.equal(names(seatOnly).includes('자풍 남'), true);
  assert.equal(names(seatOnly).includes('장풍 남'), false);
  assert.equal(seatOnly.filter((entry) => entry.name.includes('남')).reduce((sum, entry) => sum + entry.points, 0), 2);
});

test('불구인이 있으면 문전청은 빠진다', () => {
  const tiles = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  const tsumo = names(evaluateChineseYaku({ hand: tiles, winType: 'tsumo' }));
  assert.equal(tsumo.includes('불구인'), true);
  assert.equal(tsumo.includes('문전청'), false);
});

test('깡 개수에 따라 점수가 다르다', () => {
  const base = hand(['m1','m2','m3','p5','p5']);
  const one = names(evaluateChineseYaku({ hand: base, concealedKans: [hand(['s2','s2','s2','s2'])], melds: [hand(['m7','m8','m9'])], winType: 'ron' }));
  assert.equal(one.includes('깡'), true);
  const two = names(evaluateChineseYaku({ hand: hand(['m1','m2','m3','p5','p5']), concealedKans: [hand(['s2','s2','s2','s2']), hand(['p7','p7','p7','p7'])], winType: 'ron' }));
  assert.equal(two.includes('쌍깡'), true);
  assert.equal(two.includes('깡'), false);
});

test('순위는 점수 순으로 매긴다', () => {
  const ranked = rankChineseScores([40, -10, 5, -35]);
  assert.deepEqual(ranked.map((entry) => entry.seat), [0, 2, 1, 3]);
});
