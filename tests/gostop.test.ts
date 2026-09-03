import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGoStopSettlement, chongtongPoints, chooseGoStopMatch, chooseComputerGoStop, chooseComputerGoStopCard, chooseGoOrStop, goStopLevelOf, createGoStopBonusCards, dealGoStop, declareGoStopShake, goStopPayoutPoints, goStopThreshold, playGoStopBomb, playGoStopTurn, scoreGoStop, type GoStopPlayer, type GoStopRound } from '../src/gostop.ts';
import { createHwatuDeck, type HwatuCard } from '../src/hwatu.ts';

const deck = createHwatuDeck();
const card = (month: number, kind?: HwatuCard['kind']) => {
  const found = deck.find((item) => item.month === month && (!kind || item.kind === kind));
  if (!found) throw new Error(`${month}월 ${kind ?? ''} 패 없음`);
  return found;
};

test('고스톱과 맞고의 배분 수가 정확하고 48장이 겹치지 않는다', () => {
  for (const mode of ['gostop', 'matgo'] as const) {
    const round = dealGoStop(mode, () => 0.37);
    const expectedHand = mode === 'matgo' ? 10 : 7;
    const expectedFloor = mode === 'matgo' ? 8 : 6;
    assert.equal(round.players.length, mode === 'matgo' ? 2 : 3);
    assert.equal(round.players.every((player) => player.hand.length === expectedHand), true);
    assert.equal(round.floor.length, expectedFloor);
    const all = [...round.players.flatMap((player) => player.hand), ...round.floor, ...round.deck];
    assert.equal(all.length, 48);
    assert.equal(new Set(all.map((item) => item.id)).size, 48);
  }
});

test('광 점수에서 비삼광·삼광·사광·오광을 구분한다', () => {
  assert.equal(scoreGoStop([card(1, '광'), card(3, '광'), card(12, '광')]).bright, 2);
  assert.equal(scoreGoStop([card(1, '광'), card(3, '광'), card(8, '광')]).bright, 3);
  assert.equal(scoreGoStop([card(1, '광'), card(3, '광'), card(8, '광'), card(12, '광')]).bright, 4);
  assert.equal(scoreGoStop([card(1, '광'), card(3, '광'), card(8, '광'), card(11, '광'), card(12, '광')]).bright, 15);
});

test('고도리와 홍단·청단·초단 보너스를 계산한다', () => {
  const animals = [2, 4, 8].map((month) => card(month, '열끗'));
  assert.equal(scoreGoStop(animals).animal, 5);
  const red = deck.filter((item) => item.ribbon === '홍단');
  const blue = deck.filter((item) => item.ribbon === '청단');
  const grass = deck.filter((item) => item.ribbon === '초단');
  assert.equal(scoreGoStop(red).ribbon, 3);
  assert.equal(scoreGoStop(blue).ribbon, 3);
  assert.equal(scoreGoStop(grass).ribbon, 3);
});

test('열끗·띠·피 기본 점수가 장수에 따라 늘어난다', () => {
  assert.equal(scoreGoStop(deck.filter((item) => item.kind === '열끗').slice(0, 6)).animal >= 2, true);
  assert.equal(scoreGoStop(deck.filter((item) => item.kind === '띠').slice(0, 6)).ribbon >= 2, true);
  const pi = deck.filter((item) => item.kind === '피');
  assert.equal(scoreGoStop(pi.slice(0, 10)).pi >= 1, true);
});

test('같은 월 한 장이면 두 장을 먹고, 없으면 바닥에 남는다', () => {
  const handCard = card(1, '광');
  const floorMatch = deck.find((item) => item.month === 1 && item.id !== handCard.id)!;
  const draw = card(6, '열끗');
  const round: GoStopRound = { mode: 'matgo', players: [{ hand: [handCard], captured: [], goCount: 0 }, { hand: [], captured: [], goCount: 0 }], floor: [floorMatch, card(4, '띠')], deck: [draw], turn: 0, finished: false, winner: null, message: '' };
  const next = playGoStopTurn(round, handCard.id);
  assert.equal(next.players[0].captured.map((item) => item.id).sort().join(','), [handCard.id, floorMatch.id].sort().join(','));
  assert.equal(next.floor.some((item) => item.id === draw.id), true);
});

