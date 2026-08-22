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
  // 삼색·연속 패턴이 겹치지 않는 밋밋한 손 (문전청 2점뿐)
  const plain = hand(['m1','m2','m3','m6','m7','m8','p2','p3','p4','s5','s6','s7','z1','z1']);
  const faan = evaluateChineseYaku({ hand: plain, winType: 'ron', seatWind: 3, roundWind: 4 });
  assert.equal(totalChinesePoints(faan) < CHINESE_MIN_POINTS, true, `실제 ${totalChinesePoints(faan)}점: ${faan.map((e) => e.name).join(' ')}`);
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
  // 몸통 하나 + 암깡 하나 → 손패는 여덟 장
  const one = names(evaluateChineseYaku({ hand: hand(['m1','m2','m3','p5','p6','p7','s9','s9']), concealedKans: [hand(['s2','s2','s2','s2'])], melds: [hand(['m7','m8','m9'])], winType: 'ron' }));
  assert.equal(one.includes('암깡'), true);
  assert.equal(one.includes('쌍암깡'), false);

  // 암깡 두 개 → 손패는 여덟 장
  const two = names(evaluateChineseYaku({ hand: hand(['m1','m2','m3','p5','p6','p7','s9','s9']), concealedKans: [hand(['s2','s2','s2','s2']), hand(['m5','m5','m5','m5'])], winType: 'ron' }));
  assert.equal(two.includes('쌍암깡'), true);
  assert.equal(two.includes('암깡'), false);
});

test('순위는 점수 순으로 매긴다', () => {
  const ranked = rankChineseScores([40, -10, 5, -35]);
  assert.deepEqual(ranked.map((entry) => entry.seat), [0, 2, 1, 3]);
});

// ── 새로 추가한 역들 ────────────────────────────────────────────────

const yakuNames = (tiles: MahjongTile[], opts: Record<string, unknown> = {}) =>
  evaluateChineseYaku({ hand: tiles, winType: 'ron', ...opts } as never).map((entry) => entry.name);

test('연칠대와 칠대를 구분한다', () => {
  const seven = hand(['m1','m1','m2','m2','m3','m3','m4','m4','m5','m5','m6','m6','m7','m7']);
  const result = evaluateChineseYaku({ hand: seven, winType: 'ron' });
  assert.equal(result[0].name, '연칠대');
  assert.equal(result[0].points, 88);

  const plain = hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']);
  assert.equal(yakuNames(plain).includes('칠대'), true);
  assert.equal(yakuNames(plain).includes('연칠대'), false);
});

test('청룡과 화룡을 구분한다', () => {
  const pure = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','s5','s5']);
  const pureNames = yakuNames(pure);
  assert.equal(pureNames.includes('청룡'), true);
  // 청룡이면 연륙·노소부는 포함되므로 따로 세지 않는다
  assert.equal(pureNames.includes('연륙'), false);
  assert.equal(pureNames.includes('노소부'), false);

  const mixed = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']);
  assert.equal(yakuNames(mixed).includes('화룡'), true);
});

test('전대·전중·전소를 판정한다', () => {
  assert.equal(yakuNames(hand(['m7','m8','m9','p7','p8','p9','s7','s8','s9','m7','m8','m9','p8','p8'])).includes('전대'), true);
  assert.equal(yakuNames(hand(['m4','m5','m6','p4','p5','p6','s4','s5','s6','m4','m5','m6','p5','p5'])).includes('전중'), true);
  assert.equal(yakuNames(hand(['m1','m2','m3','p1','p2','p3','s1','s2','s3','m1','m2','m3','p2','p2'])).includes('전소'), true);
});

test('대어오와 소어오를 판정한다', () => {
  assert.equal(yakuNames(hand(['m6','m7','m8','p7','p8','p9','s6','s7','s8','m7','m8','m9','p6','p6'])).includes('대어오'), true);
  assert.equal(yakuNames(hand(['m1','m2','m3','p2','p3','p4','s1','s2','s3','m2','m3','m4','p1','p1'])).includes('소어오'), true);
});

