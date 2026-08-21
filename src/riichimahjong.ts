export type MahjongSuit = 'm' | 'p' | 's' | 'z';
export type MahjongTile = { id: string; suit: MahjongSuit; value: number; glyph: string };
export type MahjongCallKind = 'chi' | 'pon' | 'kan';
export type MahjongCallOption = { kind: MahjongCallKind; tiles: MahjongTile[]; label: string };
export type RiichiDiscardOption = { tile: MahjongTile; waits: MahjongTile[] };
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
