import assert from 'node:assert/strict';
import test from 'node:test';
import { addAtRisk, interruptedRecord, readAtRisk } from '../src/interrupted.ts';

test('걸린 돈이 없거나 깨진 값이면 끊긴 판이 아니다', () => {
  assert.equal(readAtRisk(null), null);
  assert.equal(readAtRisk(''), null);
  assert.equal(readAtRisk('{'), null);
  assert.equal(readAtRisk(JSON.stringify({ amount: 0, game: '블랙잭' })), null);
  assert.equal(readAtRisk(JSON.stringify({ amount: -5, game: '블랙잭' })), null);
  assert.equal(readAtRisk(JSON.stringify({ amount: 500 })), null);
});

test('한 판에 여러 번 걸면 금액만 더해지고 게임과 처음 건 때는 그대로다', () => {
  const first = addAtRisk(null, 500, '블랙잭', '보통', '2026-11-11T05:00:00.000Z');
  const doubled = addAtRisk(first, 500, '룰렛', '쉬움', '2026-11-11T05:01:00.000Z');
  assert.deepEqual(doubled, { amount: 1000, game: '블랙잭', difficulty: '보통', at: '2026-11-11T05:00:00.000Z' });
});

test('끊긴 판은 건 돈만큼의 패배 기록이 된다', () => {
  const cut = readAtRisk(JSON.stringify({ amount: 1500, game: '크랩스', difficulty: '보통', at: '2026-11-11T05:00:00.000Z' }));
  assert.ok(cut);
  const record = interruptedRecord(cut);
  assert.equal(record.result, 'loss');
  assert.equal(record.bet, 1500);
  assert.equal(record.net, -1500);
  assert.equal(record.game, '크랩스');
  assert.equal(record.playedAt, '2026-11-11T05:00:00.000Z');
  assert.match(record.detail, /끊긴 판/);
});
