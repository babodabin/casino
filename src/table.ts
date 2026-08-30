// 여러 명이 앉는 카드 게임의 베팅 한 라운드를 다룹니다.
// 세븐 포커 · 하이로우 · 텍사스 홀덤 · 오마하가 이 하나를 같이 씁니다.
//
// 자리 0번이 나이고 1번부터가 컴퓨터입니다. 차례는 번호 순으로 돕니다.
//
// **사이드 팟은 만들지 않습니다.** 컴퓨터는 칩이 무한해서 올인이 없고, 받거나 폴드만 합니다.
// 그래서 끝까지 간 사람들은 낸 돈이 언제나 같고, 폴드한 사람이 남긴 돈은 팟에 그대로 남습니다.

export type TableSeat = { seat: number; contributed: number; folded: boolean };
export type TableAction =
  | { kind: 'fold' }
  | { kind: 'check' }
  | { kind: 'call'; amount: number }
  | { kind: 'raise'; amount: number };

export type TableRound = {
  seats: TableSeat[];
  /** 이번 라운드에 나온 레이즈 횟수. 한도를 넘으면 더 못 올립니다. */
  raises: number;
  /** 지금 차례인 자리. 라운드가 끝났으면 -1입니다. */
  actor: number;
  /** 마지막 레이즈 뒤에 이미 한 번씩 행동한 자리들. 이게 다 차면 라운드가 끝납니다. */
  actedSinceRaise: number[];
  closed: boolean;
};

/** 한 라운드에 허용하는 레이즈 횟수. 안 두면 컴퓨터끼리 끝없이 올릴 수 있습니다. */
export const maxRaisesPerStreet = 3;

export const tablePot = (round: TableRound): number => round.seats.reduce((sum, seat) => sum + seat.contributed, 0);
export const tableLive = (round: TableRound): TableSeat[] => round.seats.filter((seat) => !seat.folded);
const highestBet = (round: TableRound): number => Math.max(...round.seats.map((seat) => seat.contributed));
export const tableToCall = (round: TableRound, seat: number): number => Math.max(0, highestBet(round) - round.seats[seat].contributed);
/** 내가 낸 돈을 뺀 나머지. 정산에 그대로 씁니다. */
export const tableOthersPot = (round: TableRound, seat = 0): number => tablePot(round) - round.seats[seat].contributed;

/**
 * 첫 판을 엽니다. 모두가 같은 참가비를 냅니다.
 * 다음 라운드는 낸 돈을 그대로 들고 이어 가므로 startTableRound를 씁니다.
 */
export function openTable(players: number, ante: number): TableRound {
  if (players < 2 || players > 4) throw new Error('두 명에서 네 명까지 앉습니다.');
  return {
    seats: Array.from({ length: players }, (_, seat) => ({ seat, contributed: ante, folded: false })),
    raises: 0,
    actor: 0,
    actedSinceRaise: [],
    closed: false,
  };
}

/** 다음 라운드를 엽니다. 낸 돈과 폴드는 그대로 두고 차례만 다시 시작합니다. */
export function startTableRound(round: TableRound, firstActor = 0): TableRound {
  const live = tableLive(round);
  if (live.length <= 1) return { ...round, actor: -1, closed: true };
  const actor = live.some((seat) => seat.seat === firstActor) ? firstActor : live[0].seat;
  return { ...round, raises: 0, actor, actedSinceRaise: [], closed: false };
}

const nextLive = (round: TableRound, from: number): number => {
  for (let step = 1; step <= round.seats.length; step += 1) {
    const seat = round.seats[(from + step) % round.seats.length];
    if (!seat.folded) return seat.seat;
  }
  return -1;
};

/**
 * 지금 차례인 사람이 행동합니다.
 * 라운드는 살아 있는 사람이 모두 한 번씩 행동했고 낸 돈이 같아졌을 때 끝납니다.
 * 누군가 올리면 그 뒤로 다시 한 바퀴 돌아야 합니다.
 */
export function applyTableAction(round: TableRound, action: TableAction, maxRaises = maxRaisesPerStreet): TableRound {
  if (round.closed || round.actor < 0) throw new Error('이미 끝난 라운드입니다.');
  const actor = round.actor;
  const seats = round.seats.map((seat) => ({ ...seat }));
  const me = seats[actor];
  const toCall = tableToCall(round, actor);
  let raises = round.raises;
  let actedSinceRaise = [...round.actedSinceRaise];

  if (action.kind === 'fold') {
    me.folded = true;
  } else if (action.kind === 'check') {
    if (toCall > 0) throw new Error('낼 돈이 남아 있어 체크할 수 없습니다.');
  } else if (action.kind === 'call') {
    me.contributed += toCall;
  } else {
    if (raises >= maxRaises) throw new Error('이번 라운드 레이즈 한도를 넘었습니다.');
    if (!(action.amount > 0)) throw new Error('레이즈 금액은 0보다 커야 합니다.');
    me.contributed += toCall + action.amount;
    raises += 1;
    actedSinceRaise = [];
  }
  if (!actedSinceRaise.includes(actor)) actedSinceRaise.push(actor);

  const next: TableRound = { seats, raises, actor, actedSinceRaise, closed: false };
  const live = tableLive(next);
  if (live.length <= 1) return { ...next, actor: -1, closed: true };

  const highest = Math.max(...live.map((seat) => seat.contributed));
  const settled = live.every((seat) => seat.contributed === highest && actedSinceRaise.includes(seat.seat));
  if (settled) return { ...next, actor: -1, closed: true };
  return { ...next, actor: nextLive(next, actor) };
}

/** 폴드하지 않고 끝까지 간 사람이 한 명뿐인지. 그러면 승부를 안 보고 그 사람이 가져갑니다. */
export const tableWalkover = (round: TableRound): number => {
  const live = tableLive(round);
  return live.length === 1 ? live[0].seat : -1;
};

/**
 * 승부. 세기를 재는 방법은 게임마다 달라서 비교 함수를 받습니다.
 * 같은 세기가 여럿이면 나눠 갖는 대신 모두 승자로 돌려주고, 나누는 것은 부르는 쪽이 정합니다.
 */
export function tableShowdown(round: TableRound, compare: (a: number, b: number) => number): number[] {
  const live = tableLive(round).map((seat) => seat.seat);
  if (live.length === 0) return [];
  let best = [live[0]];
  for (const seat of live.slice(1)) {
    const compared = compare(seat, best[0]);
    if (compared > 0) best = [seat];
    else if (compared === 0) best.push(seat);
  }
  return best;
}
