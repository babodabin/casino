import test from 'node:test';
import assert from 'node:assert/strict';
import { countByKind, countRibbons, createHwatuDeck, isRainBright, monthNames, pieceValue, shuffleHwatu } from '../src/hwatu.ts';

const deck = createHwatuDeck();

test('화투 한 벌은 48장이고 월마다 4장씩이다', () => {
  assert.equal(deck.length, 48);
  for (let month = 1; month <= 12; month += 1) {
    assert.equal(deck.filter((card) => card.month === month).length, 4, `${month}월이 4장이 아닙니다`);
  }
});

test('종류별 장수가 실제 화투와 같다', () => {
  const counts = { 광: 0, 열끗: 0, 띠: 0, 피: 0 };
  deck.forEach((card) => { counts[card.kind] += 1; });
  assert.deepEqual(counts, { 광: 5, 열끗: 9, 띠: 10, 피: 24 });
});

test('광은 1·3·8·11·12월에만 있다', () => {
  const months = deck.filter((card) => card.kind === '광').map((card) => card.month).sort((a, b) => a - b);
  assert.deepEqual(months, [1, 3, 8, 11, 12]);
});

test('열끗은 2·4·5·6·7·8·9·10·12월에 있다', () => {
  const months = deck.filter((card) => card.kind === '열끗').map((card) => card.month).sort((a, b) => a - b);
  assert.deepEqual(months, [2, 4, 5, 6, 7, 8, 9, 10, 12]);
});

test('띠는 홍단 3 · 청단 3 · 초단 3 · 비띠 1이다', () => {
  assert.deepEqual(countRibbons(deck), { 홍단: 3, 청단: 3, 초단: 3, 비띠: 1 });
});

test('홍단은 1·2·3월, 청단은 6·9·10월이다', () => {
  const of = (kind: string) => deck.filter((card) => card.ribbon === kind).map((card) => card.month).sort((a, b) => a - b);
  assert.deepEqual(of('홍단'), [1, 2, 3]);
  assert.deepEqual(of('청단'), [6, 9, 10]);
  assert.deepEqual(of('초단'), [4, 5, 7]);
});

test('쌍피는 11월과 12월에 한 장씩이다', () => {
  const doubles = deck.filter((card) => card.double);
  assert.equal(doubles.length, 2);
  assert.deepEqual(doubles.map((card) => card.month).sort((a, b) => a - b), [11, 12]);
  doubles.forEach((card) => assert.equal(card.kind, '피'));
});

test('피 점수는 쌍피를 두 장으로 세어 모두 26점이다', () => {
  assert.equal(deck.reduce((sum, card) => sum + pieceValue(card), 0), 26);
  assert.equal(countByKind(deck).피, 26);
});

test('카드 id는 모두 다르고 이름에 월이 들어간다', () => {
  assert.equal(new Set(deck.map((card) => card.id)).size, 48);
  deck.forEach((card) => {
    assert.equal(card.name.startsWith(`${card.month}월 ${monthNames[card.month]}`), true, card.name);
  });
});

test('비광만 12월 광으로 구분된다', () => {
  const rain = deck.filter(isRainBright);
  assert.equal(rain.length, 1);
  assert.equal(rain[0].month, 12);
});

test('섞어도 장수와 구성은 그대로다', () => {
  let seed = 42;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const shuffled = shuffleHwatu(deck, random);
  assert.equal(shuffled.length, 48);
  assert.deepEqual(new Set(shuffled.map((card) => card.id)), new Set(deck.map((card) => card.id)));
  assert.notDeepEqual(shuffled.map((card) => card.id), deck.map((card) => card.id));
});