test('같은 월이 바닥에 두 장이면 먹을 패를 선택해야 한다', () => {
  const monthCards = deck.filter((item) => item.month === 3);
  const round: GoStopRound = { mode: 'gostop', players: [{ hand: [monthCards[0]], captured: [], goCount: 0 }, { hand: [], captured: [], goCount: 0 }, { hand: [], captured: [], goCount: 0 }], floor: [monthCards[1], monthCards[2]], deck: [], turn: 0, finished: false, winner: null, message: '' };
  assert.throws(() => playGoStopTurn(round, monthCards[0].id), /골라야/);
  const next = playGoStopTurn(round, monthCards[0].id, { playedMatchId: monthCards[2].id });
  assert.equal(next.players[0].captured.some((item) => item.id === monthCards[2].id), true);
  assert.equal(next.floor.some((item) => item.id === monthCards[1].id), true);
});

test('고스톱은 3점, 맞고는 7점부터 고·스톱을 고른다', () => {
  assert.equal(goStopThreshold('gostop'), 3);
  assert.equal(goStopThreshold('matgo'), 7);
});

test('고를 하면 횟수가 늘고 스톱하면 현재 플레이어가 승리한다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  // 다른 사람도 손패를 들고 있어야 차례가 넘어갑니다. 빈손이면 건너뛰고 나에게 다시 옵니다.
  const base: GoStopRound = { mode: 'gostop', players: [{ hand: [card(2)], captured: scoring, goCount: 0 }, { hand: [card(5)], captured: [], goCount: 0 }, { hand: [card(6)], captured: [], goCount: 0 }], floor: [], deck: [card(4)], turn: 0, finished: false, winner: null, pendingDecision: 0, message: '' };
  const continued = chooseGoOrStop(base, 'go');
  assert.equal(continued.players[0].goCount, 1);
  assert.equal(continued.turn, 1);
  const stopped = chooseGoOrStop({ ...continued, turn: 0, pendingDecision: 0 }, 'stop');
  assert.equal(stopped.finished, true);
  assert.equal(stopped.winner, 0);
});

test('고 횟수에 따른 기본 정산 점수가 증가한다', () => {
  assert.equal(goStopPayoutPoints(5, 0), 5);
  assert.equal(goStopPayoutPoints(5, 1), 6);
  assert.equal(goStopPayoutPoints(5, 2), 7);
  assert.equal(goStopPayoutPoints(5, 3), 14);
  assert.equal(goStopPayoutPoints(5, 4), 28);
});

const roundFor = (hand: HwatuCard[], floor: HwatuCard[], draw: HwatuCard[], opponentCaptured: HwatuCard[] = []): GoStopRound => ({
  mode: 'matgo', players: [{ hand, captured: [], goCount: 0 }, { hand: [], captured: opponentCaptured, goCount: 0 }],
  floor, deck: draw, turn: 0, finished: false, winner: null, pendingDecision: null, message: '',
});

test('쪽이면 낸 패와 뒤집은 같은 월 패를 먹고 상대 피를 가져온다', () => {
  const month = deck.filter((item) => item.month === 5);
  const opponentPi = card(6, '피');
  const next = playGoStopTurn(roundFor([month[0]], [card(2, '띠')], [month[1]], [opponentPi]), month[0].id);
  assert.deepEqual(next.lastEvents, ['쪽']);
  assert.equal(next.players[0].captured.some((item) => item.id === opponentPi.id), true);
  assert.equal(next.players[0].captured.filter((item) => item.month === 5).length, 2);
});

test('뻑이면 같은 월 세 장이 잡히지 않고 바닥에 붙는다', () => {
  const month = deck.filter((item) => item.month === 7);
  const next = playGoStopTurn(roundFor([month[0]], [month[1], card(2, '띠')], [month[2]]), month[0].id);
  assert.deepEqual(next.lastEvents, ['뻑']);
  assert.equal(next.floor.filter((item) => item.month === 7).length, 3);
  assert.equal(next.players[0].captured.length, 0);
});

test('따닥이면 같은 월 네 장을 모두 먹고 상대 피를 가져온다', () => {
  const month = deck.filter((item) => item.month === 9);
  const opponentPi = card(10, '피');
  const next = playGoStopTurn(roundFor([month[0]], [month[1], month[2], card(2, '띠')], [month[3]], [opponentPi]), month[0].id, { playedMatchId: month[1].id });
  assert.equal(next.lastEvents?.includes('따닥'), true);
  assert.equal(next.players[0].captured.filter((item) => item.month === 9).length, 4);
  assert.equal(next.players[0].captured.some((item) => item.id === opponentPi.id), true);
});

