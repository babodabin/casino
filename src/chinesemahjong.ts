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
 * 공식 역 81개를 모두 판정합니다.
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
export type ChineseWaitShape = 'ryanmen' | 'kanchan' | 'penchan' | 'tanki' | 'shanpon';

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
  if (meldCount === 0 && (isSevenPairsHand(hand) || isKnittedStraight(hand) || isSevenStarsKnitted(hand))) return true;
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
const key = (tile: { suit: MahjongSuit; value: number }) => `${tile.suit}${tile.value}`;
const isTerminalOrHonor = (suit: MahjongSuit, value: number) => suit === 'z' || value === 1 || value === 9;
const isPureTerminal = (suit: MahjongSuit, value: number) => suit !== 'z' && (value === 1 || value === 9);
/** 뒤집어도 같아 보이는 패: 통수 1·2·3·4·5·8·9, 삭수 2·4·5·6·8·9, 백 */
const reversible = (tile: MahjongTile) =>
  (tile.suit === 'p' && [1, 2, 3, 4, 5, 8, 9].includes(tile.value)) ||
  (tile.suit === 's' && [2, 4, 5, 6, 8, 9].includes(tile.value)) ||
  (tile.suit === 'z' && tile.value === 5);

const groupTiles = (group: MahjongGroup): { suit: MahjongSuit; value: number }[] =>
  group.kind === 'triplet'
    ? [0, 0, 0].map(() => ({ suit: group.suit, value: group.value }))
    : [0, 1, 2].map((offset) => ({ suit: group.suit, value: group.value + offset }));

type Analysis = {
  groups: MahjongGroup[];
  pair: { suit: MahjongSuit; value: number };
  sequences: MahjongGroup[];
  triplets: MahjongGroup[];
  concealedTriplets: MahjongGroup[];
  openTriplets: MahjongGroup[];
  quads: MahjongGroup[];
  concealedQuads: MahjongGroup[];
  openQuads: MahjongGroup[];
  wait: ChineseWaitShape | null;
};

// ── 특수 손패 모양 ─────────────────────────────────────────────────

/** 조합룡: 세 종류에서 147 / 258 / 369을 하나씩 (전불고·칠성불고의 뼈대) */
function knittedSets(tiles: MahjongTile[]) {
  const patterns: number[][] = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
  const suits = numberSuits;
  for (const first of suits) for (const second of suits) for (const third of suits) {
    if (first === second || second === third || first === third) continue;
    const assign: [MahjongSuit, number[]][] = [[first, patterns[0]], [second, patterns[1]], [third, patterns[2]]];
    const needed = assign.flatMap(([suit, values]) => values.map((value) => `${suit}${value}`));
    const pool = tiles.map(key);
    if (needed.every((want) => pool.includes(want))) return needed;
  }
  return null;
}

/** 조합룡이 손에 들어 있는가 (다른 몸통과 함께여도 됨) */
export function hasKnittedStraight(tiles: MahjongTile[]) {
  return knittedSets(tiles) !== null;
}

/** 전불고: 조합룡 아홉 장 + 자패 등으로 짝 없이 열넉 장 */
export function isKnittedStraight(hand: MahjongTile[]) {
  if (hand.length !== 14) return false;
  const needed = knittedSets(hand);
  if (!needed) return false;
  const used = new Set(needed);
  const rest = hand.filter((tile) => !used.has(key(tile)) || false);
  // 아홉 장은 조합룡으로 쓰고 나머지 다섯 장은 서로 다른 자패여야 합니다.
  const counts = new Map<string, number>();
  hand.forEach((tile) => counts.set(key(tile), (counts.get(key(tile)) ?? 0) + 1));
  if ([...counts.values()].some((count) => count > 1)) return false;
  const leftovers = hand.filter((tile) => !used.has(key(tile)));
  return leftovers.length === 5 && leftovers.every((tile) => tile.suit === 'z');
}

/** 칠성불고: 자패 일곱 종류를 모두 갖춘 전불고 */
export function isSevenStarsKnitted(hand: MahjongTile[]) {
  if (hand.length !== 14) return false;
  const counts = new Map<string, number>();
  hand.forEach((tile) => counts.set(key(tile), (counts.get(key(tile)) ?? 0) + 1));
  if ([...counts.values()].some((count) => count > 1)) return false;
  const honors = hand.filter((tile) => tile.suit === 'z');
  if (honors.length !== 7 || new Set(honors.map((tile) => tile.value)).size !== 7) return false;
  const numbers = hand.filter((tile) => tile.suit !== 'z');
  if (numbers.length !== 7) return false;
  // 남은 일곱 장이 조합룡 아홉 자리 중 일곱 개여야 합니다.
  const needed = knittedSets([...numbers, ...numbers]);
  if (needed) return true;
  const patterns: Record<number, number[]> = { 1: [1, 4, 7], 2: [2, 5, 8], 3: [3, 6, 9] };
  for (const first of numberSuits) for (const second of numberSuits) for (const third of numberSuits) {
    if (first === second || second === third || first === third) continue;
    const allowed = new Set([
      ...patterns[1].map((value) => `${first}${value}`),
      ...patterns[2].map((value) => `${second}${value}`),
      ...patterns[3].map((value) => `${third}${value}`),
    ]);
    if (numbers.every((tile) => allowed.has(key(tile)))) return true;
  }
  return false;
}

