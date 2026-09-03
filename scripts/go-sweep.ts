// **고를 부르는 것이 정말 이득인지** 봅니다.
//
// 셈을 아무리 잘 짜도, 고가 원래 손해인 자리에서는 안 부르는 것이 맞습니다.
// 그래서 판단을 아예 고정해 놓고 — "무조건 1고까지" "무조건 2고까지" 식으로 —
// 판당 점수를 재 봅니다. 여기서 나온 값이 고·스톱 셈의 **정답지**입니다.
//
//   node --experimental-strip-types scripts/go-sweep.ts [판수]
import {
  calculateGoStopSettlement, chooseComputerGoStopCard, chooseGoOrStop, chooseGoStopMatch,
  dealGoStop, goStopThreshold, playGoStopTurn, scoreGoStop,
  type GoStopMode, type GoStopRound,
} from '../src/gostop.ts';

const rounds = Number(process.argv[2] ?? 1500);
const 나 = 1;

type 정책 = { 이름: string; 고?: (round: GoStopRound) => boolean };
const 손 = (r: GoStopRound) => r.players[나].hand.length;
const 상대최고 = (r: GoStopRound) => Math.max(0, ...r.players.map((p, s) => s === 나 ? 0 : scoreGoStop(p.captured).total));
const 짝 = (r: GoStopRound) => r.players[나].hand.filter((c) => r.floor.some((f) => f.month === c.month)).length;
const 내점수 = (r: GoStopRound) => scoreGoStop(r.players[나].captured).total;

const 정책들: 정책[] = [
  { 이름: '늘 스톱' },
  { 이름: '손패2+', 고: (r) => 손(r) >= 2 },
  { 이름: '손패2+·1고까지', 고: (r) => 손(r) >= 2 && r.players[나].goCount < 1 },
  { 이름: '손패2+·2고까지', 고: (r) => 손(r) >= 2 && r.players[나].goCount < 2 },
  { 이름: '손패2+·3고까지', 고: (r) => 손(r) >= 2 && r.players[나].goCount < 3 },
  { 이름: '손패2+·상대멀', 고: (r) => 손(r) >= 2 && 상대최고(r) <= goStopThreshold(r.mode) - 2 },
  { 이름: '손패2+·상대0점', 고: (r) => 손(r) >= 2 && 상대최고(r) === 0 },
  { 이름: '손패2+·짝1+', 고: (r) => 손(r) >= 2 && 짝(r) >= 1 },
  { 이름: '손패2+·내점수낮', 고: (r) => 손(r) >= 2 && 내점수(r) <= goStopThreshold(r.mode) + 2 },
  { 이름: '손패2+·상대멀·짝1+', 고: (r) => 손(r) >= 2 && 짝(r) >= 1 && 상대최고(r) <= goStopThreshold(r.mode) - 2 },
];

function playOne(mode: GoStopMode, 정책: 정책, seed: number) {
  let random = seed;
  const next = () => { random = (random * 1664525 + 1013904223) % 4294967296; return random / 4294967296; };
  let round: GoStopRound = dealGoStop(mode, next);
  let 고 = 0;
  for (let step = 0; step < 400 && !round.finished; step += 1) {
    if (round.pendingDecision !== null && round.pendingDecision !== undefined) {
      const seat = round.pendingDecision;
      const 고름 = seat === 나 && 정책.고 && 정책.고(round) ? 'go' : 'stop';
      if (고름 === 'go') 고 += 1;
      round = chooseGoOrStop(round, 고름);
      continue;
    }
    const card = chooseComputerGoStopCard(round, round.turn, '보통', next);
    const matches = round.floor.filter((item) => item.month === card.month);
    const playedMatchId = matches.length === 2 ? chooseGoStopMatch(matches).id : undefined;
    let floor = [...round.floor];
    if (matches.length === 0) floor.push(card);
    else if (matches.length === 1) floor = floor.filter((item) => item.id !== matches[0].id);
    else if (matches.length === 2) floor = floor.filter((item) => item.id !== playedMatchId);
    else floor = floor.filter((item) => item.month !== card.month);
    const drawn = round.deck.find((item) => !item.bonus);
    const drawnMatches = drawn ? floor.filter((item) => item.month === drawn.month) : [];
    round = playGoStopTurn(round, card.id, {
      playedMatchId,
      drawnMatchId: drawnMatches.length === 2 ? chooseGoStopMatch(drawnMatches).id : undefined,
    });
  }
  const winner = round.winner;
  if (winner === null) return { 점수: 0, 고 };
  if (winner === 나) {
    const 합 = round.players.reduce((sum, player, seat) => seat === 나 ? sum
      : sum + calculateGoStopSettlement(round.players[나], player, mode).finalPoints, 0);
    return { 점수: 합, 고 };
  }
  return { 점수: -calculateGoStopSettlement(round.players[winner], round.players[나], mode).finalPoints, 고 };
}

for (const mode of ['matgo', 'gostop'] as GoStopMode[]) {
  console.log(`\n== ${mode === 'matgo' ? '맞고(2인)' : '고스톱(3인)'} · 기준 ${goStopThreshold(mode)}점 · ${rounds}판 ==`);
  for (const 정책 of 정책들) {
    let 점수 = 0, 고 = 0;
    for (let index = 0; index < rounds; index += 1) {
      const r = playOne(mode, 정책, index * 7919 + 13);
      점수 += r.점수; 고 += r.고;
    }
    console.log(`${정책.이름.padEnd(7)} 판당 ${(점수 / rounds).toFixed(3)}점 · 고 ${고}번`);
  }
}
