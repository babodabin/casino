import test from 'node:test';
import assert from 'node:assert/strict';
import { summariseWin, isModeWinningShape, canModeWinShape, winButtonLabel, mahjongUsesHonors, mahjongMinimumNote } from '../src/mahjongmodes.ts';
import { type MahjongTile } from '../src/riichimahjong.ts';

const hand = (codes: string[]): MahjongTile[] => codes.map((code, index) => ({ id: `${code}-${index}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));
const base = { seat: 0, dealerSeat: 0, roundIndex: 0 } as const;

test('사천만 자패를 쓰지 않는다', () => {
  assert.deepEqual(mahjongUsesHonors, { riichi: true, chinese: true, hongkong: true, sichuan: false });
  assert.equal(mahjongMinimumNote.sichuan.includes('정결'), true);
  assert.equal(mahjongMinimumNote.chinese.includes('8점'), true);
  assert.equal(mahjongMinimumNote.hongkong.includes('3번'), true);
});

test('같은 손이라도 종목마다 화료 가능 여부가 다르다', () => {
  // 1을 하나 끼워 탕야오도 안 붙는 밋밋한 손:
  // 리치는 역이 없어 불가, 홍콩·중국은 최소치 미달
  const plain = hand(['m1','m2','m3','p4','p5','p6','s3','s4','s5','m6','m7','m8','s7','s7']);
  const winning = plain[plain.length - 1];

  const riichi = summariseWin({ ...base, mode: 'riichi', hand: plain, winType: 'ron', winningTile: winning });
  assert.equal(riichi.allowed, false);
  assert.equal(riichi.blockedReason.includes('역'), true);

  const chinese = summariseWin({ ...base, mode: 'chinese', hand: plain, winType: 'ron', winningTile: winning });
  assert.equal(chinese.allowed, false);
  assert.equal(chinese.blockedReason.includes('8점'), true);

  const hongkong = summariseWin({ ...base, mode: 'hongkong', hand: plain, winType: 'ron', winningTile: winning });
  assert.equal(hongkong.allowed, false);
  assert.equal(hongkong.blockedReason.includes('3번'), true);
});

test('리치는 역이 있으면 판·부로 정산한다', () => {
  const tiles = hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);
  const winning = tiles.find((tile) => tile.suit === 's' && tile.value === 8)!;
  const result = summariseWin({ ...base, mode: 'riichi', hand: tiles, winType: 'ron', winningTile: winning, riichi: true });
  assert.equal(result.allowed, true);
  assert.equal(result.lines.some((line) => line.name === '리치'), true);
  assert.equal(result.grade.includes('부'), true);
  assert.equal(result.scoreText.includes('점 획득'), true);
});

test('사천은 정결이 남아 있으면 막고 배수로 정산한다', () => {
  const withPin = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','p5','p5']);
  const blocked = summariseWin({ ...base, mode: 'sichuan', hand: withPin, winType: 'ron', voidSuit: 'p' });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blockedReason.includes('정결'), true);

  const cleared = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7','s7']);
  const ok = summariseWin({ ...base, mode: 'sichuan', hand: cleared, winType: 'tsumo', voidSuit: 'p', activeOpponents: 3 });
  assert.equal(ok.allowed, true);
  assert.equal(ok.grade.includes('배'), true);
  assert.equal(ok.lines.some((line) => line.name === '자모'), true);
});

test('홍콩은 번을 세고 한도에서 멈춘다', () => {
  const daisangen = hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']);
  const result = summariseWin({ ...base, mode: 'hongkong', hand: daisangen, winType: 'ron' });
  assert.equal(result.allowed, true);
  assert.equal(result.lines[0].name, '대삼원');
  assert.equal(result.lines[0].value, '한도');
  assert.equal(result.grade.includes('13번'), true);
});

test('중국식은 점수를 더하고 8점을 넘겨야 한다', () => {
  const pure = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']);
  const result = summariseWin({ ...base, mode: 'chinese', hand: pure, winType: 'ron' });
  assert.equal(result.allowed, true);
  assert.equal(result.rawPoints >= 8, true);
  assert.equal(result.grade.includes('점'), true);
  assert.equal(result.scoreText.includes('방총자'), true);
});

test('완성 모양 판정은 종목별 패 구성을 따른다', () => {
  const dragon = hand(['m1','m1','m1','m1','m3','m3','s5','s5','m7','m7','s9','s9','s2','s2']);
  // 용칠대자는 사천에서만 완성으로 인정
  assert.equal(isModeWinningShape('sichuan', dragon, 0), true);
  assert.equal(isModeWinningShape('riichi', dragon, 0), false);
  assert.equal(canModeWinShape('sichuan', dragon, [], 'p'), true);
});

test('버튼 문구가 상태를 구분해 준다', () => {
  assert.equal(winButtonLabel('riichi', false, null), '아직 미완성');
  assert.equal(winButtonLabel('riichi', true, { allowed: false, blockedReason: '', lines: [], grade: '', scoreText: '', rawPoints: 0 }), '역 없음');
  assert.equal(winButtonLabel('chinese', true, { allowed: false, blockedReason: '', lines: [], grade: '', scoreText: '', rawPoints: 5 }), '5점 · 부족');
  assert.equal(winButtonLabel('hongkong', true, { allowed: false, blockedReason: '', lines: [], grade: '', scoreText: '', rawPoints: 2 }), '2번 · 부족');
  assert.equal(winButtonLabel('sichuan', true, { allowed: false, blockedReason: '', lines: [], grade: '', scoreText: '', rawPoints: 0 }), '정결 미완료');
  assert.equal(winButtonLabel('riichi', true, { allowed: true, blockedReason: '', lines: [], grade: '', scoreText: '', rawPoints: 0 }), '쯔모');
});

test('쿠이탕을 끄면 울고 만든 탕야오가 인정되지 않는다', () => {
  const concealed = hand(['m2','m3','m4','p5','p6','p7','s2','s3','s4','s5','s5']);
  const melds = [hand(['s6','s7','s8'])];
  const ctx = { ...base, mode: 'riichi' as const, hand: concealed, melds, winType: 'ron' as const, winningTile: concealed[10] };

  const ari = summariseWin({ ...ctx, openTanyao: true });
  assert.equal(ari.lines.some((line) => line.name === '탕야오'), true);

  const nashi = summariseWin({ ...ctx, openTanyao: false });
  assert.equal(nashi.lines.some((line) => line.name === '탕야오'), false);
});

test('적도라를 끄면 점수에서 빠진다', () => {
  const tiles = hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);
  // 적도라 자리에 놓기 위해 id를 맞춥니다
  const red = tiles.map((tile, index) => index === 12 ? { ...tile, id: 'p5-0' } : tile);
  const winning = red.find((tile) => tile.suit === 's' && tile.value === 8)!;
  const ctx = { ...base, mode: 'riichi' as const, hand: red, winType: 'ron' as const, winningTile: winning, riichi: true };

  const on = summariseWin({ ...ctx, redFives: true });
  const off = summariseWin({ ...ctx, redFives: false });
  assert.equal(on.lines.some((line) => line.name === '적도라'), true);
  assert.equal(off.lines.some((line) => line.name === '적도라'), false);
  assert.equal(on.rawPoints > off.rawPoints, true, '적도라를 켜면 점수가 더 높아야 합니다');
});

test('홍콩 최소 번을 낮추면 화료할 수 있게 된다', () => {
  const plain = hand(['m1','m2','m3','p4','p5','p6','s3','s4','s5','m6','m7','m8','s7','s7']);
  const ctx = { ...base, mode: 'hongkong' as const, hand: plain, winType: 'ron' as const };

  const strict = summariseWin({ ...ctx, minFaan: 5 });
  assert.equal(strict.allowed, false);
  assert.equal(strict.blockedReason.includes('5번'), true);

  const loose = summariseWin({ ...ctx, minFaan: 1 });
  assert.equal(loose.allowed, true, `1번 기준이면 화료 가능해야 합니다 (현재 ${loose.rawPoints}번)`);
});

test('완성되지 않은 패는 어떤 종목에서도 화료로 인정하지 않는다', () => {
  // 몸통 4개와 머리 1개를 만들 수 없는 14장
  const broken = hand(['m1','m2','p1','p6','p7','p8','p9','p9','s1','s2','s9','z3','z7','z5']);
  const winning = broken[broken.length - 1];
  for (const mode of ['riichi', 'chinese', 'hongkong'] as const) {
    const summary = summariseWin({ ...base, mode, hand: broken, winType: 'tsumo', winningTile: winning });
    assert.equal(summary.allowed, false, `${mode}에서 미완성 패가 화료로 인정됨`);
    assert.equal(summary.blockedReason, '아직 완성된 패가 아닙니다');
    assert.equal(summary.rawPoints, 0);
  }
});

test('멘젠쯔모만으로 미완성 패가 통과하지 않는다', () => {
  const broken = hand(['m1','m1','m1','m2','m2','m2','m3','m3','m3','m4','m4','m4','s5','s9']);
  const summary = summariseWin({ ...base, mode: 'riichi', hand: broken, winType: 'tsumo', winningTile: broken[13] });
  assert.equal(summary.allowed, false);
  assert.equal(summary.grade, '');
});
