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
  dealTableRound,
  playGuestHand,
  guestResult,
  shuffleDeck,
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

test('스플릿한 손의 21은 블랙잭이 아니라 일반 승리로 정산한다', () => {
  const twentyOne = [card('A'), card('10', '♥')];
  const dealerStands = [card('9', '♦'), card('8', '♣')];

  // 첫 손이면 블랙잭 → 2.5배
  assert.equal(resolveRound(twentyOne, dealerStands), 'blackjack');
  assert.equal(payoutForResult(1000, resolveRound(twentyOne, dealerStands)), 2500);

  // 스플릿한 손이면 일반 21 → 2배
  assert.equal(resolveRound(twentyOne, dealerStands, false), 'win');
  assert.equal(payoutForResult(1000, resolveRound(twentyOne, dealerStands, false)), 2000);
});

test('스플릿한 손의 21도 딜러 블랙잭에는 진다', () => {
  const twentyOne = [card('A'), card('10', '♥')];
  const dealerBlackjack = [card('A', '♦'), card('K', '♣')];

  assert.equal(resolveRound(twentyOne, dealerBlackjack), 'push');
  assert.equal(resolveRound(twentyOne, dealerBlackjack, false), 'loss');
});

test('손님 몫까지 같이 돌리고 딜러가 마지막에 받는다', () => {
  const deck = shuffleDeck(createDeck(), () => 0.4);
  const dealt = dealTableRound(deck, 2);
  assert.equal(dealt.player.length, 2);
  assert.equal(dealt.guests.length, 2);
  assert.equal(dealt.guests.every((hand) => hand.length === 2), true);
  assert.equal(dealt.dealer.length, 2);
  // 같은 카드가 두 자리에 가면 안 됩니다.
  const ids = [...dealt.player, ...dealt.guests.flat(), ...dealt.dealer].map((card) => card.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(dealt.deck.length, deck.length - 8);
  // 손님이 없으면 예전과 똑같습니다.
  const alone = dealTableRound(deck, 0);
  assert.equal(alone.guests.length, 0);
  assert.equal(alone.deck.length, deck.length - 4);
});

test('손님은 17 미만이면 더 받고 17부터 멈춘다', () => {
  const deck = shuffleDeck(createDeck(), () => 0.31);
  const played = playGuestHand(deck, [
    { id: 'g1', suit: '♠', rank: '5' },
    { id: 'g2', suit: '♥', rank: '6' },
  ]);
  assert.equal(handValue(played.hand) >= 17 || played.hand.length > 2, true);
  // 이미 17이면 한 장도 안 받습니다.
  const stands = playGuestHand(deck, [
    { id: 'g3', suit: '♠', rank: '10' },
    { id: 'g4', suit: '♥', rank: '7' },
  ]);
  assert.equal(stands.hand.length, 2);
  assert.equal(stands.deck.length, deck.length);
});

test('손님과 딜러를 견주는 규칙은 나와 같다', () => {
  const two = (a: string, b: string) => [
    { id: a + '1', suit: '♠' as const, rank: a as never },
    { id: b + '2', suit: '♥' as const, rank: b as never },
  ];
  assert.equal(guestResult(two('10', '9'), two('10', '8')), 'win');
  assert.equal(guestResult(two('10', '8'), two('10', '9')), 'loss');
  assert.equal(guestResult(two('10', '9'), two('10', '9')), 'push');
  assert.equal(guestResult(two('A', 'K'), two('10', '9')), 'blackjack');
  // 21을 넘기면 딜러가 무엇이든 집니다.
  assert.equal(guestResult([...two('10', '9'), { id: 'x', suit: '♦', rank: '5' }], two('10', '2')), 'loss');
});
