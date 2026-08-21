import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLow, resolveHighLow } from '../src/highlow.ts';
import type { Card } from '../src/blackjack.ts';

const cards = (ranks: string[]): Card[] => ranks.map((rank, index) => ({ id: `${rank}-${index}`, rank: rank as Card['rank'], suit: ['♠','♥','♦','♣'][index % 4] as Card['suit'] }));

test('8 이하 서로 다른 다섯 장만 로우 패가 된다', () => {
  assert.equal(evaluateLow(cards(['A','2','3','4','8','K','K']))?.label, '8 로우');
  assert.equal(evaluateLow(cards(['2','3','4','5','9','K','K'])), null);
});

test('A2345가 가장 강한 로우 패다', () => {
  assert.deepEqual(evaluateLow(cards(['A','2','3','4','5','7','8']))?.values, [5,4,3,2,1]);
});

test('하이와 로우를 나누어 팟 지분을 계산한다', () => {
  const result = resolveHighLow(cards(['A','2','3','4','5','K','K']), cards(['2','3','4','5','8','Q','Q']));
  assert.equal(result.highWinner, 'player');
  assert.equal(result.lowWinner, 'player');
  assert.equal(result.share, 1);
  assert.equal(result.result, 'win');
});
