import test from 'node:test';
import assert from 'node:assert/strict';
import { opponentLevelForBetTier, opponentLevels } from '../src/opponent.ts';
import { mahjongLevelsFor } from '../src/riichimahjong.ts';

test('상대 실력은 베팅 등급을 따라간다', () => {
  // ⚠️ 등급 이름은 속 이름입니다. 화면에는 라이트·스탠더드·프리미엄·하이롤러·VIP로 보입니다.
  assert.equal(opponentLevelForBetTier('입문'), '쉬움');
  assert.equal(opponentLevelForBetTier('쉬움'), '쉬움');
  assert.equal(opponentLevelForBetTier('보통'), '보통');
  assert.equal(opponentLevelForBetTier('어려움'), '전문가');
  assert.equal(opponentLevelForBetTier('전문가'), '전문가');
});

test('모르는 등급이 와도 게임이 멈추지 않는다', () => {
  // 저장된 설정이 낡았거나 손상됐을 때를 위한 자리입니다.
  assert.equal(opponentLevelForBetTier(''), '보통');
  assert.equal(opponentLevelForBetTier('없는등급'), '보통');
});

test('등급을 올리면 상대가 약해지는 일은 없다', () => {
  const rank: Record<string, number> = { 쉬움: 0, 보통: 1, 전문가: 2 };
  const tiers = ['입문', '쉬움', '보통', '어려움', '전문가'];
  const steps = tiers.map((tier) => rank[opponentLevelForBetTier(tier)]);
  for (let index = 1; index < steps.length; index += 1) {
    assert.ok(steps[index] >= steps[index - 1], `${tiers[index]}에서 상대가 약해졌습니다`);
  }
  // 다섯 등급이 세 실력을 다 씁니다 — 한 실력도 안 쓰이면 등급을 올릴 이유가 없습니다.
  assert.deepEqual([...new Set(steps)].sort(), [0, 1, 2]);
});

test('마작 상대 셋도 등급을 따라 세진다', () => {
  const strength: Record<string, number> = { beginner: 0, easy: 1, normal: 2, hard: 3, expert: 4 };
  const seats = opponentLevels.map((level) => mahjongLevelsFor(level).map((item) => strength[item]));
  // 자리마다 실력이 다릅니다 — 셋이 똑같으면 실제 자리 같지 않습니다.
  for (const row of seats) assert.ok(new Set(row).size > 1, '상대 셋이 모두 같은 실력입니다');
  // 등급이 오르면 합이 커집니다.
  const sums = seats.map((row) => row.reduce((total, value) => total + value, 0));
  assert.ok(sums[0] < sums[1] && sums[1] < sums[2], `합이 안 커집니다: ${sums.join(' → ')}`);
});
