import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateSlot, randomSlotSymbol } from '../src/slot.ts';

test('난수로 슬롯 그림을 선택한다', () => {
  assert.equal(randomSlotSymbol(() => 0), '🍒');
  assert.equal(randomSlotSymbol(() => 0.999), '👑');
});

test('같은 그림 2개는 작은 보너스를 지급한다', () => {
  const result = evaluateSlot(['🍒', '🍒', '🍋'], 100);
  assert.equal(result.payout, 150);
  assert.equal(result.multiplier, 1.5);
});

test('같은 그림 3개는 그림별 배당을 지급한다', () => {
  assert.equal(evaluateSlot(['💎', '💎', '💎'], 100).payout, 1500);
  assert.equal(evaluateSlot(['👑', '👑', '👑'], 100).payout, 5000);
});

test('조커는 다른 그림을 대신한다', () => {
  assert.equal(evaluateSlot(['🔔', '🃏', '🔔'], 100).payout, 800);
});

test('별 3개는 무료 회전 5회를 준다', () => {
  assert.equal(evaluateSlot(['⭐', '⭐', '⭐'], 100).freeSpins, 5);
});
