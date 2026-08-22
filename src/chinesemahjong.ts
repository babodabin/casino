import {
  createMahjongTiles,
  shuffleMahjong,
  sortMahjongHand,
  isWinningMahjongHand,
  isSevenPairsHand,
  isThirteenOrphansHand,
  getStandardMahjongDecompositions,
  type MahjongTile,
  type MahjongSuit,
  type MahjongGroup,
} from './riichimahjong.ts';

/**
 * 중국식 마작 · 국표마작(國標麻將 / MCR)
 *
 * 리치·홍콩과 다른 점
 * - 부(符)도 없고 번을 두 배로 올리지도 않습니다. 역마다 정해진 점수를 그냥 더합니다.
 * - 합계 8점을 넘겨야 화료할 수 있습니다. 꽃패 점수는 이 8점 계산에 넣지 않습니다.
 * - 쯔모: 세 명이 각각 (역점수 + 8)점을 냅니다.
 * - 론: 방총자가 (역점수 + 8)점, 나머지 두 명이 8점씩 냅니다.
 * - 역끼리 겹칠 때는 큰 역에 포함되는 작은 역을 빼는 규칙이 있습니다.
 */

export type ChineseYaku = { name: string; chinese: string; points: number; detail: string };
export type ChineseWinType = 'tsumo' | 'ron';

export const CHINESE_MIN_POINTS = 8;
export const CHINESE_BASE_POINTS = 8;

export type ChineseScore = {
  yaku: ChineseYaku[];
  yakuPoints: number;
  flowerPoints: number;
  basePoints: number;
  payments: number[];
  total: number;
};

export type ChineseRound = {
  hands: MahjongTile[][];
  wall: MahjongTile[];
  rivers: MahjongTile[][];
};

export function dealChinese(random: () => number = Math.random): ChineseRound {
  const deck = shuffleMahjong(createMahjongTiles(true), random);
  const hands: MahjongTile[][] = [[], [], [], []];
  let cursor = 0;
  for (let count = 0; count < 13; count++) for (let seat = 0; seat < 4; seat++) hands[seat].push(deck[cursor++]);
  return { hands: hands.map(sortMahjongHand), wall: deck.slice(cursor), rivers: [[], [], [], []] };
}

export function isChineseWinningHand(hand: MahjongTile[], meldCount = 0) {
  return isWinningMahjongHand(hand, meldCount);
}

export function getChineseWaits(hand: MahjongTile[], meldCount = 0) {
  const candidates = createMahjongTiles(true).filter((tile) => tile.id.endsWith('-0'));
  return candidates.filter((tile) => isChineseWinningHand([...hand, tile], meldCount));
}

// ── 도우미 ─────────────────────────────────────────────────────────

const isTripletMeld = (meld: MahjongTile[]) => meld.every((tile) => tile.suit === meld[0].suit && tile.value === meld[0].value);
const countOf = (tiles: MahjongTile[], suit: MahjongSuit, value: number) => tiles.filter((tile) => tile.suit === suit && tile.value === value).length;
const numberSuits: MahjongSuit[] = ['m', 'p', 's'];
const dragonNames: Record<number, string> = { 5: '백', 6: '발', 7: '중' };
const windNames = ['', '동', '남', '서', '북'];
const isTerminalGroup = (group: MahjongGroup) => group.suit === 'z' || (group.kind === 'triplet' ? group.value === 1 || group.value === 9 : group.value === 1 || group.value === 7);
const isPureTerminalGroup = (group: MahjongGroup) => group.suit !== 'z' && (group.kind === 'triplet' ? group.value === 1 || group.value === 9 : group.value === 1 || group.value === 7);

type Analysis = {
  groups: MahjongGroup[];
  pair: { suit: MahjongSuit; value: number };
  sequences: MahjongGroup[];
  triplets: MahjongGroup[];
  concealedTriplets: MahjongGroup[];
  quads: MahjongGroup[];
};

