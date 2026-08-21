export type MahjongSuit = 'm' | 'p' | 's' | 'z';
export type MahjongTile = { id: string; suit: MahjongSuit; value: number; glyph: string };
export type MahjongCallKind = 'chi' | 'pon' | 'kan';
export type MahjongCallOption = { kind: MahjongCallKind; tiles: MahjongTile[]; label: string };
export type RiichiDiscardOption = { tile: MahjongTile; waits: MahjongTile[] };
export type RiichiYaku = { name: string; japanese: string; han: number; detail: string; yakuman?: boolean };
export type MahjongGroup = { kind:'sequence'|'triplet'; suit:MahjongSuit; value:number; open:boolean; quad?:boolean };
export type MahjongDecomposition = { pair:{suit:MahjongSuit;value:number}; groups:MahjongGroup[] };
export type MahjongWaitShape = 'ryanmen'|'kanchan'|'penchan'|'tanki'|'shanpon';
export type RiichiFuResult = { fu:number; wait:MahjongWaitShape; details:string[]; pinfu:boolean };
export type RiichiScoreResult={basePoints:number;total:number;payments:number[];limitName:string};
export type MahjongAiLevel='beginner'|'easy'|'normal'|'hard'|'expert';
export type RiichiMatchState={roundIndex:number;honba:number;riichiSticks:number;scores:[number,number,number,number];finished:boolean};
export type RiichiRound = { player: MahjongTile[]; opponents: MahjongTile[][]; wall: MahjongTile[]; deadWall:MahjongTile[]; rivers: MahjongTile[][] };

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
  const remaining=deck.slice(cursor);
  return { player: sortMahjongHand(hands[0]), opponents: hands.slice(1).map(sortMahjongHand), wall: remaining.slice(0,-14), deadWall:remaining.slice(-14), rivers: [[],[],[],[]] };
}

export function doraFromIndicator(indicator:MahjongTile):{suit:MahjongSuit;value:number}{if(indicator.suit!=='z')return {suit:indicator.suit,value:indicator.value===9?1:indicator.value+1};if(indicator.value<=4)return {suit:'z',value:indicator.value===4?1:indicator.value+1};return {suit:'z',value:indicator.value===7?5:indicator.value+1};}
export function countMahjongDora(tiles:MahjongTile[],indicators:MahjongTile[]){return indicators.reduce((total,indicator)=>{const dora=doraFromIndicator(indicator);return total+tiles.filter((tile)=>tile.suit===dora.suit&&tile.value===dora.value).length;},0);}
const roundHundred=(value:number)=>Math.ceil(value/100)*100;
export function calculateRiichiScore(args:{han:number;fu:number;dealer:boolean;winType:'tsumo'|'ron';yakumanCount?:number}):RiichiScoreResult{let base:number,limitName='';const yakuman=args.yakumanCount??0;if(yakuman>0){base=8000*yakuman;limitName=yakuman>1?`${yakuman}배 역만`:'역만';}else if(args.han>=11){base=6000;limitName='삼배만';}else if(args.han>=8){base=4000;limitName='배만';}else if(args.han>=6){base=3000;limitName='하네만';}else{const raw=args.fu*2**(args.han+2);if(args.han>=5||raw>=1920){base=2000;limitName='만관';}else base=raw;}if(args.winType==='ron'){const payment=roundHundred(base*(args.dealer?6:4));return {basePoints:base,total:payment,payments:[payment],limitName};}if(args.dealer){const each=roundHundred(base*2);return {basePoints:base,total:each*3,payments:[each,each,each],limitName};}const dealerPay=roundHundred(base*2),otherPay=roundHundred(base);return {basePoints:base,total:dealerPay+otherPay*2,payments:[dealerPay,otherPay,otherPay],limitName};}

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

export function isMahjongFuriten(hand: MahjongTile[], river: MahjongTile[], openMeldCount = 0, includeHonors = true) {
  const waits = getMahjongWaits(hand, openMeldCount, includeHonors);
  return waits.some((wait) => river.some((discarded) => sameTile(wait, discarded)));
}

export function calculateNotenPayments(tenpai: boolean[]) {
  if (tenpai.length !== 4) throw new Error('리치마작 노텐 정산은 4명이 필요합니다');
  const ready = tenpai.filter(Boolean).length;
  if (ready === 0 || ready === 4) return [0, 0, 0, 0];
  const receive = 3000 / ready;
  const pay = 3000 / (4 - ready);
  return tenpai.map((isReady) => isReady ? receive : -pay);
}

export function riichiRoundLabel(roundIndex:number){const wind=roundIndex<4?'동':'남';return `${wind}${roundIndex%4+1}국`;}