/** 연칠대: 같은 종류에서 연속된 일곱 숫자를 두 장씩 */
export function isSevenConsecutivePairs(hand: MahjongTile[]) {
  if (!isSevenPairsHand(hand)) return false;
  const suits = new Set(hand.map((tile) => tile.suit));
  if (suits.size !== 1 || hand[0].suit === 'z') return false;
  const values = [...new Set(hand.map((tile) => tile.value))].sort((a, b) => a - b);
  return values.length === 7 && values[6] - values[0] === 6;
}

// ── 대기 형태 ──────────────────────────────────────────────────────

function waitShapeFor(analysis: Omit<Analysis, 'wait'>, winningTile?: MahjongTile): ChineseWaitShape | null {
  if (!winningTile) return null;
  if (analysis.pair.suit === winningTile.suit && analysis.pair.value === winningTile.value) return 'tanki';
  for (const group of analysis.groups) {
    if (group.open || group.suit !== winningTile.suit) continue;
    if (group.kind === 'triplet' && group.value === winningTile.value) return 'shanpon';
    if (group.kind === 'sequence' && winningTile.value >= group.value && winningTile.value <= group.value + 2) {
      if (winningTile.value === group.value + 1) return 'kanchan';
      if ((group.value === 1 && winningTile.value === 3) || (group.value === 7 && winningTile.value === 7)) return 'penchan';
      return 'ryanmen';
    }
  }
  return null;
}

function analyse(decomposition: { groups: MahjongGroup[]; pair: { suit: MahjongSuit; value: number } }, winningTile?: MahjongTile): Analysis {
  const groups = decomposition.groups;
  const base = {
    groups,
    pair: decomposition.pair,
    sequences: groups.filter((group) => group.kind === 'sequence'),
    triplets: groups.filter((group) => group.kind === 'triplet'),
    concealedTriplets: groups.filter((group) => group.kind === 'triplet' && !group.open),
    openTriplets: groups.filter((group) => group.kind === 'triplet' && group.open),
    quads: groups.filter((group) => group.quad),
    concealedQuads: groups.filter((group) => group.quad && !group.open),
    openQuads: groups.filter((group) => group.quad && group.open),
  };
  return { ...base, wait: waitShapeFor(base, winningTile) };
}

// ── 역 판정 ────────────────────────────────────────────────────────

export type ChineseYakuContext = {
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
  /** 화료패가 이미 세 장 보인 마지막 한 장이면 화절장 */
  lastOfItsKind?: boolean;
  /** 울어서 만든 몸통이 전부 남의 패인지 (전구인 판정용) */
  allMeldsFromDiscards?: boolean;
  flowers?: number;
  /** 검증용. 켜면 중복 제거를 하지 않고 성립한 역을 모두 돌려줍니다. */
  keepImplied?: boolean;
};

/**
 * 국표마작 공식 역 81개를 판정합니다.
 * 손패를 여러 가지로 나눌 수 있으면 점수가 가장 높아지는 해석을 고릅니다.
 */
export function evaluateChineseYaku(context: ChineseYakuContext): ChineseYaku[] {
  const melds = context.melds ?? [];
  const concealedKans = context.concealedKans ?? [];
  const all = [...context.hand, ...melds.flat(), ...concealedKans.flat()];
  const closed = melds.length === 0;
  const seatWind = context.seatWind ?? 1;
  const roundWind = context.roundWind ?? 1;

  // 같은 손이 칠대자로도, 몸통 네 개로도 읽히는 경우가 있습니다.
  // (예: 일색쌍룡회는 칠대자 모양이기도 합니다)
  // 두 해석을 모두 계산해 점수가 높은 쪽을 씁니다.
  const candidates: ChineseYaku[][] = [];

  const special = evaluateSpecialShapes(context, all, closed);
  if (special) candidates.push(special);

  getStandardMahjongDecompositions(context.hand, melds, concealedKans).forEach((decomposition) => {
    const analysis = analyse(decomposition, context.winningTile);
    const raw = evaluateStandard(context, analysis, all, closed, seatWind, roundWind);
    candidates.push(context.keepImplied ? raw : removeImplied(raw));
  });

  if (!candidates.length) return [];
  candidates.sort((a, b) => totalChinesePoints(b) - totalChinesePoints(a));
  const best = candidates[0];
  return best.length ? best : [{ name: '무번화', chinese: '無番和', points: 8, detail: '역이 하나도 없이 완성' }];
}