function analyse(decomposition: { groups: MahjongGroup[]; pair: { suit: MahjongSuit; value: number } }): Analysis {
  const groups = decomposition.groups;
  return {
    groups,
    pair: decomposition.pair,
    sequences: groups.filter((group) => group.kind === 'sequence'),
    triplets: groups.filter((group) => group.kind === 'triplet'),
    concealedTriplets: groups.filter((group) => group.kind === 'triplet' && !group.open),
    quads: groups.filter((group) => group.quad),
  };
}

// ── 역 판정 ────────────────────────────────────────────────────────

/**
 * 국표마작의 역 중 실제 대국에서 자주 나오는 것들을 점수와 함께 판정합니다.
 * 큰 역이 성립하면 그 안에 포함되는 작은 역은 빼서 중복으로 세지 않습니다.
 */
export function evaluateChineseYaku(args: {
  hand: MahjongTile[];
  melds?: MahjongTile[][];
  concealedKans?: MahjongTile[][];
  winType: ChineseWinType;
  winningTile?: MahjongTile;
  seatWind?: number;
  roundWind?: number;
  afterKan?: boolean;
  robbingKan?: boolean;
  lastTile?: boolean;
  lastDiscard?: boolean;
}): ChineseYaku[] {
  const melds = args.melds ?? [];
  const concealedKans = args.concealedKans ?? [];
  const all = [...args.hand, ...melds.flat(), ...concealedKans.flat()];
  const closed = melds.length === 0;
  const seatWind = args.seatWind ?? 1;
  const roundWind = args.roundWind ?? 1;
  const yaku: ChineseYaku[] = [];
  const add = (name: string, chinese: string, points: number, detail: string) => yaku.push({ name, chinese, points, detail });

  const numbered = new Set(all.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit));
  const hasHonors = all.some((tile) => tile.suit === 'z');
  const quadCount = melds.filter((meld) => meld.length === 4).length + concealedKans.length;

  // ── 88점 ──────────────────────────────────────────────────────────
  if (closed && !concealedKans.length && isThirteenOrphansHand(args.hand)) {
    add('십삼요', '十三幺', 88, '서로 다른 1·9·자패 열세 종류를 모으고 그중 하나를 한 장 더 모음');
    return yaku;
  }
  if (countOf(all, 'z', 5) >= 3 && countOf(all, 'z', 6) >= 3 && countOf(all, 'z', 7) >= 3)
    add('대삼원', '大三元', 88, '백·발·중을 모두 커쯔로 완성');
  const windTriplets = [1, 2, 3, 4].filter((value) => countOf(all, 'z', value) >= 3);
  if (windTriplets.length === 4) add('대사희', '大四喜', 88, '동·남·서·북을 모두 커쯔로 완성');
  if (all.every((tile) => (tile.suit === 's' && [2, 3, 4, 6, 8].includes(tile.value)) || (tile.suit === 'z' && tile.value === 6)))
    add('녹일색', '綠一色', 88, '삭수 2·3·4·6·8과 발만으로 완성');
  if (all.every((tile) => tile.suit === 'z')) add('자일색', '字一色', 64, '자패로만 완성');
  if (quadCount === 4) add('사깡', '四杠', 88, '깡 네 개로 완성');
  if (all.every((tile) => tile.suit !== 'z' && (tile.value === 1 || tile.value === 9)))
    add('청요구', '清幺九', 64, '숫자패의 1과 9만으로 완성');

  const decompositions = getStandardMahjongDecompositions(args.hand, melds, concealedKans);
  const analyses = decompositions.map(analyse);

  // 구련보등
  if (closed && !hasHonors && numbered.size === 1) {
    const counts = Array(10).fill(0) as number[];
    all.forEach((tile) => counts[tile.value]++);
    if (counts[1] >= 3 && counts[9] >= 3 && [2, 3, 4, 5, 6, 7, 8].every((value) => counts[value] >= 1))
      add('구련보등', '九蓮寶燈', 88, '한 종류에서 1112345678999에 같은 종류 한 장을 더해 완성');
  }

  // ── 64점 ──────────────────────────────────────────────────────────
  if (windTriplets.length === 3 && [1, 2, 3, 4].some((value) => countOf(all, 'z', value) === 2))
    add('소사희', '小四喜', 64, '바람패 세 종류를 커쯔로, 나머지를 머리로 완성');
  const dragonTriplets = [5, 6, 7].filter((value) => countOf(all, 'z', value) >= 3);
  if (dragonTriplets.length === 2 && [5, 6, 7].some((value) => countOf(all, 'z', value) === 2))
    add('소삼원', '小三元', 64, '삼원패 두 종류를 커쯔로, 나머지를 머리로 완성');
  const maxConcealed = analyses.reduce((best, a) => Math.max(best, a.concealedTriplets.length), 0);
  if (closed && maxConcealed >= 4) add('사암각', '四暗刻', 64, '공개하지 않은 커쯔 네 개로 완성');

  // ── 24~48점 ───────────────────────────────────────────────────────
  if (numbered.size === 1 && !hasHonors) add('청일색', '清一色', 24, '한 종류의 숫자패만으로 완성');
  if (quadCount === 3) add('삼깡', '三杠', 32, '깡 세 개');
  if (all.every((tile) => tile.suit === 'z' || tile.value === 1 || tile.value === 9))
    add('혼요구', '混幺九', 32, '1·9와 자패로만 완성');

  // 일색쌍룡회: 같은 종류에서 123·789 두 벌과 5 머리
  if (analyses.some((a) => numberSuits.some((suit) =>
    a.pair.suit === suit && a.pair.value === 5 &&
    a.sequences.filter((group) => group.suit === suit && group.value === 1).length === 2 &&
    a.sequences.filter((group) => group.suit === suit && group.value === 7).length === 2)))
    add('일색쌍룡회', '一色雙龍會', 64, '한 종류에서 123·789를 두 벌씩 모으고 5를 머리로 완성');

  // ── 12~16점 ───────────────────────────────────────────────────────
  if (analyses.some((a) => numberSuits.some((suit) =>
    [1, 4, 7].every((value) => a.sequences.some((group) => group.suit === suit && group.value === value)))))
    add('청룡', '清龍', 16, '한 종류에서 123·456·789를 모두 완성');
  if (analyses.some((a) => [1, 2, 3, 4, 5, 6, 7].some((value) =>
    numberSuits.every((suit) => a.sequences.some((group) => group.suit === suit && group.value === value)))))
    add('삼색삼보고', '三色三步高', 16, '세 종류에서 같은 자리 연속 몸통');
  if (analyses.some((a) => [1, 2, 3, 4, 5, 6, 7, 8, 9].some((value) =>
    numberSuits.every((suit) => a.triplets.some((group) => group.suit === suit && group.value === value)))))
    add('삼동각', '三同刻', 16, '세 종류에서 같은 숫자를 커쯔로 완성');
  if (maxConcealed === 3) add('삼암각', '三暗刻', 16, '공개하지 않은 커쯔 세 개');

  // ── 6~8점 ─────────────────────────────────────────────────────────
  if (analyses.some((a) => a.triplets.length === 4)) add('대대화', '碰碰和', 6, '모든 몸통이 커쯔');
  if (numbered.size === 1 && hasHonors) add('혼일색', '混一色', 6, '한 종류의 숫자패와 자패만 사용');
  if (analyses.some((a) => isPureTerminalGroup({ kind: 'triplet', suit: a.pair.suit, value: a.pair.value, open: false }) &&
    a.groups.every(isPureTerminalGroup))) add('전대요', '全帶幺', 12, '모든 몸통과 머리에 1 또는 9가 포함');
  else if (analyses.some((a) => (a.pair.suit === 'z' || a.pair.value === 1 || a.pair.value === 9) && a.groups.every(isTerminalGroup)))
    add('혼전대요', '混全帶幺', 6, '모든 몸통과 머리에 1·9 또는 자패가 포함');

  // ── 2~4점 ─────────────────────────────────────────────────────────
  dragonTriplets.forEach((value) => add(`역패 ${dragonNames[value]}`, '箭刻', 2, '삼원패 세 장'));
  // 자풍과 장풍이 같은 바람이면 같은 커쯔가 두 역을 모두 만족해 4점이 됩니다.
  if (countOf(all, 'z', seatWind) >= 3) add(`자풍 ${windNames[seatWind]}`, '門風刻', 2, `내 자리의 바람패(${windNames[seatWind]}) 세 장`);
  if (countOf(all, 'z', roundWind) >= 3) add(`장풍 ${windNames[roundWind]}`, '圈風刻', 2, `현재 판의 바람패(${windNames[roundWind]}) 세 장`);

  if (closed && isSevenPairsHand(args.hand)) add('칠대자', '七對', 24, '서로 다른 일곱 종류를 두 장씩');
  if (analyses.some((a) => a.sequences.length === 4 && a.pair.suit !== 'z')) add('평화', '平和', 2, '몸통이 모두 연속패이고 머리가 자패가 아님');
  if (all.every((tile) => tile.suit !== 'z' && tile.value >= 2 && tile.value <= 8)) add('단요', '斷幺', 2, '1·9·자패 없이 완성');

  if (analyses.some((a) => {
    const seen = new Map<string, number>();
    a.sequences.filter((group) => !group.open).forEach((group) => { const key = `${group.suit}${group.value}`; seen.set(key, (seen.get(key) ?? 0) + 1); });
    return [...seen.values()].some((count) => count >= 4);
  })) add('일색사동순', '一色四同順', 48, '같은 연속 몸통 네 개');
  else if (analyses.some((a) => {
    const seen = new Map<string, number>();
    a.sequences.filter((group) => !group.open).forEach((group) => { const key = `${group.suit}${group.value}`; seen.set(key, (seen.get(key) ?? 0) + 1); });
    return [...seen.values()].reduce((pairs, count) => pairs + Math.floor(count / 2), 0) >= 2;
  })) add('일반고', '一般高', 1, '같은 종류·같은 숫자의 연속 몸통 두 개');

  if (quadCount === 2) add('쌍깡', '雙暗杠', 6, '깡 두 개');
  else if (quadCount === 1) add('깡', '杠', 2, '깡 하나');

  // ── 1점 부속 ──────────────────────────────────────────────────────
  if (closed && args.winType === 'ron') add('문전청', '門前清', 2, '한 번도 울지 않고 론으로 완성');
  if (closed && args.winType === 'tsumo') add('불구인', '不求人', 4, '울지 않고 직접 뽑아 완성');
  else if (args.winType === 'tsumo') add('자모', '自摸', 1, '직접 뽑아 완성');
  if (args.afterKan) add('깡상개화', '槓上開花', 8, '깡을 하고 가져온 패로 완성');
  if (args.robbingKan) add('창깡화', '搶槓和', 8, '상대가 가깡하려는 패를 가로채 완성');
  if (args.lastTile) add('묘수회춘', '妙手回春', 8, '산의 마지막 패를 뽑아 완성');
  if (args.lastDiscard) add('해저로월', '海底撈月', 8, '마지막으로 버려진 패로 완성');
  if (!hasHonors) add('무자', '無字', 1, '자패를 쓰지 않고 완성');

  return removeImplied(yaku);
}

