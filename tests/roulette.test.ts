import assert from 'node:assert/strict';
import test from 'node:test';
import { rouletteBetWins, rouletteColor, rouletteMultiplier, rouletteNet, roulettePayout, spinRoulette } from '../src/roulette.ts';

test('룰렛 숫자는 0부터 36까지 나온다', () => {
  assert.equal(spinRoulette(() => 0), 0);
  assert.equal(spinRoulette(() => 0.999999), 36);
});

test('유럽식 룰렛 색상을 판정한다', () => {
  assert.equal(rouletteColor(0), 'green');
  assert.equal(rouletteColor(1), 'red');
  assert.equal(rouletteColor(2), 'black');
});

test('색상, 홀짝, 구간 베팅을 판정한다', () => {
  assert.equal(rouletteBetWins({ type: 'red' }, 3), true);
  assert.equal(rouletteBetWins({ type: 'even' }, 14), true);
  assert.equal(rouletteBetWins({ type: 'low' }, 18), true);
  assert.equal(rouletteBetWins({ type: 'high' }, 19), true);
  assert.equal(rouletteBetWins({ type: 'dozen2' }, 24), true);
  assert.equal(rouletteBetWins({ type: 'red' }, 0), false);
});

test('단일 숫자와 배당을 계산한다', () => {
  assert.equal(rouletteBetWins({ type: 'straight', number: 17 }, 17), true);
  assert.equal(rouletteMultiplier({ type: 'straight', number: 17 }), 36);
  assert.equal(roulettePayout({ type: 'straight', number: 17 }, 100, 17), 3600);
  assert.equal(rouletteNet({ type: 'red' }, 100, 3), 100);
  assert.equal(rouletteNet({ type: 'red' }, 100, 2), -100);
});
