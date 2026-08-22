import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFromPlays, playsToReachLevel, PLAYS_PER_LEVEL_STEP } from '../src/level.ts';

test('레벨이 시작되는 누적 판수', () => {
  assert.equal(playsToReachLevel(1), 0);
  assert.equal(playsToReachLevel(2), 10);
  assert.equal(playsToReachLevel(3), 30);
  assert.equal(playsToReachLevel(4), 60);
  assert.equal(playsToReachLevel(5), 100);
});

test('판수에 맞는 레벨이 나온다', () => {
  assert.equal(levelFromPlays(0).level, 1);
  assert.equal(levelFromPlays(9).level, 1);
  assert.equal(levelFromPlays(10).level, 2);
  assert.equal(levelFromPlays(29).level, 2);
  assert.equal(levelFromPlays(30).level, 3);
  assert.equal(levelFromPlays(99).level, 4);
  assert.equal(levelFromPlays(100).level, 5);
});

test('레벨은 절대 내려가지 않는다', () => {
  let previous = 0;
  for (let plays = 0; plays <= 2000; plays += 1) {
    const { level } = levelFromPlays(plays);
    assert.equal(level >= previous, true, `${plays}판에서 레벨이 내려갔습니다`);
    previous = level;
  }
});

test('진행도는 0 이상 1 미만이고 남은 판수와 맞아떨어진다', () => {
  for (const plays of [0, 1, 9, 10, 11, 30, 59, 60, 137, 999]) {
    const p = levelFromPlays(plays);
    assert.equal(p.progress >= 0 && p.progress < 1, true, `${plays}판 진행도 ${p.progress}`);
    assert.equal(p.playsIntoLevel + p.playsToNext, p.playsForLevel);
    assert.equal(p.playsForLevel, p.level * PLAYS_PER_LEVEL_STEP);
    // 남은 판수를 채우면 정확히 다음 레벨이 됩니다.
    assert.equal(levelFromPlays(plays + p.playsToNext).level, p.level + 1);
  }
});

test('음수나 소수가 들어와도 무너지지 않는다', () => {
  assert.equal(levelFromPlays(-5).level, 1);
  assert.equal(levelFromPlays(10.9).level, 2);
  assert.equal(levelFromPlays(0).playsToNext, 10);
});