/** 큰 역에 이미 포함된 작은 역을 걷어냅니다. */
function removeImplied(yaku: ChineseYaku[]): ChineseYaku[] {
  const names = new Set(yaku.map((entry) => entry.name));
  const drop = new Set<string>();
  const implies = (big: string, smalls: string[]) => { if (names.has(big)) smalls.forEach((small) => drop.add(small)); };

  implies('대삼원', ['역패 백', '역패 발', '역패 중', '소삼원']);
  implies('소삼원', ['역패 백', '역패 발', '역패 중']);
  implies('대사희', ['자풍 동', '자풍 남', '자풍 서', '자풍 북', '장풍 동', '장풍 남', '장풍 서', '장풍 북', '소사희', '대대화']);
  implies('소사희', ['자풍 동', '자풍 남', '자풍 서', '자풍 북', '장풍 동', '장풍 남', '장풍 서', '장풍 북']);
  implies('자일색', ['혼일색', '혼요구', '대대화', '전대요', '혼전대요']);
  implies('청요구', ['대대화', '혼요구', '전대요', '혼전대요', '무자']);
  implies('녹일색', ['혼일색', '청일색']);
  implies('청일색', ['무자']);
  implies('혼요구', ['혼전대요', '대대화']);
  implies('전대요', ['혼전대요']);
  implies('사암각', ['삼암각', '대대화']);
  implies('일색사동순', ['일반고', '대대화']);
  implies('일색쌍룡회', ['일반고', '평화', '청룡']);
  implies('사깡', ['삼깡', '쌍깡', '깡', '대대화']);
  implies('삼깡', ['쌍깡', '깡']);
  implies('쌍깡', ['깡']);
  implies('구련보등', ['청일색', '무자', '문전청', '불구인']);
  implies('십삼요', ['혼요구', '무자']);
  implies('불구인', ['문전청']);

  return yaku.filter((entry) => !drop.has(entry.name));
}