test('바닥의 같은 월 석 장을 넷째 패로 쓸어 가도 상대 피를 가져온다', () => {
  // ⚠️ 이 일에 이름은 붙여 놓고 피를 뺏는 목록에는 안 넣어서, 넉 장을 다 먹어도
  // 상대 피가 그대로였습니다.
  const month = deck.filter((item) => item.month === 7);
  const opponentPi = card(11, '피');
  const next = playGoStopTurn(
    roundFor([month[0]], [month[1], month[2], month[3], card(2, '띠')], [card(5)], [opponentPi]),
    month[0].id,
  );
  assert.equal(next.lastEvents?.includes('네 장 다 먹음'), true);
  assert.equal(next.players[0].captured.filter((item) => item.month === 7).length, 4);
  assert.equal(next.players[0].captured.some((item) => item.id === opponentPi.id), true);
  assert.equal(next.players[1].captured.some((item) => item.id === opponentPi.id), false);
});

test('마지막 바닥 패까지 먹으면 싹쓸이로 상대 피를 가져온다', () => {
  const month = deck.filter((item) => item.month === 4);
  const opponentPi = card(10, '피');
  const next = playGoStopTurn(roundFor([month[0]], [month[1]], [], [opponentPi]), month[0].id);
  assert.equal(next.lastEvents?.includes('싹쓸이'), true);
  assert.equal(next.floor.length, 0);
  assert.equal(next.players[0].captured.some((item) => item.id === opponentPi.id), true);
});

test('300판을 끝까지 돌려도 멈추는 판이 없다', () => {
  // App.tsx의 stepComputer와 같은 순서로 둡니다. 폭탄 때문에 손이 먼저 비는 사람이 생기는데,
  // 그 자리에 차례가 가면 낼 패가 없어 판이 멈춥니다. 실제로 그 버그가 있었습니다.
  const firstMatchId = (floor: HwatuCard[], month: number) => {
    const matches = floor.filter((item) => item.month === month);
    return matches.length === 2 ? matches[0].id : undefined;
  };
  const step = (round: GoStopRound): GoStopRound => {
    if (round.pendingDecision === round.turn) return chooseGoOrStop(round, 'stop');
    const hand = round.players[round.turn].hand;
    const months = Array.from(new Set(hand.map((item) => item.month)));
    const bomb = months.find((month) => hand.filter((item) => item.month === month).length === 3
      && round.floor.filter((item) => item.month === month).length === 1);
    if (bomb !== undefined) return playGoStopBomb(round, bomb);
    const played = chooseComputerGoStopCard(round);
    // 낸 패를 처리한 뒤의 바닥에서 뒤집은 패의 짝을 고릅니다. 화면이 하는 것과 같습니다.
    const matches = round.floor.filter((item) => item.month === played.month);
    const playedMatchId = firstMatchId(round.floor, played.month);
    const afterPlay = matches.length === 0 ? [...round.floor, played]
      : matches.length === 1 ? round.floor.filter((item) => item.id !== matches[0].id)
      : matches.length === 2 ? round.floor.filter((item) => item.id !== playedMatchId)
      : round.floor.filter((item) => item.month !== played.month);
    const drawn = round.deck.find((item) => !item.bonus);
    return playGoStopTurn(round, played.id, { playedMatchId, drawnMatchId: drawn ? firstMatchId(afterPlay, drawn.month) : undefined });
  };
  for (let game = 0; game < 300; game += 1) {
    let round = dealGoStop('gostop');
    let turns = 0;
    while (!round.finished) {
      const next = step(round);
      assert.notEqual(next, round, `판이 멈췄습니다 · 차례 ${round.turn} · 손패 ${round.players[round.turn].hand.length}장`);
      round = next;
      turns += 1;
      assert.equal(turns < 400, true, '판이 끝나지 않습니다');
    }
  }
});

test('폭탄 뒤 뒤집은 패가 바닥 두 장과 맞아도 판이 멈추지 않는다', () => {
  // 2026-08-30에 실제로 터진 것입니다. 고를 패를 안 주면 예외가 나서 화면이 통째로 멈췄습니다.
  const month = deck.filter((item) => item.month === 6);
  const nine = deck.filter((item) => item.month === 9);
  const round = roundFor(month.slice(0, 3), [month[3], nine[0], nine[1]], [nine[2]]);
  const next = playGoStopBomb(round, 6);
  assert.equal(next.lastEvents?.includes('폭탄'), true);
  // 뒤집은 9월 패는 바닥 두 장 가운데 첫 장을 가져갑니다.
  assert.equal(next.players[0].captured.filter((item) => item.month === 9).length, 2);
  assert.equal(next.floor.filter((item) => item.month === 9).length, 1);
});

