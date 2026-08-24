import {
  createMahjongTiles,
  shuffleMahjong,
  sortMahjongHand,
  isWinningMahjongHand,
  getStandardMahjongDecompositions,
  type MahjongTile,
} from './riichimahjong.ts';

/**
 * 사천 마작(四川麻将 · 血战到底)
 *
 * 리치 마작과 다른 점
 * - 자패를 쓰지 않고 만수·통수·삭수 108장만 사용합니다.
 * - 치(吃)가 없습니다. 퐁과 깡만 할 수 있습니다.
 * - 정결(定缺): 시작할 때 한 종류를 버리기로 정하고, 그 종류를 전부 버려야 화료할 수 있습니다.
 * - 환삼장(換三張): 시작할 때 같은 종류 세 장을 옆 사람과 바꿉니다.
 * - 혈전도저(血战到底): 한 명이 화료해도 끝나지 않고 세 명이 화료할 때까지 이어집니다.
 * - 점수는 부(符)가 없고 번(番)이 배수로 곱해집니다.
 */

export type SichuanSuit = 'm' | 'p' | 's';
export const sichuanSuits: SichuanSuit[] = ['m', 'p', 's'];
export const suitNames: Record<SichuanSuit, string> = { m: '만수', p: '통수', s: '삭수' };

export type SichuanFan = { name: string; chinese: string; multiplier: number; detail: string };
export type SichuanWinType = 'tsumo' | 'ron';

export type SichuanScore = {
  fans: SichuanFan[];
  roots: number;
  multiplier: number;
  capped: boolean;
  perPlayer: number;
  total: number;
};

/** 혈전도저 진행 상태. 화료한 사람은 빠지고 남은 사람끼리 계속합니다. */
export type SichuanBloodState = {
  scores: [number, number, number, number];
  finished: [boolean, boolean, boolean, boolean];
  winners: number[];
  over: boolean;
};

const MAX_MULTIPLIER = 64;

// ── 패 준비 ────────────────────────────────────────────────────────

export function createSichuanTiles() {
  return createMahjongTiles(false);
}

export type SichuanRound = {
  hands: MahjongTile[][];
  wall: MahjongTile[];
  rivers: MahjongTile[][];
};

export function dealSichuan(random: () => number = Math.random): SichuanRound {
  const deck = shuffleMahjong(createSichuanTiles(), random);
  const hands: MahjongTile[][] = [[], [], [], []];
  let cursor = 0;
  for (let count = 0; count < 13; count++) for (let seat = 0; seat < 4; seat++) hands[seat].push(deck[cursor++]);
  return { hands: hands.map(sortMahjongHand), wall: deck.slice(cursor), rivers: [[], [], [], []] };
}

// ── 정결(定缺) ─────────────────────────────────────────────────────

export function countBySuit(tiles: MahjongTile[]) {
  return sichuanSuits.reduce((counts, suit) => {
    counts[suit] = tiles.filter((tile) => tile.suit === suit).length;
    return counts;
  }, {} as Record<SichuanSuit, number>);
}

/** 가장 적게 들고 있는 종류를 버릴 종류로 고릅니다. 같으면 만→통→삭 순. */
export function chooseVoidSuit(hand: MahjongTile[]): SichuanSuit {
  const counts = countBySuit(hand);
  return sichuanSuits.reduce((best, suit) => counts[suit] < counts[best] ? suit : best, sichuanSuits[0]);
}

export function hasVoidSuitTiles(tiles: MahjongTile[], voidSuit: SichuanSuit) {
  return tiles.some((tile) => tile.suit === voidSuit);
}

/** 정결한 종류가 한 장이라도 남아 있으면 화료할 수 없습니다. */
export function isSichuanVoidCleared(hand: MahjongTile[], melds: MahjongTile[][], voidSuit: SichuanSuit) {
  return !hasVoidSuitTiles([...hand, ...melds.flat()], voidSuit);
}

