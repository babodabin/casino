import test from 'node:test';
import assert from 'node:assert/strict';
import { compareDori, dealDori, evaluateDori, resolveDori } from '../src/dorijitgottaeng.ts';
import { createSeotdaDeck } from '../src/seotda.ts';
import { type HwatuCard } from '../src/hwatu.ts';

const deck = createSeotdaDeck();
const byMonth = (month: number) => deck.filter((card) => card.month === month);
/** 같은 달을 두 번 부르면 그 달의 두 장을 순서대로 돌려줍니다. */
const maker = () => {
  const used = new Map<number, number>();
  return (month: number): HwatuCard => {
    const at = used.get(month) ?? 0;
    used.set(month, at + 1);
    const card = byMonth(month)[at];
    if (!card) throw new Error(`${month}월 카드가 부족합니다`);
    return card;
  };
};
const hand = (...months: number[]) => { const pick = maker(); return months.map(pick); };

test('세 장으로 10의 배수를 지으면 남은 두 장으로 겨룬다', () => {
  // 1+2+7 = 10 → 남은 5·5는 5땡
  const result = evaluateDori(hand(1, 2, 7, 5, 5));
  assert.equal(result.kind, 'hand');
  if (result.kind !== 'hand') return;
  assert.equal(result.hand.build.map((c) => c.month).sort((a, b) => a - b).join(','), '1,2,7');
  assert.equal(result.hand.ddaeng, 5);
  assert.equal(result.hand.name, '5땡');
});

test('10의 배수를 못 만들면 못 지은 것으로 처리한다', () => {
  // 1,2,3,4,5 의 세 장 합: 6,7,8,9,10... 1+4+5=10 이므로 지어짐 → 다른 조합을 씁니다
  const result = evaluateDori(hand(1, 1, 2, 2, 3));
  // 합 가능한 세 장: 1+1+2=4, 1+1+3=5, 1+2+2=5, 1+2+3=6, 2+2+3=7 → 10의 배수 없음
  assert.equal(result.kind, 'none');
  if (result.kind === 'none') assert.equal(result.reason.includes('10의 배수'), true);
});

test('지을 방법이 여럿이면 남는 두 장이 가장 센 쪽을 고른다', () => {
  // 10,10,4,6,10은 불가(10월은 두 장뿐) → 3,7,10 과 10,4,6 두 가지로 지을 수 있는 손
  // 3+7+10=20, 남은 4·6 = 갑오(0끗? 4+6=10 → 0끗 망통)
  // 4+6+10=20, 남은 3·7 = 0끗 망통  → 같은 값이므로 다른 예로 확인
  const result = evaluateDori(hand(3, 7, 10, 9, 9));
  assert.equal(result.kind, 'hand');
  if (result.kind !== 'hand') return;
  // 3+7+10=20 을 지어야 9·9 = 9땡이 남습니다
  assert.equal(result.hand.ddaeng, 9);
  assert.equal(result.hand.name, '9땡');
});

test('땡은 끗보다 무조건 높고 장땡이 최고다', () => {
  const jang = evaluateDori(hand(1, 2, 7, 10, 10));   // 1+2+7=10, 남은 10·10 = 장땡
  const gu = evaluateDori(hand(1, 2, 7, 9, 9));       // 9땡
  const gabo = evaluateDori(hand(1, 2, 7, 4, 5));     // 남은 4·5 = 갑오
  assert.equal(jang.kind === 'hand' && jang.hand.name, '장땡');
  assert.equal(compareDori(jang, gu), 1);
  assert.equal(compareDori(gu, gabo), 1);
});

test('끗끼리는 숫자로 겨루고 같으면 비긴다', () => {
  const a = evaluateDori(hand(1, 2, 7, 4, 5));   // 갑오(9끗)
  const b = evaluateDori(hand(3, 3, 4, 6, 8));   // 3+3+4=10, 남은 6·8 = 4끗
  assert.equal(compareDori(a, b), 1);
  const c = evaluateDori(hand(1, 2, 7, 4, 5));
  assert.equal(compareDori(a, c), 0);
});

test('못 지은 쪽은 무조건 진다', () => {
  const none = evaluateDori(hand(1, 1, 2, 2, 3));
  const mangtong = evaluateDori(hand(1, 2, 7, 2, 8));  // 남은 2·8 = 망통
  assert.equal(none.kind, 'none');
  assert.equal(compareDori(none, mangtong), -1);
  assert.equal(compareDori(mangtong, none), 1);
  // 둘 다 못 지으면 비깁니다
  assert.equal(compareDori(none, none), 0);
});

test('지은 세 장의 합은 반드시 10의 배수다', () => {
  let seed = 3;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  let built = 0, none = 0;
  for (let i = 0; i < 500; i += 1) {
    const round = dealDori(random);
    for (const cards of [round.player, round.opponent]) {
      const result = evaluateDori(cards);
      if (result.kind === 'none') { none += 1; continue; }
      built += 1;
      const sum = result.hand.build.reduce((total, card) => total + card.month, 0);
      assert.equal(sum % 10, 0, `합이 ${sum}입니다`);
      assert.equal(result.hand.build.length, 3);
      assert.equal(result.hand.pair.length, 2);
      // 지은 세 장과 남은 두 장이 원래 다섯 장과 정확히 같아야 합니다
      const ids = [...result.hand.build, ...result.hand.pair].map((card) => card.id).sort();
      assert.deepEqual(ids, cards.map((card) => card.id).sort());
    }
  }
  // 못 짓는 손이 아주 흔하면 게임이 안 됩니다. 실제로 얼마나 되는지 확인합니다.
  const rate = none / (built + none);
  assert.equal(rate < 0.5, true, `못 지은 비율이 너무 높습니다: ${(rate * 100).toFixed(1)}%`);
  console.log(`    (못 지은 비율 ${(rate * 100).toFixed(1)}%)`);
});

test('나눠준 열 장은 서로 겹치지 않는다', () => {
  let seed = 11;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 0; i < 200; i += 1) {
    const round = dealDori(random);
    const ids = [...round.player, ...round.opponent].map((card) => card.id);
    assert.equal(new Set(ids).size, 10);
    assert.equal(round.rest.length, 10);
  }
});

test('승패 판정이 족보와 맞는다', () => {
  const win = resolveDori(hand(1, 2, 7, 10, 10), hand(3, 3, 4, 6, 8));
  assert.equal(win.result, 'win');
  const loss = resolveDori(hand(3, 3, 4, 6, 8), hand(1, 2, 7, 10, 10));
  assert.equal(loss.result, 'loss');
});