export function totalChinesePoints(yaku: ChineseYaku[]) {
  return yaku.reduce((total, entry) => total + entry.points, 0);
}

export function canChineseDeclareWin(yaku: ChineseYaku[], minimum = CHINESE_MIN_POINTS) {
  return totalChinesePoints(yaku) >= minimum;
}

// ── 점수 ───────────────────────────────────────────────────────────

/**
 * 쯔모: 세 명이 각각 (역점수 + 8)점.
 * 론: 방총자가 (역점수 + 8)점, 나머지 두 명이 8점씩.
 * 꽃패는 한 장당 1점이며 최소 8점 계산에는 넣지 않습니다.
 */
export function chineseScore(args: {
  yaku: ChineseYaku[];
  winType: ChineseWinType;
  flowers?: number;
  basePoints?: number;
}): ChineseScore {
  const base = args.basePoints ?? CHINESE_BASE_POINTS;
  const flowerPoints = args.flowers ?? 0;
  const yakuPoints = totalChinesePoints(args.yaku) + flowerPoints;
  const payments = args.winType === 'tsumo'
    ? [yakuPoints + base, yakuPoints + base, yakuPoints + base]
    : [yakuPoints + base, base, base];
  return {
    yaku: args.yaku,
    yakuPoints,
    flowerPoints,
    basePoints: base,
    payments,
    total: payments.reduce((sum, value) => sum + value, 0),
  };
}

