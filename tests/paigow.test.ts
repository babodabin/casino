import test from 'node:test';
import assert from 'node:assert/strict';
import type { Card, Rank, Suit } from '../src/blackjack.ts';
import { arrangePaiGow, comparePaiGowTwo, dealPaiGow, dealPaiGowTable, evaluatePaiGowTwo, isValidPaiGowSplit, resolvePaiGow, splitPaiGow } from '../src/paigow.ts';

const card=(rank:Rank,suit:Suit='♠'):Card=>({id:`${suit}-${rank}`,rank,suit});

test('두 장은 페어가 하이 카드보다 강하다',()=>{
  assert.equal(comparePaiGowTwo(evaluatePaiGowTwo([card('8'),card('8','♥')]),evaluatePaiGowTwo([card('A'),card('K','♥')])),1);
});
test('하이 핸드가 로우 핸드보다 약한 파울 배치를 막는다',()=>{
  assert.equal(isValidPaiGowSplit([card('A'),card('Q','♥'),card('9','♦'),card('6','♣'),card('3')],[card('2'),card('2','♥')]),false);
});
test('자동 하우스 웨이는 유효한 5장과 2장을 만든다',()=>{
  const cards=[card('A'),card('A','♥'),card('K'),card('Q'),card('J'),card('10'),card('2')];
  const split=arrangePaiGow(cards);
  assert.equal(split.high.length,5);assert.equal(split.low.length,2);assert.equal(isValidPaiGowSplit(split.high,split.low),true);
  assert.deepEqual(splitPaiGow(cards,split.low.map(item=>item.id)).low.map(item=>item.id).sort(),split.low.map(item=>item.id).sort());
});
test('양쪽을 모두 이겨야 승리하고 하나씩 이기면 무승부다',()=>{
  const player=arrangePaiGow([card('A'),card('A','♥'),card('K'),card('K','♥'),card('Q'),card('J'),card('10')]);
  const dealer=arrangePaiGow([card('9'),card('9','♥'),card('8'),card('8','♥'),card('7'),card('6'),card('5')]);
  assert.equal(resolvePaiGow(player,dealer).result,'win');
});
test('두 사람에게 나눠 준 14장은 겹치지 않는다',()=>{
  const dealt=dealPaiGow(()=>0.42),all=[...dealt.player,...dealt.dealer];
  assert.equal(new Set(all.map(item=>item.id)).size,14);
});

test('손님까지 같이 돌리고 아무도 같은 카드를 안 받는다', () => {
  const table = dealPaiGowTable(2, () => 0.37);
  assert.equal(table.player.length, 7);
  assert.equal(table.guests.length, 2);
  assert.equal(table.guests.every((hand) => hand.length === 7), true);
  assert.equal(table.dealer.length, 7);
  const ids = [...table.player, ...table.guests.flat(), ...table.dealer].map((card) => card.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('한 벌로 앉을 수 있는 자리까지만 앉힌다', () => {
  // 52장에 일곱 장씩이면 나와 딜러 말고 손님은 넷까지입니다.
  const full = dealPaiGowTable(9, () => 0.5);
  assert.equal(full.guests.length, 4);
  assert.equal(full.dealer.length, 7);
  const ids = [...full.player, ...full.guests.flat(), ...full.dealer].map((card) => card.id);
  assert.equal(new Set(ids).size, 42);
});
