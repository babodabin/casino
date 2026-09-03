// 컴퓨터의 **고·스톱 판단이 돈이 되는지** 잽니다.
//
// 고를 몇 번 부르는지 세는 것만으로는 잘하는지 알 수 없습니다. 무작정 부르면 고박으로
// 다 뭅니다. 그래서 **한 자리에 그 실력을 앉히고, 나머지는 늘 스톱하는 사람으로 두고**
// 정산까지 해서 그 자리가 판마다 몇 점을 벌었는지 셉니다.
//
//   node --experimental-strip-types scripts/go-check.ts [판수]
import {
  calculateGoStopSettlement, chooseComputerGoStop, chooseComputerGoStopCard, chooseGoOrStop,
  chooseGoStopMatch, dealGoStop, goStopThreshold, playGoStopTurn, scoreGoStop,
  type GoStopLevel, type GoStopMode, type GoStopRound,
} from '../src/gostop.ts';

const rounds = Number(process.argv[2] ?? 600);
/** 재는 자리. 이 자리만 실력대로 두고 나머지는 늘 스톱합니다. */
const 나 = 1;

function playOne(mode: GoStopMode, level: GoStopLevel, seed: number) {
  let random = seed;
  const next = () => { random = (random * 1664525 + 1013904223) % 4294967296; return random / 4294967296; };
  let round: GoStopRound = dealGoStop(mode, next);
  let 고 = 0;

  for (let step = 0; step < 400 && !round.finished; step += 1) {
    if (round.pendingDecision !== null && round.pendingDecision !== undefined) {
      const seat = round.pendingDecision;
      const 고름 = seat === 나 ? chooseComputerGoStop(round, seat, level) : 'stop';
      if (고름 === 'go') 고 += 1;
      round = chooseGoOrStop(round, 고름);
      continue;
    }
    // ⚠️ 패를 고르는 실력은 **모두 '보통'으로 묶습니다.** 재려는 것은 고·스톱 판단
    // 하나뿐인데, 패 고르는 실력까지 같이 바뀌면 무엇 덕에 이겼는지 알 수 없습니다.
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
  if (winner === null) return { 순점수: 0, 고, 이김: 0, 짐: 0, 나가리: 1 };
  const 이긴이 = round.players[winner];
  if (winner === 나) {
    // 이기면 나머지 사람들에게서 다 받습니다.
    const 합 = round.players.reduce((sum, player, seat) => seat === 나 ? sum
      : sum + calculateGoStopSettlement(이긴이, player, mode).finalPoints, 0);
    return { 순점수: 합, 고, 이김: 1, 짐: 0, 나가리: 0 };
  }
  // 지면 이긴 사람에게 냅니다. 고를 불렀다면 고박이 붙습니다.
  const 냄 = calculateGoStopSettlement(이긴이, round.players[나], mode).finalPoints;
  return { 순점수: -냄, 고, 이김: 0, 짐: 1, 나가리: 0 };
}

for (const mode of ['matgo', 'gostop'] as GoStopMode[]) {
  console.log(`\n== ${mode === 'matgo' ? '맞고(2인)' : '고스톱(3인)'} · 기준 ${goStopThreshold(mode)}점 ==`);
  for (const level of ['쉬움', '보통', '전문가'] as GoStopLevel[]) {
    let 점수 = 0, 고 = 0, 이김 = 0, 짐 = 0, 나가리 = 0;
    for (let index = 0; index < rounds; index += 1) {
      const r = playOne(mode, level, index * 7919 + 13);
      점수 += r.순점수; 고 += r.고; 이김 += r.이김; 짐 += r.짐; 나가리 += r.나가리;
    }
    console.log(`${level.padEnd(4)} 판당 ${(점수 / rounds).toFixed(2)}점 · 고 ${고}번 · ${이김}승 ${짐}패 나가리 ${나가리}`);
  }
}