export type ChineseMatchState = {
  scores: [number, number, number, number];
  roundIndex: number;
  finished: boolean;
};

export function createChineseMatch(startingScore = 0): ChineseMatchState {
  return { scores: [startingScore, startingScore, startingScore, startingScore], roundIndex: 0, finished: false };
}

export function chineseRoundLabel(roundIndex: number) {
  const wind = ['东', '南', '西', '北'][Math.floor(roundIndex / 4) % 4];
  return `${wind} ${roundIndex % 4 + 1}국`;
}

export function settleChineseWin(state: ChineseMatchState, args: {
  winner: number;
  score: ChineseScore;
  winType: ChineseWinType;
  loser?: number;
}): ChineseMatchState {
  const next: ChineseMatchState = { ...state, scores: [...state.scores] as ChineseMatchState['scores'] };
  const others = [0, 1, 2, 3].filter((seat) => seat !== args.winner);

  if (args.winType === 'tsumo') {
    others.forEach((seat, index) => {
      const amount = args.score.payments[index];
      next.scores[seat] -= amount;
      next.scores[args.winner] += amount;
    });
  } else {
    if (args.loser === undefined || args.loser === args.winner) throw new Error('론에는 방총자가 필요합니다.');
    others.forEach((seat) => {
      const amount = seat === args.loser ? args.score.payments[0] : args.score.basePoints;
      next.scores[seat] -= amount;
      next.scores[args.winner] += amount;
    });
  }

  next.roundIndex++;
  next.finished = next.roundIndex >= 16;
  return next;
}

export function settleChineseDraw(state: ChineseMatchState): ChineseMatchState {
  // 국표마작의 유국은 점수 이동이 없습니다.
  const next: ChineseMatchState = { ...state, scores: [...state.scores] as ChineseMatchState['scores'] };
  next.roundIndex++;
  next.finished = next.roundIndex >= 16;
  return next;
}

export function rankChineseScores(scores: ChineseMatchState['scores']) {
  return scores
    .map((score, seat) => ({ seat, score }))
    .sort((a, b) => b.score - a.score || a.seat - b.seat)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