test('폭탄으로 손이 빈 사람은 차례를 건너뛴다', () => {
  // 폭탄은 한 번에 세 장을 내므로 그 사람만 먼저 손이 빕니다.
  // 빈손에 차례를 주면 낼 패가 없어 판이 그 자리에서 멈춥니다.
  const month = deck.filter((item) => item.month === 6);
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: month.slice(0, 3), captured: [], goCount: 0 },
      { hand: [], captured: [], goCount: 0 },
      { hand: [card(2, '띠'), card(3, '피')], captured: [], goCount: 0 },
    ],
    floor: [month[3]], deck: [card(11, '광'), card(12, '피')], turn: 0, finished: false, winner: null, pendingDecision: null, message: '',
  };
  const next = playGoStopBomb(round, 6);
  assert.equal(next.players[0].hand.length, 0);
  assert.equal(next.finished, false);
  // 1번은 손이 비었으므로 건너뛰고 패가 남은 2번에게 갑니다.
  assert.equal(next.turn, 2);
  assert.equal(next.players[next.turn].hand.length > 0, true);
});

test('폭탄은 손의 같은 월 세 장과 바닥 한 장을 모두 먹는다', () => {
  const month = deck.filter((item) => item.month === 6);
  const opponentPi = card(10, '피');
  const next = playGoStopBomb(roundFor(month.slice(0, 3), [month[3], card(2, '띠')], [], [opponentPi]), 6);
  assert.equal(next.lastEvents?.includes('폭탄'), true);
  assert.equal(next.players[0].hand.length, 0);
  assert.equal(next.players[0].captured.filter((item) => item.month === 6).length, 4);
  assert.equal(next.players[0].captured.some((item) => item.id === opponentPi.id), true);
  assert.equal(next.players[0].shakeCount, 1);
});

test('같은 월 세 장은 한 번만 흔들 수 있고 배수 횟수가 늘어난다', () => {
  const month = deck.filter((item) => item.month === 3);
  const base = roundFor(month.slice(0, 3), [card(2)], [card(4)]);
  const shaken = declareGoStopShake(base, 3);
  assert.equal(shaken.players[0].shakeCount, 1);
  assert.deepEqual(shaken.players[0].shakenMonths, [3]);
  assert.throws(() => declareGoStopShake(shaken, 3), /이미 흔든/);
});

const playerWith = (captured: HwatuCard[], goCount = 0, shakeCount = 0): GoStopPlayer => ({ hand: [], captured, goCount, shakeCount, shakenMonths: [] });

test('피박은 고스톱 5피 이하, 맞고 7피 이하인 패자에게 적용한다', () => {
  const pi = deck.filter((item) => item.kind === '피' && !item.double);
  const winner = playerWith(pi.slice(0, 10));
  assert.equal(calculateGoStopSettlement(winner, playerWith(pi.slice(10, 15)), 'gostop').reasons.includes('피박 ×2'), true);
  assert.equal(calculateGoStopSettlement(winner, playerWith(pi.slice(10, 17)), 'matgo').reasons.includes('피박 ×2'), true);
  assert.equal(calculateGoStopSettlement(winner, playerWith(pi.slice(10, 16)), 'gostop').reasons.includes('피박 ×2'), false);
});

test('광박과 멍박은 승자 조건과 패자의 0장을 함께 확인한다', () => {
  const brightWinner = playerWith([card(1, '광'), card(3, '광'), card(8, '광')]);
  assert.equal(calculateGoStopSettlement(brightWinner, playerWith([]), 'matgo').reasons.includes('광박 ×2'), true);
  const animals = deck.filter((item) => item.kind === '열끗').slice(0, 7);
  assert.equal(calculateGoStopSettlement(playerWith(animals), playerWith([]), 'matgo').reasons.includes('멍박 ×2'), true);
});

