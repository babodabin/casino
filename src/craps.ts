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

// ── 여러 베팅을 한꺼번에 올려 두는 판 ────────────────────────────────────────
//
// 실제 크랩스 판처럼 여러 자리에 동시에 걸 수 있습니다(2026-10-26).
// 패스 라인 · 돈트 패스 판정은 위의 `resolveCrapsRoll`을 그대로 씁니다.
//
// ⚠️ 이 앱에서 줄인 것 셋:
//   1. 플레이스 · 하드웨이는 **맞으면 원금까지 돌려받고 내려옵니다.** 실제 판은 이긴 뒤에도 그대로
//      걸려 있다가 손님이 내려 달라고 해야 내려옵니다. 판이 언제 끝나는지 알 수 있게 줄였습니다.
//   2. 오즈는 **패스 라인과 컴에만**, 걸어 둔 돈의 **세 배까지** 겁니다(돈트 쪽 오즈는 없습니다).
//   3. "다음 한 번에 7" 같은 한 방짜리 칸은 넣지 않았습니다. 하우스 몫이 11~17%라 손해만 보는 칸입니다.
//
// 실제 판과 같은 것: 플레이스 · 하드웨이 · 컴 오즈는 **포인트가 없을 때(컴아웃) 쉽니다.**
// 그 굴림에서는 이기지도 지지도 않습니다(컴 오즈는 그때 지면 돌려받습니다).

export type CrapsPlaceNumber = 4 | 5 | 6 | 8 | 9 | 10;
export type CrapsHardNumber = 4 | 6 | 8 | 10;
export const crapsPlaceNumbers: CrapsPlaceNumber[] = [4, 5, 6, 8, 9, 10];
export const crapsHardNumbers: CrapsHardNumber[] = [4, 6, 8, 10];

/** 판의 자리. 같은 자리에 또 걸면 금액이 더해집니다. */
export type CrapsSpot =
  | 'pass' | 'dontPass' | 'field' | 'come' | 'passOdds'
  | `place${CrapsPlaceNumber}` | `hard${CrapsHardNumber}` | `comeOdds${CrapsPlaceNumber}`;

/** 걸려 있는 베팅 하나. 컴은 처음에 `number`가 없고, 숫자로 옮겨 가면 그 숫자가 들어갑니다. */
export type CrapsWager = { kind: 'pass' | 'dontPass' | 'field' | 'come' | 'place' | 'hard'; stake: number; number?: number; odds: number };
export type CrapsTable = { point: number | null; wagers: CrapsWager[] };
/** 끝난 베팅 하나. `stake`는 원금 + 오즈, `payout`은 돌려받는 돈 전부(원금 포함)입니다. */
export type CrapsResolution = { label: string; stake: number; payout: number; outcome: 'win' | 'loss' | 'push' };

/** 원금을 뺀 배당. 플레이스 4·10은 9:5, 5·9는 7:5, 6·8은 7:6입니다. */
export const crapsPlaceOdds: Record<CrapsPlaceNumber, number> = { 4: 9 / 5, 5: 7 / 5, 6: 7 / 6, 8: 7 / 6, 9: 7 / 5, 10: 9 / 5 };
/** 오즈는 하우스 몫이 0인 진짜 확률 배당입니다. 4·10은 2:1, 5·9는 3:2, 6·8은 6:5. */
export const crapsTrueOdds: Record<CrapsPlaceNumber, number> = { 4: 2, 5: 3 / 2, 6: 6 / 5, 8: 6 / 5, 9: 3 / 2, 10: 2 };
/** 하드웨이 4·10은 7:1, 6·8은 9:1. */
export const crapsHardOdds: Record<CrapsHardNumber, number> = { 4: 7, 6: 9, 8: 9, 10: 7 };
/** 오즈는 걸어 둔 돈의 이 배수까지만 얹을 수 있습니다. */
export const crapsMaxOdds = 3;

export const newCrapsTable = (): CrapsTable => ({ point: null, wagers: [] });

const pointNumbers = new Set([4, 5, 6, 8, 9, 10]);