test('조합룡·전불고·칠성불고를 판정한다', () => {
  const knitted = hand(['m1','m4','m7','p2','p5','p8','s3','s6','s9','z1','z2','z3','z4','z5']);
  const knittedNames = yakuNames(knitted);
  assert.equal(knittedNames.includes('전불고'), true);
  assert.equal(knittedNames.includes('조합룡'), true);

  const stars = hand(['m1','m4','m7','p2','p5','p8','s3','z1','z2','z3','z4','z5','z6','z7']);
  const starNames = yakuNames(stars);
  assert.equal(starNames.includes('칠성불고'), true);
  // 칠성불고면 전불고·조합룡은 포함되므로 따로 세지 않는다
  assert.equal(starNames.includes('전불고'), false);
});

test('추불도는 뒤집어도 같은 패로만 완성해야 한다', () => {
  const ok = hand(['p1','p2','p3','p2','p3','p4','s4','s5','s6','z5','z5','z5','p8','p8']);
  assert.equal(yakuNames(ok).includes('추불도'), true);
  // 삭수 3은 뒤집으면 달라 보이므로 성립하지 않는다
  const no = hand(['p1','p2','p3','s3','s4','s5','s4','s5','s6','z5','z5','z5','p8','p8']);
  assert.equal(yakuNames(no).includes('추불도'), false);
});

test('오문제는 다섯 종류를 모두 써야 한다', () => {
  const five = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1','z1','z5','z5']);
  assert.equal(yakuNames(five, { seatWind: 1, roundWind: 1 }).includes('오문제'), true);
  const four = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','z5','z5','z5','z6','z6']);
  assert.equal(yakuNames(four).includes('오문제'), false);
});

test('삼풍각과 요구각을 판정한다', () => {
  const winds = hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','m2','m3','m4','p5','p5']);
  const result = yakuNames(winds, { seatWind: 4, roundWind: 4 });
  assert.equal(result.includes('삼풍각'), true);
  // 자풍·장풍이 아닌 바람 커쯔는 요구각으로 센다
  assert.equal(result.filter((name) => name === '요구각').length, 3);
});

test('사귀일은 깡하지 않은 같은 패 네 장마다 센다', () => {
  const four = hand(['m2','m3','m4','m2','m3','m4','m2','m3','m4','m2','m3','m4','s5','s5']);
  const result = yakuNames(four);
  assert.equal(result.filter((name) => name === '사귀일').length, 3);
  assert.equal(result.includes('일색사동순'), true);
  assert.equal(result.includes('일반고'), false);
});

test('변장·감장·단조장을 대기 형태로 구분한다', () => {
  const tiles = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']);
  const penchan = tiles.find((tile) => tile.suit === 'm' && tile.value === 3)!;
  assert.equal(yakuNames(tiles, { winningTile: penchan }).includes('변장'), true);
  const kanchan = tiles.find((tile) => tile.suit === 'm' && tile.value === 6)!;
  assert.equal(yakuNames(tiles, { winningTile: kanchan }).includes('감장'), true);
  const tanki = tiles.find((tile) => tile.suit === 'p' && tile.value === 2)!;
  assert.equal(yakuNames(tiles, { winningTile: tanki }).includes('단조장'), true);
});

test('꽃패는 장수만큼 점수를 주되 8점 조건에는 넣지 않는다', () => {
  const plain = hand(['m1','m2','m3','m6','m7','m8','p2','p3','p4','s5','s6','s7','z1','z1']);
  // 역이 부족한 손은 꽃패가 있어도 화료할 수 없다
  assert.equal(canChineseDeclareWin(evaluateChineseYaku({ hand: plain, winType: 'ron', seatWind: 3, roundWind: 4 })), false);
  const withFlowers = evaluateChineseYaku({ hand: plain, winType: 'ron', seatWind: 3, roundWind: 4, flowers: 4 } as never);
  assert.equal(withFlowers.some((entry) => entry.name === '화패' && entry.points === 4), true);
});

