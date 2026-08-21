export type MahjongSuit = 'm' | 'p' | 's' | 'z';
export type MahjongTile = { id: string; suit: MahjongSuit; value: number; glyph: string };
export type MahjongCallKind = 'chi' | 'pon' | 'kan';
export type MahjongCallOption = { kind: MahjongCallKind; tiles: MahjongTile[]; label: string };
export type RiichiDiscardOption = { tile: MahjongTile; waits: MahjongTile[] };
export type RiichiYaku = { name: string; japanese: string; han: number; detail: string; yakuman?: boolean };
export type MahjongGroup = { kind:'sequence'|'triplet'; suit:MahjongSuit; value:number; open:boolean };
export type MahjongDecomposition = { pair:{suit:MahjongSuit;value:number}; groups:MahjongGroup[] };
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
  if (openMeldCount === 0 && (isSevenPairsHand(hand) || isThirteenOrphansHand(hand))) return true;
  const counts = Array(34).fill(0) as number[]; hand.forEach((tile) => counts[tileIndex(tile)]++);
  for (let pair = 0; pair < counts.length; pair++) if (counts[pair] >= 2) { const copy = [...counts]; copy[pair] -= 2; if (meldable(copy)) return true; }
  return false;
}

export function isSevenPairsHand(hand: MahjongTile[]) {
  if (hand.length !== 14) return false;
  const counts = new Map<string,number>(); hand.forEach((tile) => { const key=`${tile.suit}${tile.value}`; counts.set(key,(counts.get(key)??0)+1); });
  return counts.size === 7 && [...counts.values()].every((count) => count === 2);
}

