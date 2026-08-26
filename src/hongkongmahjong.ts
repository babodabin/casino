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
} from './riichimahjong.ts';

/**
 * 홍콩 마작(廣東麻雀)
 *
 * 리치 마작과 다른 점
 * - 꽃패(花牌) 8장을 더해 144장을 씁니다. 뽑으면 옆으로 빼고 보충패를 가져옵니다.
 * - 부(符)가 없습니다. 번(番)만 세고 번수를 점수표로 바꿉니다.
 * - 최소 번을 넘겨야 화료할 수 있습니다(보통 3번).
 * - 점수는 번마다 두 배로 늘고 정해진 상한(보통 13번)에서 멈춥니다.
 * - 쯔모는 세 명 모두에게 받고, 론은 방총자가 전액을 냅니다.
 */

export type HongKongFaan = { name: string; chinese: string; faan: number; detail: string; limit?: boolean };
export type HongKongWinType = 'tsumo' | 'ron';

export type HongKongFlower = { id: string; kind: 'flower' | 'season'; value: number; glyph: string };

export type HongKongRound = {
  hands: MahjongTile[][];
  flowers: HongKongFlower[][];
  wall: MahjongTile[];
  flowerWall: HongKongFlower[];
  rivers: MahjongTile[][];
};

export type HongKongScore = {
  faan: HongKongFaan[];
  total: number;
  capped: boolean;
  basePoints: number;
  perPlayer: number;
  payments: number[];
  limitName: string;
};

export const HONG_KONG_MIN_FAAN = 3;
export const HONG_KONG_LIMIT = 13;

/** 집마다 최소 번을 다르게 씁니다. 보통 1·3·5번 중 하나입니다. */
export const HONG_KONG_MIN_OPTIONS = [1, 3, 5] as const;
export type HongKongMinFaan = typeof HONG_KONG_MIN_OPTIONS[number];

// ── 꽃패 ───────────────────────────────────────────────────────────

const flowerGlyphs = ['🀢', '🀣', '🀤', '🀥'];
const seasonGlyphs = ['🀦', '🀧', '🀨', '🀩'];

export function createFlowerTiles(): HongKongFlower[] {
  return [
    ...flowerGlyphs.map((glyph, index) => ({ id: `f${index + 1}`, kind: 'flower' as const, value: index + 1, glyph })),
    ...seasonGlyphs.map((glyph, index) => ({ id: `q${index + 1}`, kind: 'season' as const, value: index + 1, glyph })),
  ];
}

export function shuffleFlowers(tiles: HongKongFlower[], random: () => number = Math.random) {
  const next = [...tiles];
  for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
  return next;
}

/** 꽃패는 자기 자리 번호와 같으면 한 번을 더 줍니다. */
export function flowerFaan(flowers: HongKongFlower[], seat: number) {
  const seatNumber = seat + 1;
  let faan = flowers.filter((flower) => flower.value === seatNumber).length;
  const allFlowers = flowers.filter((flower) => flower.kind === 'flower').length === 4;
  const allSeasons = flowers.filter((flower) => flower.kind === 'season').length === 4;
  if (allFlowers) faan += 2;
  if (allSeasons) faan += 2;
  return faan;
}

// ── 패 준비 ────────────────────────────────────────────────────────

export function dealHongKong(random: () => number = Math.random): HongKongRound {
  const deck = shuffleMahjong(createMahjongTiles(true), random);
  const flowerWall = shuffleFlowers(createFlowerTiles(), random);
  const hands: MahjongTile[][] = [[], [], [], []];
  let cursor = 0;
  for (let count = 0; count < 13; count++) for (let seat = 0; seat < 4; seat++) hands[seat].push(deck[cursor++]);
  return {
    hands: hands.map(sortMahjongHand),
    flowers: [[], [], [], []],
    wall: deck.slice(cursor),
    flowerWall,
    rivers: [[], [], [], []],
  };
}

