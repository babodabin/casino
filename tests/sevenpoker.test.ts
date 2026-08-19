import test from 'node:test';
import assert from 'node:assert/strict';
import { dealSevenPoker, resolveSevenPoker } from '../src/sevenpoker.ts';
import type { Card, Rank, Suit } from '../src/blackjack.ts';

const cards = (values: Array<[Rank, Suit]>): Card[] => values.map(([rank, suit], index) => ({ id: `${suit}-${rank}-${index}`, rank, suit }));

test('세븐 포커는 각자 중복 없는 카드 7장을 받는다', () => {
  const deal = dealSevenPoker(() => 0.5);
  assert.equal(deal.player.length, 7);
  assert.equal(deal.opponent.length, 7);
  assert.equal(new Set([...deal.player, ...deal.opponent].map((card) => card.id)).size, 14);
});

test('각자의 7장 중 가장 높은 5장으로 승패를 정한다', () => {
  const player = cards([['A','♠'],['K','♠'],['Q','♠'],['J','♠'],['10','♠'],['2','♥'],['3','♦']]);
  const opponent = cards([['9','♠'],['9','♥'],['9','♦'],['4','♣'],['4','♠'],['A','♥'],['K','♦']]);
  const result = resolveSevenPoker(player, opponent);
  assert.equal(result.result, 'win');
  assert.equal(result.playerHand.label, '로열 플러시');
  assert.equal(result.opponentHand.label, '풀하우스');
});
