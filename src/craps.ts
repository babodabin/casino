export type CrapsBet = 'pass' | 'dontPass' | 'field';
export type CrapsOutcome = 'win' | 'loss' | 'push' | 'continue';

export type CrapsRollResult = { dice: [number, number]; total: number; point: number | null; outcome: CrapsOutcome };

export function rollDice(): [number, number] {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
}

export function resolveCrapsRoll(bet: CrapsBet, point: number | null, dice: [number, number]): CrapsRollResult {
  const total = dice[0] + dice[1];
  if (bet === 'field') return { dice, total, point: null, outcome: [2, 3, 4, 9, 10, 11, 12].includes(total) ? 'win' : 'loss' };
  if (point === null) {
    if (bet === 'pass') {
      if (total === 7 || total === 11) return { dice, total, point: null, outcome: 'win' };
      if (total === 2 || total === 3 || total === 12) return { dice, total, point: null, outcome: 'loss' };
    } else {
      if (total === 2 || total === 3) return { dice, total, point: null, outcome: 'win' };
      if (total === 7 || total === 11) return { dice, total, point: null, outcome: 'loss' };
      if (total === 12) return { dice, total, point: null, outcome: 'push' };
    }
    return { dice, total, point: total, outcome: 'continue' };
  }
  if (total === point) return { dice, total, point, outcome: bet === 'pass' ? 'win' : 'loss' };
  if (total === 7) return { dice, total, point, outcome: bet === 'pass' ? 'loss' : 'win' };
  return { dice, total, point, outcome: 'continue' };
}

export function crapsNet(bet: CrapsBet, stake: number, result: CrapsRollResult) {
  if (result.outcome === 'loss') return -stake;
  if (result.outcome === 'push' || result.outcome === 'continue') return 0;
  if (bet === 'field' && (result.total === 2 || result.total === 12)) return stake * 2;
  return stake;
}

export function crapsPayout(bet: CrapsBet, stake: number, result: CrapsRollResult) {
  return result.outcome === 'continue' ? 0 : stake + crapsNet(bet, stake, result);
}
