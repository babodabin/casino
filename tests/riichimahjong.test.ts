import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMahjongCall, canRonMahjong, createMahjongTiles, dealRiichi, getMahjongCallOptions, isWinningMahjongHand, type MahjongTile } from '../src/riichimahjong.ts';

const hand = (codes: string[]): MahjongTile[] => codes.map((code, index) => ({ id: `${code}-${index}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));

test('마작패 136장을 네 장씩 만든다', () => {
  const tiles = createMahjongTiles(); assert.equal(tiles.length, 136); assert.equal(new Set(tiles.map((tile) => tile.id)).size, 136);
});

test('사천식은 자패를 제외한 108장을 사용한다', () => {
  const tiles = createMahjongTiles(false); assert.equal(tiles.length, 108); assert.equal(tiles.some((tile) => tile.suit === 'z'), false);
});

test('네 명에게 13장씩 나누고 벽패를 남긴다', () => {
  const round = dealRiichi(() => 0.42); assert.equal(round.player.length, 13); assert.deepEqual(round.opponents.map((cards) => cards.length), [13,13,13]); assert.equal(round.wall.length, 84);
});

test('머리 하나와 몸통 네 개의 완성패를 판정한다', () => {
  assert.equal(isWinningMahjongHand(hand(['m1','m1','m1','m2','m3','m4','p2','p3','p4','s7','s8','s9','z1','z1'])), true);
  assert.equal(isWinningMahjongHand(hand(['m1','m1','m2','m2','m3','m4','p2','p3','p5','s7','s8','s9','z1','z1'])), false);
});

test('버림패 한 장을 더해 론을 판정한다', () => {
  const waiting = hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']);
  assert.equal(canRonMahjong(waiting, hand(['m4'])[0]), true);
});

test('왼쪽 상대에게서만 치를 선택하고 퐁과 깡도 찾는다', () => {
  const mine = hand(['m1','m2','m4','m4','m4','p1','p2','p3','s1','s2','s3','z1','z1']);
  const m3 = hand(['m3'])[0]; const m4 = hand(['m4'])[0];
  assert.equal(getMahjongCallOptions(mine, m3, true).filter((option) => option.kind === 'chi').length, 2);
  assert.equal(getMahjongCallOptions(mine, m3, false).some((option) => option.kind === 'chi'), false);
  assert.deepEqual(getMahjongCallOptions(mine, m4, false).map((option) => option.kind), ['pon','kan']);
});

test('퐁을 하면 손패 두 장을 빼고 공개 몸통을 만든다', () => {
  const mine = hand(['m4','m4','p1','p2','p3','s1','s2','s3','z1','z1','z2','z2','z2']);
  const discarded = hand(['m4'])[0]; const option = getMahjongCallOptions(mine, discarded, false)[0];
  const called = applyMahjongCall(mine, discarded, option);
  assert.equal(called.hand.length, 11); assert.equal(called.meld.length, 3);
});

test('공개 몸통이 있는 완성패도 판정한다', () => {
  assert.equal(isWinningMahjongHand(hand(['m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']), 1), true);
});
