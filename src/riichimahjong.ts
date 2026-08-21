export type MahjongSuit = 'm' | 'p' | 's' | 'z';
export type MahjongTile = { id: string; suit: MahjongSuit; value: number; glyph: string };
export type MahjongCallKind = 'chi' | 'pon' | 'kan';
export type MahjongCallOption = { kind: MahjongCallKind; tiles: MahjongTile[]; label: string };
export type RiichiDiscardOption = { tile: MahjongTile; waits: MahjongTile[] };
export type RiichiYaku = { name: string; japanese: string; han: number; detail: string };
export type RiichiRound = { player: MahjongTile[]; opponents: MahjongTile[][]; wall: MahjongTile[]; rivers: MahjongTile[][] };

const glyphs: Record<MahjongSuit, string[]> = {
  m: ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'],
  s: ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'],
  p: ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'],
  z: ['🀀','🀁','🀂','🀃','🀆','🀅','🀄'],
};
const suitOrder: Record<MahjongSuit, number> = { m: 0, p: 1, s: 2, z: 3 };

export function createMahjongTiles(includeHonors = true): MahjongTile[] {
  const tiles: MahjongTile[] = [];
  ((includeHonors ? ['m','p','s','z'] : ['m','p','s']) as MahjongSuit[]).forEach((suit) => glyphs[suit].forEach((glyph, index) => {
    for (let copy = 0; copy < 4; copy++) tiles.push({ id: `${suit}${index + 1}-${copy}`, suit, value: index + 1, glyph });
  }));
  return tiles;
}

export function shuffleMahjong(tiles: MahjongTile[], random: () => number = Math.random) {
  const next = [...tiles];
  for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
  return next;
}

export function sortMahjongHand(hand: MahjongTile[]) {
  return [...hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || a.value - b.value || a.id.localeCompare(b.id));
}

export function dealRiichi(random: () => number = Math.random, includeHonors = true): RiichiRound {
  const deck = shuffleMahjong(createMahjongTiles(includeHonors), random); let cursor = 0;
  const hands = [[],[],[],[]] as MahjongTile[][];
  for (let count = 0; count < 13; count++) for (let player = 0; player < 4; player++) hands[player].push(deck[cursor++]);
  return { player: sortMahjongHand(hands[0]), opponents: hands.slice(1).map(sortMahjongHand), wall: deck.slice(cursor), rivers: [[],[],[],[]] };
}

const tileIndex = (tile: MahjongTile) => suitOrder[tile.suit] * 9 + tile.value - 1;
const meldable = (counts: number[]): boolean => {
  const first = counts.findIndex((count) => count > 0); if (first < 0) return true;
  if (counts[first] >= 3) { counts[first] -= 3; if (meldable(counts)) return true; counts[first] += 3; }
  const suit = Math.floor(first / 9); const value = first % 9;
  if (suit < 3 && value <= 6 && counts[first + 1] > 0 && counts[first + 2] > 0) {
    counts[first]--; counts[first + 1]--; counts[first + 2]--; if (meldable(counts)) return true; counts[first]++; counts[first + 1]++; counts[first + 2]++;
  }
  return false;
};

export function isWinningMahjongHand(hand: MahjongTile[], openMeldCount = 0) {
  if (hand.length !== 14 - openMeldCount * 3) return false;
  const counts = Array(34).fill(0) as number[]; hand.forEach((tile) => counts[tileIndex(tile)]++);
  for (let pair = 0; pair < counts.length; pair++) if (counts[pair] >= 2) { const copy = [...counts]; copy[pair] -= 2; if (meldable(copy)) return true; }
  return false;
}

const sameTile = (a: MahjongTile, b: MahjongTile) => a.suit === b.suit && a.value === b.value;

export function canRonMahjong(hand: MahjongTile[], discarded: MahjongTile, openMeldCount = 0) {
  return isWinningMahjongHand([...hand, discarded], openMeldCount);
}