/** 꽃패를 한 장 가져옵니다. 남은 꽃패가 없으면 null. */
export function drawFlower(flowerWall: HongKongFlower[]) {
  if (!flowerWall.length) return { flowerWall, drawn: null };
  const [drawn, ...rest] = flowerWall;
  return { flowerWall: rest, drawn };
}

/**
 * 게임 중 꽃패를 뽑았을 때의 처리(補花).
 * 꽃패는 옆으로 빼고 산에서 보충패를 한 장 가져옵니다.
 * 보충패가 또 꽃패면 계속 반복합니다.
 *
 * 실제 대국에서는 꽃패가 산에 섞여 있지만, 여기서는 산을 뽑을 때마다
 * flowerChance 확률로 꽃패가 나온 것으로 처리합니다.
 */
export function resolveFlowerDraws(args: {
  hand: MahjongTile[];
  wall: MahjongTile[];
  flowerWall: HongKongFlower[];
  collected: HongKongFlower[];
  flowerChance?: number;
  random?: () => number;
}) {
  const random = args.random ?? Math.random;
  const chance = args.flowerChance ?? 0;
  let wall = [...args.wall];
  let flowerWall = [...args.flowerWall];
  const collected = [...args.collected];
  let hand = [...args.hand];
  let drawnFlowers = 0;

  while (flowerWall.length && wall.length && random() < chance) {
    const picked = drawFlower(flowerWall);
    if (!picked.drawn) break;
    flowerWall = picked.flowerWall;
    collected.push(picked.drawn);
    drawnFlowers++;
    // 보충패 한 장
    const [replacement, ...rest] = wall;
    hand = sortMahjongHand([...hand, replacement]);
    wall = rest;
  }

  return { hand, wall, flowerWall, collected, drawnFlowers };
}

/**
 * 144장을 섞어 배패했다고 보았을 때 처음 13장씩에 섞인 꽃패를 자리별로 나눕니다.
 * 꽃패가 나오면 같은 자리가 다시 한 장을 받으므로, 각자의 숫자패·자패는 13장으로
 * 유지되고 뽑힌 꽃패만 옆에 공개됩니다.
 */
export function dealInitialHongKongFlowers(flowerWall:HongKongFlower[],random:()=>number=Math.random){
  let remaining=[...flowerWall];
  const flowers:HongKongFlower[][]=[[],[],[],[]];
  let standardRemaining=136;
  for(let draw=0;draw<52;draw++){
    const seat=draw%4;
    while(remaining.length&&random()<remaining.length/(standardRemaining+remaining.length)){
      const picked=drawFlower(remaining);
      if(!picked.drawn)break;
      flowers[seat].push(picked.drawn);
      remaining=picked.flowerWall;
    }
    standardRemaining--;
  }
  return {flowers,flowerWall:remaining};
}

/**
 * 한 차례의 홍콩식 뽑기를 끝까지 처리합니다.
 * 꽃패는 손패 장수에 포함하지 않고 옆으로 모은 뒤, 숫자패/자패 한 장이
 * 나올 때까지 보충합니다. 꽃패를 별도 산으로 관리하는 현재 앱 구조에서도
 * 최종 손패는 정확히 한 장만 늘어납니다.
 */
export function drawHongKongTurn(args: {
  hand: MahjongTile[];
  wall: MahjongTile[];
  flowerWall: HongKongFlower[];
  collected: HongKongFlower[];
  flowerChance?: number;
  random?: () => number;
}) {
  const random=args.random??Math.random;
  const chance=args.flowerChance??0;
  let flowerWall=[...args.flowerWall];
  const collected=[...args.collected];
  const drawnFlowers:HongKongFlower[]=[];

  while(flowerWall.length&&random()<chance){
    const picked=drawFlower(flowerWall);
    if(!picked.drawn)break;
    flowerWall=picked.flowerWall;
    collected.push(picked.drawn);
    drawnFlowers.push(picked.drawn);
  }

  if(!args.wall.length)return {hand:[...args.hand],wall:[],flowerWall,collected,drawn:null,drawnFlowers};
  const [drawn,...wall]=args.wall;
  return {hand:sortMahjongHand([...args.hand,drawn]),wall,flowerWall,collected,drawn,drawnFlowers};
}