function evaluateSpecialShapes(context: ChineseYakuContext, all: MahjongTile[], closed: boolean): ChineseYaku[] | null {
  const concealedKans = context.concealedKans ?? [];
  if (!closed || concealedKans.length) return null;
  const hand = context.hand;
  const extras = situational(context);

  if (isThirteenOrphansHand(hand))
    return [{ name: '십삼요', chinese: '十三幺', points: 88, detail: '서로 다른 1·9·자패 열세 종류를 모으고 그중 하나를 한 장 더 모음' }, ...extras];
  if (isSevenStarsKnitted(hand))
    return [{ name: '칠성불고', chinese: '七星不靠', points: 24, detail: '자패 일곱 종류를 모두 갖추고 나머지를 조합룡으로 채움' }, ...extras];
  if (isKnittedStraight(hand))
    return [{ name: '전불고', chinese: '全不靠', points: 12, detail: '조합룡과 자패로 짝 없이 열넉 장을 채움' },
            { name: '조합룡', chinese: '組合龍', points: 12, detail: '세 종류에서 147·258·369을 하나씩' }, ...extras];
  if (isSevenConsecutivePairs(hand))
    return [{ name: '연칠대', chinese: '連七對', points: 88, detail: '한 종류에서 연속된 일곱 숫자를 두 장씩' }, ...extras];
  if (isSevenPairsHand(hand)) {
    const all = hand;
    const yaku: ChineseYaku[] = [{ name: '칠대', chinese: '七對', points: 24, detail: '서로 다른 일곱 종류를 두 장씩' }];
    const numbered = new Set(all.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit));
    const hasHonors = all.some((tile) => tile.suit === 'z');
    if (numbered.size === 1 && !hasHonors) yaku.push({ name: '청일색', chinese: '清一色', points: 24, detail: '한 종류의 숫자패만으로 완성' });
    else if (numbered.size === 1 && hasHonors) yaku.push({ name: '혼일색', chinese: '混一色', points: 6, detail: '한 종류의 숫자패와 자패만 사용' });
    if (all.every((tile) => isTerminalOrHonor(tile.suit, tile.value))) yaku.push({ name: '혼요구', chinese: '混幺九', points: 32, detail: '1·9와 자패로만 완성' });
    if (all.every((tile) => tile.suit !== 'z' && tile.value >= 2 && tile.value <= 8)) yaku.push({ name: '단요', chinese: '斷幺', points: 2, detail: '1·9·자패 없이 완성' });
    if (all.every(reversible)) yaku.push({ name: '추불도', chinese: '推不倒', points: 8, detail: '뒤집어도 모양이 같은 패로만 완성' });
    if (!hasHonors) yaku.push({ name: '무자', chinese: '無字', points: 1, detail: '자패를 쓰지 않고 완성' });
    if (numbered.size === 2) yaku.push({ name: '결일문', chinese: '缺一門', points: 1, detail: '세 종류 중 한 종류를 쓰지 않음' });
    if (context.winType === 'ron') yaku.push({ name: '문전청', chinese: '門前清', points: 2, detail: '한 번도 울지 않고 론으로 완성' });
    else yaku.push({ name: '불구인', chinese: '不求人', points: 4, detail: '울지 않고 직접 뽑아 완성' });
    yaku.push({ name: '단조장', chinese: '單釣將', points: 1, detail: '머리 한 장을 기다려 완성' });
    const counts = new Map<string, number>();
    all.forEach((tile) => counts.set(key(tile), (counts.get(key(tile)) ?? 0) + 1));
    [...counts.values()].filter((count) => count === 4).forEach(() => yaku.push({ name: '사귀일', chinese: '四歸一', points: 2, detail: '깡하지 않은 같은 패 네 장이 한 손에 모임' }));
    return context.keepImplied ? [...yaku, ...extras] : removeImplied([...yaku, ...extras]);
  }
  return null;
}

/** 손패 구성과 무관하게 상황으로 붙는 역 */
function situational(context: ChineseYakuContext): ChineseYaku[] {
  const yaku: ChineseYaku[] = [];
  if (context.afterKan) yaku.push({ name: '깡상개화', chinese: '槓上開花', points: 8, detail: '깡을 하고 가져온 패로 완성' });
  if (context.robbingKan) yaku.push({ name: '창깡화', chinese: '搶槓和', points: 8, detail: '상대가 가깡하려는 패를 가로채 완성' });
  if (context.lastTile) yaku.push({ name: '묘수회춘', chinese: '妙手回春', points: 8, detail: '산의 마지막 패를 뽑아 완성' });
  if (context.lastDiscard) yaku.push({ name: '해저로월', chinese: '海底撈月', points: 8, detail: '마지막으로 버려진 패로 완성' });
  if (context.lastOfItsKind) yaku.push({ name: '화절장', chinese: '和絕張', points: 4, detail: '이미 세 장이 보인 마지막 한 장으로 완성' });
  if (context.winType === 'tsumo') yaku.push({ name: '자모', chinese: '自摸', points: 1, detail: '직접 뽑아 완성' });
  // 꽃패는 한 장당 1점입니다. 8점 최소 조건에는 넣지 않습니다.
  if (context.flowers) yaku.push({ name: '화패', chinese: '花牌', points: context.flowers, detail: `꽃패 ${context.flowers}장 · 한 장당 1점` });
  return yaku;
}

