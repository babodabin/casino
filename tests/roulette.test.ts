import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidRouletteBet, rouletteBetLabel, rouletteInsideOptions, rouletteTargets, rouletteBetWins, rouletteColor, rouletteCornersOf, rouletteMultiplier, rouletteNet, roulettePayout, rouletteSixLinesOf, rouletteSplitsOf, rouletteStreetOf, spinRoulette, type RouletteBet } from '../src/roulette.ts';

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

test('안쪽 베팅은 판에서 붙어 있는 칸끼리만 된다', () => {
  assert.deepEqual(rouletteSplitsOf(5), [[4, 5], [5, 6], [2, 5], [5, 8]]);
  assert.deepEqual(rouletteSplitsOf(0), [[0, 1], [0, 2], [0, 3]]);
  assert.deepEqual(rouletteStreetOf(14), [13, 14, 15]);
  assert.deepEqual(rouletteCornersOf(1), [[1, 2, 4, 5]]);
  assert.equal(rouletteCornersOf(5).length, 4);
  assert.deepEqual(rouletteSixLinesOf(1), [[1, 2, 3, 4, 5, 6]]);
  assert.equal(rouletteSixLinesOf(20).length, 2);
  assert.equal(isValidRouletteBet({ type: 'split', numbers: [3, 4] }), false);
  assert.equal(isValidRouletteBet({ type: 'split', numbers: [3, 6] }), true);
  assert.equal(isValidRouletteBet({ type: 'corner', numbers: [2, 3, 5, 6] }), true);
  assert.equal(isValidRouletteBet({ type: 'corner', numbers: [3, 4, 6, 7] }), false);
});

test('배당은 36을 덮는 숫자 개수로 나눈 값이다', () => {
  assert.equal(rouletteMultiplier({ type: 'split', numbers: [1, 2] }), 18);
  assert.equal(rouletteMultiplier({ type: 'street', numbers: [1, 2, 3] }), 12);
  assert.equal(rouletteMultiplier({ type: 'corner', numbers: [1, 2, 4, 5] }), 9);
  assert.equal(rouletteMultiplier({ type: 'sixline', numbers: [1, 2, 3, 4, 5, 6] }), 6);
  assert.equal(rouletteMultiplier({ type: 'column2' }), 3);
  assert.equal(rouletteMultiplier({ type: 'red' }), 2);
  assert.equal(rouletteBetWins({ type: 'column1' }, 34), true);
  assert.equal(rouletteBetWins({ type: 'column1' }, 0), false);
  assert.equal(roulettePayout({ type: 'corner', numbers: [1, 2, 4, 5] }, 100, 4), 900);
});

test('어느 칸이든 환급률은 36/37이다', () => {
  const bets: RouletteBet[] = [
    { type: 'straight', number: 7 }, { type: 'split', numbers: [0, 2] }, { type: 'street', numbers: [4, 5, 6] },
    { type: 'corner', numbers: [8, 9, 11, 12] }, { type: 'sixline', numbers: [31, 32, 33, 34, 35, 36] },
    { type: 'column3' }, { type: 'dozen1' }, { type: 'black' }, { type: 'low' },
  ];
  for (const bet of bets) {
    let returned = 0;
    for (let number = 0; number <= 36; number += 1) returned += roulettePayout(bet, 1, number);
    assert.equal(returned, 36, bet.type);
  }
});

test('이름', () => {
  assert.equal(rouletteBetLabel({ type: 'split', numbers: [2, 1] }), '스플릿 1·2');
  assert.equal(rouletteBetLabel({ type: 'sixline', numbers: [7, 8, 9, 10, 11, 12] }), '식스 라인 7~12');
  assert.equal(rouletteBetLabel({ type: 'column2' }), '세로 2줄');
  assert.equal(rouletteBetLabel({ type: 'straight', number: 0 }), '숫자 0');
});

test('두 번째로 누를 칸은 하나의 묶음으로만 정해진다', () => {
  assert.deepEqual([...rouletteTargets('split', 5).keys()].sort((a, b) => a - b), [2, 4, 6, 8]);
  assert.deepEqual(rouletteTargets('corner', 5).get(9), [5, 6, 8, 9]);
  assert.deepEqual(rouletteTargets('corner', 5).get(1), [1, 2, 4, 5]);
  assert.equal(rouletteTargets('corner', 5).has(6), false);
  assert.deepEqual(rouletteTargets('sixline', 5).get(1), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(rouletteTargets('sixline', 5).get(9), [4, 5, 6, 7, 8, 9]);
  assert.deepEqual(rouletteInsideOptions('corner', 1), [[1, 2, 4, 5]]);
  assert.deepEqual(rouletteInsideOptions('street', 0), []);
});
