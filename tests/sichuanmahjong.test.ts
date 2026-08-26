import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSichuanTiles, dealSichuan, chooseVoidSuit, countBySuit, isSichuanVoidCleared, nextVoidDiscard,
  pickSwapTiles, swapThreeTiles, canSichuanWin, getSichuanWaits, countRoots, evaluateSichuanFan,
  sichuanScore, createBloodState, settleSichuanWin, settleSichuanMultipleRon, settleSichuanDraw, activeSichuanSeats,
  isSichuanSevenPairs, autoPlaySichuanRemainder, settleSichuanKan, refundSichuanKanTransfers, settleSichuanFullDraw, kanInstantPoints, getSichuanCallOptions, getSichuanKanOptions, applySichuanCall, chooseSichuanDiscard, rankSichuanScores,
} from '../src/sichuanmahjong.ts';
import { type MahjongTile } from '../src/riichimahjong.ts';

const hand = (codes: string[]): MahjongTile[] => codes.map((code, index) => ({ id: `${code}-${index}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));

test('사천 마작은 자패 없이 108장을 쓴다', () => {
  const tiles = createSichuanTiles();
  assert.equal(tiles.length, 108);
  assert.equal(tiles.some((tile) => tile.suit === 'z'), false);
});

test('네 명에게 13장씩 나누고 남은 패를 산으로 둔다', () => {
  const round = dealSichuan(() => 0.37);
  assert.deepEqual(round.hands.map((cards) => cards.length), [13, 13, 13, 13]);
  assert.equal(round.wall.length, 108 - 52);
});

test('가장 적게 가진 종류를 정결로 고른다', () => {
  const tiles = hand(['m1','m2','m3','m4','m5','p1','p2','p3','p4','s7','s8','s9','s9']);
  assert.equal(chooseVoidSuit(tiles), 'p');
  assert.deepEqual(countBySuit(tiles), { m: 5, p: 4, s: 4 });
});

test('정결한 종류가 남아 있으면 화료할 수 없다', () => {
  const complete = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','p5','p5']);
  // 통수를 정결로 정했는데 p5가 머리로 남아 있으면 화료 불가
  assert.equal(canSichuanWin(complete, [], 'p'), false);
  assert.equal(isSichuanVoidCleared(complete, [], 'p'), false);
  // 삭수를 정결로 정했다면 s2·s3·s4가 남아 있으므로 역시 불가
  assert.equal(canSichuanWin(complete, [], 's'), false);
  // 만수를 정결로 정하면 만수가 잔뜩 있으므로 불가
  assert.equal(canSichuanWin(complete, [], 'm'), false);
});

test('정결을 끝낸 손은 화료할 수 있다', () => {
  const pureHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7','s7']);
  assert.equal(isSichuanVoidCleared(pureHand, [], 'p'), true);
  assert.equal(canSichuanWin(pureHand, [], 'p'), true);
});

test('정결한 종류를 우선 버린다', () => {
  const tiles = hand(['m1','m2','m3','p9','s5','s5','s6','s7','s8','s9','m7','m8','m9']);
  const discard = nextVoidDiscard(tiles, 'p');
  assert.equal(discard?.suit, 'p');
  // 통수를 다 버리면 더 버릴 것이 없다
  assert.equal(nextVoidDiscard(tiles.filter((tile) => tile.suit !== 'p'), 'p'), null);
});

test('환삼장으로 같은 종류 세 장이 옆으로 넘어간다', () => {
  const hands = [
    hand(['m1','m3','m5','p1','p2','p3','p4','p5','p6','s1','s2','s3','s4']),
    hand(['m2','m4','m6','p7','p8','p9','s5','s6','s7','s8','s9','m7','m8']),
    hand(['s1','s3','s5','m1','m2','m3','m4','m5','m6','p1','p2','p3','p4']),
    hand(['p2','p4','p6','s1','s2','s3','s4','s5','s6','m7','m8','m9','m1']),
  ];
  const picked = pickSwapTiles(hands[0]);
  assert.equal(picked?.length, 3);
  assert.equal(new Set(picked?.map((tile) => tile.suit)).size, 1);

  const swapped = swapThreeTiles(hands, 1);
  assert.deepEqual(swapped.map((cards) => cards.length), [13, 13, 13, 13]);
  // 넘긴 패는 자기 손에 없고 받는 자리에 있어야 합니다
  const givenIds = new Set(picked!.map((tile) => tile.id));
  assert.equal(swapped[0].some((tile) => givenIds.has(tile.id)), false);
  assert.equal(swapped[1].filter((tile) => givenIds.has(tile.id)).length, 3);
});

test('정결한 종류는 대기패에서 제외한다', () => {
  const tiles = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const waits = getSichuanWaits(tiles, [], 'p');
  assert.equal(waits.some((tile) => tile.suit === 'p'), false);
  assert.equal(waits.some((tile) => tile.suit === 's' && tile.value === 7), true);
});

test('같은 패 네 장은 근으로 세어 점수를 두 배씩 올린다', () => {
  const tiles = hand(['m5','m5','m5','m5','m1','m2','m3','m7','m8','m9','s2','s2','s2','p1']);
  assert.equal(countRoots(tiles, []), 1);
  const none = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7','s7']);
  assert.equal(countRoots(none, []), 0);
});

test('청일색·대대화·칠대자 계열의 배수를 판정한다', () => {
  const names = (tiles: MahjongTile[], winType: 'tsumo' | 'ron' = 'ron', melds: MahjongTile[][] = []) =>
    evaluateSichuanFan({ hand: tiles, melds, winType }).map((fan) => fan.name);

  const plain = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  assert.equal(names(plain)[0], '평화');

  const pure = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m2','m3','m4','m6','m6']);
  assert.equal(names(pure)[0], '청일색');

  const allTriplets = hand(['m1','m1','m1','p5','p5','p5','s9','s9','s9','m7','m7','m7','s2','s2']);
  assert.equal(names(allTriplets)[0], '대대화');

  const pureTriplets = hand(['m1','m1','m1','m5','m5','m5','m9','m9','m9','m7','m7','m7','m2','m2']);
  assert.equal(names(pureTriplets)[0], '청대대');

  const sevenPairs = hand(['m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','m4','m4']);
  assert.equal(names(sevenPairs)[0], '칠대자');

  const dragonPairs = hand(['m1','m1','m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2']);
  assert.equal(names(dragonPairs)[0], '용칠대자');
});

test('자모와 깡상화는 배수를 두 배씩 더한다', () => {
  const tiles = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','m5','m6','m7','s2','s2']);
  const fans = evaluateSichuanFan({ hand: tiles, winType: 'tsumo', afterKan: true });
  assert.equal(fans.some((fan) => fan.name === '자모'), true);
  assert.equal(fans.some((fan) => fan.name === '깡상화'), true);
  // 울지 않은 손이므로 문전도 붙습니다: 평화 1 × 문전 2 × 자모 2 × 깡상화 2 = 8배
  assert.equal(fans.some((fan) => fan.name === '문전'), true);
  assert.equal(sichuanScore({ fans, winType: 'tsumo' }).multiplier, 8);

  // 울었으면 문전이 빠져 4배
  const opened = evaluateSichuanFan({ hand: hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','s2','s2']), melds: [hand(['m5','m6','m7'])], winType: 'tsumo', afterKan: true });
  assert.equal(opened.some((fan) => fan.name === '문전'), false);
  assert.equal(sichuanScore({ fans: opened, winType: 'tsumo' }).multiplier, 4);
});

test('점수는 배수를 곱하고 64배에서 멈춘다', () => {
  const big = [{ name: '십팔나한', chinese: '十八罗汉', multiplier: 64, detail: '' }, { name: '자모', chinese: '自摸', multiplier: 2, detail: '' }];
  const score = sichuanScore({ fans: big, roots: 2, winType: 'tsumo' });
  assert.equal(score.multiplier, 64);
  assert.equal(score.capped, true);

  const pure = [{ name: '청일색', chinese: '清一色', multiplier: 4, detail: '' }];
  const plain = sichuanScore({ fans: pure, basePoints: 10, winType: 'ron' });
  assert.equal(plain.perPlayer, 40);
  assert.equal(plain.total, 40);

  const tsumo = sichuanScore({ fans: pure, basePoints: 10, winType: 'tsumo' });
  assert.equal(tsumo.total, 120);
});

test('혈전도저는 세 명이 화료할 때까지 이어진다', () => {
  let state = createBloodState(0);
  const score = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 10, winType: 'ron' });

  state = settleSichuanWin(state, { winner: 0, score, winType: 'ron', loser: 1 });
  assert.equal(state.over, false);
  assert.equal(state.finished[0], true);
  assert.deepEqual(activeSichuanSeats(state), [1, 2, 3]);
  assert.equal(state.scores[0], 10);
  assert.equal(state.scores[1], -10);

  state = settleSichuanWin(state, { winner: 2, score, winType: 'ron', loser: 3 });
  assert.equal(state.over, false);

  state = settleSichuanWin(state, { winner: 1, score, winType: 'ron', loser: 3 });
  assert.equal(state.over, true);
  assert.deepEqual(state.winners, [0, 2, 1]);
});

test('이미 화료한 사람은 쯔모 지불에서 빠진다', () => {
  let state = createBloodState(0);
  const score = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 10, winType: 'ron' });
  state = settleSichuanWin(state, { winner: 0, score, winType: 'ron', loser: 1 });

  const tsumo = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 10, winType: 'tsumo', activeOpponents: 2 });
  const before = [...state.scores];
  state = settleSichuanWin(state, { winner: 2, score: tsumo, winType: 'tsumo' });
  // 빠진 0번은 그대로, 남은 1·3번만 지불
  assert.equal(state.scores[0], before[0]);
  assert.equal(state.scores[1], before[1] - 10);
  assert.equal(state.scores[3], before[3] - 10);
  assert.equal(state.scores[2], before[2] + 20);
});

test('점수 총합은 항상 보존된다', () => {
  let state = createBloodState(100);
  const score = sichuanScore({ fans: [{ name: '청일색', chinese: '清一色', multiplier: 4, detail: '' }], basePoints: 5, winType: 'ron' });
  state = settleSichuanWin(state, { winner: 3, score, winType: 'ron', loser: 0 });
  state = settleSichuanWin(state, { winner: 1, score, winType: 'ron', loser: 2 });
  assert.equal(state.scores.reduce((sum, value) => sum + value, 0), 400);
});

test('유국에서는 정결을 못 끝낸 사람이 끝낸 사람에게 물어준다', () => {
  const state = createBloodState(0);
  const settled = settleSichuanDraw(state, [true, false, true, false], 5);
  // 1번과 3번이 각각 0번과 2번에게 5점씩
  assert.equal(settled.scores[0], 10);
  assert.equal(settled.scores[2], 10);
  assert.equal(settled.scores[1], -10);
  assert.equal(settled.scores[3], -10);
  assert.equal(settled.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('치는 없고 퐁과 깡만 부를 수 있다', () => {
  const tiles = hand(['m4','m4','m5','m6','p1','p2','p3','s5','s6','s7','s9','s9','s9']);
  const options = getSichuanCallOptions(tiles, hand(['m4'])[0], 'p');
  assert.deepEqual(options.map((option) => option.kind), ['pon']);
  // 연속패가 되는 패를 버려도 치는 나오지 않습니다
  assert.equal(getSichuanCallOptions(tiles, hand(['m7'])[0], 'p').length, 0);
  // 정결한 종류로는 부를 수 없습니다
  assert.equal(getSichuanCallOptions(tiles, hand(['p3'])[0], 'p').length, 0);
});

test('암깡과 가깡을 찾고 정결한 종류는 제외한다', () => {
  const tiles = hand(['s9','s9','s9','s9','m1','m2','m3','p5','p5','p5','p5','m7','m8']);
  const kans = getSichuanKanOptions(tiles, [], 'p');
  assert.deepEqual(kans.map((option) => option.tiles[0].suit), ['s']);

  const melds = [hand(['m5','m5','m5'])];
  const withKakan = getSichuanKanOptions(hand(['m5','s1','s2','s3','s7','s8','s9','m1','m2','m3']), melds, 'p');
  assert.equal(withKakan.some((option) => option.kind === 'kakan'), true);
});

test('퐁하면 손패에서 두 장이 빠지고 몸통이 세 장이 된다', () => {
  const tiles = hand(['m4','m4','m5','m6','p1','p2','p3','s5','s6','s7','s9','s9','s9']);
  const option = getSichuanCallOptions(tiles, hand(['m4'])[0], 'p')[0];
  const applied = applySichuanCall(tiles, hand(['m4'])[0], option);
  assert.equal(applied.meld.length, 3);
  assert.equal(applied.hand.length, 11);
});

test('컴퓨터는 정결한 종류부터 버린다', () => {
  const tiles = hand(['m1','m2','m3','p9','s5','s5','s6','s7','s8','s9','m7','m8','m9']);
  assert.equal(chooseSichuanDiscard(tiles, 'p', () => 0.5).suit, 'p');
  const cleared = tiles.filter((tile) => tile.suit !== 'p');
  assert.notEqual(chooseSichuanDiscard(cleared, 'p', () => 0.5).suit, 'p');
});

test('순위는 점수 순으로 매긴다', () => {
  const ranked = rankSichuanScores([10, -30, 25, -5]);
  assert.deepEqual(ranked.map((entry) => entry.seat), [2, 0, 3, 1]);
  assert.deepEqual(ranked.map((entry) => entry.rank), [1, 2, 3, 4]);
});

test('용칠대자 모양도 완성으로 인정한다', () => {
  const dragon = hand(['m1','m1','m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2']);
  assert.equal(isSichuanSevenPairs(dragon), true);
  assert.equal(canSichuanWin(dragon, [], 'p'), false); // 통수가 남아 있으므로 정결 미달
  const cleared = hand(['m1','m1','m1','m1','m3','m3','s5','s5','m7','m7','s9','s9','s2','s2']);
  assert.equal(canSichuanWin(cleared, [], 'p'), true);
  assert.equal(countRoots(cleared, []), 1);
});

test('홀수 짝이 섞이면 칠대자가 아니다', () => {
  const bad = hand(['m1','m1','m1','p3','p3','s5','s5','m7','m7','p9','p9','s2','s2','s3']);
  assert.equal(isSichuanSevenPairs(bad), false);
});

test('혈전도저 자동 진행은 세 명이 화료하거나 산이 마를 때까지 이어진다', () => {
  let seed = 4242;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const round = dealSichuan(rng);
  const voids = round.hands.map(chooseVoidSuit) as ('m'|'p'|'s')[];

  // 0번이 이미 화료해 빠진 상태에서 나머지를 자동 진행
  let state = createBloodState(0);
  const first = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 1, winType: 'ron' });
  state = settleSichuanWin(state, { winner: 0, score: first, winType: 'ron', loser: 1 });

  const result = autoPlaySichuanRemainder({
    state, hands: round.hands, melds: [[], [], [], []], wall: round.wall,
    rivers: round.rivers, voidSuits: voids, basePoints: 1, startSeat: 1, random: rng,
  });

  // 이미 화료한 사람은 다시 화료하지 않는다
  assert.equal(result.state.winners.filter((seat) => seat === 0).length, 1);
  // 세 명이 화료했거나 산이 말라 끝났어야 한다
  assert.equal(result.state.over || result.exhausted, true);
  // 점수 총합은 그대로
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
  // 손패 길이가 무너지지 않는다
  result.hands.forEach((hand, seat) => {
    const expected = 13 - result.melds[seat].length * 3;
    assert.equal(hand.length === expected || hand.length === expected + 1, true, `seat ${seat}: ${hand.length} vs ${expected}`);
  });
});

test('자동 진행이 여러 판에서도 규칙을 깨지 않는다', () => {
  let seed = 90210;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let game = 0; game < 60; game++) {
    const round = dealSichuan(rng);
    const voids = round.hands.map(chooseVoidSuit) as ('m'|'p'|'s')[];
    const result = autoPlaySichuanRemainder({
      state: createBloodState(0), hands: round.hands, melds: [[], [], [], []],
      wall: round.wall, rivers: round.rivers, voidSuits: voids, basePoints: 1, random: rng,
    });
    assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
    assert.equal(result.state.winners.length <= 3, true);
    // 화료한 사람은 반드시 정결을 끝냈어야 한다
    result.state.winners.forEach((seat) => {
      assert.equal(result.melds[seat].flat().some((tile) => tile.suit === voids[seat]), false);
    });
  }
});

test('과수: 깡을 하면 그 자리에서 점수를 받는다', () => {
  const state = createBloodState(0);

  // 암깡은 남은 세 명에게 2점씩
  const ankan = settleSichuanKan(state, { kanner: 0, kind: 'ankan', basePoints: 1 });
  assert.equal(ankan.gained, 6);
  assert.equal(ankan.state.scores[0], 6);
  assert.equal(ankan.state.scores[1], -2);
  assert.equal(ankan.state.scores.reduce((sum, value) => sum + value, 0), 0);

  // 대명깡은 패를 버린 사람에게만 2점
  const minkan = settleSichuanKan(state, { kanner: 1, kind: 'minkan', discarder: 3, basePoints: 1 });
  assert.equal(minkan.gained, 2);
  assert.equal(minkan.state.scores[1], 2);
  assert.equal(minkan.state.scores[3], -2);
  assert.equal(minkan.state.scores[0], 0);

  // 가깡은 남은 세 명에게 1점씩
  const kakan = settleSichuanKan(state, { kanner: 2, kind: 'kakan', basePoints: 1 });
  assert.equal(kakan.gained, 3);
  assert.equal(kakan.state.scores[2], 3);
});

test('이미 화료해 빠진 사람은 깡 정산에서 제외된다', () => {
  let state = createBloodState(0);
  const score = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 1, winType: 'ron' });
  state = settleSichuanWin(state, { winner: 3, score, winType: 'ron', loser: 0 });

  const before = [...state.scores];
  const result = settleSichuanKan(state, { kanner: 1, kind: 'ankan', basePoints: 1 });
  // 빠진 3번은 그대로, 남은 0·2번만 낸다
  assert.equal(result.state.scores[3], before[3]);
  assert.equal(result.gained, 4);
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('깡 직후 방총하면 방금 받은 깡 점수를 모두 돌려준다', () => {
  const before = createBloodState(0);
  const afterKan = settleSichuanKan(before, { kanner: 0, kind: 'ankan', basePoints: 1 });
  const refunded = refundSichuanKanTransfers(afterKan.state, afterKan.transfers);
  assert.deepEqual(refunded.scores, before.scores);
  assert.equal(refunded.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('일포다향은 한 방총자가 여러 론 승자에게 각각 지불한다', () => {
  const one = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 1, winType: 'ron' });
  const two = sichuanScore({ fans: [{ name: '대대호', chinese: '对对胡', multiplier: 2, detail: '' }], basePoints: 1, winType: 'ron' });
  const result = settleSichuanMultipleRon(createBloodState(0), { loser: 0, winners: [{ seat: 1, score: one }, { seat: 3, score: two }] });
  assert.deepEqual(result.winners, [1, 3]);
  assert.deepEqual(result.finished, [false, true, false, true]);
  assert.equal(result.scores[0], -(one.perPlayer + two.perPlayer));
  assert.equal(result.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('퇴세는 유국 때 노텐인 사람이 받은 깡 점수를 돌려준다', () => {
  const tenpaiHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const notenHand = hand(['m1','m3','m5','m7','m9','s2','s4','s6','s8','m2','m4','m6','s1']);
  const afterKan = settleSichuanKan(createBloodState(0), { kanner: 1, kind: 'ankan', basePoints: 1 });
  const result = settleSichuanFullDraw(afterKan.state, {
    hands: [tenpaiHand, notenHand, tenpaiHand, tenpaiHand],
    melds: [[], [], [], []],
    voidSuits: ['p', 'p', 'p', 'p'],
    kanTransfers: afterKan.transfers,
    basePoints: 1,
  });
  assert.ok(result.log.some((line) => line.includes('퇴세')));
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('문전은 닫힌 손, 금구는 네 몸통을 공개한 단기 화료다', () => {
  const tiles = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7','s7']);
  const closed = evaluateSichuanFan({ hand: tiles, winType: 'ron' });
  assert.equal(closed.some((fan) => fan.name === '문전'), true);
  assert.equal(closed.some((fan) => fan.name === '금구'), false);

  const open = evaluateSichuanFan({ hand: hand(['m1','m2','m3','m4','m5','m6','s2','s3','s4','s7','s7']), melds: [hand(['m7','m8','m9'])], winType: 'ron' });
  assert.equal(open.some((fan) => fan.name === '문전'), false);

  const goldHook = evaluateSichuanFan({ hand: hand(['s7','s7']), melds: [hand(['m1','m1','m1']),hand(['m2','m2','m2']),hand(['s3','s3','s3']),hand(['s4','s4','s4'])], winType: 'ron' });
  assert.equal(goldHook.some((fan) => fan.name === '금구'), true);
});

test('차대각: 유국이면 노텐과 화저가 텐파이한 사람에게 물어준다', () => {
  // 0번은 텐파이, 1번은 노텐, 2번은 정결 미완료(화저), 3번도 텐파이
  const tenpaiHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const notenHand = hand(['m1','m3','m5','m7','m9','s2','s4','s6','s8','m2','m4','m6','s1']);
  const pigHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','p7']);

  const result = settleSichuanFullDraw(createBloodState(0), {
    hands: [tenpaiHand, notenHand, pigHand, tenpaiHand],
    melds: [[], [], [], []],
    voidSuits: ['p', 'p', 'p', 'p'],
    basePoints: 1,
  });

  assert.equal(result.tenpai[0], true, '0번은 텐파이여야 합니다');
  assert.equal(result.cleared[2], false, '2번은 정결을 못 끝낸 화저여야 합니다');
  assert.equal(result.tenpai[2], false);
  // 점수 총합은 보존
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
  // 텐파이한 사람은 받고, 노텐·화저는 낸다
  assert.equal(result.state.scores[0] > 0, true);
  assert.equal(result.state.scores[1] < 0, true);
  assert.equal(result.state.scores[2] < 0, true);
  assert.equal(result.log.length > 0, true);
});

test('네 명이 모두 텐파이면 차대각에서 점수가 오가지 않는다', () => {
  const tenpaiHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const result = settleSichuanFullDraw(createBloodState(0), {
    hands: [tenpaiHand, tenpaiHand, tenpaiHand, tenpaiHand],
    melds: [[], [], [], []],
    voidSuits: ['p', 'p', 'p', 'p'],
    basePoints: 1,
  });
  assert.deepEqual(result.state.scores, [0, 0, 0, 0]);
  assert.equal(result.log.length, 0);
});

test('자동 혈전에서 산이 마르면 간단 벌점이 아니라 차대각 상세 정산을 한다', () => {
  const tenpaiHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const notenHand = hand(['m1','m3','m5','m7','m9','s2','s4','s6','s8','m2','m4','m6','s1']);
  const pigHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','p7']);
  const result = autoPlaySichuanRemainder({
    state: createBloodState(0),
    hands: [tenpaiHand, notenHand, pigHand, tenpaiHand],
    melds: [[], [], [], []], wall: [], rivers: [[], [], [], []],
    voidSuits: ['p', 'p', 'p', 'p'], basePoints: 1,
  });
  assert.equal(result.exhausted, true);
  assert.equal(result.drawSettlement?.tenpai[0], true);
  assert.equal(result.drawSettlement?.cleared[2], false);
  assert.ok(result.log.some((line) => line.includes('차대각')));
  assert.ok(result.log.some((line) => line.includes('화저')));
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('자동 혈전 유국도 이전 깡 기록을 받아 노텐 깡의 퇴세를 실행한다', () => {
  const tenpaiHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const notenHand = hand(['m1','m3','m5','m7','m9','s2','s4','s6','s8','m2','m4','m6','s1']);
  const afterKan = settleSichuanKan(createBloodState(0), { kanner: 1, kind: 'ankan', basePoints: 1 });
  const result = autoPlaySichuanRemainder({
    state: afterKan.state,
    hands: [tenpaiHand, notenHand, tenpaiHand, tenpaiHand],
    melds: [[], [], [], []], wall: [], rivers: [[], [], [], []],
    voidSuits: ['p', 'p', 'p', 'p'], kanTransfers: afterKan.transfers, basePoints: 1,
  });
  assert.equal(result.kanTransfers.length, afterKan.transfers.length);
  assert.ok(result.log.some((line) => line.includes('퇴세')));
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
});

test('이미 화료한 사람은 자동 유국의 차대각과 퇴세 대상에서도 빠진다', () => {
  const tenpaiHand = hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','s2','s3','s4','s7']);
  const notenHand = hand(['m1','m3','m5','m7','m9','s2','s4','s6','s8','m2','m4','m6','s1']);
  const winScore = sichuanScore({ fans: [{ name: '평화', chinese: '平胡', multiplier: 1, detail: '' }], basePoints: 1, winType: 'ron' });
  const state = settleSichuanWin(createBloodState(0), { winner: 3, score: winScore, winType: 'ron', loser: 0 });
  const beforeWinner = state.scores[3];
  const result = autoPlaySichuanRemainder({
    state, hands: [notenHand, tenpaiHand, notenHand, notenHand],
    melds: [[], [], [], []], wall: [], rivers: [[], [], [], []],
    voidSuits: ['p', 'p', 'p', 'p'], basePoints: 1,
  });
  assert.equal(result.state.scores[3], beforeWinner);
  assert.equal(result.state.winners.filter((seat) => seat === 3).length, 1);
  assert.equal(result.state.scores.reduce((sum, value) => sum + value, 0), 0);
});
