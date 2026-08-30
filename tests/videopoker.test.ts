import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVideoPoker, exchangeVideoPoker, videoPokerMadeCards } from '../src/videopoker.ts';
import type { Card, Rank, Suit } from '../src/blackjack.ts';

const hand = (ranks: Rank[], suits: Suit[] = ['♠', '♥', '♦', '♣', '♠']) => ranks.map((rank, index) => ({ id: `${suits[index]}-${rank}`, rank, suit: suits[index] }));

test('비디오 포커의 주요 족보와 배당을 판정한다', () => {
  assert.equal(evaluateVideoPoker(hand(['10','J','Q','K','A'], ['♠','♠','♠','♠','♠'])).multiplier, 250);
  assert.equal(evaluateVideoPoker(hand(['9','9','9','9','2'])).multiplier, 25);
  assert.equal(evaluateVideoPoker(hand(['K','K','3','3','3'])).multiplier, 9);
  assert.equal(evaluateVideoPoker(hand(['J','J','3','6','9'])).multiplier, 1);
  assert.equal(evaluateVideoPoker(hand(['10','10','3','6','9'])).multiplier, 0);
});

test('족보를 이루는 카드만 골라낸다', () => {
  const ids = (cards: Card[]) => cards.map((card) => card.rank).sort().join(',');
  // 다섯 장을 다 쓰는 족보는 다섯 장 그대로입니다.
  assert.equal(videoPokerMadeCards(hand(['10','J','Q','K','A'], ['♠','♠','♠','♠','♠'])).length, 5);
  assert.equal(videoPokerMadeCards(hand(['2','3','4','5','6'])).length, 5);
  assert.equal(videoPokerMadeCards(hand(['K','K','3','3','3'])).length, 5);
  // 짝으로 되는 족보는 짝이 된 카드만입니다.
  assert.equal(ids(videoPokerMadeCards(hand(['9','9','9','9','2']))), '9,9,9,9');
  assert.equal(ids(videoPokerMadeCards(hand(['7','7','7','4','2']))), '7,7,7');
  assert.equal(ids(videoPokerMadeCards(hand(['8','8','5','5','2']))), '5,5,8,8');
  assert.equal(ids(videoPokerMadeCards(hand(['J','J','3','6','9']))), 'J,J');
  // 당첨이 아니면 번쩍일 카드가 없습니다.
  assert.deepEqual(videoPokerMadeCards(hand(['10','10','3','6','9'])), []);
});

test('보관하지 않은 카드만 교환한다', () => {
  const original = hand(['A','K','Q','J','2']);
  const deck: Card[] = hand(['10','9','8','7','6']);
  const result = exchangeVideoPoker(original, deck, [true, true, true, true, false]);
  assert.deepEqual(result.hand.map((card) => card.rank), ['A','K','Q','J','10']);
});