export function advanceRiichiMatch(state:RiichiMatchState,result:{winner?:number;exhaustive?:boolean;tenpai?:boolean[];riichiDeposits?:number}){
  const next:RiichiMatchState={...state,scores:[...state.scores] as RiichiMatchState['scores'],riichiSticks:state.riichiSticks+(result.riichiDeposits??0)};
  const dealer=state.roundIndex%4;
  if(result.winner!==undefined){if(next.riichiSticks){next.scores[result.winner]+=next.riichiSticks*1000;next.riichiSticks=0;}if(result.winner===dealer)next.honba++;else{next.honba=0;next.roundIndex++;}}
  else if(result.exhaustive){const payments=calculateNotenPayments(result.tenpai??[false,false,false,false]);payments.forEach((value,index)=>next.scores[index]+=value);next.honba++;if(!(result.tenpai?.[dealer]??false))next.roundIndex++;}
  next.finished=next.roundIndex>=8;return next;
}

export function settleRiichiWin(state:RiichiMatchState,args:{winner:number;score:RiichiScoreResult;winType:'tsumo'|'ron';loser?:number}){
  const next:RiichiMatchState={...state,scores:[...state.scores] as RiichiMatchState['scores']};const dealer=state.roundIndex%4;
  if(args.winType==='ron'){if(args.loser===undefined||args.loser===args.winner)throw new Error('론에는 승자와 다른 방총자가 필요합니다');const amount=args.score.total+state.honba*300;next.scores[args.loser]-=amount;next.scores[args.winner]+=amount;}
  else{const losers=[0,1,2,3].filter((seat)=>seat!==args.winner);losers.forEach((seat,index)=>{const base=args.winner===dealer?args.score.payments[0]:seat===dealer?args.score.payments[0]:args.score.payments[Math.min(index+1,args.score.payments.length-1)];const amount=base+state.honba*100;next.scores[seat]-=amount;next.scores[args.winner]+=amount;});}
  next.scores[args.winner]+=state.riichiSticks*1000;next.riichiSticks=0;return advanceRiichiMatch(next,{winner:args.winner});
}

export function rankRiichiScores(scores:RiichiMatchState['scores']){return scores.map((score,seat)=>({seat,score})).sort((a,b)=>b.score-a.score||a.seat-b.seat).map((entry,index)=>({...entry,rank:index+1}));}

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
  const openGroups:MahjongGroup[]=openMelds.map((meld)=>{const sorted=sortMahjongHand(meld);return {kind:isTripletMeld(sorted)?'triplet':'sequence',suit:sorted[0].suit,value:sorted[0].value,open:true,quad:meld.length===4};});
  const results:MahjongDecomposition[]=[];
  const collect=(next:number[],groups:MahjongGroup[])=>{const first=next.findIndex((count)=>count>0);if(first<0){if(groups.length===needed)results.push({pair:{suit:'m',value:0},groups:[...openGroups,...groups]});return;}if(groups.length>=needed)return;const tile=indexToTileValue(first);if(next[first]>=3){next[first]-=3;collect(next,[...groups,{kind:'triplet',...tile,open:false}]);next[first]+=3;}if(tile.suit!=='z'&&tile.value<=7&&next[first+1]>0&&next[first+2]>0){next[first]--;next[first+1]--;next[first+2]--;collect(next,[...groups,{kind:'sequence',...tile,open:false}]);next[first]++;next[first+1]++;next[first+2]++;}};
  for(let pair=0;pair<counts.length;pair++)if(counts[pair]>=2){const copy=[...counts];copy[pair]-=2;const before=results.length;collect(copy,[]);const pairTile=indexToTileValue(pair);for(let index=before;index<results.length;index++)results[index].pair=pairTile;}
  return results;
}

type WinningPlacement={wait:MahjongWaitShape;groupIndex?:number};
function winningPlacements(decomposition:MahjongDecomposition,tile:MahjongTile):WinningPlacement[]{const placements:WinningPlacement[]=[];if(decomposition.pair.suit===tile.suit&&decomposition.pair.value===tile.value)placements.push({wait:'tanki'});decomposition.groups.forEach((group,index)=>{if(group.suit!==tile.suit)return;if(group.kind==='triplet'&&group.value===tile.value)placements.push({wait:'shanpon',groupIndex:index});if(group.kind==='sequence'&&tile.value>=group.value&&tile.value<=group.value+2){const wait=tile.value===group.value+1?'kanchan':(group.value===1&&tile.value===3)||(group.value===7&&tile.value===7)?'penchan':'ryanmen';placements.push({wait,groupIndex:index});}});return placements;}
const valuePairFu=(pair:MahjongDecomposition['pair'],seatWind:number,roundWind:number)=>pair.suit==='z'?((pair.value>=5?2:0)+(pair.value===seatWind?2:0)+(pair.value===roundWind?2:0)):0;