function evaluateStandard(
  context: ChineseYakuContext,
  a: Analysis,
  all: MahjongTile[],
  closed: boolean,
  seatWind: number,
  roundWind: number,
): ChineseYaku[] {
  const melds = context.melds ?? [];
  const concealedKans = context.concealedKans ?? [];
  const yaku: ChineseYaku[] = [];
  const add = (name: string, chinese: string, points: number, detail: string) => yaku.push({ name, chinese, points, detail });

  const numbered = new Set(all.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit));
  const hasHonors = all.some((tile) => tile.suit === 'z');
  const quadCount = a.quads.length;
  const values = all.map((tile) => tile.value);
  const allSets = [...a.groups.map(groupTiles).flat(), a.pair, a.pair];

  // ── 88점 ─────────────────────────────────────────────────────────
  const windTriplets = [1, 2, 3, 4].filter((value) => countOf(all, 'z', value) >= 3);
  if (windTriplets.length === 4) add('대사희', '大四喜', 88, '동·남·서·북을 모두 커쯔로 완성');
  if (countOf(all, 'z', 5) >= 3 && countOf(all, 'z', 6) >= 3 && countOf(all, 'z', 7) >= 3)
    add('대삼원', '大三元', 88, '백·발·중을 모두 커쯔로 완성');
  if (all.every((tile) => (tile.suit === 's' && [2, 3, 4, 6, 8].includes(tile.value)) || (tile.suit === 'z' && tile.value === 6)))
    add('녹일색', '綠一色', 88, '삭수 2·3·4·6·8과 발만으로 완성');
  if (closed && !hasHonors && numbered.size === 1) {
    const counts = Array(10).fill(0) as number[];
    all.forEach((tile) => counts[tile.value]++);
    if (counts[1] >= 3 && counts[9] >= 3 && [2, 3, 4, 5, 6, 7, 8].every((value) => counts[value] >= 1))
      add('구련보등', '九蓮寶燈', 88, '한 종류에서 1112345678999에 같은 종류 한 장을 더해 완성');
  }
  if (quadCount === 4) add('사깡', '四杠', 88, '깡 네 개로 완성');

  // ── 64점 ─────────────────────────────────────────────────────────
  if (all.every((tile) => isPureTerminal(tile.suit, tile.value))) add('청요구', '清幺九', 64, '숫자패의 1과 9만으로 완성');
  if (windTriplets.length === 3 && [1, 2, 3, 4].some((value) => countOf(all, 'z', value) === 2))
    add('소사희', '小四喜', 64, '바람패 세 종류를 커쯔로, 나머지를 머리로 완성');
  const dragonTriplets = [5, 6, 7].filter((value) => countOf(all, 'z', value) >= 3);
  if (dragonTriplets.length === 2 && [5, 6, 7].some((value) => countOf(all, 'z', value) === 2))
    add('소삼원', '小三元', 64, '삼원패 두 종류를 커쯔로, 나머지를 머리로 완성');
  if (all.every((tile) => tile.suit === 'z')) add('자일색', '字一色', 64, '자패로만 완성');
  if (a.concealedTriplets.length >= 4) add('사암각', '四暗刻', 64, '공개하지 않은 커쯔 네 개로 완성');
  if (numberSuits.some((suit) =>
    a.pair.suit === suit && a.pair.value === 5 &&
    a.sequences.filter((group) => group.suit === suit && group.value === 1).length === 2 &&
    a.sequences.filter((group) => group.suit === suit && group.value === 7).length === 2))
    add('일색쌍룡회', '一色雙龍會', 64, '한 종류에서 123·789를 두 벌씩 모으고 5를 머리로 완성');

  // ── 48점 ─────────────────────────────────────────────────────────
  const seqCounts = new Map<string, number>();
  a.sequences.forEach((group) => seqCounts.set(key(group), (seqCounts.get(key(group)) ?? 0) + 1));
  if ([...seqCounts.values()].some((count) => count >= 4)) add('일색사동순', '一色四同順', 48, '같은 연속 몸통 네 개');
  if (numberSuits.some((suit) => [1, 2, 3, 4, 5, 6].some((start) =>
    [0, 1, 2, 3].every((step) => a.triplets.some((group) => group.suit === suit && group.value === start + step)))))
    add('일색사절고', '一色四節高', 48, '한 종류에서 숫자가 하나씩 오르는 커쯔 네 개');

  // ── 32점 ─────────────────────────────────────────────────────────
  if (numberSuits.some((suit) => [1, 2].some((step) => [1, 2, 3].some((start) =>
    [0, 1, 2, 3].every((index) => a.sequences.some((group) => group.suit === suit && group.value === start + step * index))))))
    add('일색사보고', '一色四步高', 32, '한 종류에서 일정하게 오르는 연속 몸통 네 개');
  if (quadCount === 3) add('삼깡', '三杠', 32, '깡 세 개');
  if (all.every((tile) => isTerminalOrHonor(tile.suit, tile.value))) add('혼요구', '混幺九', 32, '1·9와 자패로만 완성');

  // ── 24점 ─────────────────────────────────────────────────────────
  if (a.triplets.length === 4 && all.every((tile) => tile.suit !== 'z' && tile.value % 2 === 0))
    add('전쌍각', '全雙刻', 24, '짝수 숫자패 커쯔로만 완성');
  if (numbered.size === 1 && !hasHonors) add('청일색', '清一色', 24, '한 종류의 숫자패만으로 완성');
  if ([...seqCounts.values()].some((count) => count >= 3)) add('일색삼동순', '一色三同順', 24, '같은 연속 몸통 세 개');
  if (numberSuits.some((suit) => [1, 2, 3, 4, 5, 6, 7].some((start) =>
    [0, 1, 2].every((step) => a.triplets.some((group) => group.suit === suit && group.value === start + step)))))
    add('일색삼절고', '一色三節高', 24, '한 종류에서 숫자가 하나씩 오르는 커쯔 세 개');
  if (all.every((tile) => tile.suit !== 'z' && tile.value >= 7)) add('전대', '全大', 24, '7·8·9로만 완성');
  if (all.every((tile) => tile.suit !== 'z' && tile.value >= 4 && tile.value <= 6)) add('전중', '全中', 24, '4·5·6으로만 완성');
  if (all.every((tile) => tile.suit !== 'z' && tile.value <= 3)) add('전소', '全小', 24, '1·2·3으로만 완성');

  // ── 16점 ─────────────────────────────────────────────────────────
  if (a.pair.value === 5 && a.pair.suit !== 'z' &&
    numberSuits.filter((suit) => a.sequences.some((group) => group.suit === suit && group.value === 1) &&
      a.sequences.some((group) => group.suit === suit && group.value === 7)).length >= 2 &&
    a.sequences.filter((group) => group.value === 1).length >= 2 && a.sequences.filter((group) => group.value === 7).length >= 2 &&
    new Set(a.sequences.map((group) => group.suit)).size >= 2)
    add('삼색쌍룡회', '三色雙龍會', 16, '두 종류에서 123·789를 모으고 남은 종류의 5를 머리로 완성');
  if (numberSuits.some((suit) => [1, 2].some((step) => [1, 2, 3, 4, 5].some((start) =>
    [0, 1, 2].every((index) => a.sequences.some((group) => group.suit === suit && group.value === start + step * index))))))
    add('일색삼보고', '一色三步高', 16, '한 종류에서 일정하게 오르는 연속 몸통 세 개');
  if (numberSuits.some((suit) => [1, 4, 7].every((value) => a.sequences.some((group) => group.suit === suit && group.value === value))))
    add('청룡', '清龍', 16, '한 종류에서 123·456·789를 모두 완성');
  if (allSets.length && a.groups.every((group) => groupTiles(group).some((tile) => tile.value === 5 && tile.suit !== 'z')) &&
    a.pair.suit !== 'z' && a.pair.value === 5)
    add('전대오', '全帶五', 16, '모든 몸통과 머리에 5가 들어감');
  if (numberSuits.every((suit) => a.triplets.some((group) => group.suit === suit)) &&
    [1, 2, 3, 4, 5, 6, 7, 8, 9].some((value) => numberSuits.every((suit) => a.triplets.some((group) => group.suit === suit && group.value === value))))
    add('삼동각', '三同刻', 16, '세 종류에서 같은 숫자를 커쯔로 완성');
  if (a.concealedTriplets.length === 3) add('삼암각', '三暗刻', 16, '공개하지 않은 커쯔 세 개');

  // ── 12점 ─────────────────────────────────────────────────────────
  if (hasKnittedStraight(all) && !yaku.some((entry) => entry.name === '조합룡'))
    add('조합룡', '組合龍', 12, '세 종류에서 147·258·369을 하나씩');
  if (all.every((tile) => tile.suit !== 'z' && tile.value > 5)) add('대어오', '大於五', 12, '6 이상의 숫자패로만 완성');
  if (all.every((tile) => tile.suit !== 'z' && tile.value < 5)) add('소어오', '小於五', 12, '4 이하의 숫자패로만 완성');
  if (windTriplets.length === 3) add('삼풍각', '三風刻', 12, '바람패 커쯔 세 개');

  // ── 8점 ──────────────────────────────────────────────────────────
  if ([[1, 4, 7], [4, 7, 1], [7, 1, 4]].some(() => false) ||
    (() => {
      // 화룡: 세 종류에 123·456·789를 하나씩 흩어서
      for (const first of numberSuits) for (const second of numberSuits) for (const third of numberSuits) {
        if (first === second || second === third || first === third) continue;
        if (a.sequences.some((group) => group.suit === first && group.value === 1) &&
          a.sequences.some((group) => group.suit === second && group.value === 4) &&
          a.sequences.some((group) => group.suit === third && group.value === 7)) return true;
      }
      return false;
    })())
    add('화룡', '花龍', 8, '세 종류에 123·456·789를 하나씩 흩어서 완성');
  if (all.every(reversible)) add('추불도', '推不倒', 8, '뒤집어도 모양이 같은 패로만 완성');
  if ([1, 2, 3, 4, 5, 6, 7].some((value) => numberSuits.every((suit) => a.sequences.some((group) => group.suit === suit && group.value === value))))
    add('삼색삼동순', '三色三同順', 8, '세 종류에서 같은 자리의 연속 몸통');
  if ([1, 2, 3, 4, 5, 6, 7].some((start) => {
    const perm = numberSuits;
    for (const first of perm) for (const second of perm) for (const third of perm) {
      if (first === second || second === third || first === third) continue;
      if (a.triplets.some((group) => group.suit === first && group.value === start) &&
        a.triplets.some((group) => group.suit === second && group.value === start + 1) &&
        a.triplets.some((group) => group.suit === third && group.value === start + 2)) return true;
    }
    return false;
  })) add('삼색삼절고', '三色三節高', 8, '세 종류에서 숫자가 하나씩 오르는 커쯔');

  // ── 6점 ──────────────────────────────────────────────────────────
  if (a.triplets.length === 4) add('대대화', '碰碰和', 6, '모든 몸통이 커쯔');
  if (numbered.size === 1 && hasHonors) add('혼일색', '混一色', 6, '한 종류의 숫자패와 자패만 사용');
  if ([1, 2].some((step) => [1, 2, 3, 4, 5, 6, 7].some((start) => {
    for (const first of numberSuits) for (const second of numberSuits) for (const third of numberSuits) {
      if (first === second || second === third || first === third) continue;
      if (a.sequences.some((group) => group.suit === first && group.value === start) &&
        a.sequences.some((group) => group.suit === second && group.value === start + step) &&
        a.sequences.some((group) => group.suit === third && group.value === start + step * 2)) return true;
    }
    return false;
  }))) add('삼색삼보고', '三色三步高', 6, '세 종류에서 일정하게 오르는 연속 몸통');
  if (numberSuits.every((suit) => all.some((tile) => tile.suit === suit)) &&
    [1, 2, 3, 4].some((value) => all.some((tile) => tile.suit === 'z' && tile.value === value)) &&
    [5, 6, 7].some((value) => all.some((tile) => tile.suit === 'z' && tile.value === value)))
    add('오문제', '五門齊', 6, '만수·통수·삭수·바람패·삼원패를 모두 사용');
  if (!closed && context.allMeldsFromDiscards && context.winType === 'ron' && context.hand.length <= 2)
    add('전구인', '全求人', 6, '모든 몸통을 남의 패로 만들고 마지막도 남의 패로 완성');
  if (a.concealedQuads.length === 2) add('쌍암깡', '雙暗杠', 6, '비공개 깡 두 개');
  if (dragonTriplets.length === 2) add('쌍전각', '雙箭刻', 6, '삼원패 커쯔 두 개');

  // ── 4점 ──────────────────────────────────────────────────────────
  if (a.groups.every((group) => groupTiles(group).some((tile) => isPureTerminal(tile.suit, tile.value))) &&
    isPureTerminal(a.pair.suit, a.pair.value))
    add('전대요', '全帶幺', 4, '모든 몸통과 머리에 1 또는 9가 들어감');
  if (closed && context.winType === 'tsumo') add('불구인', '不求人', 4, '울지 않고 직접 뽑아 완성');
  if (a.openQuads.length === 2) add('쌍명깡', '雙明杠', 4, '공개 깡 두 개');

  // ── 2점 ──────────────────────────────────────────────────────────
  dragonTriplets.forEach((value) => add(`역패 ${dragonNames[value]}`, '箭刻', 2, '삼원패 세 장'));
  if (countOf(all, 'z', roundWind) >= 3) add(`장풍 ${windNames[roundWind]}`, '圈風刻', 2, `현재 판의 바람패(${windNames[roundWind]}) 세 장`);
  if (countOf(all, 'z', seatWind) >= 3) add(`자풍 ${windNames[seatWind]}`, '門風刻', 2, `내 자리의 바람패(${windNames[seatWind]}) 세 장`);
  if (closed && context.winType === 'ron') add('문전청', '門前清', 2, '한 번도 울지 않고 론으로 완성');
  if (a.sequences.length === 4 && a.pair.suit !== 'z') add('평화', '平和', 2, '몸통이 모두 연속패이고 머리가 자패가 아님');
  const tileCounts = new Map<string, number>();
  all.forEach((tile) => tileCounts.set(key(tile), (tileCounts.get(key(tile)) ?? 0) + 1));
  const fourOfAKind = [...tileCounts.entries()].filter(([tileKey, count]) => count === 4 && !a.quads.some((group) => key(group) === tileKey));
  fourOfAKind.forEach(() => add('사귀일', '四歸一', 2, '깡하지 않은 같은 패 네 장이 한 손에 모임'));
  const tripletValues = a.triplets.map((group) => group.value);
  if (tripletValues.some((value, index) => tripletValues.indexOf(value) !== index)) add('쌍동각', '雙同刻', 2, '같은 숫자의 커쯔 두 개');
  if (a.concealedTriplets.length === 2) add('쌍암각', '雙暗刻', 2, '공개하지 않은 커쯔 두 개');
  if (a.concealedQuads.length === 1) add('암깡', '暗杠', 2, '비공개 깡 하나');
  if (all.every((tile) => tile.suit !== 'z' && tile.value >= 2 && tile.value <= 8)) add('단요', '斷幺', 2, '1·9·자패 없이 완성');

  // ── 1점 ──────────────────────────────────────────────────────────
  const pairsOfIdentical = [...seqCounts.values()].reduce((sum, count) => sum + Math.floor(count / 2), 0);
  for (let i = 0; i < pairsOfIdentical; i++) add('일반고', '一般高', 1, '같은 종류·같은 숫자의 연속 몸통 두 개');
  [1, 2, 3, 4, 5, 6, 7].forEach((value) => {
    const suits = numberSuits.filter((suit) => a.sequences.some((group) => group.suit === suit && group.value === value));
    if (suits.length >= 2) add('희상봉', '喜相逢', 1, '두 종류에서 같은 자리의 연속 몸통');
  });
  numberSuits.forEach((suit) => {
    [1, 4, 7].forEach((start) => {
      if (a.sequences.some((group) => group.suit === suit && group.value === start) &&
        a.sequences.some((group) => group.suit === suit && group.value === start + 3))
        add('연륙', '連六', 1, '한 종류에서 이어지는 연속 몸통 두 개');
    });
    if (a.sequences.some((group) => group.suit === suit && group.value === 1) &&
      a.sequences.some((group) => group.suit === suit && group.value === 7))
      add('노소부', '老少副', 1, '한 종류에서 123과 789');
  });
  a.triplets.forEach((group) => {
    if (isTerminalOrHonor(group.suit, group.value) && !(group.suit === 'z' && (group.value >= 5 || group.value === seatWind || group.value === roundWind)))
      add('요구각', '幺九刻', 1, '1·9 또는 역이 붙지 않는 자패의 커쯔');
  });
  a.openQuads.forEach(() => add('명깡', '明杠', 1, '공개 깡'));
  if (numbered.size === 2 || (numbered.size === 2 && hasHonors)) add('결일문', '缺一門', 1, '세 종류 중 한 종류를 쓰지 않음');
  if (!hasHonors) add('무자', '無字', 1, '자패를 쓰지 않고 완성');
  if (a.wait === 'penchan') add('변장', '邊張', 1, '12나 89에서 한쪽만 기다려 완성');
  if (a.wait === 'kanchan') add('감장', '坎張', 1, '가운데 한 장을 기다려 완성');
  if (a.wait === 'tanki') add('단조장', '單釣將', 1, '머리 한 장을 기다려 완성');

  return [...yaku, ...situational(context)];
}