/** 정결한 종류를 우선 버립니다. 다 버렸으면 null. */
export function nextVoidDiscard(hand: MahjongTile[], voidSuit: SichuanSuit) {
  const target = hand.filter((tile) => tile.suit === voidSuit);
  if (!target.length) return null;
  // 고립된 패부터 버립니다.
  const scored = target.map((tile) => ({
    tile,
    neighbours: hand.filter((other) => other.suit === tile.suit && Math.abs(other.value - tile.value) <= 2 && other.id !== tile.id).length,
  }));
  scored.sort((a, b) => a.neighbours - b.neighbours);
  return scored[0].tile;
}

// ── 환삼장(換三張) ─────────────────────────────────────────────────

/** 같은 종류 세 장을 고릅니다. 가장 쓸모가 적은 종류에서 뽑습니다. */
export function pickSwapTiles(hand: MahjongTile[]): MahjongTile[] | null {
  const counts = countBySuit(hand);
  const candidates = sichuanSuits
    .filter((suit) => counts[suit] >= 3)
    .sort((a, b) => counts[a] - counts[b]);
  if (!candidates.length) return null;
  const suit = candidates[0];
  const pool = hand.filter((tile) => tile.suit === suit);
  const scored = pool.map((tile) => ({
    tile,
    neighbours: pool.filter((other) => Math.abs(other.value - tile.value) <= 2 && other.id !== tile.id).length,
  }));
  scored.sort((a, b) => a.neighbours - b.neighbours);
  return scored.slice(0, 3).map((entry) => entry.tile);
}

/**
 * 네 명이 같은 방향으로 세 장씩 넘깁니다.
 * direction이 1이면 다음 자리로, 3이면 이전 자리로 넘어갑니다.
 */
export function swapThreeTiles(hands: MahjongTile[][], direction = 1) {
  if (hands.length !== 4) throw new Error('환삼장은 네 명이 필요합니다.');
  const given = hands.map((hand) => pickSwapTiles(hand));
  if (given.some((tiles) => !tiles)) return hands.map(sortMahjongHand);
  const next = hands.map((hand, seat) => {
    const removed = new Set(given[seat]!.map((tile) => tile.id));
    return hand.filter((tile) => !removed.has(tile.id));
  });
  given.forEach((tiles, seat) => {
    const target = (seat + direction) % 4;
    next[target].push(...tiles!);
  });
  return next.map(sortMahjongHand);
}

// ── 완성 판정 ──────────────────────────────────────────────────────

/**
 * 사천식 칠대자. 리치와 달리 같은 패 네 장을 두 쌍으로 셉니다(용칠대자).
 * 그래서 짝이 모두 짝수이고 쌍이 일곱이면 완성입니다.
 */
export function isSichuanSevenPairs(hand: MahjongTile[]) {
  if (hand.length !== 14) return false;
  const counts = new Map<string, number>();
  hand.forEach((tile) => { const key = `${tile.suit}${tile.value}`; counts.set(key, (counts.get(key) ?? 0) + 1); });
  const values = [...counts.values()];
  if (values.some((count) => count % 2 !== 0)) return false;
  return values.reduce((pairs, count) => pairs + count / 2, 0) === 7;
}

export function isSichuanWinningHand(hand: MahjongTile[], meldCount = 0) {
  if (meldCount === 0 && isSichuanSevenPairs(hand)) return true;
  return isWinningMahjongHand(hand, meldCount);
}

export function canSichuanWin(hand: MahjongTile[], melds: MahjongTile[][], voidSuit: SichuanSuit) {
  if (!isSichuanVoidCleared(hand, melds, voidSuit)) return false;
  return isSichuanWinningHand(hand, melds.length);
}

export function getSichuanWaits(hand: MahjongTile[], melds: MahjongTile[][], voidSuit: SichuanSuit) {
  if (!isSichuanVoidCleared(hand, melds, voidSuit)) return [];
  const candidates = createSichuanTiles().filter((tile) => tile.id.endsWith('-0') && tile.suit !== voidSuit);
  return candidates.filter((tile) => isSichuanWinningHand([...hand, tile], melds.length));
}

// ── 번(番) 판정 ────────────────────────────────────────────────────

const isTripletMeld = (meld: MahjongTile[]) => meld.every((tile) => tile.suit === meld[0].suit && tile.value === meld[0].value);