test('흔들기와 여러 박이 겹치면 두 배씩 곱한다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광'), ...deck.filter((item) => item.kind === '피' && !item.double).slice(0, 10)];
  const result = calculateGoStopSettlement(playerWith(scoring, 0, 1), playerWith([]), 'matgo');
  assert.equal(result.reasons.includes('피박 ×2'), true);
  assert.equal(result.reasons.includes('광박 ×2'), true);
  assert.equal(result.reasons.includes('흔들기·폭탄 ×2'), true);
  assert.equal(result.multiplier, 8);
  assert.equal(result.finalPoints, result.goScore * 8);
});

test('3인 고스톱에서 고를 외친 패자는 고박이 된다', () => {
  const winner = playerWith([card(1, '광'), card(3, '광'), card(8, '광')]);
  const result = calculateGoStopSettlement(winner, playerWith([], 1), 'gostop');
  assert.equal(result.reasons.includes('고박 ×2'), true);
  assert.equal(calculateGoStopSettlement(winner, playerWith([], 1), 'matgo').reasons.includes('고박 ×2'), false);
});

test('손에 같은 월 네 장이 들어오면 총통 즉시 승리다', () => {
  const fixed = [...deck.filter((item) => item.month === 4), ...deck.filter((item) => item.month !== 4)];
  let index = fixed.length;
  // Fisher-Yates에서 항상 첫 배열을 그대로 두는 값에 가까운 난수는 총통 배치를 만들기 어려우므로
  // 배분 결과 자체를 반복 탐색해 총통 판정이 실제로 나타나는 시드를 확인합니다.
  let found = false;
  for (let seed = 1; seed < 5000 && !found; seed += 1) {
    let state = seed;
    const random = () => { state = (state * 48271) % 2147483647; return state / 2147483647; };
    const round = dealGoStop('matgo', random);
    found = round.lastEvents?.includes('총통') ?? false;
  }
  assert.equal(found, true);
  assert.equal(index, 48);
});

test('패를 모두 써도 스톱하지 못하면 점수 순 승리가 아니라 나가리다', () => {
  const handCard = card(1, '광');
  const match = deck.find((item) => item.month === 1 && item.id !== handCard.id)!;
  const round: GoStopRound = { mode:'gostop', players:[playerWith([],0),playerWith([],0),{...playerWith([],0),hand:[handCard]}], floor:[match], deck:[], turn:2, finished:false, winner:null, pendingDecision:null, message:'' };
  const next = playGoStopTurn(round, handCard.id);
  assert.equal(next.finished, true);
  assert.equal(next.winner, null);
  assert.equal(next.nagari, true);
});

test('컴퓨터는 아무 패가 아니라 바닥의 가치 높은 같은 월 패를 우선 낸다', () => {
  const bright = card(3, '광');
  const matching = deck.find((item) => item.month === 3 && item.id !== bright.id)!;
  const unrelated = card(7, '피');
  const round: GoStopRound = { mode:'matgo', players:[playerWith([]),{...playerWith([]),hand:[unrelated,matching]}], floor:[bright], deck:[card(6)], turn:1, finished:false, winner:null, pendingDecision:null, message:'' };
  assert.equal(chooseComputerGoStopCard(round).id, matching.id);
});

test('보너스판은 2피와 3피 보너스패를 추가한다',()=>{
  const bonus=createGoStopBonusCards();assert.deepEqual(bonus.map((card)=>card.bonus),[2,3]);
  assert.equal(scoreGoStop(bonus).counts.피,5);
});

test('보너스판도 정해진 손패와 바닥 장수를 유지하고 보너스는 자동 획득한다',()=>{
  const round=dealGoStop('matgo',()=>0.29,'bonus');
  assert.equal(round.deckStyle,'bonus');assert.deepEqual(round.players.map((player)=>player.hand.length),[10,10]);assert.equal(round.floor.length,8);
  const all=[...round.players.flatMap((player)=>[...player.hand,...player.captured]),...round.floor,...round.deck];
  assert.equal(all.length,50);assert.equal(new Set(all.map((card)=>card.id)).size,50);
  assert.equal(round.players.flatMap((player)=>player.hand).some((card)=>card.bonus),false);
  assert.equal(round.floor.some((card)=>card.bonus),false);
});

test('더미에서 보너스가 나오면 획득하고 다음 일반 패를 한 장 더 뒤집는다',()=>{
  const bonus=createGoStopBonusCards()[0];const played=card(1,'광');const draw=card(6,'열끗');
  const round:GoStopRound={mode:'matgo',deckStyle:'bonus',players:[{hand:[played],captured:[],goCount:0},{hand:[],captured:[],goCount:0}],floor:[card(4,'띠')],deck:[bonus,draw],turn:0,finished:false,winner:null,pendingDecision:null,message:''};
  const next=playGoStopTurn(round,played.id);
  assert.equal(next.players[0].captured.some((item)=>item.id===bonus.id),true);
  assert.equal(next.floor.some((item)=>item.id===draw.id),true);
  assert.equal(next.lastEvents?.includes('2피 보너스'),true);
});