/** 자리 이름. 화면과 기록에 같이 씁니다. */
export function crapsSpotLabel(spot: CrapsSpot): string {
  if (spot === 'pass') return '패스 라인';
  if (spot === 'dontPass') return '돈트 패스';
  if (spot === 'field') return '필드';
  if (spot === 'come') return '컴';
  if (spot === 'passOdds') return '패스 라인 오즈';
  if (spot.startsWith('place')) return `플레이스 ${spot.slice(5)}`;
  if (spot.startsWith('hard')) return `하드 ${spot.slice(4)}`;
  return `컴 ${spot.slice(8)} 오즈`;
}

function wagerLabel(wager: CrapsWager): string {
  const base = wager.kind === 'pass' ? '패스 라인' : wager.kind === 'dontPass' ? '돈트 패스' : wager.kind === 'field' ? '필드'
    : wager.kind === 'come' ? (wager.number ? `컴 ${wager.number}` : '컴') : wager.kind === 'place' ? `플레이스 ${wager.number}` : `하드 ${wager.number}`;
  return wager.odds > 0 ? `${base}+오즈` : base;
}

const passWager = (table: CrapsTable) => table.wagers.find((wager) => wager.kind === 'pass');
const comeWagerOn = (table: CrapsTable, number: number) => table.wagers.find((wager) => wager.kind === 'come' && wager.number === number);

/** 이 자리에 오즈를 얼마까지 더 얹을 수 있는지. 오즈 자리가 아니면 끝이 없습니다. */
export function crapsOddsRoom(table: CrapsTable, spot: CrapsSpot): number {
  if (spot === 'passOdds') { const base = passWager(table); return base ? base.stake * crapsMaxOdds - base.odds : 0; }
  if (spot.startsWith('comeOdds')) { const base = comeWagerOn(table, Number(spot.slice(8))); return base ? base.stake * crapsMaxOdds - base.odds : 0; }
  return Infinity;
}

/**
 * 지금 이 자리에 걸 수 있는지. 못 걸면 그 까닭을, 걸 수 있으면 null을 돌려줍니다.
 * `already`는 이번 굴림 전에 이미 올려 둔(아직 안 굴린) 금액입니다.
 */
export function crapsCannotBet(table: CrapsTable, spot: CrapsSpot, amount: number, already = 0): string | null {
  if ((spot === 'pass' || spot === 'dontPass') && table.point !== null) return '포인트가 정해진 뒤에는 못 겁니다';
  if (spot === 'come' && table.point === null) return '포인트가 정해진 뒤에 겁니다';
  if (spot === 'passOdds' && (table.point === null || !passWager(table))) return '패스 라인에 걸고 포인트가 정해지면 겁니다';
  if (spot.startsWith('comeOdds') && !comeWagerOn(table, Number(spot.slice(8)))) return '컴이 이 숫자로 옮겨 와야 겁니다';
  if (already + amount > crapsOddsRoom(table, spot)) return `오즈는 건 돈의 ${crapsMaxOdds}배까지입니다`;
  return null;
}

/** 굴리기 전에 올려 둔 돈을 판에 붙입니다. 같은 자리면 금액을 더합니다. */
export function commitCrapsBets(table: CrapsTable, pending: Partial<Record<CrapsSpot, number>>): CrapsTable {
  const wagers = table.wagers.map((wager) => ({ ...wager }));
  const merge = (kind: CrapsWager['kind'], amount: number, number?: number) => {
    const found = wagers.find((wager) => wager.kind === kind && wager.number === number);
    if (found) found.stake += amount;
    else wagers.push({ kind, stake: amount, number, odds: 0 });
  };
  for (const [spot, amount] of Object.entries(pending) as [CrapsSpot, number][]) {
    if (!amount) continue;
    if (spot === 'pass' || spot === 'dontPass' || spot === 'field' || spot === 'come') merge(spot, amount);
    else if (spot === 'passOdds') { const base = wagers.find((wager) => wager.kind === 'pass'); if (base) base.odds += amount; }
    else if (spot.startsWith('comeOdds')) { const base = wagers.find((wager) => wager.kind === 'come' && wager.number === Number(spot.slice(8))); if (base) base.odds += amount; }
    else if (spot.startsWith('place')) merge('place', amount, Number(spot.slice(5)));
    else merge('hard', amount, Number(spot.slice(4)));
  }
  return { ...table, wagers };
}

