import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePachislot, evaluateSlot, randomSlotSymbol, spinPachislotReels } from '../src/slot.ts';

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

test('파치슬롯 릴 3개를 만든다', () => {
  assert.deepEqual(spinPachislotReels(() => 0), ['🍒', '🍒', '🍒']);
});

test('파치슬롯 리플레이는 다음 회전을 무료로 만든다', () => {
  assert.equal(evaluatePachislot(['🔁', '🔁', '🔁'], 100).replay, true);
});

test('파치슬롯 BIG과 REGULAR 보너스를 판정한다', () => {
  assert.equal(evaluatePachislot(['7️⃣', '7️⃣', '7️⃣'], 100).bonusSpins, 8);
  assert.equal(evaluatePachislot(['🔔', '🔔', '🔔'], 100).bonusSpins, 4);
});

test('조커는 서로 다른 그림 사이에서도 2개 보너스를 만든다', () => {
  const result = evaluateSlot(['👑', '💎', '🃏'], 100);
  assert.equal(result.multiplier, 1.5);
  assert.equal(result.payout, 150);
});

test('조커 없이 모두 다르면 당첨이 없다', () => {
  assert.equal(evaluateSlot(['👑', '💎', '🍒'], 100).payout, 0);
});
