export type MahjongSuit = 'm' | 'p' | 's' | 'z';
export type MahjongTile = { id: string; suit: MahjongSuit; value: number; glyph: string };
export type RiichiRound = { player: MahjongTile[]; opponents: MahjongTile[][]; wall: MahjongTile[]; rivers: MahjongTile[][] };

const glyphs: Record<MahjongSuit, string[]> = {
  m: ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'],
  s: ['🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘'],
  p: ['🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'],
  z: ['🀀','🀁','🀂','🀃','🀆','🀅','🀄'],
};
const suitOrder: Record<MahjongSuit, number> = { m: 0, p: 1, s: 2, z: 3 };

export function createMahjongTiles(): MahjongTile[] {
  const tiles: MahjongTile[] = [];
  (['m','p','s','z'] as MahjongSuit[]).forEach((suit) => glyphs[suit].forEach((glyph, index) => {
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

export function dealRiichi(random: () => number = Math.random): RiichiRound {
  const deck = shuffleMahjong(createMahjongTiles(), random); let cursor = 0;
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

export function isWinningMahjongHand(hand: MahjongTile[]) {
  if (hand.length !== 14) return false;
  const counts = Array(34).fill(0) as number[]; hand.forEach((tile) => counts[tileIndex(tile)]++);
  for (let pair = 0; pair < counts.length; pair++) if (counts[pair] >= 2) { const copy = [...counts]; copy[pair] -= 2; if (meldable(copy)) return true; }
  return false;
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