// ── 완성 판정 ──────────────────────────────────────────────────────

export function isHongKongWinningHand(hand: MahjongTile[], meldCount = 0) {
  return isWinningMahjongHand(hand, meldCount);
}

export function getHongKongWaits(hand: MahjongTile[], meldCount = 0) {
  const candidates = createMahjongTiles(true).filter((tile) => tile.id.endsWith('-0'));
  return candidates.filter((tile) => isHongKongWinningHand([...hand, tile], meldCount));
}

// ── 번(番) 판정 ────────────────────────────────────────────────────

const isTripletMeld = (meld: MahjongTile[]) => meld.every((tile) => tile.suit === meld[0].suit && tile.value === meld[0].value);
const countOf = (tiles: MahjongTile[], suit: MahjongSuit, value: number) => tiles.filter((tile) => tile.suit === suit && tile.value === value).length;
const dragonNames: Record<number, string> = { 5: '백', 6: '발', 7: '중' };
const windNames = ['', '동', '남', '서', '북'];

export function evaluateHongKongFaan(args: {
  hand: MahjongTile[];
  melds?: MahjongTile[][];
  concealedKans?: MahjongTile[][];
  winType: HongKongWinType;
  winningTile?: MahjongTile;
  seatWind?: number;
  roundWind?: number;
  flowers?: HongKongFlower[];
  seat?: number;
  afterKan?: boolean;
  robbingKan?: boolean;
  lastTile?: boolean;
  firstTurn?: boolean;
}): HongKongFaan[] {
  const melds = args.melds ?? [];
  const concealedKans = args.concealedKans ?? [];
  const all = [...args.hand, ...melds.flat(), ...concealedKans.flat()];
  const closed = melds.length === 0;
  const seatWind = args.seatWind ?? 1;
  const roundWind = args.roundWind ?? 1;
  const faan: HongKongFaan[] = [];

  const limit: HongKongFaan[] = [];
  const pushLimit = (name: string, chinese: string, detail: string, value = HONG_KONG_LIMIT) =>
    limit.push({ name, chinese, faan: value, detail, limit: true });

  // ── 한도 역(限番) ────────────────────────────────────────────────
  if (closed && !concealedKans.length && isThirteenOrphansHand(args.hand))
    pushLimit('십삼요', '十三么', '서로 다른 1·9·자패 열세 종류를 모으고 그중 하나를 한 장 더 모음');
  if (countOf(all, 'z', 5) >= 3 && countOf(all, 'z', 6) >= 3 && countOf(all, 'z', 7) >= 3)
    pushLimit('대삼원', '大三元', '백·발·중을 모두 커쯔 또는 깡으로 완성');
  const windTriplets = [1, 2, 3, 4].filter((value) => countOf(all, 'z', value) >= 3);
  if (windTriplets.length === 4) pushLimit('대사희', '大四喜', '동·남·서·북을 모두 커쯔로 완성');
  else if (windTriplets.length === 3 && [1, 2, 3, 4].some((value) => countOf(all, 'z', value) === 2))
    pushLimit('소사희', '小四喜', '바람패 세 종류를 커쯔로, 나머지를 머리로 완성');
  if (all.every((tile) => tile.suit === 'z')) pushLimit('자일색', '字一色', '자패로만 완성');
  if (all.every((tile) => tile.suit !== 'z' && (tile.value === 1 || tile.value === 9)))
    pushLimit('청요구', '清么九', '숫자패의 1과 9만으로 완성');
  if (all.every((tile) => (tile.suit === 's' && [2, 3, 4, 6, 8].includes(tile.value)) || (tile.suit === 'z' && tile.value === 6)))
    pushLimit('녹일색', '綠一色', '삭수 2·3·4·6·8과 발만으로 완성');
  const quadCount = melds.filter((meld) => meld.length === 4).length + concealedKans.length;
  if (quadCount === 4) pushLimit('십팔나한', '十八羅漢', '깡 네 개로 완성');

  const numberedSuits = new Set(all.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit));
  const hasHonors = all.some((tile) => tile.suit === 'z');
  if (closed && !hasHonors && numberedSuits.size === 1) {
    const counts = Array(10).fill(0) as number[];
    all.forEach((tile) => counts[tile.value]++);
    if (counts[1] >= 3 && counts[9] >= 3 && [2, 3, 4, 5, 6, 7, 8].every((value) => counts[value] >= 1))
      pushLimit('구련보등', '九蓮寶燈', '한 종류에서 1112345678999에 같은 종류 한 장을 더해 완성');
  }
  const decompositions = getStandardMahjongDecompositions(args.hand, melds, concealedKans);
  const concealedTriplets = decompositions.reduce((best, { groups }) =>
    Math.max(best, groups.filter((group) => group.kind === 'triplet' && !group.open).length), 0);
  if (closed && concealedTriplets >= 4 && args.winType === 'tsumo')
    pushLimit('사암각', '四暗刻', '공개하지 않은 커쯔 네 개를 쯔모로 완성');
  if (args.firstTurn && args.winType === 'tsumo' && seatWind === 1)
    pushLimit('천화', '天和', '친이 첫 배패에서 그대로 완성');

  if (limit.length) return limit;

  // ── 일반 번 ─────────────────────────────────────────────────────
  const allSequences = decompositions.some(({ groups }) => groups.every((group) => group.kind === 'sequence'));
  const allTriplets = melds.every(isTripletMeld) && decompositions.some(({ groups }) => groups.every((group) => group.kind === 'triplet'));

  if (numberedSuits.size === 1 && !hasHonors) faan.push({ name: '청일색', chinese: '清一色', faan: 7, detail: '한 종류의 숫자패만으로 완성' });
  else if (numberedSuits.size === 1 && hasHonors) faan.push({ name: '혼일색', chinese: '混一色', faan: 3, detail: '한 종류의 숫자패와 자패만 사용' });

  if (allTriplets) faan.push({ name: '대대화', chinese: '對對和', faan: 3, detail: '모든 몸통이 같은 패 세 장 또는 네 장' });
  if (concealedTriplets >= 3 && concealedTriplets < 4) faan.push({ name: '삼암각', chinese: '三暗刻', faan: 2, detail: '공개하지 않은 커쯔 세 개' });

  if (all.every((tile) => tile.suit === 'z' || tile.value === 1 || tile.value === 9))
    faan.push({ name: '혼요구', chinese: '混么九', faan: 3, detail: '1·9와 자패로만 완성' });

  // 소삼원
  const dragonTriplets = [5, 6, 7].filter((value) => countOf(all, 'z', value) >= 3);
  if (dragonTriplets.length === 2 && [5, 6, 7].some((value) => countOf(all, 'z', value) === 2))
    faan.push({ name: '소삼원', chinese: '小三元', faan: 5, detail: '삼원패 두 종류를 커쯔로, 나머지를 머리로 완성' });
  else dragonTriplets.forEach((value) => faan.push({ name: `역패 ${dragonNames[value]}`, chinese: '番子', faan: 1, detail: '삼원패 세 장' }));

  if (countOf(all, 'z', seatWind) >= 3) faan.push({ name: `자풍 ${windNames[seatWind]}`, chinese: '門風', faan: 1, detail: `내 자리의 바람패(${windNames[seatWind]}) 세 장` });
  if (roundWind !== seatWind && countOf(all, 'z', roundWind) >= 3)
    faan.push({ name: `장풍 ${windNames[roundWind]}`, chinese: '圈風', faan: 1, detail: `현재 판의 바람패(${windNames[roundWind]}) 세 장` });

  // 평화: 모두 순자이고 자패 커쯔가 없음
  if (allSequences && !allTriplets) faan.push({ name: '평화', chinese: '平和', faan: 1, detail: '몸통이 모두 연속패' });

  if (closed && args.winType === 'ron') faan.push({ name: '문전청', chinese: '門前清', faan: 1, detail: '한 번도 울지 않고 완성' });
  if (closed && args.winType === 'tsumo') faan.push({ name: '문전청 자모', chinese: '門前清自摸', faan: 2, detail: '울지 않고 직접 뽑아 완성' });
  else if (args.winType === 'tsumo') faan.push({ name: '자모', chinese: '自摸', faan: 1, detail: '직접 뽑아 완성' });

  if (args.afterKan) faan.push({ name: '깡상화', chinese: '槓上開花', faan: 1, detail: '깡을 하고 가져온 패로 완성' });
  if (args.robbingKan) faan.push({ name: '창깡', chinese: '搶槓', faan: 1, detail: '상대가 가깡하려는 패를 가로채 완성' });
  if (args.lastTile) faan.push({ name: '해저로월', chinese: '海底撈月', faan: 1, detail: '마지막 패로 완성' });

  const flowers = args.flowers ?? [];
  const flowerCount = flowerFaan(flowers, args.seat ?? 0);
  if (flowerCount) faan.push({ name: '꽃패', chinese: '花牌', faan: flowerCount, detail: `자기 번호 꽃패와 모음 보너스로 ${flowerCount}번` });

  if (isSevenPairsHand(args.hand) && closed) faan.push({ name: '칠대자', chinese: '七對子', faan: 2, detail: '서로 다른 일곱 종류를 두 장씩' });

  // 그 밖의 홍콩식 번
  if (decompositions.some(({ groups }) => (['m', 'p', 's'] as MahjongSuit[]).some((suit) =>
    [1, 4, 7].every((value) => groups.some((group) => group.kind === 'sequence' && group.suit === suit && group.value === value)))))
    faan.push({ name: '일기통관', chinese: '一氣通貫', faan: 1, detail: '한 종류에서 123·456·789를 모두 완성' });
  if (decompositions.some(({ groups }) => [1, 2, 3, 4, 5, 6, 7].some((value) =>
    (['m', 'p', 's'] as MahjongSuit[]).every((suit) => groups.some((group) => group.kind === 'sequence' && group.suit === suit && group.value === value)))))
    faan.push({ name: '삼색동순', chinese: '三色同順', faan: 1, detail: '세 종류에서 같은 자리의 연속 몸통' });
  if (decompositions.some(({ groups }) => [1, 2, 3, 4, 5, 6, 7, 8, 9].some((value) =>
    (['m', 'p', 's'] as MahjongSuit[]).every((suit) => groups.some((group) => group.kind === 'triplet' && group.suit === suit && group.value === value)))))
    faan.push({ name: '삼색동각', chinese: '三色同刻', faan: 2, detail: '세 종류에서 같은 숫자를 커쯔로 완성' });
  if (decompositions.some(({ pair, groups }) =>
    (pair.suit === 'z' || pair.value === 1 || pair.value === 9) &&
    groups.every((group) => group.suit === 'z' || (group.kind === 'sequence' ? group.value === 1 || group.value === 7 : group.value === 1 || group.value === 9))))
    faan.push({ name: '혼전대요', chinese: '混全帶么', faan: 1, detail: '모든 몸통과 머리에 1·9 또는 자패가 포함' });
  if (closed && decompositions.some(({ groups }) => {
    const seen = new Map<string, number>();
    groups.filter((group) => group.kind === 'sequence' && !group.open)
      .forEach((group) => { const id = `${group.suit}${group.value}`; seen.set(id, (seen.get(id) ?? 0) + 1); });
    return [...seen.values()].some((count) => count >= 2);
  })) faan.push({ name: '이배구', chinese: '一般高', faan: 1, detail: '같은 종류·같은 숫자의 연속 몸통 두 개' });
  if (quadCount === 1) faan.push({ name: '깡', chinese: '槓', faan: 1, detail: '깡 하나' });
  else if (quadCount === 2) faan.push({ name: '쌍깡', chinese: '雙槓', faan: 2, detail: '깡 두 개' });
  else if (quadCount === 3) faan.push({ name: '삼깡', chinese: '三槓', faan: 8, detail: '깡 세 개' });

  // 아무 번도 없으면 계산에서 0번으로 남습니다(최소 번 미달로 화료 불가).
  return faan;
}