/** 한 번 굴립니다. 끝난 베팅은 `resolutions`로 나오고 판에서 빠집니다. */
export function rollCrapsTable(table: CrapsTable, dice: [number, number]): { table: CrapsTable; resolutions: CrapsResolution[] } {
  const total = dice[0] + dice[1];
  const hard = dice[0] === dice[1];
  const comeOut = table.point === null;
  const resolutions: CrapsResolution[] = [];
  const kept: CrapsWager[] = [];
  const settle = (wager: CrapsWager, outcome: CrapsResolution['outcome'], payout: number) =>
    resolutions.push({ label: wagerLabel(wager), stake: wager.stake + wager.odds, payout: Math.floor(payout), outcome });

  for (const wager of table.wagers) {
    if (wager.kind === 'field') {
      if (total === 2 || total === 12) settle(wager, 'win', wager.stake * 3);
      else if ([3, 4, 9, 10, 11].includes(total)) settle(wager, 'win', wager.stake * 2);
      else settle(wager, 'loss', 0);
    } else if (wager.kind === 'pass' || wager.kind === 'dontPass') {
      const result = resolveCrapsRoll(wager.kind, table.point, dice);
      if (result.outcome === 'continue') kept.push(wager);
      else if (result.outcome === 'push') settle(wager, 'push', wager.stake);
      else if (result.outcome === 'loss') settle(wager, 'loss', 0);
      else {
        // 오즈는 패스 라인이 포인트로 이길 때만 붙어 있습니다.
        const odds = wager.odds > 0 && table.point !== null ? wager.odds * (1 + crapsTrueOdds[table.point as CrapsPlaceNumber]) : 0;
        settle(wager, 'win', wager.stake * 2 + odds);
      }
    } else if (wager.kind === 'come') {
      if (wager.number === undefined) {
        // 컴은 거는 순간이 제 첫 굴림입니다.
        if (total === 7 || total === 11) settle(wager, 'win', wager.stake * 2);
        else if (total === 2 || total === 3 || total === 12) settle(wager, 'loss', 0);
        else kept.push({ ...wager, number: total });
      } else if (total === wager.number) {
        // 컴아웃에서는 컴 오즈가 쉬므로 오즈는 원금만 돌려받습니다.
        const odds = comeOut ? wager.odds : wager.odds * (1 + crapsTrueOdds[wager.number as CrapsPlaceNumber]);
        settle(wager, 'win', wager.stake * 2 + odds);
      } else if (total === 7) {
        settle(wager, 'loss', comeOut ? wager.odds : 0);
      } else kept.push(wager);
    } else if (comeOut) {
      kept.push(wager); // 플레이스 · 하드웨이는 컴아웃에서 쉽니다.
    } else if (wager.kind === 'place') {
      if (total === wager.number) settle(wager, 'win', wager.stake * (1 + crapsPlaceOdds[wager.number as CrapsPlaceNumber]));
      else if (total === 7) settle(wager, 'loss', 0);
      else kept.push(wager);
    } else {
      if (total === wager.number && hard) settle(wager, 'win', wager.stake * (1 + crapsHardOdds[wager.number as CrapsHardNumber]));
      else if (total === wager.number || total === 7) settle(wager, 'loss', 0);
      else kept.push(wager);
    }
  }

  const point = comeOut ? (pointNumbers.has(total) ? total : null) : total === table.point || total === 7 ? null : table.point;
  return { table: { point, wagers: kept }, resolutions };
}

/**
 * 판을 떠날 때. 실제 판에서 **내려 달라고 할 수 있는 것**(플레이스 · 하드웨이 · 오즈 · 돈트 패스)은 돌려받고,
 * 못 내리는 것(패스 라인 · 컴의 원금)은 잃습니다.
 */
export function leaveCrapsTable(table: CrapsTable): CrapsResolution[] {
  return table.wagers.map((wager) => {
    const locked = wager.kind === 'pass' || wager.kind === 'come';
    return locked
      ? { label: wagerLabel(wager), stake: wager.stake + wager.odds, payout: wager.odds, outcome: 'loss' as const }
      : { label: wagerLabel(wager), stake: wager.stake + wager.odds, payout: wager.stake + wager.odds, outcome: 'push' as const };
  });
}

/** 떠나면 잃는 금액. 뒤로가기 창에 보여 줍니다. */
export const crapsLockedStake = (table: CrapsTable): number =>
  table.wagers.filter((wager) => wager.kind === 'pass' || wager.kind === 'come').reduce((sum, wager) => sum + wager.stake, 0);
