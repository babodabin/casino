import test from 'node:test';
import assert from 'node:assert/strict';
import { baccaratCardValue, baccaratNet, baccaratScore, bankerDraws, dealBaccaratRound } from '../src/baccarat.ts';
import type { Card } from '../src/blackjack.ts';

const card = (rank: Card['rank'], id = rank): Card => ({ rank, suit: '♠', id });

test('바카라 카드 점수는 일의 자리만 사용한다', () => {
  assert.equal(baccaratCardValue(card('K')), 0);
  assert.equal(baccaratScore([card('7'), card('8')]), 5);
});

test('뱅커 세 번째 카드 규칙을 적용한다', () => {
  assert.equal(bankerDraws(3, card('8')), false);
  assert.equal(bankerDraws(4, card('2')), true);
  assert.equal(bankerDraws(6, card('7')), true);
  assert.equal(bankerDraws(6, card('5')), false);
});

test('한 판 결과는 플레이어, 뱅커, 타이 중 하나다', () => {
  const round = dealBaccaratRound();
  assert.ok(['player', 'banker', 'tie'].includes(round.winner));
  assert.ok(round.player.length >= 2 && round.player.length <= 3);
  assert.ok(round.banker.length >= 2 && round.banker.length <= 3);
});

test('플레이어, 뱅커 수수료, 타이 배당을 계산한다', () => {
  assert.equal(baccaratNet('player', 500, 'player'), 500);
  assert.equal(baccaratNet('banker', 500, 'banker'), 475);
  assert.equal(baccaratNet('tie', 500, 'tie'), 4000);
  assert.equal(baccaratNet('player', 500, 'tie'), 0);
  assert.equal(baccaratNet('player', 500, 'banker'), -500);
});