export function totalFaan(faan: HongKongFaan[]) {
  return faan.reduce((total, entry) => total + entry.faan, 0);
}

export function canHongKongDeclareWin(faan: HongKongFaan[], minimum: number = HONG_KONG_MIN_FAAN) {
  return faan.some((entry) => entry.limit) || totalFaan(faan) >= minimum;
}

// ── 점수 ───────────────────────────────────────────────────────────

const limitNameFor = (faan: number) => {
  if (faan >= HONG_KONG_LIMIT) return '한도';
  if (faan >= 10) return '십번';
  if (faan >= 7) return '칠번';
  if (faan >= 5) return '오번';
  return '';
};

/**
 * 홍콩식은 번수를 두 배씩 올린 값을 씁니다.
 * 기본점 × 2^번, 한도(보통 13번)에서 멈춥니다.
 * 쯔모는 세 명이 각각 내고, 론은 방총자가 세 명 몫을 전부 냅니다.
 */
export function hongKongScore(args: {
  faan: HongKongFaan[];
  basePoints?: number;
  winType: HongKongWinType;
  limitFaan?: number;
}): HongKongScore {
  const base = args.basePoints ?? 1;
  const cap = args.limitFaan ?? HONG_KONG_LIMIT;
  const raw = args.faan.some((entry) => entry.limit) ? cap : totalFaan(args.faan);
  const capped = raw > cap;
  const counted = Math.min(raw, cap);
  const perPlayer = base * 2 ** counted;
  const payments = args.winType === 'tsumo' ? [perPlayer, perPlayer, perPlayer] : [perPlayer * 3];
  return {
    faan: args.faan,
    total: counted,
    capped,
    basePoints: base,
    perPlayer,
    payments,
    limitName: limitNameFor(counted),
  };
}

