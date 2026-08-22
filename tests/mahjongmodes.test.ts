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