export function calculateRiichiFu(args:{concealed:MahjongTile[];openMelds?:MahjongTile[][];winningTile:MahjongTile;winType:'tsumo'|'ron';seatWind?:number;roundWind?:number}):RiichiFuResult|null {
  const openMelds=args.openMelds??[];if(!openMelds.length&&isSevenPairsHand(args.concealed))return {fu:25,wait:'tanki',details:['칠대자 고정 25부'],pinfu:false};if(isThirteenOrphansHand(args.concealed))return null;
  const seat=args.seatWind??1,round=args.roundWind??1,closed=!openMelds.length;const candidates:RiichiFuResult[]=[];
  getStandardMahjongDecompositions(args.concealed,openMelds).forEach((decomposition)=>winningPlacements(decomposition,args.winningTile).forEach((placement)=>{const allSequences=decomposition.groups.every((group)=>group.kind==='sequence');const pairFu=valuePairFu(decomposition.pair,seat,round);const pinfu=closed&&allSequences&&pairFu===0&&placement.wait==='ryanmen';if(pinfu){candidates.push({fu:args.winType==='tsumo'?20:30,wait:placement.wait,details:[args.winType==='tsumo'?'핑후 쯔모 20부':'핑후 론 30부'],pinfu:true});return;}let raw=20;const details=['기본 20부'];if(closed&&args.winType==='ron'){raw+=10;details.push('멘젠 론 +10부');}if(args.winType==='tsumo'){raw+=2;details.push('쯔모 +2부');}if(pairFu){raw+=pairFu;details.push(`가치패 머리 +${pairFu}부`);}if(['kanchan','penchan','tanki'].includes(placement.wait)){raw+=2;details.push(`${placement.wait==='kanchan'?'간짱':placement.wait==='penchan'?'변짱':'단기'} 대기 +2부`);}decomposition.groups.forEach((group,index)=>{if(group.kind!=='triplet')return;const terminal=group.suit==='z'||group.value===1||group.value===9;const ronOpened=args.winType==='ron'&&!group.open&&placement.wait==='shanpon'&&placement.groupIndex===index;const open=group.open||ronOpened;let points=group.quad?(open?8:16):(open?2:4);if(terminal)points*=2;raw+=points;details.push(`${open?'공개':'비공개'} ${group.quad?'깡':'커쯔'}${terminal?'(1·9·자패)':''} +${points}부`);});if(!closed&&raw===20){raw+=2;details.push('열린 평화형 +2부');}const fu=Math.ceil(raw/10)*10;if(fu!==raw)details.push(`${raw}부 → ${fu}부 올림`);candidates.push({fu,wait:placement.wait,details,pinfu:false});}));
  return candidates.sort((a,b)=>(b.pinfu?1:0)-(a.pinfu?1:0)||b.fu-a.fu)[0]??null;
}

function concealedCanBeAllTriplets(hand: MahjongTile[]) {
  const counts = Array(34).fill(0) as number[]; hand.forEach((tile) => counts[tileIndex(tile)]++);
  for (let pair = 0; pair < counts.length; pair++) if (counts[pair] >= 2) {
    const copy = [...counts]; copy[pair] -= 2;
    if (copy.every((count) => count % 3 === 0)) return true;
  }
  return false;
}