export type HongKongMatchState = {
  scores: [number, number, number, number];
  roundIndex: number;
  dealerRepeat: number;
  finished: boolean;
};

export function createHongKongMatch(startingScore = 500): HongKongMatchState {
  return { scores: [startingScore, startingScore, startingScore, startingScore], roundIndex: 0, dealerRepeat: 0, finished: false };
}

export function hongKongRoundLabel(roundIndex: number) {
  const wind = ['東', '南', '西', '北'][Math.floor(roundIndex / 4) % 4];
  return `${wind} ${roundIndex % 4 + 1}국`;
}

export function settleHongKongWin(state: HongKongMatchState, args: {
  winner: number;
  score: HongKongScore;
  winType: HongKongWinType;
  loser?: number;
}): HongKongMatchState {
  const next: HongKongMatchState = { ...state, scores: [...state.scores] as HongKongMatchState['scores'] };
  const dealer = state.roundIndex % 4;

  if (args.winType === 'ron') {
    if (args.loser === undefined || args.loser === args.winner) throw new Error('론에는 방총자가 필요합니다.');
    const amount = args.score.perPlayer * 3;
    next.scores[args.loser] -= amount;
    next.scores[args.winner] += amount;
  } else {
    [0, 1, 2, 3].filter((seat) => seat !== args.winner).forEach((seat) => {
      next.scores[seat] -= args.score.perPlayer;
      next.scores[args.winner] += args.score.perPlayer;
    });
  }

  // 친이 이기면 연장(連莊), 아니면 다음 자리로 넘어갑니다.
  if (args.winner === dealer) next.dealerRepeat++;
  else { next.dealerRepeat = 0; next.roundIndex++; }
  next.finished = next.roundIndex >= 16;
  return next;
}