export function getMahjongWaits(hand: MahjongTile[], openMeldCount = 0, includeHonors = true) {
  const candidates = createMahjongTiles(includeHonors).filter((tile) => tile.id.endsWith('-0'));
  return candidates.filter((tile) => canRonMahjong(hand, tile, openMeldCount));
}

export function getRiichiDiscardOptions(hand: MahjongTile[], includeHonors = true): RiichiDiscardOption[] {
  if (hand.length !== 14) return [];
  return hand.flatMap((tile) => {
    const waits = getMahjongWaits(hand.filter((candidate) => candidate.id !== tile.id), 0, includeHonors);
    return waits.length ? [{ tile, waits }] : [];
  });
}

const isTripletMeld = (meld: MahjongTile[]) => meld.every((tile) => sameTile(tile, meld[0]));

function concealedCanBeAllTriplets(hand: MahjongTile[]) {
  const counts = Array(34).fill(0) as number[]; hand.forEach((tile) => counts[tileIndex(tile)]++);
  for (let pair = 0; pair < counts.length; pair++) if (counts[pair] >= 2) {
    const copy = [...counts]; copy[pair] -= 2;
    if (copy.every((count) => count % 3 === 0)) return true;
  }
  return false;
}

export function evaluateBasicRiichiYaku(args: { concealed: MahjongTile[]; openMelds?: MahjongTile[][]; riichi?: boolean; winType: 'tsumo'|'ron'; seatWind?: number; roundWind?: number }) {
  const openMelds = args.openMelds ?? []; const allTiles = [...args.concealed, ...openMelds.flat()]; const yaku: RiichiYaku[] = [];
  const closed = openMelds.length === 0;
  if (args.riichi && closed) yaku.push({ name:'리치', japanese:'立直', han:1, detail:'패를 공개하지 않은 텐파이에서 선언' });
  if (args.winType === 'tsumo' && closed) yaku.push({ name:'멘젠쯔모', japanese:'門前清自摸和', han:1, detail:'패를 공개하지 않고 직접 뽑아 완성' });
  if (allTiles.every((tile) => tile.suit !== 'z' && tile.value >= 2 && tile.value <= 8)) yaku.push({ name:'탕야오', japanese:'断么九', han:1, detail:'1·9·자패 없이 완성' });
  [5,6,7].forEach((value) => { if (allTiles.filter((tile) => tile.suit === 'z' && tile.value === value).length >= 3) yaku.push({ name:`역패 ${['백','발','중'][value-5]}`, japanese:'役牌', han:1, detail:'삼원패 세 장' }); });
  const seatWind = args.seatWind ?? 1; const roundWind = args.roundWind ?? 1;
  if (allTiles.filter((tile) => tile.suit === 'z' && tile.value === seatWind).length >= 3) yaku.push({ name:'자풍패 동', japanese:'自風牌', han:1, detail:'내 자리의 바람패 세 장' });
  if (allTiles.filter((tile) => tile.suit === 'z' && tile.value === roundWind).length >= 3) yaku.push({ name:'장풍패 동', japanese:'場風牌', han:1, detail:'현재 판의 바람패 세 장' });
  const numberedSuits = new Set(allTiles.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit)); const hasHonors = allTiles.some((tile) => tile.suit === 'z');
  if (numberedSuits.size === 1 && hasHonors) yaku.push({ name:'혼일색', japanese:'混一色', han:closed?3:2, detail:'한 종류의 숫자패와 자패만 사용' });
  if (numberedSuits.size === 1 && !hasHonors) yaku.push({ name:'청일색', japanese:'清一色', han:closed?6:5, detail:'한 종류의 숫자패만 사용' });
  if (openMelds.every(isTripletMeld) && concealedCanBeAllTriplets(args.concealed)) yaku.push({ name:'또이또이', japanese:'対々和', han:2, detail:'모든 몸통이 같은 패 세 장 또는 네 장' });
  return yaku;
}

