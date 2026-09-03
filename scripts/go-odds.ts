// 고를 불렀을 때 **실제로 얼마나 이기는지** 셉니다.
//
// 고·스톱 셈에 넣을 가망(pWin·pLose)을 어림으로 적으면 틀립니다. 여기서는 손패 수와
// 상대와의 점수 차이별로, 고를 부른 뒤 판이 어떻게 끝났는지 세어 표를 만듭니다.
//
//   node --experimental-strip-types scripts/go-odds.ts [판수]
import {
  chooseComputerGoStopCard, chooseGoOrStop, chooseGoStopMatch, dealGoStop,
  goStopThreshold, playGoStopTurn, scoreGoStop, type GoStopMode, type GoStopRound,
} from '../src/gostop.ts';

const rounds = Number(process.argv[2] ?? 3000);
const 나 = 1;

type 칸 = { 이김: number; 짐: number; 나가리: number };
const 표 = new Map<string, 칸>();
const 담기 = (key: string, 결과: '이김' | '짐' | '나가리') => {
  const box = 표.get(key) ?? { 이김: 0, 짐: 0, 나가리: 0 };
  box[결과] += 1; 표.set(key, box);
};

for (const mode of ['matgo', 'gostop'] as GoStopMode[]) {
  const threshold = goStopThreshold(mode);
  for (let index = 0; index < rounds; index += 1) {
    let random = index * 7919 + 13;
    const next = () => { random = (random * 1664525 + 1013904223) % 4294967296; return random / 4294967296; };
    let round: GoStopRound = dealGoStop(mode, next);
    const 표시: string[] = [];
    for (let step = 0; step < 400 && !round.finished; step += 1) {
      if (round.pendingDecision !== null && round.pendingDecision !== undefined) {
        const seat = round.pendingDecision;
        let 고름: 'go' | 'stop' = 'stop';
        if (seat === 나 && round.players[나].hand.length >= 2) {
          고름 = 'go';
          const 손 = Math.min(6, round.players[나].hand.length);
          const 상대 = Math.max(0, ...round.players.map((p, s) => s === 나 ? 0 : scoreGoStop(p.captured).total));
          const 차 = Math.max(0, threshold - 상대);
          표시.push(`${mode === 'matgo' ? '맞고' : '고스톱'} 손패${손} 상대차${Math.min(4, 차)}`);
        }
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
    const 결과 = round.winner === null ? '나가리' : round.winner === 나 ? '이김' : '짐';
    for (const key of 표시) 담기(key, 결과);
  }
}

const 줄 = [...표.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [key, box] of 줄) {
  const 합 = box.이김 + box.짐 + box.나가리;
  if (합 < 30) continue;
  console.log(`${key.padEnd(20)} ${String(합).padStart(5)}번 · 이김 ${(box.이김 / 합 * 100).toFixed(0)}% · 짐 ${(box.짐 / 합 * 100).toFixed(0)}% · 나가리 ${(box.나가리 / 합 * 100).toFixed(0)}%`);
}