/** 근(根): 같은 패 네 장이 모인 묶음 하나당 점수가 두 배가 됩니다. */
export function countRoots(hand: MahjongTile[], melds: MahjongTile[][]) {
  const all = [...hand, ...melds.flat()];
  const counts = new Map<string, number>();
  all.forEach((tile) => { const key = `${tile.suit}${tile.value}`; counts.set(key, (counts.get(key) ?? 0) + 1); });
  return [...counts.values()].filter((count) => count >= 4).length;
}

export function evaluateSichuanFan(args: {
  hand: MahjongTile[];
  melds?: MahjongTile[][];
  winType: SichuanWinType;
  afterKan?: boolean;
  robbingKan?: boolean;
  lastTile?: boolean;
}): SichuanFan[] {
  const melds = args.melds ?? [];
  const concealed = melds.length === 0;
  const all = [...args.hand, ...melds.flat()];
  const fans: SichuanFan[] = [];

  const suits = new Set(all.map((tile) => tile.suit));
  const pure = suits.size === 1;
  const sevenPairs = melds.length === 0 && isSichuanSevenPairs(args.hand);
  const quadCount = melds.filter((meld) => meld.length === 4).length;

  // 칠대자 계열
  if (sevenPairs) {
    const withQuad = countRoots(args.hand, melds) > 0;
    if (pure && withQuad) fans.push({ name: '청룡칠대자', chinese: '清龙七对', multiplier: 32, detail: '한 종류로만 만든 칠대자에 같은 패 네 장이 포함' });
    else if (pure) fans.push({ name: '청칠대자', chinese: '清七对', multiplier: 16, detail: '한 종류로만 만든 칠대자' });
    else if (withQuad) fans.push({ name: '용칠대자', chinese: '龙七对', multiplier: 8, detail: '같은 패 네 장이 포함된 칠대자' });
    else fans.push({ name: '칠대자', chinese: '七对', multiplier: 4, detail: '서로 다른 일곱 종류를 두 장씩' });
    if (fans.length) return finishFans(fans, { ...args, concealed });
  }

  const decompositions = getStandardMahjongDecompositions(args.hand, melds);
  const allTriplets = melds.every(isTripletMeld) && decompositions.some(({ groups }) => groups.every((group) => group.kind === 'triplet'));

  // 십팔나한: 깡 네 개
  if (quadCount === 4) fans.push({ name: '십팔나한', chinese: '十八罗汉', multiplier: 64, detail: '깡 네 개로 완성' });
  // 장대(将对): 2·5·8로만 이루어진 대대화
  else if (allTriplets && all.every((tile) => [2, 5, 8].includes(tile.value))) fans.push({ name: '장대', chinese: '将对', multiplier: 16, detail: '2·5·8만으로 만든 대대화' });
  else if (pure && allTriplets) fans.push({ name: '청대대', chinese: '清碰', multiplier: 8, detail: '한 종류로만 만든 대대화' });
  else if (pure) fans.push({ name: '청일색', chinese: '清一色', multiplier: 4, detail: '한 종류의 패로만 완성' });
  else if (allTriplets) fans.push({ name: '대대화', chinese: '碰碰胡', multiplier: 2, detail: '모든 몸통이 같은 패 세 장 또는 네 장' });
  else fans.push({ name: '평화', chinese: '平胡', multiplier: 1, detail: '기본 완성형' });

  return finishFans(fans, { ...args, concealed });
}

function finishFans(fans: SichuanFan[], args: { winType: SichuanWinType; afterKan?: boolean; robbingKan?: boolean; lastTile?: boolean; concealed?: boolean }) {
  const extra: SichuanFan[] = [];
  if (args.concealed) extra.push({ name: '금구', chinese: '門清', multiplier: 2, detail: '한 번도 울지 않고 완성' });
  if (args.winType === 'tsumo') extra.push({ name: '자모', chinese: '自摸', multiplier: 2, detail: '직접 뽑아 완성' });
  if (args.afterKan) extra.push({ name: '깡상화', chinese: '杠上花', multiplier: 2, detail: '깡을 하고 가져온 패로 완성' });
  if (args.robbingKan) extra.push({ name: '창깡', chinese: '抢杠', multiplier: 2, detail: '상대가 가깡하려는 패를 가로채 완성' });
  if (args.lastTile) extra.push({ name: '해저포', chinese: '海底捞月', multiplier: 2, detail: '마지막 패로 완성' });
  return [...fans, ...extra];
}

