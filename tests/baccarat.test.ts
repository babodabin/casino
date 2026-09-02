import test from 'node:test';
import assert from 'node:assert/strict';
import { baccaratCardValue, baccaratNet, baccaratScore, bankerDraws, dealBaccaratRound, drawBaccaratGuestBet, seatBaccaratGuests } from '../src/baccarat.ts';
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

test('같은 판에 손님 셋이 앉고 각자 다른 곳에 걸 수 있다', () => {
  // 난수를 정해 주면 같은 자리가 나옵니다.
  let step = 0;
  const rolls = [0.2, 0.0, 0.6, 0.5, 0.95, 0.99];
  const random = () => rolls[step++ % rolls.length];
  const guests = seatBaccaratGuests(500, random);
  assert.equal(guests.length, 3);
  assert.deepEqual(guests.map((guest) => guest.bet), ['banker', 'player', 'tie']);
  assert.equal(guests.every((guest) => guest.stake > 0), true);
  assert.deepEqual(guests.map((guest) => guest.name), ['손님 1', '손님 2', '손님 3']);
});

test('손님은 뱅커에 조금 더 많이 건다', () => {
  const count = { player: 0, banker: 0, tie: 0 };
  for (let index = 0; index < 3000; index += 1) {
    count[drawBaccaratGuestBet(() => (index * 0.000333) % 1)] += 1;
  }
  assert.equal(count.banker > count.player, true);
  assert.equal(count.player > count.tie, true);
});
