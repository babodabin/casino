import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDeck,
  canSplit,
  handValue,
  insurancePayout,
  insuranceStake,
  isBlackjack,
  netForResult,
  payoutForResult,
  playDealer,
  resolveRound,
  type Card,
} from '../src/blackjack.ts';

const card = (rank: Card['rank'], suit: Card['suit'] = '♠'): Card => ({ id: `${suit}-${rank}`, rank, suit });

test('52장의 중복 없는 덱을 만든다', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((item) => item.id)).size, 52);
});

test('에이스를 1 또는 11로 계산한다', () => {
  assert.equal(handValue([card('A'), card('9')]), 20);
  assert.equal(handValue([card('A'), card('9'), card('8')]), 18);
  assert.equal(handValue([card('A'), card('A'), card('9')]), 21);
});

test('두 장으로 21이면 블랙잭이다', () => {
  assert.equal(isBlackjack([card('A'), card('K')]), true);
  assert.equal(isBlackjack([card('7'), card('7'), card('7')]), false);
});

test('딜러는 17 이상에서 멈춘다', () => {
  const result = playDealer([card('5'), card('10')], [card('10'), card('2')]);
  assert.equal(handValue(result.hand), 17);
  assert.equal(result.hand.length, 3);
});

test('승패와 무승부를 판정한다', () => {
  assert.equal(resolveRound([card('10'), card('9')], [card('10'), card('8')]), 'win');
  assert.equal(resolveRound([card('10'), card('8')], [card('10'), card('9')]), 'loss');
  assert.equal(resolveRound([card('10'), card('8')], [card('9'), card('9')]), 'push');
  assert.equal(resolveRound([card('10'), card('8'), card('5')], [card('10'), card('7')]), 'loss');
});

test('일반 승리와 블랙잭 보상을 계산한다', () => {
  assert.equal(payoutForResult(100, 'win'), 200);
  assert.equal(payoutForResult(100, 'blackjack'), 250);
  assert.equal(netForResult(100, 'win'), 100);
  assert.equal(netForResult(100, 'loss'), -100);
  assert.equal(netForResult(100, 'push'), 0);
});

test('더블다운은 두 배가 된 전체 베팅으로 정산한다', () => {
  const doubledBet = 200;
  assert.equal(payoutForResult(doubledBet, 'win'), 400);
  assert.equal(netForResult(doubledBet, 'win'), 200);
  assert.equal(netForResult(doubledBet, 'loss'), -200);
  assert.equal(netForResult(doubledBet, 'push'), 0);
});

test('같은 값의 첫 두 장만 스플릿할 수 있다', () => {
  assert.equal(canSplit([card('8'), card('8')]), true);
  assert.equal(canSplit([card('10'), card('K')]), true);
  assert.equal(canSplit([card('8'), card('9')]), false);
  assert.equal(canSplit([card('8'), card('8'), card('8')]), false);
});

test('보험은 원래 베팅의 절반이며 딜러 블랙잭이면 2대1 이익을 지급한다', () => {
  assert.equal(insuranceStake(500), 250);
  assert.equal(insuranceStake(25), 12);
  assert.equal(insurancePayout(250, true), 750);
  assert.equal(insurancePayout(250, false), 0);
});
