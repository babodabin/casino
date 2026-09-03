// 고스톱·맞고를 처음부터 끝까지 여러 판 두어 봅니다.
//
// 화면으로 한 판 두는 데 몇 분이 걸려서, 규칙이 어긋나는 자리를 눈으로 찾기 어렵습니다.
// 여기서는 엔진만 돌려 **판이 끝까지 가는지, 규칙을 어기는 자리가 없는지** 셉니다.
//
//   node --experimental-strip-types scripts/gostop-play.ts [판수]
import {
  calculateGoStopSettlement,
  canCallGoStop,
  chooseComputerGoStop,
  chooseComputerGoStopCard,
  chooseGoOrStop,
  chooseGoStopMatch,
  dealGoStop,
  goStopThreshold,
  playGoStopTurn,
  scoreGoStop,
  type GoStopLevel,
  type GoStopMode,
  type GoStopRound,
} from '../src/gostop.ts';

const rounds = Number(process.argv[2] ?? 300);

/** 판 하나를 끝까지 둡니다. 규칙을 어기면 그 자리에서 멈춥니다. */
function playOne(mode: GoStopMode, level: GoStopLevel, seed: number) {
  let random = seed;
  const next = () => {
    random = (random * 1664525 + 1013904223) % 4294967296;
    return random / 4294967296;
  };
  let round: GoStopRound = dealGoStop(mode, next);
  const cards = () => [
    ...round.players.flatMap((player) => [...player.hand, ...player.captured]),
    ...round.floor,
    ...round.deck,
  ];
  const startCards = cards().length;
  let turns = 0;
  while (!round.finished) {
    turns += 1;
    if (turns > 400) throw new Error('판이 안 끝납니다');

    if (round.pendingDecision !== null && round.pendingDecision !== undefined) {
      const seat = round.pendingDecision;
      if (!canCallGoStop(round, seat)) throw new Error(`${seat}번이 기준 점수도 없이 고·스톱을 묻습니다`);
      const choice = seat === 0 ? 'stop' : chooseComputerGoStop(round, seat, level);
      round = chooseGoOrStop(round, choice);
      continue;
    }

    const player = round.players[round.turn];
    if (!player.hand.length) throw new Error(`${round.turn}번이 손패 없이 차례를 받았습니다`);
    const card = chooseComputerGoStopCard(round, round.turn, level, next);
    if (!player.hand.some((item) => item.id === card.id)) throw new Error('손에 없는 패를 냈습니다');
    // 바닥에 같은 월이 두 장이면 어느 것을 가져올지 정해 줘야 합니다(화면이 하는 일과 같습니다).
    const matches = round.floor.filter((item) => item.month === card.month);
    let floor = [...round.floor];
    const playedMatchId = matches.length === 2 ? chooseGoStopMatch(matches).id : undefined;
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

    // 카드는 한 장도 늘거나 줄면 안 됩니다.
    const now = cards();
    if (now.length !== startCards) throw new Error(`카드가 ${startCards}장에서 ${now.length}장이 됐습니다`);
    if (new Set(now.map((item) => item.id)).size !== startCards) throw new Error('같은 패가 둘이 됐습니다');
  }

  const winner = round.winner;
  if (winner === null) return { turns, nagari: true, points: 0, score: 0, reasons: [] as string[], chongtong: false };

  const score = scoreGoStop(round.players[winner].captured);
  // 총통은 패를 안 먹고 그 자리에서 이깁니다. 기준 점수를 따지지 않습니다.
  const chongtong = round.lastEvents?.includes('총통') === true;
  // 삼뻑도 기준 점수를 안 따집니다 — 뻑을 세 번 낸 것으로 이깁니다.
  const sambbeok = round.lastEvents?.includes('삼뻑') === true;
  if (!chongtong && !sambbeok && score.total < goStopThreshold(mode)) throw new Error(`${score.total}점으로 이겼습니다(기준 ${goStopThreshold(mode)}점)`);
  // 진 사람 가운데 **제일 많이 딴 사람**과 견줍니다. 셋이 하면 나머지 둘 중 하나입니다.
  const losers = round.players.filter((_, seat) => seat !== winner);
  const worst = losers.reduce((low, player) => scoreGoStop(player.captured).total > scoreGoStop(low.captured).total ? player : low, losers[0]);
  const settlement = calculateGoStopSettlement(round.players[winner], worst, mode, { chongtong, sambbeok });
  if (!chongtong && !sambbeok && settlement.finalPoints < score.total) throw new Error('정산 점수가 딴 점수보다 적습니다');
  return { turns, nagari: false, points: settlement.finalPoints, score: score.total, reasons: settlement.reasons, chongtong, sambbeok };
}

const tally: Record<string, { 판: number; 나가리: number; 점수합: number; 최고: number; 이유: Record<string, number> }> = {};
for (const mode of ['gostop', 'matgo'] as GoStopMode[]) {
  for (const level of ['쉬움', '보통', '전문가'] as GoStopLevel[]) {
    const key = `${mode === 'gostop' ? '고스톱' : '맞고'} · ${level}`;
    tally[key] = { 판: 0, 나가리: 0, 점수합: 0, 최고: 0, 이유: {} };
    for (let index = 0; index < rounds; index += 1) {
      const result = playOne(mode, level, index * 7919 + 13);
      const box = tally[key];
      box.판 += 1;
      if (result.nagari) box.나가리 += 1;
      box.점수합 += result.points;
      box.최고 = Math.max(box.최고, result.points);
      for (const reason of result.reasons) box.이유[reason] = (box.이유[reason] ?? 0) + 1;
    }
  }
}

for (const [key, box] of Object.entries(tally)) {
  const 평균 = box.판 - box.나가리 > 0 ? (box.점수합 / (box.판 - box.나가리)).toFixed(1) : '-';
  const 이유 = Object.entries(box.이유).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => `${name} ${count}`).join(' · ');
  console.log(`${key}: ${box.판}판 · 나가리 ${box.나가리} · 평균 ${평균}점 · 최고 ${box.최고}점`);
  console.log(`  ${이유}`);
}
