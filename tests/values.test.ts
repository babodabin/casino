import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBasicRiichiYaku, calculateRiichiScore, type MahjongTile } from '../src/riichimahjong.ts';
import { evaluateHongKongFaan, hongKongScore, HONG_KONG_LIMIT } from '../src/hongkongmahjong.ts';
import { evaluateSichuanFan, sichuanScore } from '../src/sichuanmahjong.ts';
import { evaluateChineseYaku } from '../src/chinesemahjong.ts';

let uid = 0;
const hand = (codes: string[]): MahjongTile[] =>
  codes.map((code) => ({ id: `${code}-${uid++}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));

/** 어떤 역이 나왔고 그 값이 얼마인지 확인합니다. */
function valueOf(list: { name: string }[], name: string, field: 'han' | 'faan' | 'multiplier' | 'points') {
  const found = list.find((entry) => entry.name === name) as Record<string, number> | undefined;
  return found ? found[field] : null;
}

// ── 리치 마작: 판수 ─────────────────────────────────────────────────

test('리치 마작 역의 판수가 표준과 같다', () => {
  const wrong: string[] = [];
  const check = (name: string, expected: number, args: Record<string, unknown>) => {
    const list = evaluateBasicRiichiYaku({ winType: 'ron', ...args } as never);
    const got = valueOf(list, name, 'han');
    if (got !== expected) wrong.push(`${name}: ${got ?? '안 나옴'}판 (표준 ${expected}판) — ${list.map((e) => e.name).join(' ')}`);
  };

  const pinfu = hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);
  const pinfuWin = pinfu.find((tile) => tile.suit === 's' && tile.value === 8)!;

  check('리치', 1, { concealed: pinfu, winningTile: pinfuWin, riichi: true });
  check('더블리치', 2, { concealed: pinfu, winningTile: pinfuWin, riichi: true, doubleRiichi: true });
  check('일발', 1, { concealed: pinfu, winningTile: pinfuWin, riichi: true, ippatsu: true });
  check('멘젠쯔모', 1, { concealed: pinfu, winningTile: pinfuWin, winType: 'tsumo' });
  check('핑후', 1, { concealed: pinfu, winningTile: pinfuWin });
  check('하이테이', 1, { concealed: pinfu, winningTile: pinfuWin, winType: 'tsumo', lastTile: true });
  check('호테이', 1, { concealed: pinfu, winningTile: pinfuWin, lastTile: true });
  check('영상개화', 1, { concealed: pinfu, winningTile: pinfuWin, winType: 'tsumo', afterKan: true });
  check('창깡', 1, { concealed: pinfu, winningTile: pinfuWin, robbingKan: true });
  check('인화', 5, { concealed: pinfu, winningTile: pinfuWin, firstTurn: true, anyCallMade: false, seatWind: 2 });

  check('탕야오', 1, { concealed: hand(['m2','m3','m4','p5','p6','p7','s6','s7','s8','m6','m7','m8','s3','s3']) });
  check('이페코', 1, { concealed: hand(['m2','m3','m4','m2','m3','m4','p6','p7','p8','s2','s3','s4','s5','s5']) });
  check('량페코', 3, { concealed: hand(['m2','m3','m4','m2','m3','m4','p6','p7','p8','p6','p7','p8','s5','s5']) });
  check('칠대자', 2, { concealed: hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']) });
  check('또이또이', 2, { concealed: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']), openMelds: [] , winType: 'ron' });
  check('삼암각', 2, { concealed: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m2','m3','m4','s2','s2']) });
  check('삼색동각', 2, { concealed: hand(['m5','m5','m5','p5','p5','p5','s5','s5','s5','m2','m3','m4','p1','p1']) });
  check('혼노두', 2, { concealed: hand(['m1','m1','m1','p9','p9','p9','z1','z1','z1','s9','s9','s9','z5','z5']), seatWind: 2, roundWind: 3 });
  check('소삼원', 2, { concealed: hand(['z5','z5','z5','z6','z6','z6','m2','m3','m4','p5','p6','p7','z7','z7']) });
  check('일기통관', 2, { concealed: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','s5','s5']) });
  check('삼색동순', 2, { concealed: hand(['m3','m4','m5','p3','p4','p5','s3','s4','s5','m7','m8','m9','p1','p1']) });
  check('찬타', 2, { concealed: hand(['m1','m2','m3','p7','p8','p9','s1','s2','s3','z1','z1','z1','p1','p1']), seatWind: 2, roundWind: 3 });
  check('준찬타', 3, { concealed: hand(['m1','m2','m3','p7','p8','p9','s1','s2','s3','m9','m9','m9','p1','p1']) });
  check('혼일색', 3, { concealed: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','z1','z1','z1','m6','m6']), seatWind: 2, roundWind: 3 });
  check('청일색', 6, { concealed: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']) });
  check('삼깡쯔', 2, { concealed: hand(['m1','m2','m3','m5','m5']), concealedKans: [hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['z1','z1','z1','z1'])], seatWind: 2, roundWind: 3 });

  assert.deepEqual(wrong, [], `판수가 다른 역:\n${wrong.join('\n')}`);
});

test('리치 마작 역만이 13판, 더블 역만이 26판이다', () => {
  const wrong: string[] = [];
  const check = (name: string, multiplier: number, args: Record<string, unknown>) => {
    const list = evaluateBasicRiichiYaku({ winType: 'ron', ...args } as never);
    const found = list.find((entry) => entry.name === name);
    if (!found) { wrong.push(`${name}: 안 나옴 — ${list.map((e) => e.name).join(' ')}`); return; }
    if (found.han !== 13 * multiplier) wrong.push(`${name}: ${found.han}판 (기대 ${13 * multiplier}판)`);
    if ((found.yakumanMultiplier ?? 1) !== multiplier) wrong.push(`${name}: 배수 ${found.yakumanMultiplier ?? 1} (기대 ${multiplier})`);
  };

  check('국사무쌍', 1, { concealed: hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']) });
  check('대삼원', 1, { concealed: hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']) });
  check('대사희', 2, { concealed: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z4','z4','z4','m5','m5']) });
  check('소사희', 1, { concealed: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','m2','m3','m4','z4','z4']) });
  check('자일색', 1, { concealed: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7']) });
  check('청노두', 1, { concealed: hand(['m1','m1','m1','m9','m9','m9','p1','p1','p1','s9','s9','s9','p9','p9']) });
  check('녹일색', 1, { concealed: hand(['s2','s3','s4','s2','s3','s4','s6','s6','s6','z6','z6','z6','s8','s8']) });
  check('구련보등', 1, { concealed: hand(['m1','m1','m1','m2','m3','m4','m5','m6','m7','m8','m9','m9','m9','m5']), winType: 'tsumo' });
  check('사깡쯔', 1, { concealed: hand(['m5','m5']), concealedKans: [hand(['m1','m1','m1','m1']), hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['z1','z1','z1','z1'])], winType: 'tsumo' });

  const orphans = hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  check('국사무쌍 13면', 2, { concealed: orphans, winningTile: orphans[orphans.length - 1] });
  const gates = hand(['m1','m1','m1','m2','m3','m4','m5','m6','m7','m8','m9','m9','m9','m5']);
  check('순정구련보등', 2, { concealed: gates, winningTile: gates[gates.length - 1], winType: 'tsumo' });
  const suanko = hand(['m1','m1','m1','p9','p9','p9','s3','s3','s3','z2','z2','z2','z1','z1']);
  check('사암각 단기', 2, { concealed: suanko, winningTile: suanko.find((tile) => tile.suit === 'z' && tile.value === 1)! });

  assert.deepEqual(wrong, [], `역만 값이 다른 역:\n${wrong.join('\n')}`);
});

// ── 홍콩 마작: 번수 ─────────────────────────────────────────────────

test('홍콩 마작 번수가 표준과 같다', () => {
  const wrong: string[] = [];
  const check = (name: string, expected: number, args: Record<string, unknown>) => {
    const list = evaluateHongKongFaan({ winType: 'ron', ...args } as never);
    const got = valueOf(list, name, 'faan');
    if (got !== expected) wrong.push(`${name}: ${got ?? '안 나옴'}번 (표준 ${expected}번) — ${list.map((e) => e.name).join(' ')}`);
  };

  const plain = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']);
  check('평화', 1, { hand: plain });
  check('문전청', 1, { hand: plain });
  check('문전청 자모', 2, { hand: plain, winType: 'tsumo' });
  check('깡상화', 1, { hand: plain, winType: 'tsumo', afterKan: true });
  check('창깡', 1, { hand: plain, robbingKan: true });
  check('해저로월', 1, { hand: plain, lastTile: true });
  check('일기통관', 1, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','s5','s5']) });
  check('삼색동순', 1, { hand: hand(['m3','m4','m5','p3','p4','p5','s3','s4','s5','m7','m8','m9','p1','p1']) });
  check('삼색동각', 2, { hand: hand(['m5','m5','m5','p5','p5','p5','s5','s5','s5','m2','m3','m4','p1','p1']) });
  check('이배구', 1, { hand: hand(['m2','m3','m4','m2','m3','m4','p6','p7','p8','s2','s3','s4','s5','s5']) });
  check('혼전대요', 1, { hand: hand(['m1','m2','m3','p7','p8','p9','s1','s2','s3','z1','z1','z1','m9','m9']), seatWind: 2, roundWind: 3 });
  check('칠대자', 2, { hand: hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']) });
  check('삼암각', 2, { hand: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m2','m3','m4','s2','s2']) });
  check('대대화', 3, { hand: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']) });
  check('혼일색', 3, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','z1','z1','z1','m6','m6']), seatWind: 2, roundWind: 3 });
  check('혼요구', 3, { hand: hand(['m1','m1','m1','p9','p9','p9','z1','z1','z1','s9','s9','s9','z5','z5']), seatWind: 2, roundWind: 3 });
  check('소삼원', 5, { hand: hand(['z5','z5','z5','z6','z6','z6','m2','m3','m4','p5','p6','p7','z7','z7']) });
  check('청일색', 7, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']) });
  check('삼깡', 8, { hand: hand(['m1','m2','m3','m5','m5']), concealedKans: [hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['z1','z1','z1','z1'])], seatWind: 2, roundWind: 3 });

  assert.deepEqual(wrong, [], `번수가 다른 역:\n${wrong.join('\n')}`);
});

test('홍콩 마작 한도 역은 모두 13번이다', () => {
  const wrong: string[] = [];
  const check = (name: string, args: Record<string, unknown>) => {
    const list = evaluateHongKongFaan({ winType: 'ron', ...args } as never);
    const found = list.find((entry) => entry.name === name);
    if (!found) { wrong.push(`${name}: 안 나옴 — ${list.map((e) => e.name).join(' ')}`); return; }
    if (found.faan !== HONG_KONG_LIMIT) wrong.push(`${name}: ${found.faan}번 (한도 ${HONG_KONG_LIMIT}번)`);
    if (!found.limit) wrong.push(`${name}: 한도 역 표시가 없음`);
  };
  check('십삼요', { hand: hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']) });
  check('대삼원', { hand: hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']) });
  check('대사희', { hand: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z4','z4','z4','m5','m5']) });
  check('자일색', { hand: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7']) });
  check('청요구', { hand: hand(['m1','m1','m1','m9','m9','m9','p1','p1','p1','s9','s9','s9','p9','p9']) });
  check('녹일색', { hand: hand(['s2','s3','s4','s2','s3','s4','s6','s6','s6','z6','z6','z6','s8','s8']) });
  check('십팔나한', { hand: hand(['m5','m5']), concealedKans: [hand(['m1','m1','m1','m1']), hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['z1','z1','z1','z1'])] });
  check('구련보등', { hand: hand(['m1','m1','m1','m2','m3','m4','m5','m6','m7','m8','m9','m9','m9','m5']) });
  assert.deepEqual(wrong, [], `한도 역 문제:\n${wrong.join('\n')}`);
});

test('홍콩 점수는 번마다 두 배로 오른다', () => {
  for (let faan = 1; faan <= 13; faan++) {
    const score = hongKongScore({ faan: [{ name: 'x', chinese: 'x', faan, detail: '' }], basePoints: 1, winType: 'ron' });
    assert.equal(score.perPlayer, 2 ** faan, `${faan}번은 ${2 ** faan}점이어야 합니다`);
    assert.equal(score.payments[0], 2 ** faan * 3, '론은 방총자가 세 명 몫을 냅니다');
  }
});

// ── 사천 마작: 배수 ─────────────────────────────────────────────────

test('사천 마작 역의 배수가 표준과 같다', () => {
  const wrong: string[] = [];
  const check = (name: string, expected: number, args: Record<string, unknown>) => {
    const list = evaluateSichuanFan({ winType: 'ron', ...args } as never);
    const got = valueOf(list, name, 'multiplier');
    if (got !== expected) wrong.push(`${name}: ${got ?? '안 나옴'}배 (표준 ${expected}배) — ${list.map((e) => e.name).join(' ')}`);
  };

  const plain = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  check('평화', 1, { hand: plain });
  check('금구', 2, { hand: plain });
  check('자모', 2, { hand: plain, winType: 'tsumo' });
  check('깡상화', 2, { hand: plain, winType: 'tsumo', afterKan: true });
  check('창깡', 2, { hand: plain, robbingKan: true });
  check('해저포', 2, { hand: plain, lastTile: true });
  check('대대화', 2, { hand: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']) });
  check('청일색', 4, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']) });
  check('칠대자', 4, { hand: hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']) });
  check('청대대', 8, { hand: hand(['m1','m1','m1','m5','m5','m5','m9','m9','m9','m7','m7','m7','m2','m2']) });
  check('용칠대자', 8, { hand: hand(['m1','m1','m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2']) });
  check('청칠대자', 16, { hand: hand(['m1','m1','m2','m2','m3','m3','m4','m4','m5','m5','m6','m6','m8','m8']) });
  check('장대', 16, { hand: hand(['m2','m2','m2','m5','m5','m5','p8','p8','p8','s2','s2','s2','p5','p5']) });
  check('청룡칠대자', 32, { hand: hand(['m1','m1','m1','m1','m3','m3','m4','m4','m5','m5','m6','m6','m8','m8']) });
  check('십팔나한', 64, { hand: hand(['m5','m5']), melds: [hand(['m1','m1','m1','m1']), hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['m9','m9','m9','m9'])] });

  assert.deepEqual(wrong, [], `배수가 다른 역:\n${wrong.join('\n')}`);
});

test('사천 점수는 배수를 곱하고 64배에서 멈춘다', () => {
  const one = [{ name: 'x', chinese: 'x', multiplier: 4, detail: '' }];
  assert.equal(sichuanScore({ fans: one, basePoints: 10, winType: 'ron' }).perPlayer, 40);
  // 근 하나마다 두 배
  assert.equal(sichuanScore({ fans: one, roots: 2, basePoints: 10, winType: 'ron' }).perPlayer, 160);
  // 상한
  const big = [{ name: 'x', chinese: 'x', multiplier: 64, detail: '' }, { name: 'y', chinese: 'y', multiplier: 2, detail: '' }];
  const capped = sichuanScore({ fans: big, basePoints: 1, winType: 'ron' });
  assert.equal(capped.multiplier, 64);
  assert.equal(capped.capped, true);
});

// ── 중국식 마작: 점수 ───────────────────────────────────────────────

test('중국식 마작 역의 점수가 공식 점수와 같다 (실제 판정으로 확인)', () => {
  const wrong: string[] = [];
  const check = (name: string, expected: number, args: Record<string, unknown>) => {
    const list = evaluateChineseYaku({ winType: 'ron', ...args } as never);
    const got = valueOf(list, name, 'points');
    if (got !== expected) wrong.push(`${name}: ${got ?? '안 나옴'}점 (공식 ${expected}점) — ${list.map((e) => e.name).join(' ')}`);
  };

  check('대사희', 88, { hand: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z4','z4','z4','m5','m5']) });
  check('대삼원', 88, { hand: hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']) });
  check('녹일색', 88, { hand: hand(['s2','s3','s4','s2','s3','s4','s6','s6','s6','z6','z6','z6','s8','s8']) });
  check('구련보등', 88, { hand: hand(['m1','m1','m1','m2','m3','m4','m5','m6','m7','m8','m9','m9','m9','m5']) });
  check('사깡', 88, { hand: hand(['m5','m5']), concealedKans: [hand(['m1','m1','m1','m1']), hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['z1','z1','z1','z1'])] });
  check('연칠대', 88, { hand: hand(['m1','m1','m2','m2','m3','m3','m4','m4','m5','m5','m6','m6','m7','m7']) });
  check('십삼요', 88, { hand: hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']) });

  check('청요구', 64, { hand: hand(['m1','m1','m1','m9','m9','m9','p1','p1','p1','s9','s9','s9','p9','p9']) });
  check('소사희', 64, { hand: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','m2','m3','m4','z4','z4']) });
  check('소삼원', 64, { hand: hand(['z5','z5','z5','z6','z6','z6','m2','m3','m4','p5','p6','p7','z7','z7']) });
  check('자일색', 64, { hand: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7']) });
  check('사암각', 64, { hand: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']) });
  check('일색쌍룡회', 64, { hand: hand(['m1','m2','m3','m7','m8','m9','m1','m2','m3','m7','m8','m9','m5','m5']) });

  check('일색사동순', 48, { hand: hand(['m2','m3','m4','m2','m3','m4','m2','m3','m4','m2','m3','m4','s5','s5']) });
  check('일색사절고', 48, { hand: hand(['m1','m1','m1','m2','m2','m2','m3','m3','m3','m4','m4','m4','s5','s5']) });
  check('일색사보고', 32, { hand: hand(['m1','m2','m3','m2','m3','m4','m3','m4','m5','m4','m5','m6','s9','s9']) });
  check('삼깡', 32, { hand: hand(['m1','m2','m3','m5','m5']), concealedKans: [hand(['p2','p2','p2','p2']), hand(['s3','s3','s3','s3']), hand(['z1','z1','z1','z1'])] });
  check('혼요구', 32, { hand: hand(['m1','m1','m1','p9','p9','p9','z1','z1','z1','s9','s9','s9','z5','z5']), seatWind: 2, roundWind: 3 });

  check('칠대', 24, { hand: hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']) });
  check('칠성불고', 24, { hand: hand(['m1','m4','m7','p2','p5','p8','s3','z1','z2','z3','z4','z5','z6','z7']) });
  check('전쌍각', 24, { hand: hand(['m2','m2','m2','p4','p4','p4','s6','s6','s6','m8','m8','m8','p2','p2']) });
  check('청일색', 24, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']) });
  check('일색삼절고', 24, { hand: hand(['m2','m2','m2','m3','m3','m3','m4','m4','m4','p7','p8','p9','s5','s5']) });
  check('전대', 24, { hand: hand(['m7','m8','m9','p7','p8','p9','s7','s8','s9','m7','m8','m9','p8','p8']) });
  check('전중', 24, { hand: hand(['m4','m5','m6','p4','p5','p6','s4','s5','s6','m4','m5','m6','p5','p5']) });
  check('전소', 24, { hand: hand(['m1','m2','m3','p1','p2','p3','s1','s2','s3','m1','m2','m3','p2','p2']) });
  check('일색삼동순', 24, { hand: hand(['m2','m3','m4','m2','m3','m4','p7','p8','p9','s5','s5']), melds: [hand(['m2','m3','m4'])] });

  check('청룡', 16, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','s5','s5']) });
  check('삼색쌍룡회', 16, { hand: hand(['m1','m2','m3','m7','m8','m9','p1','p2','p3','p7','p8','p9','s5','s5']) });
  check('일색삼보고', 16, { hand: hand(['m1','m2','m3','m2','m3','m4','m3','m4','m5','p7','p8','p9','s9','s9']) });
  check('전대오', 16, { hand: hand(['m3','m4','m5','p4','p5','p6','s5','s6','s7','m5','m5','m5','p5','p5']) });
  check('삼동각', 16, { hand: hand(['m5','m5','m5','p5','p5','p5','s5','s5','s5','m2','m3','m4','p1','p1']) });
  check('삼암각', 16, { hand: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m2','m3','m4','s2','s2']) });

  check('전불고', 12, { hand: hand(['m1','m4','m7','p2','p5','p8','s3','s6','s9','z1','z2','z3','z4','z5']) });
  check('조합룡', 12, { hand: hand(['m1','m4','m7','p2','p5','p8','s3','s6','s9','z1','z2','z3','z4','z5']) });
  check('대어오', 12, { hand: hand(['m6','m7','m8','p7','p8','p9','s6','s7','s8','m7','m8','m9','p6','p6']) });
  check('소어오', 12, { hand: hand(['m1','m2','m3','p2','p3','p4','s1','s2','s3','m2','m3','m4','p1','p1']) });
  check('삼풍각', 12, { hand: hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','m2','m3','m4','p5','p5']), seatWind: 4, roundWind: 4 });

  check('화룡', 8, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']) });
  check('추불도', 8, { hand: hand(['p1','p2','p3','p2','p3','p4','s4','s5','s6','z5','z5','z5','p8','p8']) });
  check('삼색삼동순', 8, { hand: hand(['m3','m4','m5','p3','p4','p5','s3','s4','s5','m7','m8','m9','p1','p1']) });
  check('무번화', 8, { hand: hand(['m1','m2','m3','m6','m7','m8','p2','p3','p4','z1','z1']), melds: [hand(['s5','s6','s7'])], seatWind: 3, roundWind: 4 });
  check('묘수회춘', 8, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), winType: 'tsumo', lastTile: true });
  check('해저로월', 8, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), lastDiscard: true });
  check('깡상개화', 8, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), winType: 'tsumo', afterKan: true });
  check('창깡화', 8, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), robbingKan: true });

  check('대대화', 6, { hand: hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','s2','s2']), melds: [hand(['m7','m7','m7'])] });
  check('혼일색', 6, { hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','z1','z1','z1','m6','m6']), seatWind: 2, roundWind: 3 });
  check('삼색삼보고', 6, { hand: hand(['m1','m2','m3','p2','p3','p4','s3','s4','s5','m7','m8','m9','p6','p6']) });
  check('오문제', 6, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1','z1','z5','z5']), seatWind: 1, roundWind: 1 });
  check('전구인', 6, { hand: hand(['z1','z1']), melds: [hand(['m1','m2','m3']), hand(['p4','p5','p6']), hand(['s7','s8','s9']), hand(['m5','m6','m7'])], allMeldsFromDiscards: true });
  check('쌍전각', 6, { hand: hand(['z5','z5','z5','z6','z6','z6','m2','m3','m4','p5','p6','p7','s9','s9']) });
  check('쌍암깡', 6, { hand: hand(['m1','m2','m3','p5','p6','p7','s9','s9']), concealedKans: [hand(['s2','s2','s2','s2']), hand(['m5','m5','m5','m5'])] });

  check('전대요', 4, { hand: hand(['m1','m2','m3','p7','p8','p9','s1','s2','s3','m9','m9','m9','p1','p1']) });
  check('불구인', 4, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), winType: 'tsumo' });
  check('쌍명깡', 4, { hand: hand(['m1','m2','m3','p5','p6','p7','s9','s9']), melds: [hand(['m5','m5','m5','m5']), hand(['p2','p2','p2','p2'])] });
  check('화절장', 4, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), lastOfItsKind: true });

  check('문전청', 2, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']) });
  check('평화', 2, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']) });
  check('단요', 2, { hand: hand(['m2','m3','m4','p5','p6','p7','s6','s7','s8','m6','m7','m8','s3','s3']) });
  check('암깡', 2, { hand: hand(['m1','m2','m3','p5','p6','p7','s1','s2','s3','s9','s9']), concealedKans: [hand(['m5','m5','m5','m5'])] });

  check('명깡', 1, { hand: hand(['m1','m2','m3','p5','p6','p7','s1','s2','s3','s9','s9']), melds: [hand(['m5','m5','m5','m5'])] });
  check('무자', 1, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']) });
  check('자모', 1, { hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','p2','p2']), melds: [hand(['m5','m6','m7'])], winType: 'tsumo' });

  assert.deepEqual(wrong, [], `점수가 다른 역:\n${wrong.join('\n')}`);
});

test('중국식 나머지 역 17종의 점수도 공식과 같다', () => {
  const wrong: string[] = [];
  const check = (name: string, expected: number, args: Record<string, unknown>) => {
    const list = evaluateChineseYaku({ winType: 'ron', ...args } as never);
    const got = valueOf(list, name, 'points');
    if (got !== expected) wrong.push(`${name}: ${got ?? '안 나옴'}점 (공식 ${expected}점) — ${list.map((e) => e.name).join(' ')}`);
  };

  check('삼색삼절고', 8, { hand: hand(['m3','m3','m3','p4','p4','p4','s5','s5','s5','m7','m8','m9','p1','p1']) });
  check('역패 중', 2, { hand: hand(['z7','z7','z7','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']), seatWind: 2, roundWind: 3 });
  check('역패 백', 2, { hand: hand(['z5','z5','z5','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']), seatWind: 2, roundWind: 3 });
  check('역패 발', 2, { hand: hand(['z6','z6','z6','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']), seatWind: 2, roundWind: 3 });
  check('장풍 동', 2, { hand: hand(['z1','z1','z1','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']), seatWind: 2, roundWind: 1 });
  check('자풍 남', 2, { hand: hand(['z2','z2','z2','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']), seatWind: 2, roundWind: 1 });
  // m5 네 장: 커쯔 하나 + 연속패에 한 장
  check('사귀일', 2, { hand: hand(['m5','m5','m5','m5','m6','m7','p2','p3','p4','s7','s8','s9','z1','z1']), seatWind: 2, roundWind: 3 });
  check('쌍동각', 2, { hand: hand(['m5','m5','m5','p5','p5','p5','m2','m3','m4','s6','s7','s8','p9','p9']) });
  check('쌍암각', 2, { hand: hand(['m1','m1','m1','p5','p5','p5','m2','m3','m4','s6','s7','s8','p9','p9']) });
  check('일반고', 1, { hand: hand(['m2','m3','m4','m2','m3','m4','p6','p7','p8','s2','s3','s4','s5','s5']) });
  check('희상봉', 1, { hand: hand(['m3','m4','m5','p3','p4','p5','s7','s8','s9','m1','m2','m3','p1','p1']) });
  check('연륙', 1, { hand: hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s7','s8','s9','p9','p9']) });
  check('노소부', 1, { hand: hand(['m1','m2','m3','m7','m8','m9','p2','p3','p4','s5','s6','s7','p9','p9']) });
  check('요구각', 1, { hand: hand(['z3','z3','z3','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']), seatWind: 1, roundWind: 2 });
  check('결일문', 1, { hand: hand(['m1','m2','m3','m5','m6','m7','p2','p3','p4','p6','p7','p8','z1','z1']), seatWind: 2, roundWind: 3 });
  const edge = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']);
  check('변장', 1, { hand: edge, winningTile: edge.find((tile) => tile.suit === 'm' && tile.value === 3)! });
  check('감장', 1, { hand: edge, winningTile: edge.find((tile) => tile.suit === 'm' && tile.value === 6)! });
  check('단조장', 1, { hand: edge, winningTile: edge.find((tile) => tile.suit === 'p' && tile.value === 2)! });
  check('화패', 3, { hand: edge, flowers: 3 });

  assert.deepEqual(wrong, [], `점수가 다른 역:\n${wrong.join('\n')}`);
});

test('대대화와 쌍동각은 각각 센다', () => {
  // 같은 숫자 커쯔 두 개가 든 대대화: 6점 + 2점이 모두 붙어야 합니다
  const both = evaluateChineseYaku({
    hand: hand(['m5','m5','m5','p5','p5','p5','s9','s9','s9','s2','s2']),
    melds: [hand(['m7','m7','m7'])], winType: 'ron',
  });
  const names = both.map((entry) => entry.name);
  assert.equal(names.includes('대대화'), true);
  assert.equal(names.includes('쌍동각'), true, `실제: ${names.join(' ')}`);
});

test('사암각을 쯔모로 완성하면 불구인이 따로 붙는다', () => {
  const tiles = hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']);
  const tsumo = evaluateChineseYaku({ hand: tiles, winType: 'tsumo' }).map((entry) => entry.name);
  assert.equal(tsumo.includes('사암각'), true);
  assert.equal(tsumo.includes('불구인'), true, `실제: ${tsumo.join(' ')}`);
  // 대대화·문전청은 사암각에 포함되므로 빠집니다
  assert.equal(tsumo.includes('대대화'), false);
  assert.equal(tsumo.includes('문전청'), false);
});

test('사천: 칠대자로도 표준형으로도 읽히는 손은 높은 쪽이 나온다', () => {
  // 만수 연속 짝: 칠대자로도, m1m2m3·m1m2m3·m4m5m6·m4m5m6·m8m8로도 읽힙니다
  const both = hand(['m1','m1','m2','m2','m3','m3','m4','m4','m5','m5','m6','m6','m8','m8']);
  const fans = evaluateSichuanFan({ hand: both, winType: 'ron' });
  const score = sichuanScore({ fans, basePoints: 1, winType: 'ron' });
  // 청칠대자 16 × 금구 2 = 32배. 표준형(청일색 4 × 금구 2 = 8배)보다 높아야 합니다
  assert.equal(fans.some((fan) => fan.name === '청칠대자'), true, `실제: ${fans.map((f) => f.name).join(' ')}`);
  assert.equal(score.multiplier >= 8, true);

  // 여러 종류가 섞인 칠대자도 표준형(평화)보다 높아야 합니다
  const mixed = hand(['m1','m1','m2','m2','m3','m3','p1','p1','p2','p2','p3','p3','s5','s5']);
  const mixedFans = evaluateSichuanFan({ hand: mixed, winType: 'ron' });
  assert.equal(mixedFans.some((fan) => fan.name === '칠대자'), true);
  assert.equal(sichuanScore({ fans: mixedFans, basePoints: 1, winType: 'ron' }).multiplier, 8);
});

test('사천 역 사다리가 점수를 잃지 않는다', () => {
  // 청일색(4) × 대대화(2) = 8 이고, 청대대도 8이라 어느 쪽으로 읽혀도 같습니다
  const pureTriplets = hand(['m1','m1','m1','m5','m5','m5','m9','m9','m9','m7','m7','m7','m2','m2']);
  const fans = evaluateSichuanFan({ hand: pureTriplets, winType: 'ron' });
  const names = fans.map((fan) => fan.name);
  assert.equal(names.includes('청대대'), true);
  // 청대대가 청일색·대대화를 대신하므로 둘은 따로 나오지 않습니다
  assert.equal(names.includes('청일색'), false);
  assert.equal(names.includes('대대화'), false);
  assert.equal(sichuanScore({ fans, basePoints: 1, winType: 'ron' }).multiplier, 16); // 청대대 8 × 금구 2
});

test('홍콩 역 사다리가 점수를 잃지 않는다', () => {
  // 청일색(7)이면 혼일색(3)은 나오지 않습니다
  const pure = evaluateHongKongFaan({ hand: hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']), winType: 'ron' }).map((e) => e.name);
  assert.equal(pure.includes('청일색'), true);
  assert.equal(pure.includes('혼일색'), false);

  // 문전청 자모(2)면 문전청(1)과 자모(1)를 따로 세지 않습니다
  const tsumo = evaluateHongKongFaan({ hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','p2','p2']), winType: 'tsumo' }).map((e) => e.name);
  assert.equal(tsumo.includes('문전청 자모'), true);
  assert.equal(tsumo.filter((n) => n === '문전청').length, 0);
  assert.equal(tsumo.includes('자모'), false);
});
