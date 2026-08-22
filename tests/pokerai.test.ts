import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, type Card } from '../src/blackjack.ts';
import { decidePokerAction, estimateDrawEquity, estimateEquity, potOdds, pokerActionLabel, remainingDeck } from '../src/pokerai.ts';

const card = (id: string): Card => createDeck().find((item) => item.id === id)!;
// 시드 난수: 테스트가 매번 같은 결과를 내게 합니다.
const seeded = (seed: number) => { let state = seed; return () => { state = (state * 1103515245 + 12345) % 2147483648; return state / 2147483648; }; };

test('본 카드를 뺀 나머지 덱만 남는다', () => {
  const deck = remainingDeck([card('♠-A'), card('♥-K')]);
  assert.equal(deck.length, 50);
  assert.equal(deck.some((item) => item.id === '♠-A'), false);
});

test('AA는 프리플랍 승률이 8할을 넘는다', () => {
  const equity = estimateEquity({
    variant: 'holdem', hole: [card('♠-A'), card('♥-A')], community: [],
    opponentHidden: 2, communityToCome: 5, trials: 600, random: seeded(7),
  });
  assert.equal(equity > 0.8, true, `AA 승률이 너무 낮습니다: ${equity}`);
});

test('72 오프수트는 프리플랍 승률이 4할을 넘지 못한다', () => {
  const equity = estimateEquity({
    variant: 'holdem', hole: [card('♠-7'), card('♥-2')], community: [],
    opponentHidden: 2, communityToCome: 5, trials: 600, random: seeded(11),
  });
  assert.equal(equity < 0.4, true, `72o 승률이 너무 높습니다: ${equity}`);
});

test('보드에 이미 완성된 플러시를 들고 있으면 승률이 매우 높다', () => {
  const equity = estimateEquity({
    variant: 'holdem',
    hole: [card('♠-A'), card('♠-K')],
    community: [card('♠-2'), card('♠-7'), card('♠-9'), card('♥-3'), card('♦-4')],
    opponentHidden: 2, communityToCome: 0, trials: 400, random: seeded(3),
  });
  assert.equal(equity > 0.95, true, `너트 플러시 승률이 낮습니다: ${equity}`);
});

test('오마하도 같은 방식으로 계산된다', () => {
  const equity = estimateEquity({
    variant: 'omaha', hole: [card('♠-A'), card('♥-A'), card('♦-K'), card('♣-K')], community: [],
    opponentHidden: 4, communityToCome: 5, trials: 200, random: seeded(5),
  });
  assert.equal(equity > 0.5, true, `AAKK 승률이 낮습니다: ${equity}`);
  assert.equal(equity < 1, true);
});

test('팟 오즈는 콜 금액을 팟에 더한 값으로 나눈다', () => {
  assert.equal(potOdds(500, 1500), 0.25);
  assert.equal(potOdds(0, 1000), 0);
});

test('승률이 팟 오즈보다 훨씬 낮으면 폴드한다', () => {
  const action = decidePokerAction({ equity: 0.1, toCall: 1000, pot: 1000, raiseSize: 500, canRaise: true, street: 2, random: seeded(1) });
  assert.equal(action.kind, 'fold');
});

test('아주 강한 손은 레이즈가 나온다', () => {
  const kinds = new Set<string>();
  for (let seed = 1; seed <= 40; seed += 1) {
    kinds.add(decidePokerAction({ equity: 0.95, toCall: 0, pot: 1000, raiseSize: 500, canRaise: true, street: 3, random: seeded(seed) }).kind);
  }
  assert.equal(kinds.has('raise'), true, '강한 손인데 레이즈가 한 번도 안 나옵니다');
});

test('레이즈가 막혀 있으면 절대 레이즈하지 않는다', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const action = decidePokerAction({ equity: 0.95, toCall: 0, pot: 1000, raiseSize: 500, canRaise: false, street: 3, random: seeded(seed) });
    assert.notEqual(action.kind, 'raise');
  }
});

test('체크할 수 있으면 폴드하지 않는다', () => {
  for (let seed = 1; seed <= 60; seed += 1) {
    const action = decidePokerAction({ equity: 0.05, toCall: 0, pot: 1000, raiseSize: 500, canRaise: true, street: 1, random: seeded(seed) });
    assert.notEqual(action.kind, 'fold', '체크가 가능한데 폴드했습니다');
  }
});

test('콜 금액은 요구 금액과 정확히 같다', () => {
  const action = decidePokerAction({ equity: 0.7, toCall: 700, pot: 3000, raiseSize: 500, canRaise: false, street: 2, random: seeded(9) });
  assert.equal(action.kind, 'call');
  if (action.kind === 'call') assert.equal(action.amount, 700);
});

test('항상 콜만 하지는 않는다', () => {
  const kinds = new Set<string>();
  for (let seed = 1; seed <= 60; seed += 1) {
    for (const equity of [0.12, 0.45, 0.88]) {
      kinds.add(decidePokerAction({ equity, toCall: 500, pot: 1500, raiseSize: 500, canRaise: true, street: 2, random: seeded(seed) }).kind);
    }
  }
  assert.equal(kinds.has('fold'), true);
  assert.equal(kinds.has('call'), true);
  assert.equal(kinds.has('raise'), true);
});