export function evaluateBasicRiichiYaku(args: { concealed: MahjongTile[]; openMelds?: MahjongTile[][]; riichi?: boolean; ippatsu?:boolean; winType: 'tsumo'|'ron'; winningTile?:MahjongTile; seatWind?: number; roundWind?: number }) {
  const openMelds = args.openMelds ?? []; const allTiles = [...args.concealed, ...openMelds.flat()]; const yaku: RiichiYaku[] = [];
  const closed = openMelds.length === 0;
  if (closed && isThirteenOrphansHand(args.concealed)) return [{ name:'국사무쌍', japanese:'国士無双', han:13, yakuman:true, detail:'서로 다른 1·9·자패 13종을 모두 모으고 그중 하나를 한 장 더 모은 역만' }];
  if (args.riichi && closed) yaku.push({ name:'리치', japanese:'立直', han:1, detail:'패를 공개하지 않은 텐파이에서 선언' });
  if (args.riichi && args.ippatsu && closed) yaku.push({ name:'일발', japanese:'一発', han:1, detail:'리치 뒤 다음 내 차례가 끝나기 전, 아무도 치·퐁·깡하지 않은 동안 완성' });
  if (args.winType === 'tsumo' && closed) yaku.push({ name:'멘젠쯔모', japanese:'門前清自摸和', han:1, detail:'패를 공개하지 않고 직접 뽑아 완성' });
  if(args.winningTile&&calculateRiichiFu({concealed:args.concealed,openMelds,winningTile:args.winningTile,winType:args.winType,seatWind:args.seatWind,roundWind:args.roundWind})?.pinfu)yaku.push({name:'핑후',japanese:'平和',han:1,detail:'비공개 손패의 몸통이 모두 연속패이고 가치 없는 머리·양면 대기로 완성'});
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
    if(decompositions.some(({pair,groups})=>pair.suit==='z'&&pair.value>=5&&groups.filter((group)=>group.kind==='triplet'&&group.suit==='z'&&group.value>=5).length===2))yaku.push({name:'소삼원',japanese:'小三元',han:2,detail:'삼원패 두 종류를 커쯔로, 나머지 한 종류를 머리로 완성'});
    if(decompositions.some(({groups})=>groups.filter((group)=>group.kind==='triplet'&&!group.open).length>=3))yaku.push({name:'삼암각',japanese:'三暗刻',han:2,detail:'공개하지 않은 커쯔 또는 깡 세 개'});
  }
  const tripletValues=(suit:MahjongSuit,values:number[])=>values.every((value)=>allTiles.filter((tile)=>tile.suit===suit&&tile.value===value).length>=3);
  if(tripletValues('z',[5,6,7]))yaku.push({name:'대삼원',japanese:'大三元',han:13,yakuman:true,detail:'백·발·중을 모두 커쯔 또는 깡으로 완성'});
  const windTriplets=[1,2,3,4].filter((value)=>allTiles.filter((tile)=>tile.suit==='z'&&tile.value===value).length>=3);
  if(windTriplets.length===4)yaku.push({name:'대사희',japanese:'大四喜',han:13,yakuman:true,detail:'동·남·서·북을 모두 커쯔 또는 깡으로 완성'});
  else if(windTriplets.length===3&&[1,2,3,4].some((value)=>allTiles.filter((tile)=>tile.suit==='z'&&tile.value===value).length===2))yaku.push({name:'소사희',japanese:'小四喜',han:13,yakuman:true,detail:'바람패 세 종류를 커쯔로, 나머지 한 종류를 머리로 완성'});
  if(allTiles.every((tile)=>tile.suit==='z'))yaku.push({name:'자일색',japanese:'字一色',han:13,yakuman:true,detail:'자패로만 완성'});
  if(allTiles.every((tile)=>tile.suit!=='z'&&(tile.value===1||tile.value===9)))yaku.push({name:'청노두',japanese:'清老頭',han:13,yakuman:true,detail:'숫자패의 1과 9만으로 완성'});
  if(allTiles.every((tile)=>(tile.suit==='s'&&[2,3,4,6,8].includes(tile.value))||(tile.suit==='z'&&tile.value===6)))yaku.push({name:'녹일색',japanese:'緑一色',han:13,yakuman:true,detail:'삭수 2·3·4·6·8과 발만으로 완성'});
  if(closed&&!hasHonors&&numberedSuits.size===1){const counts=Array(10).fill(0);allTiles.forEach((tile)=>counts[tile.value]++);if(counts[1]>=3&&counts[9]>=3&&[2,3,4,5,6,7,8].every((value)=>counts[value]>=1))yaku.push({name:'구련보등',japanese:'九蓮宝燈',han:13,yakuman:true,detail:'한 종류에서 1112345678999에 같은 종류 한 장을 더해 완성'});}
  if(closed&&args.winType==='tsumo'&&getStandardMahjongDecompositions(args.concealed).some(({groups})=>groups.every((group)=>group.kind==='triplet'&&!group.open)))yaku.push({name:'사암각',japanese:'四暗刻',han:13,yakuman:true,detail:'공개하지 않은 커쯔 또는 깡 네 개를 쯔모로 완성'});
  const quadCount=openMelds.filter((meld)=>meld.length===4).length;if(quadCount===4)yaku.push({name:'사깡쯔',japanese:'四槓子',han:13,yakuman:true,detail:'깡 네 개로 완성'});else if(quadCount===3)yaku.push({name:'삼깡쯔',japanese:'三槓子',han:2,detail:'깡 세 개로 완성'});
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

