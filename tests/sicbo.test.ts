import assert from 'node:assert/strict';
import test from 'node:test';
import { rollSicBo, sicBoPayout } from '../src/sicbo.ts';

test('식보는 주사위 3개를 굴린다', () => assert.deepEqual(rollSicBo(() => 0), [1, 1, 1]));
test('대소와 홀짝은 트리플이면 진다', () => {
  assert.equal(sicBoPayout({ type: 'big' }, 100, [4, 4, 4]), 0);
  assert.equal(sicBoPayout({ type: 'even' }, 100, [2, 2, 2]), 0);
  assert.equal(sicBoPayout({ type: 'small' }, 100, [2, 3, 4]), 200);
});
test('특정 합계 배당을 계산한다', () => assert.equal(sicBoPayout({ type: 'total', value: 4 }, 100, [1, 1, 2]), 5100));
test('특정 숫자는 나온 개수에 따라 배당한다', () => {
  assert.equal(sicBoPayout({ type: 'single', value: 3 }, 100, [3, 3, 5]), 300);
  assert.equal(sicBoPayout({ type: 'double', value: 3 }, 100, [3, 3, 5]), 1200);
  assert.equal(sicBoPayout({ type: 'triple', value: 3 }, 100, [3, 3, 3]), 18100);
});
