import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_FORMAT, BACKUP_VERSION, backupFileName, buildBackup, checkBackup } from '../src/backup.ts';

const record = (over: Record<string, unknown> = {}) => ({
  id: 'r1', game: '블랙잭', result: 'win', difficulty: '보통',
  bet: 500, net: 500, playedAt: '2026-08-22T01:00:00.000Z', ...over,
});
const good = () => JSON.stringify(buildBackup({
  coins: 12345, totalPlays: 42, difficulty: '보통',
  records: [record(), record({ id: 'r2', net: -500, result: 'loss' })],
  preferences: { sound: false }, savedAt: '2026-08-22T01:00:00.000Z',
}));

test('내보낸 파일을 그대로 다시 읽을 수 있다', () => {
  const check = checkBackup(good());
  assert.equal(check.ok, true);
  if (!check.ok) return;
  assert.equal(check.data.coins, 12345);
  assert.equal(check.data.totalPlays, 42);
  assert.equal(check.data.records.length, 2);
  assert.equal(check.summary.includes('12,345 WC'), true);
  assert.equal(check.summary.includes('42판'), true);
});

test('JSON이 아니면 거절한다', () => {
  const check = checkBackup('이건 그냥 글입니다');
  assert.equal(check.ok, false);
  if (!check.ok) assert.equal(check.reason.includes('읽을 수 없습니다'), true);
});

test('다른 앱의 JSON은 거절한다', () => {
  const check = checkBackup(JSON.stringify({ hello: 'world', coins: 999 }));
  assert.equal(check.ok, false);
  if (!check.ok) assert.equal(check.reason.includes('백업 파일이 아닙니다'), true);
});

test('더 새로운 버전은 거절한다', () => {
  const check = checkBackup(JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION + 1, coins: 1, records: [] }));
  assert.equal(check.ok, false);
});

test('코인이 음수거나 숫자가 아니면 거절한다', () => {
  for (const coins of [-1, '많음', null, NaN]) {
    const check = checkBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1, coins, records: [] }));
    assert.equal(check.ok, false, `coins=${String(coins)} 가 통과했습니다`);
  }
});

test('깨진 기록은 건너뛰고 나머지는 살린다', () => {
  const text = JSON.stringify({
    format: BACKUP_FORMAT, version: 1, coins: 100, totalPlays: 3,
    records: [record(), { id: 'x' }, record({ id: 'r3', playedAt: '날짜아님' })],
  });
  const check = checkBackup(text);
  assert.equal(check.ok, true);
  if (!check.ok) return;
  assert.equal(check.data.records.length, 1);
  assert.equal(check.summary.includes('건너뜁니다'), true);
});

test('기록을 하나도 못 읽으면 거절한다', () => {
  const text = JSON.stringify({ format: BACKUP_FORMAT, version: 1, coins: 100, records: [{ id: 'x' }, { nope: 1 }] });
  const check = checkBackup(text);
  assert.equal(check.ok, false);
  if (!check.ok) assert.equal(check.reason.includes('손상'), true);
});

test('기록이 원래 비어 있는 파일은 통과한다', () => {
  const check = checkBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1, coins: 100000, records: [] }));
  assert.equal(check.ok, true);
  if (check.ok) assert.equal(check.data.records.length, 0);
});

test('기록은 100건까지만 가져온다', () => {
  const many = Array.from({ length: 150 }, (_, i) => record({ id: `r${i}` }));
  const check = checkBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1, coins: 1, totalPlays: 150, records: many }));
  assert.equal(check.ok, true);
  if (check.ok) assert.equal(check.data.records.length, 100);
});

test('누적 판수가 없으면 기록 수로 채운다', () => {
  const check = checkBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1, coins: 1, records: [record()] }));
  assert.equal(check.ok, true);
  if (check.ok) assert.equal(check.data.totalPlays, 1);
});

test('파일 이름에 날짜가 들어간다', () => {
  assert.equal(backupFileName('2026-08-22T01:00:00.000Z'), 'world-casino-2026-08-22.json');
});
