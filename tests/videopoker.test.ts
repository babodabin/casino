import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVideoPoker, exchangeVideoPoker } from '../src/videopoker.ts';
import type { Card, Rank, Suit } from '../src/blackjack.ts';

const hand = (ranks: Rank[], suits: Suit[] = ['♠', '♥', '♦', '♣', '♠']) => ranks.map((rank, index) => ({ id: `${suits[index]}-${rank}`, rank, suit: suits[index] }));

test('비디오 포커의 주요 족보와 배당을 판정한다', () => {
  assert.equal(evaluateVideoPoker(hand(['10','J','Q','K','A'], ['♠','♠','♠','♠','♠'])).multiplier, 250);
  assert.equal(evaluateVideoPoker(hand(['9','9','9','9','2'])).multiplier, 25);
  assert.equal(evaluateVideoPoker(hand(['K','K','3','3','3'])).multiplier, 9);
  assert.equal(evaluateVideoPoker(hand(['J','J','3','6','9'])).multiplier, 1);
  assert.equal(evaluateVideoPoker(hand(['10','10','3','6','9'])).multiplier, 0);
});

test('보관하지 않은 카드만 교환한다', () => {
  const original = hand(['A','K','Q','J','2']);
  const deck: Card[] = hand(['10','9','8','7','6']);
  const result = exchangeVideoPoker(original, deck, [true, true, true, true, false]);
  assert.deepEqual(result.hand.map((card) => card.rank), ['A','K','Q','J','10']);
});