test('행동 문구가 사람이 읽을 수 있게 나온다', () => {
  assert.equal(pokerActionLabel({ kind: 'fold' }), '폴드');
  assert.equal(pokerActionLabel({ kind: 'check' }), '체크');
  assert.equal(pokerActionLabel({ kind: 'call', amount: 1000 }), '콜 1,000 WC');
  assert.equal(pokerActionLabel({ kind: 'raise', amount: 500 }), '레이즈 +500 WC');
});

test('하이로우는 하이·로우 양쪽을 평균 낸다', () => {
  const equity = estimateEquity({
    variant: 'highlow',
    hole: [card('♠-A'), card('♥-2'), card('♦-3'), card('♣-4'), card('♠-5'), card('♥-8'), card('♦-K')],
    opponentHidden: 7, trials: 200, random: seeded(13),
  });
  // A2345는 스트레이트이면서 최고의 로우라 양쪽 모두 매우 강합니다.
  assert.equal(equity > 0.7, true, `휠 핸드 승률이 낮습니다: ${equity}`);
});

test('상대가 적게 바꿀수록 내 승률은 낮게 잡힌다', () => {
  // 원 페어(9) — 평범한 손. 상대 교환 장수만 바꿔 가며 비교합니다.
  const hole = [card('♠-9'), card('♥-9'), card('♦-4'), card('♣-7'), card('♠-J')];
  const many = estimateDrawEquity({ hole, opponentDrawCount: 3, trials: 400, random: seeded(21) });
  const few = estimateDrawEquity({ hole, opponentDrawCount: 1, trials: 400, random: seeded(21) });
  assert.equal(many > few, true, `3장 교환 상대(${many})가 1장 교환 상대(${few})보다 약해야 합니다`);
});

test('교환 장수를 모르면 조건 없이 계산한다', () => {
  const hole = [card('♠-A'), card('♥-A'), card('♦-A'), card('♣-A'), card('♠-K')];
  const equity = estimateDrawEquity({ hole, trials: 200, random: seeded(4) });
  assert.equal(equity > 0.98, true, `포카드 승률이 낮습니다: ${equity}`);
});

test('불가능한 교환 장수를 넣어도 멈추지 않고 값을 돌려준다', () => {
  const hole = [card('♠-2'), card('♥-5'), card('♦-8'), card('♣-J'), card('♠-K')];
  const equity = estimateDrawEquity({ hole, opponentDrawCount: 4, trials: 60, random: seeded(2) });
  assert.equal(Number.isFinite(equity), true);
  assert.equal(equity >= 0 && equity <= 1, true);
});

test('섰다 승률은 족보 서열과 맞아떨어진다', async () => {
  const { createSeotdaDeck } = await import('../src/seotda.ts');
  const { seotdaEquity } = await import('../src/pokerai.ts');
  const deck = createSeotdaDeck();
  const rules = { ddaengJabi: false, amhaeng: false, guSa: false };
  const pick = (month: number, bright = false) => {
    const cards = deck.filter((c) => c.month === month);
    return bright ? cards.find((c) => c.kind === '광')! : (cards.find((c) => c.kind !== '광') ?? cards[0]);
  };
  const samPal = seotdaEquity([pick(3, true), pick(8, true)], rules);
  const jangDdaeng = seotdaEquity([pick(10), pick(10)], rules);
  const ali = seotdaEquity([pick(1), pick(2)], rules);
  const mangtong = seotdaEquity([pick(2), pick(8)], rules);
  assert.equal(samPal > 0.99, true, `삼팔광땡 ${samPal}`);
  assert.equal(samPal > jangDdaeng, true);
  assert.equal(jangDdaeng > ali, true);
  assert.equal(ali > mangtong, true);
  assert.equal(mangtong < 0.15, true, `망통 ${mangtong}`);
});

test('도리짓고땡 승률이 족보 서열과 맞는다', async () => {
  const { doriEquity } = await import('../src/pokerai.ts');
  const { createSeotdaDeck } = await import('../src/seotda.ts');
  const deck = createSeotdaDeck();
  const used = new Map<number, number>();
  const pick = (month: number) => {
    const at = used.get(month) ?? 0; used.set(month, at + 1);
    return deck.filter((c) => c.month === month)[at];
  };
  const build = (...months: number[]) => { used.clear(); return months.map(pick); };
  const jang = doriEquity(build(1, 2, 7, 10, 10));   // 장땡
  const gabo = doriEquity(build(1, 2, 7, 4, 5));     // 갑오
  const mang = doriEquity(build(1, 2, 7, 2, 8));     // 망통
  const none = doriEquity(build(1, 1, 2, 2, 3));     // 못 지음
  assert.equal(jang > 0.95, true, `장땡 ${jang}`);
  assert.equal(jang > gabo && gabo > mang, true, `장땡 ${jang} 갑오 ${gabo} 망통 ${mang}`);
  assert.equal(none < mang, true, `못 지음 ${none} 이 망통 ${mang} 보다 낮아야 합니다`);
  assert.equal(none < 0.35, true, `못 지음 ${none}`);
});