// ── 점수 ───────────────────────────────────────────────────────────

/**
 * 사천 마작은 번이 배수로 곱해집니다.
 * 기본 점수 × 역 배수 × 근(같은 패 네 장) 배수, 상한 64배.
 * 쯔모는 세 명 모두에게, 론은 방총자에게만 받습니다.
 */
export function sichuanScore(args: {
  fans: SichuanFan[];
  roots?: number;
  basePoints?: number;
  winType: SichuanWinType;
  activeOpponents?: number;
}): SichuanScore {
  const base = args.basePoints ?? 1;
  const roots = args.roots ?? 0;
  const raw = args.fans.reduce((total, fan) => total * fan.multiplier, 1) * 2 ** roots;
  const multiplier = Math.min(raw, MAX_MULTIPLIER);
  const perPlayer = base * multiplier;
  // 혈전도저에서는 이미 화료해 빠진 사람은 내지 않습니다.
  const payers = args.winType === 'tsumo' ? Math.max(1, args.activeOpponents ?? 3) : 1;
  return { fans: args.fans, roots, multiplier, capped: raw > MAX_MULTIPLIER, perPlayer, total: perPlayer * payers };
}

// ── 과수(刮風下雨): 깡 즉시 정산 ────────────────────────────────────

export type SichuanKanKind = 'ankan' | 'minkan' | 'kakan';
export type SichuanKanTransfer = { from: number; to: number; amount: number };

/**
 * 사천 마작은 깡을 하는 순간 점수를 받습니다.
 * - 암깡(暗杠, 하우): 남은 사람 각자에게 2점
 * - 대명깡(明杠, 괄풍): 패를 버린 사람에게 2점
 * - 가깡(下雨): 남은 사람 각자에게 1점
 */
export function kanInstantPoints(kind: SichuanKanKind, basePoints = 1) {
  if (kind === 'ankan') return { perPlayer: basePoints * 2, fromDiscarder: false, label: '암깡(하우)' };
  if (kind === 'minkan') return { perPlayer: basePoints * 2, fromDiscarder: true, label: '대명깡(괄풍)' };
  return { perPlayer: basePoints * 1, fromDiscarder: false, label: '가깡(하우)' };
}

/** 깡 즉시 정산을 점수판에 반영합니다. 이미 화료해 빠진 사람은 주고받지 않습니다. */
export function settleSichuanKan(state: SichuanBloodState, args: {
  kanner: number;
  kind: SichuanKanKind;
  discarder?: number;
  basePoints?: number;
}): { state: SichuanBloodState; gained: number; label: string; transfers: SichuanKanTransfer[] } {
  const rule = kanInstantPoints(args.kind, args.basePoints ?? 1);
  const next: SichuanBloodState = {
    scores: [...state.scores] as SichuanBloodState['scores'],
    finished: [...state.finished] as SichuanBloodState['finished'],
    winners: [...state.winners],
    over: state.over,
  };
  let gained = 0;
  const transfers: SichuanKanTransfer[] = [];
  if (rule.fromDiscarder) {
    if (args.discarder === undefined) throw new Error('대명깡에는 패를 버린 사람이 필요합니다.');
    if (!next.finished[args.discarder]) {
      next.scores[args.discarder] -= rule.perPlayer;
      next.scores[args.kanner] += rule.perPlayer;
      gained = rule.perPlayer;
      transfers.push({ from: args.discarder, to: args.kanner, amount: rule.perPlayer });
    }
  } else {
    activeSichuanSeats(state).filter((seat) => seat !== args.kanner).forEach((seat) => {
      next.scores[seat] -= rule.perPlayer;
      next.scores[args.kanner] += rule.perPlayer;
      gained += rule.perPlayer;
      transfers.push({ from: seat, to: args.kanner, amount: rule.perPlayer });
    });
  }
  return { state: next, gained, label: rule.label, transfers };
}

// ── 혈전도저 진행 ──────────────────────────────────────────────────

export function createBloodState(startingScore = 0): SichuanBloodState {
  return {
    scores: [startingScore, startingScore, startingScore, startingScore],
    finished: [false, false, false, false],
    winners: [],
    over: false,
  };
}