/** 큰 역에 이미 포함된 작은 역을 걷어냅니다. */
function removeImplied(yaku: ChineseYaku[]): ChineseYaku[] {
  const names = new Set(yaku.map((entry) => entry.name));
  const drop = new Map<string, number>();
  const dropAll = (list: string[]) => list.forEach((name) => drop.set(name, Infinity));
  const dropSome = (name: string, count: number) => drop.set(name, (drop.get(name) ?? 0) + count);
  const has = (name: string) => names.has(name);

  if (has('대사희')) dropAll(['소사희', '삼풍각', '대대화', '요구각', '자풍 동', '자풍 남', '자풍 서', '자풍 북', '장풍 동', '장풍 남', '장풍 서', '장풍 북', '쌍동각']);
  if (has('소사희')) dropAll(['삼풍각']);
  if (has('대삼원')) dropAll(['역패 백', '역패 발', '역패 중', '쌍전각', '소삼원']);
  if (has('소삼원')) dropAll(['쌍전각']);
  if (has('쌍전각')) dropSome('역패 백', 1);
  if (has('녹일색')) dropAll(['혼일색', '청일색']);
  if (has('구련보등')) dropAll(['청일색', '무자', '문전청', '불구인', '요구각']);
  if (has('사깡')) dropAll(['삼깡', '쌍명깡', '쌍암깡', '명깡', '암깡', '대대략', '대대화']);
  if (has('삼깡')) dropAll(['쌍명깡', '쌍암깡']);
  if (has('청요구')) dropAll(['혼요구', '대대화', '전대요', '요구각', '무자', '쌍동각']);
  if (has('자일색')) dropAll(['혼일색', '혼요구', '대대화', '전대요', '요구각']);
  // 사암각은 단기 론으로도 성립하므로 쯔모(불구인)는 따로 셉니다.
  if (has('사암각')) dropAll(['삼암각', '쌍암각', '대대화', '문전청']);
  if (has('삼암각')) dropAll(['쌍암각']);
  if (has('일색쌍룡회')) dropAll(['일반고', '평화', '청일색', '노소부', '희상봉', '무자']);
  if (has('삼색쌍룡회')) dropAll(['희상봉', '노소부', '평화', '무자']);
  if (has('일색사동순')) dropAll(['일반고', '일색삼동순', '대대화']);
  if (has('일색삼동순')) dropSome('일반고', 2);
  if (has('일색사절고')) dropAll(['일색삼절고', '대대화']);
  if (has('일색사보고')) dropAll(['일색삼보고']);
  if (has('혼요구')) dropAll(['전대요', '대대화', '요구각']);
  if (has('전쌍각')) dropAll(['대대화', '단요', '무자']);
  if (has('청일색')) dropAll(['무자', '결일문']);
  if (has('전대')) dropAll(['대어오', '무자']);
  if (has('전중')) dropAll(['단요', '무자']);
  if (has('전소')) dropAll(['소어오', '무자']);
  if (has('대어오')) dropAll(['무자']);
  if (has('소어오')) dropAll(['무자']);
  if (has('전대오')) dropAll(['단요', '무자']);
  if (has('삼동각')) dropAll(['쌍동각']);
  if (has('청룡')) dropAll(['연륙', '노소부']);
  // 화룡은 머리가 자패일 수 있어 무자를 포함하지 않습니다.
  if (has('추불도')) dropAll([]);
  if (has('삼색삼동순')) dropAll(['희상봉']);
  if (has('삼색삼절고')) dropAll(['쌍동각']);
  if (has('삼색삼보고')) dropAll([]);
  // 대대화(6)와 쌍동각(2)은 서로 포함 관계가 아니라 각각 셉니다.
  if (has('혼일색')) dropAll(['결일문']);
  if (has('전구인')) dropAll(['문전청']);
  if (has('쌍암깡')) dropAll(['암깡']);
  if (has('쌍명깡')) dropAll(['명깡']);
  if (has('불구인')) dropAll(['자모', '문전청']);
  if (has('전불고')) dropAll(['조합룡', '무자', '결일문']);
  if (has('칠성불고')) dropAll(['전불고', '조합룡', '오문제']);
  if (has('연칠대')) dropAll(['칠대', '청일색', '무자', '단요']);
  if (has('십삼요')) dropAll(['혼요구', '무자', '단조장']);
  if (has('무번화')) dropAll(['무번화']);

  const remaining = new Map(drop);
  return yaku.filter((entry) => {
    const budget = remaining.get(entry.name);
    if (budget === undefined) return true;
    if (budget === Infinity) return false;
    if (budget <= 0) return true;
    remaining.set(entry.name, budget - 1);
    return false;
  });
}

