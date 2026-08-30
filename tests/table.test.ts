import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyTableAction,
  maxRaisesPerStreet,
  openTable,
  startTableRound,
  tableLive,
  tableOthersPot,
  tablePot,
  tableShowdown,
  tableToCall,
  tableWalkover,
} from '../src/table.ts';
import { dealSevenPokerTable } from '../src/sevenpoker.ts';
import { compareHands, evaluateHoldem } from '../src/texasholdem.ts';

test('모두 같은 참가비를 내고 시작한다', () => {
  const round = openTable(4, 100);
  assert.equal(round.seats.length, 4);
  assert.equal(tablePot(round), 400);
  assert.equal(tableToCall(round, 0), 0);
  assert.equal(tableOthersPot(round), 300);
  assert.equal(round.actor, 0);
});

test('다섯 명 이상은 앉지 않는다', () => {
  assert.throws(() => openTable(5, 100), /두 명에서 네 명까지/);
  assert.throws(() => openTable(1, 100), /두 명에서 네 명까지/);
});

test('모두 체크하면 라운드가 한 바퀴에 끝난다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'check' });
  assert.equal(round.actor, 1);
  round = applyTableAction(round, { kind: 'check' });
  assert.equal(round.actor, 2);
  round = applyTableAction(round, { kind: 'check' });
  assert.equal(round.closed, true);
  assert.equal(tablePot(round), 300);
});

test('누가 올리면 나머지가 다시 한 바퀴 받아야 끝난다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  assert.equal(round.seats[0].contributed, 150);
  assert.equal(round.closed, false);
  assert.equal(tableToCall(round, 1), 50);
  round = applyTableAction(round, { kind: 'call', amount: 50 });
  assert.equal(round.closed, false, '아직 2번이 안 받았습니다');
  round = applyTableAction(round, { kind: 'call', amount: 50 });
  assert.equal(round.closed, true);
  assert.equal(tablePot(round), 450);
});

test('올린 뒤 다시 올리면 처음 올린 사람도 한 번 더 받아야 한다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  assert.equal(round.actor, 2);
  round = applyTableAction(round, { kind: 'call', amount: 100 });
  assert.equal(round.closed, false, '0번이 두 번째 레이즈를 아직 안 받았습니다');
  assert.equal(round.actor, 0);
  round = applyTableAction(round, { kind: 'call', amount: 50 });
  assert.equal(round.closed, true);
  assert.equal(new Set(round.seats.map((seat) => seat.contributed)).size, 1, '끝까지 간 사람은 낸 돈이 같습니다');
});

test('폴드한 사람은 차례를 건너뛰고 낸 돈은 팟에 남는다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  round = applyTableAction(round, { kind: 'fold' });
  assert.equal(round.actor, 2);
  round = applyTableAction(round, { kind: 'call', amount: 50 });
  assert.equal(round.closed, true);
  assert.equal(tableLive(round).length, 2);
  assert.equal(tablePot(round), 100 + 150 + 150, '폴드한 사람의 100도 팟에 남습니다');
});

test('한 명만 남으면 승부 없이 그 사람이 가져간다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  round = applyTableAction(round, { kind: 'fold' });
  round = applyTableAction(round, { kind: 'fold' });
  assert.equal(round.closed, true);
  assert.equal(tableWalkover(round), 0);
});

test('레이즈 한도를 넘기지 못한다', () => {
  let round = openTable(2, 100);
  for (let i = 0; i < maxRaisesPerStreet; i += 1) round = applyTableAction(round, { kind: 'raise', amount: 50 });
  assert.equal(round.raises, maxRaisesPerStreet);
  assert.throws(() => applyTableAction(round, { kind: 'raise', amount: 50 }), /레이즈 한도/);
});

test('낼 돈이 남았는데 체크할 수 없다', () => {
  let round = openTable(2, 100);
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  assert.throws(() => applyTableAction(round, { kind: 'check' }), /체크할 수 없습니다/);
});

