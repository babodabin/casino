import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_MISSION_GOAL, DAILY_MISSION_REWARD, countPlayedOn, missionDayKey, shouldClaimMission } from '../src/mission.ts';

const at = (iso: string) => ({ playedAt: iso });

test('오늘의 미션 목표와 보상이 정해져 있다', () => {
  assert.equal(DAILY_MISSION_GOAL, 3);
  assert.equal(DAILY_MISSION_REWARD, 300);
});

test('같은 날의 기록만 센다', () => {
  const day = missionDayKey(new Date('2026-08-22T10:00:00'));
  const records = [
    at('2026-08-22T01:00:00'),
    at('2026-08-22T23:30:00'),
    at('2026-08-21T23:30:00'),
    at('2026-08-23T00:10:00'),
  ];
  assert.equal(countPlayedOn(records, day), 2);
});

test('기록이 없으면 0판이다', () => {
  assert.equal(countPlayedOn([], missionDayKey(new Date())), 0);
});

test('목표를 채워도 오늘 이미 받았으면 다시 주지 않는다', () => {
  const today = missionDayKey(new Date());
  assert.equal(shouldClaimMission(3, '', today), true);
  assert.equal(shouldClaimMission(3, today, today), false);
  assert.equal(shouldClaimMission(2, '', today), false);
  assert.equal(shouldClaimMission(9, 'Thu Aug 21 2026', today), true);
});