/** 한 버림패에 여러 명이 동시에 론하는 일포다향 정산. 국 진행은 한 번만 합니다. */
export function settleHongKongMultipleRon(state: HongKongMatchState,args:{
  loser:number;
  winners:{seat:number;score:HongKongScore}[];
}):HongKongMatchState{
  if(!args.winners.length)throw new Error('론 승자가 필요합니다.');
  const seats=args.winners.map(({seat})=>seat);
  if(new Set(seats).size!==seats.length||seats.includes(args.loser))throw new Error('복수 론 자리 정보가 올바르지 않습니다.');
  const next:HongKongMatchState={...state,scores:[...state.scores] as HongKongMatchState['scores']};
  args.winners.forEach(({seat,score})=>{
    const amount=score.perPlayer*3;
    next.scores[args.loser]-=amount;
    next.scores[seat]+=amount;
  });
  const dealer=state.roundIndex%4;
  if(seats.includes(dealer))next.dealerRepeat++;
  else{next.dealerRepeat=0;next.roundIndex++;}
  next.finished=next.roundIndex>=16;
  return next;
}

export function settleHongKongDraw(state: HongKongMatchState): HongKongMatchState {
  // 유국이면 점수 이동 없이 친이 그대로 이어갑니다.
  const next: HongKongMatchState = { ...state, scores: [...state.scores] as HongKongMatchState['scores'] };
  next.dealerRepeat++;
  return next;
}