export function getMahjongCallOptions(hand: MahjongTile[], discarded: MahjongTile, canChi: boolean): MahjongCallOption[] {
  const matching = hand.filter((tile) => sameTile(tile, discarded));
  const options: MahjongCallOption[] = [];
  if (matching.length >= 2) options.push({ kind: 'pon', tiles: matching.slice(0, 2), label: `퐁 ${discarded.glyph}${discarded.glyph}${discarded.glyph}` });
  if (matching.length >= 3) options.push({ kind: 'kan', tiles: matching.slice(0, 3), label: `깡 ${discarded.glyph} ×4` });
  if (canChi && discarded.suit !== 'z') {
    [[-2,-1],[-1,1],[1,2]].forEach((offsets) => {
      const values = offsets.map((offset) => discarded.value + offset);
      if (values.some((value) => value < 1 || value > 9)) return;
      const tiles = values.map((value) => hand.find((tile) => tile.suit === discarded.suit && tile.value === value));
      if (tiles.every(Boolean)) {
        const used = tiles as MahjongTile[];
        const glyphs = sortMahjongHand([...used, discarded]).map((tile) => tile.glyph).join('');
        options.push({ kind: 'chi', tiles: used, label: `치 ${glyphs}` });
      }
    });
  }
  return options;
}

export function applyMahjongCall(hand: MahjongTile[], discarded: MahjongTile, option: MahjongCallOption) {
  const usedIds = new Set(option.tiles.map((tile) => tile.id));
  return {
    hand: sortMahjongHand(hand.filter((tile) => !usedIds.has(tile.id))),
    meld: sortMahjongHand([...option.tiles, discarded]),
  };
}

export function playOneComputerTurn(hand: MahjongTile[], wall: MahjongTile[], random: () => number = Math.random) {
  const draw = drawTile(hand, wall);
  if (!draw.drawn) return { hand, wall, discarded: null, win: false };
  if (isWinningMahjongHand(draw.hand)) return { hand: draw.hand, wall: draw.wall, discarded: null, win: true };
  const discardIndex = Math.floor(random() * draw.hand.length);
  const discarded = draw.hand[discardIndex];
  return { hand: sortMahjongHand(draw.hand.filter((_, index) => index !== discardIndex)), wall: draw.wall, discarded, win: false };
}

export function drawTile(hand: MahjongTile[], wall: MahjongTile[]) {
  if (!wall.length) return { hand, wall, drawn: null };
  const [drawn, ...rest] = wall; return { hand: [...hand, drawn], wall: rest, drawn };
}

export function discardTile(hand: MahjongTile[], tileId: string) {
  const index = hand.findIndex((tile) => tile.id === tileId); if (index < 0) throw new Error('버릴 패를 찾을 수 없습니다.');
  return { hand: sortMahjongHand(hand.filter((_, i) => i !== index)), discarded: hand[index] };
}

export function playComputerTurns(opponents: MahjongTile[][], wall: MahjongTile[], rivers: MahjongTile[][], random: () => number = Math.random) {
  const nextOpponents = opponents.map((hand) => [...hand]); const nextRivers = rivers.map((river) => [...river]); let nextWall = [...wall];
  for (let player = 0; player < 3 && nextWall.length; player++) {
    const draw = drawTile(nextOpponents[player], nextWall); nextWall = draw.wall;
    if (isWinningMahjongHand(draw.hand)) return { opponents: nextOpponents, wall: nextWall, rivers: nextRivers, winner: player };
    const discardIndex = Math.floor(random() * draw.hand.length); const discarded = draw.hand[discardIndex];
    nextOpponents[player] = draw.hand.filter((_, index) => index !== discardIndex); nextRivers[player + 1].push(discarded);
  }
  return { opponents: nextOpponents, wall: nextWall, rivers: nextRivers, winner: null };
}