export function isThirteenOrphansHand(hand: MahjongTile[]) {
  if (hand.length !== 14) return false;
  const required = new Set(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7']);
  const counts = new Map<string,number>(); hand.forEach((tile) => { const key=`${tile.suit}${tile.value}`; counts.set(key,(counts.get(key)??0)+1); });
  return [...required].every((key) => (counts.get(key)??0) >= 1) && [...counts.keys()].every((key) => required.has(key)) && [...counts.values()].some((count) => count === 2);
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

const indexToTileValue = (index:number) => ({ suit:(['m','p','s','z'] as MahjongSuit[])[Math.floor(index/9)], value:index%9+1 });

export function getStandardMahjongDecompositions(hand:MahjongTile[],openMelds:MahjongTile[][]=[]):MahjongDecomposition[] {
  const needed=4-openMelds.length;if(hand.length!==needed*3+2)return [];
  const counts=Array(34).fill(0) as number[];hand.forEach((tile)=>counts[tileIndex(tile)]++);
  const openGroups:MahjongGroup[]=openMelds.map((meld)=>{const sorted=sortMahjongHand(meld);return {kind:isTripletMeld(sorted)?'triplet':'sequence',suit:sorted[0].suit,value:sorted[0].value,open:true};});
  const results:MahjongDecomposition[]=[];
  const collect=(next:number[],groups:MahjongGroup[])=>{const first=next.findIndex((count)=>count>0);if(first<0){if(groups.length===needed)results.push({pair:{suit:'m',value:0},groups:[...openGroups,...groups]});return;}if(groups.length>=needed)return;const tile=indexToTileValue(first);if(next[first]>=3){next[first]-=3;collect(next,[...groups,{kind:'triplet',...tile,open:false}]);next[first]+=3;}if(tile.suit!=='z'&&tile.value<=7&&next[first+1]>0&&next[first+2]>0){next[first]--;next[first+1]--;next[first+2]--;collect(next,[...groups,{kind:'sequence',...tile,open:false}]);next[first]++;next[first+1]++;next[first+2]++;}};
  for(let pair=0;pair<counts.length;pair++)if(counts[pair]>=2){const copy=[...counts];copy[pair]-=2;const before=results.length;collect(copy,[]);const pairTile=indexToTileValue(pair);for(let index=before;index<results.length;index++)results[index].pair=pairTile;}
  return results;
}

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
  if (closed && isThirteenOrphansHand(args.concealed)) return [{ name:'국사무쌍', japanese:'国士無双', han:13, yakuman:true, detail:'서로 다른 1·9·자패 13종을 모두 모으고 그중 하나를 한 장 더 모은 역만' }];
  if (args.riichi && closed) yaku.push({ name:'리치', japanese:'立直', han:1, detail:'패를 공개하지 않은 텐파이에서 선언' });
  if (args.winType === 'tsumo' && closed) yaku.push({ name:'멘젠쯔모', japanese:'門前清自摸和', han:1, detail:'패를 공개하지 않고 직접 뽑아 완성' });
  const sevenPairs = closed && isSevenPairsHand(args.concealed);
  if (sevenPairs) yaku.push({ name:'칠대자', japanese:'七対子', han:2, detail:'서로 다른 일곱 종류의 똑같은 패 두 장씩으로 완성' });
  if (allTiles.every((tile) => tile.suit !== 'z' && tile.value >= 2 && tile.value <= 8)) yaku.push({ name:'탕야오', japanese:'断么九', han:1, detail:'1·9·자패 없이 완성' });
  [5,6,7].forEach((value) => { if (allTiles.filter((tile) => tile.suit === 'z' && tile.value === value).length >= 3) yaku.push({ name:`역패 ${['백','발','중'][value-5]}`, japanese:'役牌', han:1, detail:'삼원패 세 장' }); });
  const seatWind = args.seatWind ?? 1; const roundWind = args.roundWind ?? 1;
  if (allTiles.filter((tile) => tile.suit === 'z' && tile.value === seatWind).length >= 3) yaku.push({ name:'자풍패 동', japanese:'自風牌', han:1, detail:'내 자리의 바람패 세 장' });
  if (allTiles.filter((tile) => tile.suit === 'z' && tile.value === roundWind).length >= 3) yaku.push({ name:'장풍패 동', japanese:'場風牌', han:1, detail:'현재 판의 바람패 세 장' });
  const numberedSuits = new Set(allTiles.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit)); const hasHonors = allTiles.some((tile) => tile.suit === 'z');
  if (numberedSuits.size === 1 && hasHonors) yaku.push({ name:'혼일색', japanese:'混一色', han:closed?3:2, detail:'한 종류의 숫자패와 자패만 사용' });
  if (numberedSuits.size === 1 && !hasHonors) yaku.push({ name:'청일색', japanese:'清一色', han:closed?6:5, detail:'한 종류의 숫자패만 사용' });
  if (!sevenPairs && openMelds.every(isTripletMeld) && concealedCanBeAllTriplets(args.concealed)) yaku.push({ name:'또이또이', japanese:'対々和', han:2, detail:'모든 몸통이 같은 패 세 장 또는 네 장' });
  if (!sevenPairs) {
    const decompositions=getStandardMahjongDecompositions(args.concealed,openMelds);
    if(closed&&decompositions.some(({groups})=>{const sequences=groups.filter((group)=>group.kind==='sequence');return sequences.some((group,index)=>sequences.findIndex((other)=>other.suit===group.suit&&other.value===group.value)!==index);})) yaku.push({name:'이페코',japanese:'一盃口',han:1,detail:'같은 종류·같은 숫자의 연속 몸통 두 개'});
    if(decompositions.some(({groups})=>(['m','p','s'] as MahjongSuit[]).some((suit)=>[1,4,7].every((value)=>groups.some((group)=>group.kind==='sequence'&&group.suit===suit&&group.value===value))))) yaku.push({name:'일기통관',japanese:'一気通貫',han:closed?2:1,detail:'한 종류에서 123·456·789를 모두 완성'});
    if(decompositions.some(({groups})=>[1,2,3,4,5,6,7].some((value)=>(['m','p','s'] as MahjongSuit[]).every((suit)=>groups.some((group)=>group.kind==='sequence'&&group.suit===suit&&group.value===value))))) yaku.push({name:'삼색동순',japanese:'三色同順',han:closed?2:1,detail:'만수·통수·삭수에서 같은 숫자의 연속 몸통'});
    if(decompositions.some(({groups})=>[1,2,3,4,5,6,7,8,9].some((value)=>(['m','p','s'] as MahjongSuit[]).every((suit)=>groups.some((group)=>group.kind==='triplet'&&group.suit===suit&&group.value===value))))) yaku.push({name:'삼색동각',japanese:'三色同刻',han:2,detail:'만수·통수·삭수에서 같은 숫자 세 장씩'});
    const terminal=(suit:MahjongSuit,value:number)=>suit==='z'||value===1||value===9;const pureTerminal=(suit:MahjongSuit,value:number)=>suit!=='z'&&(value===1||value===9);
    const junchan=decompositions.some(({pair,groups})=>pureTerminal(pair.suit,pair.value)&&groups.some((group)=>group.kind==='sequence')&&groups.every((group)=>group.kind==='sequence'?(group.value===1||group.value===7):pureTerminal(group.suit,group.value)));
    if(junchan)yaku.push({name:'준찬타',japanese:'純全帯么九',han:closed?3:2,detail:'모든 몸통과 머리에 1 또는 9가 포함되고 자패는 없음'});
    else if(decompositions.some(({pair,groups})=>terminal(pair.suit,pair.value)&&groups.some((group)=>group.kind==='sequence')&&groups.every((group)=>group.kind==='sequence'?(group.value===1||group.value===7):terminal(group.suit,group.value))))yaku.push({name:'찬타',japanese:'混全帯么九',han:closed?2:1,detail:'모든 몸통과 머리에 1·9 또는 자패가 포함'});
  }
  if(allTiles.every((tile)=>tile.suit==='z'||tile.value===1||tile.value===9))yaku.push({name:'혼노두',japanese:'混老頭',han:2,detail:'1·9와 자패로만 완성'});
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
