import assert from 'node:assert/strict';
import test from 'node:test';
import { carTicketPayout, createCarField, simulateCarRace } from '../src/carracing.ts';

test('자동차 레이스에는 서로 다른 여섯 브랜드가 출전한다', () => {
  const cars = createCarField();
  assert.equal(cars.length, 6);
  assert.equal(new Set(cars.map(car => car.brand)).size, 6);
  assert.ok(cars.every(car => car.odds > 1));
});

test('레이스 결과에는 모든 차량이 중복 없이 기록된다', () => {
  const result = simulateCarRace(createCarField(), () => .5);
  assert.deepEqual([...result.order].sort(), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...result.midRaceOrder].sort(), [1, 2, 3, 4, 5, 6]);
  assert.equal(Object.keys(result.times).length, 6);
});

test('선택한 차량이 우승할 때만 배당을 지급한다', () => {
  const result = { order: [3, 2, 1, 4, 5, 6], midRaceOrder: [2, 3, 1, 4, 5, 6], times: {} };
  assert.equal(carTicketPayout({ selection: 3, stake: 100, odds: 3.1 }, result), 310);
  assert.equal(carTicketPayout({ selection: 2, stake: 100, odds: 3.4 }, result), 0);
});