export function activeSichuanSeats(state: SichuanBloodState) {
  return [0, 1, 2, 3].filter((seat) => !state.finished[seat]);
}

/**
 * 한 명이 화료했을 때의 정산.
 * 화료한 사람은 이후 판에서 빠지고, 세 명이 화료하면 그 국이 끝납니다.
 */
export function settleSichuanWin(state: SichuanBloodState, args: {
  winner: number;
  score: SichuanScore;
  winType: SichuanWinType;
  loser?: number;
}): SichuanBloodState {
  if (state.finished[args.winner]) throw new Error('이미 화료한 사람은 다시 화료할 수 없습니다.');
  const next: SichuanBloodState = {
    scores: [...state.scores] as SichuanBloodState['scores'],
    finished: [...state.finished] as SichuanBloodState['finished'],
    winners: [...state.winners, args.winner],
    over: false,
  };

  if (args.winType === 'ron') {
    if (args.loser === undefined || args.loser === args.winner) throw new Error('론에는 방총자가 필요합니다.');
    if (next.finished[args.loser]) throw new Error('이미 화료해 빠진 사람은 방총할 수 없습니다.');
    next.scores[args.loser] -= args.score.perPlayer;
    next.scores[args.winner] += args.score.perPlayer;
  } else {
    const payers = activeSichuanSeats(state).filter((seat) => seat !== args.winner);
    payers.forEach((seat) => {
      next.scores[seat] -= args.score.perPlayer;
      next.scores[args.winner] += args.score.perPlayer;
    });
  }

  next.finished[args.winner] = true;
  next.over = next.winners.length >= 3;
  return next;
}

/** 한 장의 버림패로 여러 명이 동시에 론하는 일포다향 정산입니다. */
export function settleSichuanMultipleRon(state: SichuanBloodState, args: {
  loser: number;
  winners: { seat: number; score: SichuanScore }[];
}): SichuanBloodState {
  if (state.finished[args.loser]) throw new Error('이미 화료해 빠진 사람은 방총할 수 없습니다.');
  const seats = args.winners.map((winner) => winner.seat);
  if (new Set(seats).size !== seats.length || args.winners.some((winner) => winner.seat === args.loser || state.finished[winner.seat])) {
    throw new Error('론 승자는 서로 다른 진행 중 참가자여야 합니다.');
  }
  return args.winners.reduce((next, winner) => settleSichuanWin(next, {
    winner: winner.seat,
    score: winner.score,
    winType: 'ron',
    loser: args.loser,
  }), state);
}

/**
 * 차대각(査大叫) · 차화저(査花豬).
 *
 * 유국이면 텐파이하지 못한 사람이 텐파이한 사람에게 물어줍니다.
 * 낼 금액은 상대가 그 손으로 화료했을 때 받았을 점수입니다.
 * 정결을 끝내지 못한 사람(화저)은 텐파이한 모든 사람에게 물어줍니다.
 */