export function rankHongKongScores(scores: HongKongMatchState['scores']) {
  return scores
    .map((score, seat) => ({ seat, score }))
    .sort((a, b) => b.score - a.score || a.seat - b.seat)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// ── 부르기 ─────────────────────────────────────────────────────────

export type HongKongCallKind = 'chi' | 'pon' | 'minkan' | 'ankan' | 'kakan';
export type HongKongCallOption = { kind: HongKongCallKind; tiles: MahjongTile[]; label: string; meldIndex?: number };

export function getHongKongCallOptions(hand: MahjongTile[], discarded: MahjongTile, canChi: boolean): HongKongCallOption[] {
  const matching = hand.filter((tile) => tile.suit === discarded.suit && tile.value === discarded.value);
  const options: HongKongCallOption[] = [];
  if (matching.length >= 2) options.push({ kind: 'pon', tiles: matching.slice(0, 2), label: `퐁 ${discarded.glyph}${discarded.glyph}${discarded.glyph}` });
  if (matching.length >= 3) options.push({ kind: 'minkan', tiles: matching.slice(0, 3), label: `깡 ${discarded.glyph} ×4` });
  if (canChi && discarded.suit !== 'z') {
    const near = (offset: number) => hand.find((tile) => tile.suit === discarded.suit && tile.value === discarded.value + offset);
    ([[-2, -1], [-1, 1], [1, 2]] as const).forEach(([a, b]) => {
      const first = near(a); const second = near(b);
      if (first && second) options.push({ kind: 'chi', tiles: [first, second], label: `치 ${[first, discarded, second].sort((x, y) => x.value - y.value).map((tile) => tile.glyph).join('')}` });
    });
  }
  return options;
}

export function applyHongKongCall(hand: MahjongTile[], discarded: MahjongTile, option: HongKongCallOption) {
  const ids = new Set(option.tiles.map((tile) => tile.id));
  const meld = option.kind === 'ankan' ? option.tiles : [...option.tiles, discarded];
  return { hand: sortMahjongHand(hand.filter((tile) => !ids.has(tile.id))), meld };
}

/** 최소 번을 못 넘기면 부르지 않는 편이 낫습니다. */
export function shouldHongKongCall(option: HongKongCallOption, faanSoFar: number, minimum = HONG_KONG_MIN_FAAN) {
  if (option.kind === 'chi') return faanSoFar >= minimum;
  return true;
}
