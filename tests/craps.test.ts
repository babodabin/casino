import test from 'node:test';
import assert from 'node:assert/strict';
import { crapsNet, resolveCrapsRoll } from '../src/craps.ts';

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