test('고를 외친 뒤 점수가 안 오르면 고·스톱을 다시 묻지 않는다', () => {
  // 삼광 3점으로 이미 고를 한 번 외친 자리입니다. 그때 점수를 decidedAtScore에 적어 둡니다.
  const captured = [card(1, '광'), card(3, '광'), card(8, '광')];
  const base = (hand: HwatuCard[], floor: HwatuCard[]): GoStopRound => ({
    mode: 'gostop',
    players: [
      { hand, captured, goCount: 1, decidedAtScore: 3 },
      { hand: [card(5)], captured: [], goCount: 0 },
      { hand: [card(6)], captured: [], goCount: 0 },
    ],
    floor, deck: [card(4), card(7), card(9)], turn: 0, finished: false, winner: null, pendingDecision: null, message: '',
  });

  // 한 장도 못 먹은 차례. 3점 그대로라 묻지 않고 다음 사람에게 넘어갑니다.
  const missed = playGoStopTurn(base([card(2)], []), card(2).id);
  assert.equal(scoreGoStop(missed.players[0].captured).total, 3);
  assert.equal(missed.pendingDecision, null);
  assert.equal(missed.turn, 1);

  // 12월 광을 먹어 사광 4점. 점수가 올랐으니 다시 묻습니다.
  const gained = playGoStopTurn(base([card(12, '피')], [card(12, '광')]), card(12, '피').id);
  assert.equal(scoreGoStop(gained.players[0].captured).total, 4);
  assert.equal(gained.pendingDecision, 0);
});

test('고를 외치면 그때의 점수를 적어 둔다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  const base: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(2)], captured: scoring, goCount: 0 },
      { hand: [card(5)], captured: [], goCount: 0 },
      { hand: [card(6)], captured: [], goCount: 0 },
    ],
    floor: [], deck: [card(4)], turn: 0, finished: false, winner: null, pendingDecision: 0, message: '',
  };
  assert.equal(chooseGoOrStop(base, 'go').players[0].decidedAtScore, 3);
});

test('바닥에 같은 월 세 장이 있을 때 넷째를 내면 네 장을 다 먹고 이름이 붙는다', () => {
  const march = deck.filter((item) => item.month === 3);
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [march[3]], captured: [], goCount: 0 },
      { hand: [card(5)], captured: [], goCount: 0 },
      { hand: [card(6)], captured: [], goCount: 0 },
    ],
    floor: [march[0], march[1], march[2], card(9)],
    deck: [card(11), card(12)], turn: 0, finished: false, winner: null, pendingDecision: null, message: '',
  };
  const next = playGoStopTurn(round, march[3].id);
  assert.equal(next.players[0].captured.length, 4);
  assert.equal(next.lastEvents?.includes('네 장 다 먹음'), true);
  assert.equal(next.floor.some((item) => item.month === 3), false);
});

test('깐 패가 바닥의 같은 월 세 장과 맞아도 네 장을 다 먹는다', () => {
  const june = deck.filter((item) => item.month === 6);
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(9)], captured: [], goCount: 0 },
      { hand: [card(5)], captured: [], goCount: 0 },
      { hand: [card(10)], captured: [], goCount: 0 },
    ],
    floor: [june[0], june[1], june[2], card(7)],
    deck: [june[3], card(12)], turn: 0, finished: false, winner: null, pendingDecision: null, message: '',
  };
  const next = playGoStopTurn(round, card(9).id);
  assert.equal(next.players[0].captured.length, 4);
  assert.equal(next.lastEvents?.includes('깐 패로 네 장 다 먹음'), true);
});

test('패를 다 쓰면 기준 점수를 넘긴 사람이 있어도 승리 없이 끝난다', () => {
  // 삼광 3점으로 이미 기준을 넘겼지만 스톱을 안 외쳤습니다.
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(2)], captured: scoring, goCount: 0 },
      { hand: [], captured: [], goCount: 0 },
      { hand: [], captured: [], goCount: 0 },
    ],
    floor: [], deck: [card(4)], turn: 0, finished: false, winner: null, pendingDecision: null, message: '',
  };
  const next = playGoStopTurn(round, card(2).id);
  assert.equal(next.finished, true);
  assert.equal(next.winner, null);
  assert.equal(next.nagari, true);
  assert.equal(next.pendingDecision, null);
});