export function settleSichuanFullDraw(state: SichuanBloodState, args: {
  hands: MahjongTile[][];
  melds: MahjongTile[][][];
  voidSuits: SichuanSuit[];
  kanTransfers?: SichuanKanTransfer[];
  basePoints?: number;
}): { state: SichuanBloodState; tenpai: boolean[]; cleared: boolean[]; log: string[] } {
  const base = args.basePoints ?? 1;
  const next: SichuanBloodState = {
    scores: [...state.scores] as SichuanBloodState['scores'],
    finished: [...state.finished] as SichuanBloodState['finished'],
    winners: [...state.winners],
    over: true,
  };
  const remaining = activeSichuanSeats(state);
  const cleared = [0, 1, 2, 3].map((seat) => isSichuanVoidCleared(args.hands[seat], args.melds[seat], args.voidSuits[seat]));
  const tenpai = [0, 1, 2, 3].map((seat) =>
    cleared[seat] && getSichuanWaits(args.hands[seat], args.melds[seat], args.voidSuits[seat]).length > 0);
  const log: string[] = [];

  const seatLabelOf = (seat: number) => seat === 0 ? '나' : `컴퓨터 ${seat}`;

  remaining.forEach((payer) => {
    // 화저: 정결을 못 끝낸 사람
    const isPig = !cleared[payer];
    if (tenpai[payer] && !isPig) return;
    remaining.filter((seat) => seat !== payer && tenpai[seat]).forEach((receiver) => {
      // 받는 사람이 그 대기로 화료했다면 받았을 점수
      const waits = getSichuanWaits(args.hands[receiver], args.melds[receiver], args.voidSuits[receiver]);
      const best = waits.reduce((top, tile) => {
        const fans = evaluateSichuanFan({ hand: [...args.hands[receiver], tile], melds: args.melds[receiver], winType: 'ron' });
        const score = sichuanScore({ fans, roots: countRoots([...args.hands[receiver], tile], args.melds[receiver]), basePoints: base, winType: 'ron' });
        return Math.max(top, score.perPlayer);
      }, base);
      next.scores[payer] -= best;
      next.scores[receiver] += best;
      log.push(`${seatLabelOf(payer)} → ${seatLabelOf(receiver)} ${best}점 (${isPig ? '화저' : '노텐'})`);
    });
  });

  // 퇴세(退稅): 유국 때 텐파이하지 못한 사람이 받은 깡 점수는 원래 낸 사람에게 돌려줍니다.
  (args.kanTransfers ?? []).forEach((transfer) => {
    if (!remaining.includes(transfer.to) || tenpai[transfer.to]) return;
    next.scores[transfer.to] -= transfer.amount;
    next.scores[transfer.from] += transfer.amount;
    log.push(`${seatLabelOf(transfer.to)} → ${seatLabelOf(transfer.from)} ${transfer.amount}점 (퇴세)`);
  });

  return { state: next, tenpai, cleared, log };
}

/**
 * 유국. 아직 화료하지 못한 사람 중 정결을 끝내지 못한 사람이
 * 정결을 끝낸 사람에게 물어줍니다(간단형).
 */
export function settleSichuanDraw(state: SichuanBloodState, voidCleared: boolean[], penalty = 1): SichuanBloodState {
  const next: SichuanBloodState = {
    scores: [...state.scores] as SichuanBloodState['scores'],
    finished: [...state.finished] as SichuanBloodState['finished'],
    winners: [...state.winners],
    over: true,
  };
  const remaining = activeSichuanSeats(state);
  const cleared = remaining.filter((seat) => voidCleared[seat]);
  const notCleared = remaining.filter((seat) => !voidCleared[seat]);
  notCleared.forEach((payer) => {
    cleared.forEach((receiver) => {
      next.scores[payer] -= penalty;
      next.scores[receiver] += penalty;
    });
  });
  return next;
}

