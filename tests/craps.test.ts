import test from 'node:test';
import assert from 'node:assert/strict';
import { commitCrapsBets, crapsCannotBet, crapsLockedStake, crapsNet, leaveCrapsTable, newCrapsTable, resolveCrapsRoll, rollCrapsTable, type CrapsTable } from '../src/craps.ts';

test('패스 라인의 컴아웃 결과를 판정한다', () => {
  assert.equal(resolveCrapsRoll('pass', null, [3, 4]).outcome, 'win');
  assert.equal(resolveCrapsRoll('pass', null, [1, 1]).outcome, 'loss');
  assert.equal(resolveCrapsRoll('pass', null, [2, 3]).point, 5);
});
test('포인트 이후 포인트 또는 7로 승패를 판정한다', () => {
  assert.equal(resolveCrapsRoll('pass', 6, [3, 3]).outcome, 'win');
  assert.equal(resolveCrapsRoll('pass', 6, [3, 4]).outcome, 'loss');
  assert.equal(resolveCrapsRoll('dontPass', 6, [3, 4]).outcome, 'win');
});
test('돈트 패스 12는 무승부다', () => assert.equal(resolveCrapsRoll('dontPass', null, [6, 6]).outcome, 'push'));
test('필드는 한 번 굴리며 2와 12는 두 배 수익이다', () => {
  const result = resolveCrapsRoll('field', null, [1, 1]);
  assert.equal(result.outcome, 'win');
  assert.equal(crapsNet('field', 500, result), 1000);
  assert.equal(resolveCrapsRoll('field', null, [3, 4]).outcome, 'loss');
});

const roll = (table: CrapsTable, a: number, b: number) => rollCrapsTable(table, [a, b]);

test('패스 라인 + 오즈: 포인트 6으로 이기면 오즈는 6:5를 받는다', () => {
  let table = commitCrapsBets(newCrapsTable(), { pass: 100 });
  table = roll(table, 2, 4).table;
  assert.equal(table.point, 6);
  assert.equal(crapsCannotBet(table, 'passOdds', 300), null);
  assert.notEqual(crapsCannotBet(table, 'passOdds', 400), null);
  table = commitCrapsBets(table, { passOdds: 300 });
  const { resolutions, table: after } = roll(table, 5, 1);
  assert.equal(after.point, null);
  assert.deepEqual(resolutions, [{ label: '패스 라인+오즈', stake: 400, payout: 200 + 660, outcome: 'win' }]);
});

test('패스 라인과 돈트 패스는 컴아웃에만, 컴과 오즈는 포인트가 있을 때만 건다', () => {
  const empty = newCrapsTable();
  assert.equal(crapsCannotBet(empty, 'pass', 100), null);
  assert.notEqual(crapsCannotBet(empty, 'come', 100), null);
  assert.notEqual(crapsCannotBet(empty, 'passOdds', 100), null);
  const withPoint = { point: 5, wagers: [] };
  assert.notEqual(crapsCannotBet(withPoint, 'pass', 100), null);
  assert.equal(crapsCannotBet(withPoint, 'come', 100), null);
  assert.equal(crapsCannotBet(withPoint, 'place6', 100), null);
});

test('컴은 다음 숫자로 옮겨 갔다가 그 숫자가 7보다 먼저 나오면 이긴다', () => {
  let table = commitCrapsBets({ point: 5, wagers: [] }, { come: 100 });
  table = roll(table, 4, 4).table;
  assert.deepEqual(table.wagers, [{ kind: 'come', stake: 100, number: 8, odds: 0 }]);
  table = commitCrapsBets(table, { comeOdds8: 200 });
  const { resolutions } = roll(table, 6, 2);
  assert.deepEqual(resolutions, [{ label: '컴 8+오즈', stake: 300, payout: 200 + 440, outcome: 'win' }]);
});

test('컴은 첫 굴림 7·11이면 바로 이기고 2·3·12면 바로 진다', () => {
  const table = commitCrapsBets({ point: 5, wagers: [] }, { come: 100 });
  assert.equal(roll(table, 5, 6).resolutions[0].payout, 200);
  assert.equal(roll(table, 1, 1).resolutions[0].outcome, 'loss');
});

test('컴아웃 7에 컴은 지지만 쉬고 있던 오즈는 돌려받는다', () => {
  const table: CrapsTable = { point: null, wagers: [{ kind: 'come', stake: 100, number: 9, odds: 200 }] };
  assert.deepEqual(roll(table, 3, 4).resolutions, [{ label: '컴 9+오즈', stake: 300, payout: 200, outcome: 'loss' }]);
});

test('플레이스: 6은 7:6, 4는 9:5이고 7이 먼저 나오면 진다', () => {
  const table = commitCrapsBets({ point: 5, wagers: [] }, { place6: 600, place4: 100 });
  const six = roll(table, 3, 3);
  assert.deepEqual(six.resolutions, [{ label: '플레이스 6', stake: 600, payout: 1300, outcome: 'win' }]);
  assert.equal(six.table.wagers.length, 1);
  assert.equal(roll(table, 2, 2).resolutions[0].payout, 280);
  assert.equal(roll(table, 3, 4).resolutions.filter((item) => item.outcome === 'loss').length, 2);
});

test('하드웨이: 같은 눈 두 개로만 이기고 다른 조합이나 7이면 진다', () => {
  const table = commitCrapsBets({ point: 5, wagers: [] }, { hard8: 100 });
  assert.equal(roll(table, 4, 4).resolutions[0].payout, 1000);
  assert.equal(roll(table, 5, 3).resolutions[0].outcome, 'loss');
  assert.equal(roll(table, 6, 1).resolutions[0].outcome, 'loss');
  assert.equal(roll(table, 6, 3).resolutions.length, 0);
  assert.equal(roll(table, 4, 10 - 4).resolutions.length, 0);
});

test('플레이스와 하드웨이는 컴아웃에서 쉰다', () => {
  const table = commitCrapsBets(newCrapsTable(), { place8: 100, hard8: 100 });
  const { resolutions, table: after } = roll(table, 3, 4);
  assert.equal(resolutions.length, 0);
  assert.equal(after.wagers.length, 2);
  assert.equal(roll(table, 4, 4).resolutions.length, 0);
});

test('필드는 한 번에 끝나고 2·12는 두 배 수익이다', () => {
  const table = commitCrapsBets({ point: 5, wagers: [] }, { field: 100 });
  assert.equal(roll(table, 6, 6).resolutions[0].payout, 300);
  assert.equal(roll(table, 2, 2).resolutions[0].payout, 200);
  assert.equal(roll(table, 3, 2).resolutions[0].outcome, 'loss');
});

test('떠나면 패스 라인 · 컴 원금만 잃고 나머지는 돌려받는다', () => {
  const table: CrapsTable = { point: 6, wagers: [
    { kind: 'pass', stake: 100, odds: 200 }, { kind: 'place', stake: 100, number: 8, odds: 0 }, { kind: 'hard', stake: 50, number: 4, odds: 0 },
  ] };
  const back = leaveCrapsTable(table);
  assert.equal(back.reduce((sum, item) => sum + item.payout, 0), 200 + 100 + 50);
  assert.equal(crapsLockedStake(table), 100);
});

test('같은 자리에 또 걸면 금액이 더해진다', () => {
  const table = commitCrapsBets(commitCrapsBets({ point: 5, wagers: [] }, { place9: 100 }), { place9: 200 });
  assert.deepEqual(table.wagers, [{ kind: 'place', stake: 300, number: 9, odds: 0 }]);
});