test('다음 라운드는 낸 돈과 폴드를 그대로 들고 간다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'raise', amount: 50 });
  round = applyTableAction(round, { kind: 'fold' });
  round = applyTableAction(round, { kind: 'call', amount: 50 });
  const next = startTableRound(round);
  assert.equal(tablePot(next), 400);
  assert.equal(next.seats[1].folded, true);
  assert.equal(next.actor, 0);
  assert.equal(next.raises, 0);
  assert.equal(next.closed, false);
});

test('내가 폴드했으면 다음 라운드는 살아 있는 사람부터 시작한다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'fold' });
  round = applyTableAction(round, { kind: 'check' });
  round = applyTableAction(round, { kind: 'check' });
  const next = startTableRound(round);
  assert.equal(next.actor, 1);
});

test('제일 센 사람이 팟을 가져가고 같으면 여럿이 나온다', () => {
  let round = openTable(3, 100);
  round = applyTableAction(round, { kind: 'check' });
  round = applyTableAction(round, { kind: 'fold' });
  round = applyTableAction(round, { kind: 'check' });
  // 1번이 제일 세지만 폴드했으므로 승부에서 빠집니다.
  const strength = [5, 9, 8];
  assert.deepEqual(tableShowdown(round, (a, b) => strength[a] - strength[b]), [2]);
  const tied = [7, 1, 7];
  assert.deepEqual(tableShowdown(round, (a, b) => tied[a] - tied[b]), [0, 2]);
});

// ── 화면이 실제로 도는 것과 같은 흐름을 돌려 봅니다 ──────────────────────
// 화면은 "라운드가 끝나면 다음 거리로, 마지막이면 승부"를 되풀이합니다.
// 여기서 막히거나 끝없이 도는 일이 없는지, 팟이 맞는지 확인합니다.

function playSevenPokerHand(players: number, ante: number, random: () => number) {
  const hands = dealSevenPokerTable(players, random);
  let round = openTable(players, ante);
  let guard = 0;
  for (let street = 1; street <= 4; street += 1) {
    if (street > 1) round = startTableRound(round);
    if (round.closed) break;
    while (!round.closed) {
      if (guard += 1, guard > 500) throw new Error('베팅이 끝나지 않습니다');
      const seat = round.actor;
      const toCall = tableToCall(round, seat);
      // 사람 대신 아무렇게나 두게 해서 폴드·콜·레이즈가 골고루 나오게 합니다.
      const roll = random();
      const wantRaise = roll < 0.2 && round.raises < maxRaisesPerStreet;
      const wantFold = roll > 0.85 && toCall > 0;
      round = applyTableAction(round, wantFold ? { kind: 'fold' } : wantRaise ? { kind: 'raise', amount: ante } : toCall > 0 ? { kind: 'call', amount: toCall } : { kind: 'check' });
    }
    if (tableWalkover(round) >= 0) break;
  }
  return { round, hands };
}

test('네 명이 끝까지 도는 판을 이백 번 돌려도 막히지 않는다', () => {
  let seed = 20260830;
  const random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let hand = 0; hand < 200; hand += 1) {
    const { round, hands } = playSevenPokerHand(4, 100, random);
    assert.equal(round.closed, true);
    const live = tableLive(round);
    assert.equal(live.length >= 1, true);
    // 끝까지 간 사람은 낸 돈이 같아야 합니다(사이드 팟이 없으므로).
    if (live.length > 1) assert.equal(new Set(live.map((seat) => seat.contributed)).size, 1);
    // 팟은 낸 돈의 합이고, 폴드한 사람 돈도 남아 있어야 합니다.
    assert.equal(tablePot(round), round.seats.reduce((sum, seat) => sum + seat.contributed, 0));
    assert.equal(tablePot(round) >= 400, true);
    // 승부는 언제나 한 명 이상을 돌려줍니다.
    const winners = tableShowdown(round, (a, b) => compareHands(evaluateHoldem(hands[a]), evaluateHoldem(hands[b])));
    assert.equal(winners.length >= 1, true);
  }
});

test('두 명·세 명 판도 같은 방식으로 끝난다', () => {
  let seed = 7777;
  const random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (const players of [2, 3]) {
    for (let hand = 0; hand < 100; hand += 1) {
      const { round } = playSevenPokerHand(players, 50, random);
      assert.equal(round.closed, true);
      assert.equal(tableLive(round).length >= 1, true);
    }
  }
});