test('이긴 사람이 다음 판을 먼저 낸다', () => {
  for (const first of [0, 1, 2]) assert.equal(dealGoStop('gostop', () => 0.37, 'classic', first).turn, first);
  // 자리 수를 넘기면 0번으로 돌립니다.
  assert.equal(dealGoStop('matgo', () => 0.37, 'classic', 5).turn, 1);
});

const levelRound = (mine: HwatuCard[], captured: HwatuCard[], goCount: number, rival: HwatuCard[] = []): GoStopRound => ({
  mode: 'gostop',
  players: [
    { hand: [card(2)], captured: rival, goCount: 0 },
    { hand: mine, captured, goCount },
    { hand: [card(6)], captured: [], goCount: 0 },
  ],
  floor: [], deck: [card(4), card(7)], turn: 1, finished: false, winner: null, pendingDecision: 1, message: '',
});

test('쉬움은 늘 스톱하고, 보통·전문가는 자리가 남으면 고를 외친다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  const hand = [card(5), card(6), card(7), card(9)];
  const round = levelRound(hand, scoring, 0);
  assert.equal(chooseComputerGoStop(round, 1, '쉬움'), 'stop');
  assert.equal(chooseComputerGoStop(round, 1, '보통'), 'go');
  assert.equal(chooseComputerGoStop(round, 1, '전문가'), 'go');
});

test('낼 패가 거의 없거나 상대가 기준에 닿으면 스톱한다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  // 낼 패가 한 장뿐입니다. 고를 외쳐도 점수를 못 올립니다.
  assert.equal(chooseComputerGoStop(levelRound([card(5)], scoring, 0), 1, '전문가'), 'stop');
  // 상대가 이미 홍단(3점)입니다. 굳히는 편이 낫습니다.
  const rivalReady = levelRound([card(5), card(6), card(7), card(9)], scoring, 0, [card(1, '띠'), card(2, '띠'), card(3, '띠')]);
  assert.equal(chooseComputerGoStop(rivalReady, 1, '전문가'), 'stop');
});

test('보통은 두 고에서 멈추고, 전문가는 천장이 없다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  const hand = [card(5), card(6), card(7), card(9)];
  // 보통은 이미 두 번 불렀으면 셈이 아무리 좋아도 멈춥니다.
  assert.equal(chooseComputerGoStop(levelRound(hand, scoring, 2), 1, '보통'), 'stop');
  // 전문가는 천장이 없습니다. 상대가 아직 멀면 3고를 부른 뒤에도 더 갑니다.
  assert.equal(chooseComputerGoStop(levelRound(hand, scoring, 3), 1, '전문가'), 'go');
});

test('전문가는 상대가 기준에 닿으면 몇 고를 불렀든 멈춘다', () => {
  const scoring = [card(1, '광'), card(3, '광'), card(8, '광')];
  // 상대가 홍단(3점)을 이미 지어 다음 차례에 뒤집힙니다. 고박까지 물면 크게 잃습니다.
  const rivalReady = [card(1, '띠'), card(2, '띠'), card(3, '띠')];
  const rivalClose: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(10), card(11), card(12)], captured: rivalReady, goCount: 0 },
      { hand: [card(5), card(6)], captured: scoring, goCount: 3 },
      { hand: [card(4), card(7), card(9)], captured: [], goCount: 0 },
    ],
    floor: [], deck: [card(4)], turn: 1, finished: false, winner: null, pendingDecision: 1, message: '',
  };
  assert.equal(chooseComputerGoStop(rivalClose, 1, '전문가'), 'stop');
});

test('전문가는 삼광이 눈앞이면 광부터 집는다', () => {
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(2)], captured: [], goCount: 0 },
      // 광 두 장을 이미 모았습니다. 한 장만 더하면 삼광입니다.
      { hand: [card(8, '광'), card(9, '띠')], captured: [card(1, '광'), card(3, '광')], goCount: 0 },
      { hand: [card(7)], captured: [], goCount: 0 },
    ],
    floor: [card(8, '피'), card(9, '피')], deck: [card(4)], turn: 1, finished: false, winner: null, pendingDecision: null, message: '',
  };
  // 보통은 바닥 값만 보고 띠를 낼 수도 있지만, 전문가는 삼광을 마무리합니다.
  assert.equal(chooseComputerGoStopCard(round, 1, '전문가').kind, '광');
});