export function totalChinesePoints(yaku: ChineseYaku[]) {
  return yaku.reduce((total, entry) => total + entry.points, 0);
}

export function canChineseDeclareWin(yaku: ChineseYaku[], minimum = CHINESE_MIN_POINTS) {
  return totalChinesePoints(yaku) >= minimum;
}

// ── 꽃패 ───────────────────────────────────────────────────────────

export type ChineseFlower = { id: string; kind: 'flower' | 'season'; value: number; glyph: string };

export function createChineseFlowers(): ChineseFlower[] {
  const flowerGlyphs = ['🀢', '🀣', '🀤', '🀥'];
  const seasonGlyphs = ['🀦', '🀧', '🀨', '🀩'];
  return [
    ...flowerGlyphs.map((glyph, index) => ({ id: `cf${index + 1}`, kind: 'flower' as const, value: index + 1, glyph })),
    ...seasonGlyphs.map((glyph, index) => ({ id: `cq${index + 1}`, kind: 'season' as const, value: index + 1, glyph })),
  ];
}

/** 국표마작은 꽃패 한 장당 1점입니다. 8점 최소 조건에는 넣지 않습니다. */
export function chineseFlowerPoints(flowers: ChineseFlower[]) {
  return flowers.length;
}

// ── 점수 ───────────────────────────────────────────────────────────

/**
 * 쯔모: 세 명이 각각 (역점수 + 8)점.
 * 론: 방총자가 (역점수 + 8)점, 나머지 두 명이 8점씩.
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