test('역이 하나도 없으면 무번화 8점을 준다', () => {
  const plain = hand(['m1','m2','m3','m6','m7','m8','p2','p3','p4','z1','z1']);
  const result = evaluateChineseYaku({ hand: plain, melds: [hand(['s5','s6','s7'])], winType: 'ron', seatWind: 3, roundWind: 4 });
  assert.equal(result.some((entry) => entry.name === '무번화' && entry.points === 8), true, `실제: ${result.map((e) => e.name).join(' ')}`);
  assert.equal(totalChinesePoints(result), 8);
});

test('점수가 가장 높아지는 해석을 고른다', () => {
  // 여러 가지로 나눌 수 있는 손에서 더 높은 쪽이 나와야 한다
  const flexible = hand(['m1','m1','m1','m2','m2','m2','m3','m3','m3','m4','m4','m4','s5','s5']);
  const result = evaluateChineseYaku({ hand: flexible, winType: 'ron' });
  const picked = result.map((entry) => entry.name);
  // 일색사절고(48) 또는 일색사동순(48) 중 하나로 잡혀야 한다
  assert.equal(picked.includes('일색사절고') || picked.includes('일색사동순'), true);
  assert.equal(totalChinesePoints(result) >= 48, true);
});

test('칠대자로도 읽히는 손은 점수가 높은 해석을 고른다', () => {
  // 일색쌍룡회(64점)는 칠대자 모양이기도 합니다. 칠대(24점)로 내려가면 안 됩니다.
  const both = hand(['m1','m2','m3','m7','m8','m9','m1','m2','m3','m7','m8','m9','m5','m5']);
  const result = evaluateChineseYaku({ hand: both, winType: 'ron' });
  assert.equal(result.some((entry) => entry.name === '일색쌍룡회'), true, `실제: ${result.map((e) => e.name).join(' ')}`);
  assert.equal(result.some((entry) => entry.name === '칠대'), false);
  assert.equal(totalChinesePoints(result) >= 64, true);

  // 연칠대(88점)도 마찬가지로 칠대보다 우선합니다
  const dragon = hand(['m1','m1','m2','m2','m3','m3','m4','m4','m5','m5','m6','m6','m7','m7']);
  assert.equal(evaluateChineseYaku({ hand: dragon, winType: 'ron' })[0].name, '연칠대');

  // 순수한 칠대자는 그대로 칠대로 나옵니다
  const plain = hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']);
  assert.equal(evaluateChineseYaku({ hand: plain, winType: 'ron' }).some((entry) => entry.name === '칠대'), true);
});

test('같은 패가 커쯔로도 연속패로도 읽히면 높은 쪽을 쓴다', () => {
  // m2m3m4 세 벌은 커쯔 세 개(일색삼절고 24 + 삼암각 16)로도 읽힙니다
  const closed = hand(['m2','m3','m4','m2','m3','m4','m2','m3','m4','p7','p8','p9','s5','s5']);
  const closedResult = evaluateChineseYaku({ hand: closed, winType: 'ron' });
  assert.equal(closedResult.some((entry) => entry.name === '일색삼절고'), true);
  assert.equal(totalChinesePoints(closedResult) >= 40, true);

  // 하나를 울면 커쯔 해석이 막혀 일색삼동순이 나옵니다
  const opened = evaluateChineseYaku({
    hand: hand(['m2','m3','m4','m2','m3','m4','p7','p8','p9','s5','s5']),
    melds: [hand(['m2','m3','m4'])], winType: 'ron',
  });
  assert.equal(opened.some((entry) => entry.name === '일색삼동순'), true, `실제: ${opened.map((e) => e.name).join(' ')}`);
});