test('전문가는 상대 피가 적으면 피를 끊는다', () => {
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      // 상대 피가 두 장뿐입니다. 여기서 피를 끊으면 피박이 보입니다.
      { hand: [card(2)], captured: [card(11, '피'), card(12, '피')], goCount: 0 },
      { hand: [card(5, '피'), card(6, '띠')], captured: [], goCount: 0 },
      { hand: [card(7)], captured: [card(10, '피'), card(11, '피'), card(12, '피')], goCount: 0 },
    ],
    floor: [card(5, '피'), card(6, '피')], deck: [card(4)], turn: 1, finished: false, winner: null, pendingDecision: null, message: '',
  };
  assert.equal(chooseComputerGoStopCard(round, 1, '전문가').month, 5);
});

test('전문가는 못 먹을 때 광을 안 버리고 죽은 달부터 버린다', () => {
  const nine = deck.filter((item) => item.month === 9);
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(2)], captured: [], goCount: 0 },
      // 바닥에 짝이 하나도 없습니다. 무엇을 버릴지가 실력입니다.
      { hand: [card(1, '광'), nine[0]], captured: [], goCount: 0 },
      { hand: [card(7)], captured: [nine[1], nine[2], nine[3]], goCount: 0 },
    ],
    floor: [card(11, '피')], deck: [card(4)], turn: 1, finished: false, winner: null, pendingDecision: null, message: '',
  };
  // 9월은 넉 장이 이미 다 드러나 죽은 달입니다. 광 대신 그것을 버립니다.
  assert.equal(chooseComputerGoStopCard(round, 1, '전문가').month, 9);
});

test('자리마다 실력이 다르고 맞고는 보통 하나다', () => {
  assert.equal(goStopLevelOf('gostop', 1), '쉬움');
  assert.equal(goStopLevelOf('gostop', 2), '전문가');
  assert.equal(goStopLevelOf('matgo', 1), '보통');
});

test('쉬움은 가끔 두 번째로 좋은 패를 낸다', () => {
  const month = deck.filter((item) => item.month === 9);
  const round: GoStopRound = {
    mode: 'gostop',
    players: [
      { hand: [card(2)], captured: [], goCount: 0 },
      { hand: [month[0], card(5), card(6)], captured: [], goCount: 0 },
      { hand: [card(7)], captured: [], goCount: 0 },
    ],
    floor: [month[1]], deck: [card(4)], turn: 1, finished: false, winner: null, pendingDecision: null, message: '',
  };
  // 난수를 안 주면 늘 제일 좋은 수(바닥을 먹는 9월)를 냅니다.
  assert.equal(chooseComputerGoStopCard(round, 1, '쉬움').month, 9);
  assert.equal(chooseComputerGoStopCard(round, 1, '전문가', () => 0).month, 9);
  // 쉬움은 난수가 낮으면 두 번째 수를 냅니다.
  assert.notEqual(chooseComputerGoStopCard(round, 1, '쉬움', () => 0).month, 9);
});

test('총통으로 이기면 먹은 패가 없어도 10점으로 친다', () => {
  const empty: GoStopPlayer = { hand: [], captured: [], goCount: 0 };
  // 모은 패가 없으니 보통이면 0점입니다.
  assert.equal(calculateGoStopSettlement(empty, empty, 'gostop').finalPoints, 0);
  // 총통이면 정해진 점수로 칩니다.
  const bill = calculateGoStopSettlement(empty, empty, 'gostop', { chongtong: true });
  assert.equal(bill.baseScore, chongtongPoints);
  assert.equal(bill.finalPoints, chongtongPoints);
  assert.equal(bill.reasons[0], `총통 ${chongtongPoints}점`);
});

test('바닥에 같은 월이 두 장이면 값이 큰 쪽을 가져온다', () => {
  // 광과 피가 나란히 있으면 광을 가져와야 합니다. 전에는 늘 앞의 것이었습니다.
  assert.equal(chooseGoStopMatch([card(1, '피'), card(1, '광')]).kind, '광');
  assert.equal(chooseGoStopMatch([card(2, '피'), card(2, '열끗')]).kind, '열끗');
  assert.equal(chooseGoStopMatch([card(1, '띠'), card(1, '피')]).kind, '띠');
});