function computerHandPotential(hand:MahjongTile[],includeHonors=true,openMeldCount=0){
  const waits=getMahjongWaits(hand,openMeldCount,includeHonors);if(waits.length)return 10000+waits.length*100;
  return hand.reduce((score,tile)=>{const same=hand.filter((other)=>sameTile(tile,other)).length-1;if(tile.suit==='z')return score+same*7;const adjacent=hand.filter((other)=>other.suit===tile.suit&&Math.abs(other.value-tile.value)===1).length;const gap=hand.filter((other)=>other.suit===tile.suit&&Math.abs(other.value-tile.value)===2).length;const middle=tile.value>=3&&tile.value<=7?1:0;return score+same*7+adjacent*4+gap*2+middle;},0);
}

export function chooseComputerDiscard(hand:MahjongTile[],options:{level?:MahjongAiLevel;opponentRiver?:MahjongTile[];opponentRiichi?:boolean;includeHonors?:boolean;openMeldCount?:number;random?:()=>number}={}){
  const level=options.level??'normal',random=options.random??Math.random;if(!hand.length)throw new Error('버릴 패가 없습니다');
  if(level==='beginner')return hand[Math.floor(random()*hand.length)];
  const scored=hand.map((tile,index)=>{const remaining=hand.filter((_,candidate)=>candidate!==index);let score=computerHandPotential(remaining,options.includeHonors??true,options.openMeldCount??0);if(level==='easy')score=Math.floor(score/20);
    if((level==='hard'||level==='expert')&&options.opponentRiichi){const safe=options.opponentRiver?.some((discarded)=>sameTile(discarded,tile))??false;if(safe)score+=level==='expert'?5000:1200;else if(tile.suit==='z')score+=300;}
    return {tile,score,tie:random()};});
  scored.sort((a,b)=>b.score-a.score||b.tie-a.tie);return scored[0].tile;
}

const aiStrength:Record<MahjongAiLevel,number>={beginner:0,easy:1,normal:2,hard:3,expert:4};

export function shouldComputerDeclareRiichi(hand:MahjongTile[],level:MahjongAiLevel='normal',points=25000,includeHonors=true){
  if(points<1000||aiStrength[level]<1)return false;
  const waits=getMahjongWaits(hand,0,includeHonors);
  if(!waits.length)return false;
  if(level==='easy')return waits.length>=2;
  return true;
}

export function chooseComputerCall(hand:MahjongTile[],discarded:MahjongTile,canChi:boolean,options:{level?:MahjongAiLevel;openMeldCount?:number;includeHonors?:boolean}={}):MahjongCallOption|null{
  const level=options.level??'normal';if(level==='beginner')return null;
  const calls=getMahjongCallOptions(hand,discarded,canChi);if(!calls.length)return null;
  const before=computerHandPotential(hand,options.includeHonors??true,options.openMeldCount??0);
  const ranked=calls.map((call)=>{const called=applyMahjongCall(hand,discarded,call);let best=-Infinity;
    called.hand.forEach((tile,index)=>{const after=called.hand.filter((_,candidate)=>candidate!==index);best=Math.max(best,computerHandPotential(after,options.includeHonors??true,(options.openMeldCount??0)+1));});
    const valueTriplet=call.kind!=='chi'&&discarded.suit==='z'&&(discarded.value>=5||discarded.value===1);const bonus=valueTriplet?250:call.kind==='kan'&&aiStrength[level]>=3?80:0;return {call,score:best+bonus};});
  ranked.sort((a,b)=>b.score-a.score);const choice=ranked[0];const threshold=level==='easy'?before+120:level==='normal'?before+40:before-20;
  return choice.score>=threshold?choice.call:null;
}

export function playOneComputerTurn(hand: MahjongTile[], wall: MahjongTile[], random: () => number = Math.random, options:{level?:MahjongAiLevel;opponentRiver?:MahjongTile[];opponentRiichi?:boolean;includeHonors?:boolean;riichiDeclared?:boolean;points?:number;openMeldCount?:number}={}) {
  const draw = drawTile(hand, wall);
  if (!draw.drawn) return { hand, wall, discarded: null, win: false };
  if (isWinningMahjongHand(draw.hand,options.openMeldCount??0)) return { hand: draw.hand, wall: draw.wall, discarded: null, win: true };
  const discarded=options.riichiDeclared?draw.drawn:chooseComputerDiscard(draw.hand,{...options,random});
  const nextHand=sortMahjongHand(draw.hand.filter((tile) => tile.id !== discarded.id));const riichi=!options.riichiDeclared&&!(options.openMeldCount??0)&&shouldComputerDeclareRiichi(nextHand,options.level,options.points,options.includeHonors);
  return { hand:nextHand, wall: draw.wall, discarded, win: false, riichi };
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