export function rankSichuanScores(scores: SichuanBloodState['scores']) {
  return scores
    .map((score, seat) => ({ seat, score }))
    .sort((a, b) => b.score - a.score || a.seat - b.seat)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// ── 부르기(퐁·깡만) ────────────────────────────────────────────────

export type SichuanCallKind = 'pon' | 'minkan' | 'ankan' | 'kakan';
export type SichuanCallOption = { kind: SichuanCallKind; tiles: MahjongTile[]; label: string; meldIndex?: number };

/** 사천 마작에는 치가 없습니다. 정결한 종류로는 부를 수 없습니다. */
export function getSichuanCallOptions(hand: MahjongTile[], discarded: MahjongTile, voidSuit: SichuanSuit): SichuanCallOption[] {
  if (discarded.suit === voidSuit) return [];
  const matching = hand.filter((tile) => tile.suit === discarded.suit && tile.value === discarded.value);
  const options: SichuanCallOption[] = [];
  if (matching.length >= 2) options.push({ kind: 'pon', tiles: matching.slice(0, 2), label: `퐁 ${discarded.glyph}${discarded.glyph}${discarded.glyph}` });
  if (matching.length >= 3) options.push({ kind: 'minkan', tiles: matching.slice(0, 3), label: `깡 ${discarded.glyph} ×4` });
  return options;
}

export function getSichuanKanOptions(hand: MahjongTile[], melds: MahjongTile[][], voidSuit: SichuanSuit): SichuanCallOption[] {
  const options: SichuanCallOption[] = [];
  const groups = new Map<string, MahjongTile[]>();
  hand.filter((tile) => tile.suit !== voidSuit).forEach((tile) => {
    const key = `${tile.suit}${tile.value}`;
    groups.set(key, [...(groups.get(key) ?? []), tile]);
  });
  [...groups.values()].filter((tiles) => tiles.length >= 4).forEach((tiles) => {
    options.push({ kind: 'ankan', tiles: tiles.slice(0, 4), label: `암깡 ${tiles[0].glyph} ×4` });
  });
  melds.forEach((meld, meldIndex) => {
    if (meld.length !== 3 || !isTripletMeld(meld)) return;
    const match = hand.find((tile) => tile.suit === meld[0].suit && tile.value === meld[0].value);
    if (match) options.push({ kind: 'kakan', tiles: [...meld, match], label: `가깡 ${match.glyph} ×4`, meldIndex });
  });
  return options;
}

/**
 * 깡을 하면 보충패를 한 장 가져옵니다.
 * 사천 마작에는 왕패가 따로 없어 산의 뒤쪽에서 가져옵니다.
 */
export function drawSichuanReplacement(hand: MahjongTile[], wall: MahjongTile[]) {
  if (!wall.length) return { hand, wall, drawn: null };
  const next = [...wall];
  const drawn = next.pop()!;
  return { hand: sortMahjongHand([...hand, drawn]), wall: next, drawn };
}

export function applySichuanCall(hand: MahjongTile[], discarded: MahjongTile, option: SichuanCallOption) {
  const ids = new Set(option.tiles.map((tile) => tile.id));
  const meld = option.kind === 'pon' || option.kind === 'minkan' ? [...option.tiles, discarded] : option.tiles;
  return { hand: sortMahjongHand(hand.filter((tile) => !ids.has(tile.id))), meld };
}

// ── 컴퓨터 ─────────────────────────────────────────────────────────

/** 정결이 남아 있으면 무조건 그것부터, 아니면 고립된 패부터 버립니다. */
export function chooseSichuanDiscard(hand: MahjongTile[], voidSuit: SichuanSuit, random: () => number = Math.random) {
  const forced = nextVoidDiscard(hand, voidSuit);
  if (forced) return forced;
  if (!hand.length) throw new Error('버릴 패가 없습니다.');
  const scored = hand.map((tile) => {
    const sameSuit = hand.filter((other) => other.suit === tile.suit);
    const pairs = sameSuit.filter((other) => other.value === tile.value && other.id !== tile.id).length;
    const near = sameSuit.filter((other) => Math.abs(other.value - tile.value) <= 2 && other.id !== tile.id).length;
    const edge = tile.value === 1 || tile.value === 9 ? 1 : 0;
    return { tile, keep: pairs * 3 + near - edge, tie: random() };
  });
  scored.sort((a, b) => a.keep - b.keep || a.tie - b.tie);
  return scored[0].tile;
}

export function shouldSichuanCall(hand: MahjongTile[], option: SichuanCallOption, voidSuit: SichuanSuit) {
  // 정결이 아직 남아 있으면 부르지 않고 먼저 정리합니다.
  if (hasVoidSuitTiles(hand, voidSuit)) return false;
  // 부르고 나서 버릴 패가 남아야 합니다. 퐁은 두 장, 깡은 세 장을 씁니다.
  const used = option.kind === 'pon' ? 2 : 3;
  return hand.length - used >= 2;
}

// ── 혈전도저 자동 진행 ──────────────────────────────────────────────

export type SichuanAutoResult = {
  state: SichuanBloodState;
  hands: MahjongTile[][];
  melds: MahjongTile[][][];
  wall: MahjongTile[];
  rivers: MahjongTile[][];
  /** 진행 중 일어난 일을 사람이 읽을 수 있게 남깁니다. */
  log: string[];
  exhausted: boolean;
};

const seatLabel = (seat: number) => seat === 0 ? '나' : `컴퓨터 ${seat}`;

/**
 * 내가 화료해서 빠진 뒤, 남은 사람들끼리 계속 두는 부분을 자동으로 진행합니다.
 * 세 명이 화료하거나 산이 마르면 멈춥니다.
 */
export function autoPlaySichuanRemainder(args: {
  state: SichuanBloodState;
  hands: MahjongTile[][];
  melds: MahjongTile[][][];
  wall: MahjongTile[];
  rivers: MahjongTile[][];
  voidSuits: SichuanSuit[];
  basePoints?: number;
  startSeat?: number;
  random?: () => number;
}): SichuanAutoResult {
  const random = args.random ?? Math.random;
  const base = args.basePoints ?? 1;
  let state = args.state;
  const hands = args.hands.map((hand) => [...hand]);
  const melds = args.melds.map((sets) => sets.map((meld) => [...meld]));
  const rivers = args.rivers.map((river) => [...river]);
  let wall = [...args.wall];
  const log: string[] = [];

  let turn = args.startSeat ?? 0;
  let guard = 0;
  while (!state.over && wall.length > 0 && guard++ < 600) {
    const seat = turn % 4;
    turn++;
    if (state.finished[seat]) continue;

    const drawn = wall[0];
    wall = wall.slice(1);
    hands[seat] = sortMahjongHand([...hands[seat], drawn]);

    if (canSichuanWin(hands[seat], melds[seat], args.voidSuits[seat])) {
      const fans = evaluateSichuanFan({ hand: hands[seat], melds: melds[seat], winType: 'tsumo' });
      const score = sichuanScore({
        fans, roots: countRoots(hands[seat], melds[seat]), basePoints: base,
        winType: 'tsumo', activeOpponents: activeSichuanSeats(state).length - 1,
      });
      state = settleSichuanWin(state, { winner: seat, score, winType: 'tsumo' });
      log.push(`${seatLabel(seat)} 쯔모 · ${fans.map((fan) => fan.name).join('·')} ${score.multiplier}배`);
      continue;
    }

    const discarded = chooseSichuanDiscard(hands[seat], args.voidSuits[seat], random);
    hands[seat] = sortMahjongHand(hands[seat].filter((tile) => tile.id !== discarded.id));
    rivers[seat].push(discarded);

    let claimed = false;
    for (let step = 1; step < 4 && !claimed; step++) {
      const other = (seat + step) % 4;
      if (state.finished[other]) continue;
      if (!canSichuanWin([...hands[other], discarded], melds[other], args.voidSuits[other])) continue;
      const fans = evaluateSichuanFan({ hand: [...hands[other], discarded], melds: melds[other], winType: 'ron' });
      const score = sichuanScore({ fans, roots: countRoots([...hands[other], discarded], melds[other]), basePoints: base, winType: 'ron' });
      state = settleSichuanWin(state, { winner: other, score, winType: 'ron', loser: seat });
      log.push(`${seatLabel(other)} 론 · ${seatLabel(seat)}의 ${discarded.glyph} · ${fans.map((fan) => fan.name).join('·')} ${score.multiplier}배`);
      claimed = true;
    }
    if (claimed) continue;

    for (let step = 1; step < 4; step++) {
      const other = (seat + step) % 4;
      if (state.finished[other]) continue;
      const options = getSichuanCallOptions(hands[other], discarded, args.voidSuits[other]);
      const pick = options.find((option) => shouldSichuanCall(hands[other], option, args.voidSuits[other]));
      if (!pick) continue;
      const applied = applySichuanCall(hands[other], discarded, pick);
      hands[other] = applied.hand;
      melds[other].push(applied.meld);
      rivers[seat].pop();
      if (pick.kind === 'minkan') {
        const replacement = drawSichuanReplacement(hands[other], wall);
        hands[other] = replacement.hand;
        wall = replacement.wall;
      }
      if (!hands[other].length) break;
      const thrown = chooseSichuanDiscard(hands[other], args.voidSuits[other], random);
      hands[other] = sortMahjongHand(hands[other].filter((tile) => tile.id !== thrown.id));
      rivers[other].push(thrown);
      turn = other + 1;
      break;
    }
  }

  const exhausted = !state.over;
  if (exhausted) {
    const cleared = [0, 1, 2, 3].map((seat) => isSichuanVoidCleared(hands[seat], melds[seat], args.voidSuits[seat]));
    state = settleSichuanDraw(state, cleared, base);
    log.push('산이 말라 유국 · 정결을 못 끝낸 사람이 물어줍니다');
  }

  return { state, hands, melds, wall, rivers, log, exhausted };
}
