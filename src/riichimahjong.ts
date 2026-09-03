export type MahjongSuit = 'm' | 'p' | 's' | 'z';
export type MahjongTile = { id: string; suit: MahjongSuit; value: number; glyph: string };
export type MahjongCallKind = 'chi' | 'pon' | 'kan';
export type MahjongCallOption = { kind: MahjongCallKind; tiles: MahjongTile[]; label: string };
export type RiichiDiscardOption = { tile: MahjongTile; waits: MahjongTile[] };
export type RiichiYaku = { name: string; japanese: string; han: number; detail: string; yakuman?: boolean; yakumanMultiplier?: number };
export type MahjongGroup = { kind:'sequence'|'triplet'; suit:MahjongSuit; value:number; open:boolean; quad?:boolean };
export type MahjongDecomposition = { pair:{suit:MahjongSuit;value:number}; groups:MahjongGroup[] };
export type MahjongWaitShape = 'ryanmen'|'kanchan'|'penchan'|'tanki'|'shanpon';
export type RiichiFuResult = { fu:number; wait:MahjongWaitShape; details:string[]; pinfu:boolean };
export type RiichiScoreResult={basePoints:number;total:number;payments:number[];limitName:string};
export type MahjongAiLevel='beginner'|'easy'|'normal'|'hard'|'expert';

/**
 * 마작 상대 셋의 실력. **베팅 등급을 따라갑니다.**
 *
 * ⚠️ 전에는 어느 자리에서나 `easy · normal · expert`로 못 박혀 있었습니다. 라이트에서도
 * 전문가 한 명과 붙고, VIP에서도 초보 한 명이 앉아 있었습니다.
 *
 * 셋을 다 같은 실력으로 두지는 않습니다 — 실제 자리도 사람마다 다릅니다.
 * 등급이 오르면 셋이 **통째로 한 단씩** 세집니다.
 */
export function mahjongLevelsFor(level: '쉬움' | '보통' | '전문가'): [MahjongAiLevel, MahjongAiLevel, MahjongAiLevel] {
  if (level === '쉬움') return ['beginner', 'easy', 'normal'];
  if (level === '전문가') return ['normal', 'expert', 'expert'];
  return ['easy', 'normal', 'expert'];
}
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

export type BeginnerYakuHint={name:string;reason:string};
export type RiichiDiscardGuide={tile:MahjongTile;tenpai:boolean;waits:MahjongTile[];improvements:MahjongTile[];liveTiles:number;reason:string};

/**
 * 초보자에게 현재 손에서 비교적 가까운 리치 역을 설명합니다.
 * 승리 판정이 아니라 방향을 잡는 힌트이므로, 확실한 근거가 있는 후보만 반환합니다.
 */
export function suggestBeginnerRiichiYaku(hand:MahjongTile[],openMeldCount=0,seatWind=1,roundWind=1):BeginnerYakuHint[]{
  const hints:BeginnerYakuHint[]=[];
  const closed=openMeldCount===0;
  const counts=new Map<string,number>();
  hand.forEach((tile)=>{const key=`${tile.suit}${tile.value}`;counts.set(key,(counts.get(key)??0)+1);});
  const terminalOrHonor=hand.filter((tile)=>tile.suit==='z'||tile.value===1||tile.value===9).length;
  const pairs=[...counts.values()].filter((count)=>count>=2).length;
  if(closed)hints.push({name:'리치·멘젠쯔모',reason:'아직 패를 공개하지 않았습니다. 텐파이가 되면 리치, 직접 뽑아 완성하면 멘젠쯔모를 노릴 수 있어요.'});
  if(terminalOrHonor<=2)hints.push({name:'탕야오',reason:`1·9·자패가 ${terminalOrHonor}장뿐입니다. 이것들을 정리하면 숫자 2~8만 남길 수 있어요.`});
  const honorNames=['동','남','서','북','백','발','중'];
  const valuable=[5,6,7,seatWind,roundWind];
  const valuablePair=[...new Set(valuable)].find((value)=>(counts.get(`z${value}`)??0)>=2);
  if(valuablePair)hints.push({name:'역패',reason:`${honorNames[valuablePair-1]}이 ${counts.get(`z${valuablePair}`)}장 있습니다. 같은 패 3장을 만들면 역이 됩니다.`});
  if(closed&&pairs>=3)hints.push({name:'치또이츠',reason:`현재 짝이 ${pairs}개입니다. 서로 다른 짝 7개를 만들면 치또이츠가 됩니다.`});
  const suitTotals=(['m','p','s'] as MahjongSuit[]).map((suit)=>({suit,count:hand.filter((tile)=>tile.suit===suit).length})).sort((a,b)=>b.count-a.count);
  if(suitTotals[0].count>=9)hints.push({name:'혼일색·청일색',reason:`한 종류의 숫자패가 ${suitTotals[0].count}장입니다. 다른 숫자 종류를 줄이면 한 가지 무늬 중심의 큰 역을 노릴 수 있어요.`});
  return hints.slice(0,4);
}

/**
 * 배패. 왕패(죽은 산)는 리치마작에만 있습니다. 중국식·홍콩·사천은 왕패를 두지 않으므로
 * deadWallSize 0으로 부르면 산의 마지막 패까지 모두 뽑을 수 있습니다.
 */
export function dealRiichi(random: () => number = Math.random, includeHonors = true, deadWallSize = 14): RiichiRound {
  const deck = shuffleMahjong(createMahjongTiles(includeHonors), random); let cursor = 0;
  const hands = [[],[],[],[]] as MahjongTile[][];
  for (let count = 0; count < 13; count++) for (let player = 0; player < 4; player++) hands[player].push(deck[cursor++]);
  const remaining=deck.slice(cursor);
  const reserved=Math.max(0,Math.min(deadWallSize,remaining.length));
  return { player: sortMahjongHand(hands[0]), opponents: hands.slice(1).map(sortMahjongHand), wall: reserved?remaining.slice(0,-reserved):remaining, deadWall: reserved?remaining.slice(-reserved):[], rivers: [[],[],[],[]] };
}

export function doraFromIndicator(indicator:MahjongTile):{suit:MahjongSuit;value:number}{if(indicator.suit!=='z')return {suit:indicator.suit,value:indicator.value===9?1:indicator.value+1};if(indicator.value<=4)return {suit:'z',value:indicator.value===4?1:indicator.value+1};return {suit:'z',value:indicator.value===7?5:indicator.value+1};}
export function countMahjongDora(tiles:MahjongTile[],indicators:MahjongTile[]){return indicators.reduce((total,indicator)=>{const dora=doraFromIndicator(indicator);return total+tiles.filter((tile)=>tile.suit===dora.suit&&tile.value===dora.value).length;},0);}
const roundHundred=(value:number)=>Math.ceil(value/100)*100;
export function calculateRiichiScore(args:{han:number;fu:number;dealer:boolean;winType:'tsumo'|'ron';yakumanCount?:number}):RiichiScoreResult{let base:number,limitName='';const yakuman=args.yakumanCount??0;if(yakuman>0){base=8000*yakuman;limitName=yakuman>1?`${yakuman}배 역만`:'역만';}else if(args.han>=11){base=6000;limitName='삼배만';}else if(args.han>=8){base=4000;limitName='배만';}else if(args.han>=6){base=3000;limitName='하네만';}else{const raw=args.fu*2**(args.han+2);if(args.han>=5||raw>2000){base=2000;limitName='만관';}else base=raw;}if(args.winType==='ron'){const payment=roundHundred(base*(args.dealer?6:4));return {basePoints:base,total:payment,payments:[payment],limitName};}if(args.dealer){const each=roundHundred(base*2);return {basePoints:base,total:each*3,payments:[each,each,each],limitName};}const dealerPay=roundHundred(base*2),otherPay=roundHundred(base);return {basePoints:base,total:dealerPay+otherPay*2,payments:[dealerPay,otherPay,otherPay],limitName};}

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

export function riichiRoundLabel(roundIndex:number){const wind=['동','남','서','북'][Math.min(Math.floor(roundIndex/4),3)];return `${wind}${roundIndex%4+1}국`;}

/** 반장전 종료 규칙. 기본값은 일반적인 반장전(남4국 종료·3만점·들통·서입) 설정입니다. */
export type RiichiMatchRules = {
  finalRoundIndex?: number;
  targetScore?: number;
  tobi?: boolean;
  extension?: boolean;
  maxRoundIndex?: number;
  agariYame?: boolean;
};
const defaultRules: Required<RiichiMatchRules> = { finalRoundIndex: 7, targetScore: 30000, tobi: true, extension: true, maxRoundIndex: 11, agariYame: true };

export function advanceRiichiMatch(
  state:RiichiMatchState,
  result:{winner?:number;exhaustive?:boolean;tenpai?:boolean[];riichiDeposits?:number;abortive?:boolean},
  rules:RiichiMatchRules={},
){
  const config={...defaultRules,...rules};
  const next:RiichiMatchState={...state,scores:[...state.scores] as RiichiMatchState['scores'],riichiSticks:state.riichiSticks+(result.riichiDeposits??0)};
  const dealer=state.roundIndex%4;
  if(result.abortive){
    // 도중유국은 친이 그대로 유지되고 본장만 하나 올라갑니다.
    next.honba++;
  }else if(result.winner!==undefined){
    if(next.riichiSticks){next.scores[result.winner]+=next.riichiSticks*1000;next.riichiSticks=0;}
    if(result.winner===dealer)next.honba++;else{next.honba=0;next.roundIndex++;}
  }else if(result.exhaustive){
    const payments=calculateNotenPayments(result.tenpai??[false,false,false,false]);
    payments.forEach((value,index)=>next.scores[index]+=value);
    next.honba++;
    if(!(result.tenpai?.[dealer]??false))next.roundIndex++;
  }

  // 들통: 누군가 점수가 0 미만이 되면 그 자리에서 끝납니다.
  if(config.tobi&&next.scores.some((score)=>score<0)){next.finished=true;return next;}

  const top=Math.max(...next.scores);
  const dealerContinued=next.roundIndex===state.roundIndex;
  if(state.roundIndex>=config.finalRoundIndex&&dealerContinued&&result.winner===dealer){
    // 오라스에서 친이 선두로 화료하면 연장하지 않고 끝냅니다(아가리야메).
    next.finished=config.agariYame&&next.scores[dealer]===top&&top>=config.targetScore;
    return next;
  }
  if(next.roundIndex>config.finalRoundIndex){
    // 목표 점수에 닿은 사람이 있으면 종료, 없으면 서입으로 연장합니다.
    next.finished=top>=config.targetScore||!config.extension||next.roundIndex>config.maxRoundIndex;
  }else next.finished=false;
  return next;
}

export function settleRiichiWin(state:RiichiMatchState,args:{winner:number;score:RiichiScoreResult;winType:'tsumo'|'ron';loser?:number},rules:RiichiMatchRules={}){
  const next:RiichiMatchState={...state,scores:[...state.scores] as RiichiMatchState['scores']};const dealer=state.roundIndex%4;
  if(args.winType==='ron'){if(args.loser===undefined||args.loser===args.winner)throw new Error('론에는 승자와 다른 방총자가 필요합니다');const amount=args.score.total+state.honba*300;next.scores[args.loser]-=amount;next.scores[args.winner]+=amount;}
  else{const losers=[0,1,2,3].filter((seat)=>seat!==args.winner);losers.forEach((seat,index)=>{const base=args.winner===dealer?args.score.payments[0]:seat===dealer?args.score.payments[0]:args.score.payments[Math.min(index+1,args.score.payments.length-1)];const amount=base+state.honba*100;next.scores[seat]-=amount;next.scores[args.winner]+=amount;});}
  next.scores[args.winner]+=state.riichiSticks*1000;next.riichiSticks=0;return advanceRiichiMatch(next,{winner:args.winner},rules);
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

export function getStandardMahjongDecompositions(hand:MahjongTile[],openMelds:MahjongTile[][]=[],concealedKans:MahjongTile[][]=[]):MahjongDecomposition[] {
  const needed=4-openMelds.length-concealedKans.length;if(needed<0||hand.length!==needed*3+2)return [];
  const counts=Array(34).fill(0) as number[];hand.forEach((tile)=>counts[tileIndex(tile)]++);
  const openGroups:MahjongGroup[]=[
    ...openMelds.map((meld)=>{const sorted=sortMahjongHand(meld);return {kind:isTripletMeld(sorted)?'triplet':'sequence',suit:sorted[0].suit,value:sorted[0].value,open:true,quad:meld.length===4} as MahjongGroup;}),
    // 암깡은 공개하지만 비공개 몸통으로 셉니다 (부수 16부, 사암각 인정)
    ...concealedKans.map((meld)=>({kind:'triplet',suit:meld[0].suit,value:meld[0].value,open:false,quad:true} as MahjongGroup)),
  ];
  const results:MahjongDecomposition[]=[];
  const collect=(next:number[],groups:MahjongGroup[])=>{const first=next.findIndex((count)=>count>0);if(first<0){if(groups.length===needed)results.push({pair:{suit:'m',value:0},groups:[...openGroups,...groups]});return;}if(groups.length>=needed)return;const tile=indexToTileValue(first);if(next[first]>=3){next[first]-=3;collect(next,[...groups,{kind:'triplet',...tile,open:false}]);next[first]+=3;}if(tile.suit!=='z'&&tile.value<=7&&next[first+1]>0&&next[first+2]>0){next[first]--;next[first+1]--;next[first+2]--;collect(next,[...groups,{kind:'sequence',...tile,open:false}]);next[first]++;next[first+1]++;next[first+2]++;}};
  for(let pair=0;pair<counts.length;pair++)if(counts[pair]>=2){const copy=[...counts];copy[pair]-=2;const before=results.length;collect(copy,[]);const pairTile=indexToTileValue(pair);for(let index=before;index<results.length;index++)results[index].pair=pairTile;}
  return results;
}

type WinningPlacement={wait:MahjongWaitShape;groupIndex?:number};
function winningPlacements(decomposition:MahjongDecomposition,tile:MahjongTile):WinningPlacement[]{const placements:WinningPlacement[]=[];if(decomposition.pair.suit===tile.suit&&decomposition.pair.value===tile.value)placements.push({wait:'tanki'});decomposition.groups.forEach((group,index)=>{if(group.suit!==tile.suit)return;if(group.kind==='triplet'&&group.value===tile.value)placements.push({wait:'shanpon',groupIndex:index});if(group.kind==='sequence'&&tile.value>=group.value&&tile.value<=group.value+2){const wait=tile.value===group.value+1?'kanchan':(group.value===1&&tile.value===3)||(group.value===7&&tile.value===7)?'penchan':'ryanmen';placements.push({wait,groupIndex:index});}});return placements;}
const valuePairFu=(pair:MahjongDecomposition['pair'],seatWind:number,roundWind:number)=>pair.suit==='z'?((pair.value>=5?2:0)+(pair.value===seatWind?2:0)+(pair.value===roundWind?2:0)):0;

export function calculateRiichiFu(args:{concealed:MahjongTile[];openMelds?:MahjongTile[][];concealedKans?:MahjongTile[][];winningTile:MahjongTile;winType:'tsumo'|'ron';seatWind?:number;roundWind?:number}):RiichiFuResult|null {
  const openMelds=args.openMelds??[],concealedKans=args.concealedKans??[];if(isThirteenOrphansHand(args.concealed))return null;
  const seat=args.seatWind??1,round=args.roundWind??1,closed=!openMelds.length;const candidates:RiichiFuResult[]=[];
  // 량페코는 칠대자로도 읽히므로 두 형태를 모두 후보에 넣고 높은 쪽을 고릅니다.
  if(!openMelds.length&&!concealedKans.length&&isSevenPairsHand(args.concealed))candidates.push({fu:25,wait:'tanki',details:['칠대자 고정 25부'],pinfu:false});
  getStandardMahjongDecompositions(args.concealed,openMelds,concealedKans).forEach((decomposition)=>winningPlacements(decomposition,args.winningTile).forEach((placement)=>{const allSequences=decomposition.groups.every((group)=>group.kind==='sequence');const pairFu=valuePairFu(decomposition.pair,seat,round);const pinfu=closed&&!concealedKans.length&&allSequences&&pairFu===0&&placement.wait==='ryanmen';if(pinfu){candidates.push({fu:args.winType==='tsumo'?20:30,wait:placement.wait,details:[args.winType==='tsumo'?'핑후 쯔모 20부':'핑후 론 30부'],pinfu:true});return;}let raw=20;const details=['기본 20부'];if(closed&&args.winType==='ron'){raw+=10;details.push('멘젠 론 +10부');}if(args.winType==='tsumo'){raw+=2;details.push('쯔모 +2부');}if(pairFu){raw+=pairFu;details.push(`가치패 머리 +${pairFu}부`);}if(['kanchan','penchan','tanki'].includes(placement.wait)){raw+=2;details.push(`${placement.wait==='kanchan'?'간짱':placement.wait==='penchan'?'변짱':'단기'} 대기 +2부`);}decomposition.groups.forEach((group,index)=>{if(group.kind!=='triplet')return;const terminal=group.suit==='z'||group.value===1||group.value===9;const ronOpened=args.winType==='ron'&&!group.open&&placement.wait==='shanpon'&&placement.groupIndex===index;const open=group.open||ronOpened;let points=group.quad?(open?8:16):(open?2:4);if(terminal)points*=2;raw+=points;details.push(`${open?'공개':'비공개'} ${group.quad?'깡':'커쯔'}${terminal?'(1·9·자패)':''} +${points}부`);});if(!closed&&raw===20){raw+=2;details.push('열린 평화형 +2부');}const fu=Math.ceil(raw/10)*10;if(fu!==raw)details.push(`${raw}부 → ${fu}부 올림`);candidates.push({fu,wait:placement.wait,details,pinfu:false});}));
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

const windNames = ['', '동', '남', '서', '북'];
const dragonNames: Record<number, string> = { 5: '백', 6: '발', 7: '중' };
const countOf = (tiles: MahjongTile[], suit: MahjongSuit, value: number) => tiles.filter((tile) => tile.suit === suit && tile.value === value).length;

/** 론으로 샹퐁 대기를 완성한 커쯔는 암각으로 세지 않습니다. */
function concealedTripletCount(decomposition: MahjongDecomposition, winningTile: MahjongTile | undefined, winType: 'tsumo' | 'ron') {
  let count = 0; let ronTripletUsed = false;
  decomposition.groups.forEach((group) => {
    if (group.kind !== 'triplet' || group.open) return;
    if (!ronTripletUsed && winType === 'ron' && winningTile && group.suit === winningTile.suit && group.value === winningTile.value) { ronTripletUsed = true; return; }
    count++;
  });
  return count;
}

/** 같은 종류·같은 숫자의 비공개 연속 몸통이 몇 쌍인지 (1쌍=이페코, 2쌍=량페코) */
function identicalSequencePairs(groups: MahjongGroup[]) {
  const seen = new Map<string, number>();
  groups.filter((group) => group.kind === 'sequence' && !group.open)
    .forEach((group) => { const key = `${group.suit}${group.value}`; seen.set(key, (seen.get(key) ?? 0) + 1); });
  return [...seen.values()].reduce((total, count) => total + Math.floor(count / 2), 0);
}

/** 국사무쌍 13면 대기: 완성패를 빼면 13종이 한 장씩 남는 형태 */
function isThirteenWaitOrphans(hand: MahjongTile[], winningTile?: MahjongTile) {
  if (!winningTile || !isThirteenOrphansHand(hand)) return false;
  const index = hand.findIndex((tile) => tile.id === winningTile.id);
  const rest = index >= 0 ? hand.filter((_, position) => position !== index) : null;
  if (!rest) return false;
  const keys = new Set(rest.map((tile) => `${tile.suit}${tile.value}`));
  return keys.size === 13;
}

/** 순정구련보등: 완성패를 빼면 정확히 1112345678999 */
function isPureNineGates(hand: MahjongTile[], winningTile?: MahjongTile) {
  if (!winningTile) return false;
  const index = hand.findIndex((tile) => tile.id === winningTile.id);
  if (index < 0) return false;
  const rest = hand.filter((_, position) => position !== index);
  if (rest.some((tile) => tile.suit !== winningTile.suit)) return false;
  const counts = Array(10).fill(0) as number[];
  rest.forEach((tile) => counts[tile.value]++);
  return counts[1] === 3 && counts[9] === 3 && [2, 3, 4, 5, 6, 7, 8].every((value) => counts[value] === 1);
}

export function evaluateBasicRiichiYaku(args: {
  concealed: MahjongTile[]; openMelds?: MahjongTile[][];
  riichi?: boolean; doubleRiichi?: boolean; ippatsu?: boolean;
  winType: 'tsumo' | 'ron'; winningTile?: MahjongTile;
  seatWind?: number; roundWind?: number;
  lastTile?: boolean; afterKan?: boolean; robbingKan?: boolean; firstTurn?: boolean;
  concealedKans?: MahjongTile[][];
  /** 쿠이탕(아리아리) 여부. 기본은 인정 */
  openTanyao?: boolean;
  /** 첫 순번에 누가 울었는지 (인화 판정용) */
  anyCallMade?: boolean;
}) {
  const openMelds = args.openMelds ?? []; const concealedKans = args.concealedKans ?? [];
  const allTiles = [...args.concealed, ...openMelds.flat(), ...concealedKans.flat()]; const yaku: RiichiYaku[] = [];
  // 암깡은 멘젠을 깨지 않습니다.
  const closed = openMelds.length === 0;
  const seatWind = args.seatWind ?? 1; const roundWind = args.roundWind ?? 1;
  const winningTile = args.winningTile;

  // ── 역만: 성립하면 다른 역과 섞지 않습니다 ──────────────────────────
  const yakuman: RiichiYaku[] = [];
  const pushYakuman = (name: string, japanese: string, detail: string, multiplier = 1) =>
    yakuman.push({ name, japanese, han: 13 * multiplier, yakuman: true, yakumanMultiplier: multiplier, detail });

  if (closed && args.firstTurn && args.winType === 'tsumo') {
    if (seatWind === 1) pushYakuman('천화', '天和', '친이 첫 배패에서 그대로 완성');
    else pushYakuman('지화', '地和', '자가 첫 쯔모에서 아무도 울지 않은 채로 완성');
  }
  if (closed && !concealedKans.length && isThirteenOrphansHand(args.concealed)) {
    if (isThirteenWaitOrphans(args.concealed, winningTile)) pushYakuman('국사무쌍 13면', '国士無双十三面', '13종이 모두 한 장씩인 상태에서 어느 패로도 완성되는 대기', 2);
    else pushYakuman('국사무쌍', '国士無双', '서로 다른 1·9·자패 13종을 모두 모으고 그중 하나를 한 장 더 모은 역만');
  }
  if (countOf(allTiles, 'z', 5) >= 3 && countOf(allTiles, 'z', 6) >= 3 && countOf(allTiles, 'z', 7) >= 3)
    pushYakuman('대삼원', '大三元', '백·발·중을 모두 커쯔 또는 깡으로 완성');
  const windTriplets = [1, 2, 3, 4].filter((value) => countOf(allTiles, 'z', value) >= 3);
  if (windTriplets.length === 4) pushYakuman('대사희', '大四喜', '동·남·서·북을 모두 커쯔 또는 깡으로 완성', 2);
  else if (windTriplets.length === 3 && [1, 2, 3, 4].some((value) => countOf(allTiles, 'z', value) === 2)) pushYakuman('소사희', '小四喜', '바람패 세 종류를 커쯔로, 나머지 한 종류를 머리로 완성');
  if (allTiles.every((tile) => tile.suit === 'z')) pushYakuman('자일색', '字一色', '자패로만 완성');
  if (allTiles.every((tile) => tile.suit !== 'z' && (tile.value === 1 || tile.value === 9))) pushYakuman('청노두', '清老頭', '숫자패의 1과 9만으로 완성');
  if (allTiles.every((tile) => (tile.suit === 's' && [2, 3, 4, 6, 8].includes(tile.value)) || (tile.suit === 'z' && tile.value === 6))) pushYakuman('녹일색', '緑一色', '삭수 2·3·4·6·8과 발만으로 완성');

  const numberedSuits = new Set(allTiles.filter((tile) => tile.suit !== 'z').map((tile) => tile.suit));
  const hasHonors = allTiles.some((tile) => tile.suit === 'z');
  if (closed && !hasHonors && numberedSuits.size === 1) {
    const counts = Array(10).fill(0) as number[]; allTiles.forEach((tile) => counts[tile.value]++);
    if (counts[1] >= 3 && counts[9] >= 3 && [2, 3, 4, 5, 6, 7, 8].every((value) => counts[value] >= 1)) {
      if (isPureNineGates(args.concealed, winningTile)) pushYakuman('순정구련보등', '純正九蓮宝燈', '1112345678999를 갖춘 뒤 아홉 종류 어느 패로도 완성되는 대기', 2);
      else pushYakuman('구련보등', '九蓮宝燈', '한 종류에서 1112345678999에 같은 종류 한 장을 더해 완성');
    }
  }
  const decompositions = getStandardMahjongDecompositions(args.concealed, openMelds, concealedKans);
  const maxConcealedTriplets = decompositions.reduce((best, decomposition) => Math.max(best, concealedTripletCount(decomposition, winningTile, args.winType)), 0);
  if (closed && maxConcealedTriplets >= 4) {
    // 론으로 완성한 경우 단기 대기일 때만 사암각입니다. 샹퐁 론은 삼암각으로 내려갑니다.
    const tanki = !!winningTile && decompositions.some(({ pair, groups }) => groups.length === 4 && groups.every((group) => group.kind === 'triplet' && !group.open) && pair.suit === winningTile.suit && pair.value === winningTile.value);
    if (tanki && args.winType === 'ron') pushYakuman('사암각 단기', '四暗刻単騎', '암각 네 개를 갖추고 머리 한 장을 기다려 완성', 2);
    else if (args.winType === 'tsumo') pushYakuman('사암각', '四暗刻', '공개하지 않은 커쯔 또는 깡 네 개로 완성');
  }
  const quadCount = openMelds.filter((meld) => meld.length === 4).length + concealedKans.length;
  if (quadCount === 4) pushYakuman('사깡쯔', '四槓子', '깡 네 개로 완성');
  if (yakuman.length) return yakuman;

  // ── 일반 역 ────────────────────────────────────────────────────────
  // 인화: 자가가 첫 순번에 남의 패로 완성 (기본은 만관 취급이라 5판)
  if (closed && args.firstTurn && !args.anyCallMade && args.winType === 'ron' && seatWind !== 1)
    yaku.push({ name: '인화', japanese: '人和', han: 5, detail: '자가가 첫 순번에 아무도 울지 않은 상태에서 남의 패로 완성' });
  if (args.doubleRiichi && closed) yaku.push({ name: '더블리치', japanese: 'ダブル立直', han: 2, detail: '첫 순번에 아무도 울지 않은 상태에서 선언한 리치' });
  else if (args.riichi && closed) yaku.push({ name: '리치', japanese: '立直', han: 1, detail: '패를 공개하지 않은 텐파이에서 선언' });
  if (args.riichi && args.ippatsu && closed) yaku.push({ name: '일발', japanese: '一発', han: 1, detail: '리치 뒤 다음 내 차례가 끝나기 전, 아무도 치·퐁·깡하지 않은 동안 완성' });
  if (args.winType === 'tsumo' && closed) yaku.push({ name: '멘젠쯔모', japanese: '門前清自摸和', han: 1, detail: '패를 공개하지 않고 직접 뽑아 완성' });
  if (args.lastTile && args.winType === 'tsumo') yaku.push({ name: '하이테이', japanese: '海底摸月', han: 1, detail: '산의 마지막 패를 뽑아 완성' });
  if (args.lastTile && args.winType === 'ron') yaku.push({ name: '호테이', japanese: '河底撈魚', han: 1, detail: '마지막으로 버려진 패로 완성' });
  if (args.afterKan && args.winType === 'tsumo') yaku.push({ name: '영상개화', japanese: '嶺上開花', han: 1, detail: '깡을 하고 가져온 영상패로 완성' });
  if (args.robbingKan && args.winType === 'ron') yaku.push({ name: '창깡', japanese: '槍槓', han: 1, detail: '상대가 가깡하려는 패를 가로채 완성' });
  if (winningTile && calculateRiichiFu({ concealed: args.concealed, openMelds, concealedKans, winningTile, winType: args.winType, seatWind, roundWind })?.pinfu)
    yaku.push({ name: '핑후', japanese: '平和', han: 1, detail: '비공개 손패의 몸통이 모두 연속패이고 가치 없는 머리·양면 대기로 완성' });

  // 량페코는 칠대자로도 읽히지만 판수가 높은 량페코 쪽으로 판정합니다.
  const identicalPairs = decompositions.reduce((best, { groups }) => Math.max(best, identicalSequencePairs(groups)), 0);
  const sevenPairs = closed && !concealedKans.length && identicalPairs < 2 && isSevenPairsHand(args.concealed);
  if (sevenPairs) yaku.push({ name: '칠대자', japanese: '七対子', han: 2, detail: '서로 다른 일곱 종류의 똑같은 패 두 장씩으로 완성' });
  const openTanyao = args.openTanyao ?? true;
  if ((closed || openTanyao) && allTiles.every((tile) => tile.suit !== 'z' && tile.value >= 2 && tile.value <= 8)) yaku.push({ name: '탕야오', japanese: '断么九', han: 1, detail: openTanyao ? '1·9·자패 없이 완성' : '울지 않고 1·9·자패 없이 완성' });
  [5, 6, 7].forEach((value) => { if (countOf(allTiles, 'z', value) >= 3) yaku.push({ name: `역패 ${dragonNames[value]}`, japanese: '役牌', han: 1, detail: '삼원패 세 장' }); });
  if (countOf(allTiles, 'z', seatWind) >= 3) yaku.push({ name: `자풍패 ${windNames[seatWind]}`, japanese: '自風牌', han: 1, detail: `내 자리의 바람패(${windNames[seatWind]}) 세 장` });
  if (countOf(allTiles, 'z', roundWind) >= 3) yaku.push({ name: `장풍패 ${windNames[roundWind]}`, japanese: '場風牌', han: 1, detail: `현재 판의 바람패(${windNames[roundWind]}) 세 장` });
  if (numberedSuits.size === 1 && hasHonors) yaku.push({ name: '혼일색', japanese: '混一色', han: closed ? 3 : 2, detail: '한 종류의 숫자패와 자패만 사용' });
  if (numberedSuits.size === 1 && !hasHonors) yaku.push({ name: '청일색', japanese: '清一色', han: closed ? 6 : 5, detail: '한 종류의 숫자패만 사용' });
  if (!sevenPairs && openMelds.every(isTripletMeld) && decompositions.some(({ groups }) => groups.every((group) => group.kind === 'triplet'))) yaku.push({ name: '또이또이', japanese: '対々和', han: 2, detail: '모든 몸통이 같은 패 세 장 또는 네 장' });
  if (!sevenPairs) {
    const pairsOfSequences = identicalPairs;
    if (closed && pairsOfSequences >= 2) yaku.push({ name: '량페코', japanese: '二盃口', han: 3, detail: '같은 종류·같은 숫자의 연속 몸통 두 쌍' });
    else if (closed && pairsOfSequences === 1) yaku.push({ name: '이페코', japanese: '一盃口', han: 1, detail: '같은 종류·같은 숫자의 연속 몸통 두 개' });
    if (decompositions.some(({ groups }) => (['m', 'p', 's'] as MahjongSuit[]).some((suit) => [1, 4, 7].every((value) => groups.some((group) => group.kind === 'sequence' && group.suit === suit && group.value === value))))) yaku.push({ name: '일기통관', japanese: '一気通貫', han: closed ? 2 : 1, detail: '한 종류에서 123·456·789를 모두 완성' });
    if (decompositions.some(({ groups }) => [1, 2, 3, 4, 5, 6, 7].some((value) => (['m', 'p', 's'] as MahjongSuit[]).every((suit) => groups.some((group) => group.kind === 'sequence' && group.suit === suit && group.value === value))))) yaku.push({ name: '삼색동순', japanese: '三色同順', han: closed ? 2 : 1, detail: '만수·통수·삭수에서 같은 숫자의 연속 몸통' });
    if (decompositions.some(({ groups }) => [1, 2, 3, 4, 5, 6, 7, 8, 9].some((value) => (['m', 'p', 's'] as MahjongSuit[]).every((suit) => groups.some((group) => group.kind === 'triplet' && group.suit === suit && group.value === value))))) yaku.push({ name: '삼색동각', japanese: '三色同刻', han: 2, detail: '만수·통수·삭수에서 같은 숫자 세 장씩' });
    const terminal = (suit: MahjongSuit, value: number) => suit === 'z' || value === 1 || value === 9;
    const pureTerminal = (suit: MahjongSuit, value: number) => suit !== 'z' && (value === 1 || value === 9);
    const junchan = decompositions.some(({ pair, groups }) => pureTerminal(pair.suit, pair.value) && groups.some((group) => group.kind === 'sequence') && groups.every((group) => group.kind === 'sequence' ? (group.value === 1 || group.value === 7) : pureTerminal(group.suit, group.value)));
    if (junchan) yaku.push({ name: '준찬타', japanese: '純全帯么九', han: closed ? 3 : 2, detail: '모든 몸통과 머리에 1 또는 9가 포함되고 자패는 없음' });
    else if (decompositions.some(({ pair, groups }) => terminal(pair.suit, pair.value) && groups.some((group) => group.kind === 'sequence') && groups.every((group) => group.kind === 'sequence' ? (group.value === 1 || group.value === 7) : terminal(group.suit, group.value)))) yaku.push({ name: '찬타', japanese: '混全帯么九', han: closed ? 2 : 1, detail: '모든 몸통과 머리에 1·9 또는 자패가 포함' });
    if (decompositions.some(({ pair, groups }) => pair.suit === 'z' && pair.value >= 5 && groups.filter((group) => group.kind === 'triplet' && group.suit === 'z' && group.value >= 5).length === 2)) yaku.push({ name: '소삼원', japanese: '小三元', han: 2, detail: '삼원패 두 종류를 커쯔로, 나머지 한 종류를 머리로 완성' });
    if (maxConcealedTriplets >= 3) yaku.push({ name: '삼암각', japanese: '三暗刻', han: 2, detail: '공개하지 않은 커쯔 또는 깡 세 개' });
  }
  if (quadCount === 3) yaku.push({ name: '삼깡쯔', japanese: '三槓子', han: 2, detail: '깡 세 개로 완성' });
  if (allTiles.every((tile) => tile.suit === 'z' || tile.value === 1 || tile.value === 9)) yaku.push({ name: '혼노두', japanese: '混老頭', han: 2, detail: '1·9와 자패로만 완성' });
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

export type MahjongDangerContext = {
  /** 리치를 선언한 상대들의 버림패 */
  riichiRivers?: MahjongTile[][];
  /** 내가 볼 수 있는 모든 패 (내 손패 + 모든 버림패 + 공개된 몸통) */
  visibleTiles?: MahjongTile[];
};

const countVisible = (tile: MahjongTile, visible: MahjongTile[] = []) =>
  visible.filter((candidate) => sameTile(candidate, tile)).length;

/** 한 명의 리치자에 대한 위험도 (0 안전 ~ 60 위험) */
function dangerAgainst(tile: MahjongTile, river: MahjongTile[], visible: MahjongTile[]) {
  // 현물: 그 사람이 이미 버린 패로는 론할 수 없습니다
  if (river.some((discarded) => sameTile(discarded, tile))) return 0;

  if (tile.suit === 'z') {
    // 자패는 보이는 장수가 많을수록 안전합니다 (샹퐁·단기만 남음)
    const seen = countVisible(tile, visible);
    return seen >= 3 ? 4 : seen === 2 ? 14 : 34;
  }

  const value = tile.value;
  const inRiver = (target: number) => river.some((discarded) => discarded.suit === tile.suit && discarded.value === target);
  // 4·5·6이 가장 위험하고 1·9가 가장 안전합니다
  let score = value === 1 || value === 9 ? 30 : value === 2 || value === 8 ? 40 : value === 3 || value === 7 ? 50 : 60;

  // 스지: 양면 대기를 배제할 수 있으면 크게 안전해집니다
  if (value <= 3 && inRiver(value + 3)) score *= 0.45;
  else if (value >= 7 && inRiver(value - 3)) score *= 0.45;
  else if (value >= 4 && value <= 6) {
    const low = inRiver(value - 3); const high = inRiver(value + 3);
    if (low && high) score *= 0.45;
    else if (low || high) score *= 0.78;
  }

  // 벽(노찬스): 양면을 만들 이웃 패가 전부 보이면 그만큼 안전합니다
  const neighborGone = (offset: number) => {
    const target = value + offset;
    if (target < 1 || target > 9) return true;
    return countVisible({ ...tile, value: target }, visible) >= 4;
  };
  if (neighborGone(-1) && neighborGone(1)) score *= 0.5;
  else if (neighborGone(-2) && neighborGone(2)) score *= 0.75;

  return score;
}

/**
 * 이 패를 버렸을 때의 위험도. 리치자가 없으면 0입니다.
 * 여러 명이 리치했다면 가장 위험한 쪽을 기준으로 합니다.
 */
export function tileDangerScore(tile: MahjongTile, context: MahjongDangerContext = {}) {
  const rivers = (context.riichiRivers ?? []).filter((river) => river.length);
  if (!rivers.length) return 0;
  const visible = context.visibleTiles ?? [];
  return rivers.reduce((worst, river) => Math.max(worst, dangerAgainst(tile, river, visible)), 0);
}

/** 손패가 완성에서 얼마나 가까운지를 비교 가능한 점수로 환산 */
function normalizedPotential(hand: MahjongTile[], includeHonors: boolean, openMeldCount: number) {
  const raw = computerHandPotential(hand, includeHonors, openMeldCount);
  return raw >= 10000 ? { score: 1000 + (raw - 10000), tenpai: true } : { score: raw, tenpai: false };
}

/**
 * 초보자용 버림패 후보. 완전한 샹텐 계산 대신 현재 모양보다 실제로 좋아지는
 * 다음 패(유효패)를 전부 대입하며, 텐파이가 되는 선택은 항상 가장 먼저 둡니다.
 * 같은 종류의 패가 여러 장이면 한 번만 보여 줍니다.
 */
export function suggestRiichiDiscards(hand:MahjongTile[],options:{openMeldCount?:number;includeHonors?:boolean;visibleTiles?:MahjongTile[];limit?:number}={}):RiichiDiscardGuide[]{
  const openMeldCount=options.openMeldCount??0;
  const includeHonors=options.includeHonors??true;
  const visible=options.visibleTiles??hand;
  const candidates=createMahjongTiles(includeHonors).filter((tile)=>tile.id.endsWith('-0'));
  const unique=new Map<string,{tile:MahjongTile;index:number}>();
  hand.forEach((tile,index)=>{const key=`${tile.suit}${tile.value}`;if(!unique.has(key))unique.set(key,{tile,index});});
  const guides=[...unique.values()].map(({tile,index})=>{
    const remaining=hand.filter((_,candidate)=>candidate!==index);
    const waits=getMahjongWaits(remaining,openMeldCount,includeHonors);
    const base=normalizedPotential(remaining,includeHonors,openMeldCount);
    const improvements=waits.length?waits:candidates.filter((draw)=>normalizedPotential([...remaining,draw],includeHonors,openMeldCount).score>base.score);
    const liveTiles=improvements.reduce((total,draw)=>total+Math.max(0,4-visible.filter((shown)=>sameTile(shown,draw)).length),0);
    const reason=waits.length
      ? `${waits.map((wait)=>wait.glyph).join(' ')}을 기다리는 텐파이 · 남은 대기패 최대 ${liveTiles}장`
      : improvements.length
        ? `${improvements.slice(0,8).map((draw)=>draw.glyph).join(' ')}${improvements.length>8?' 외':''}을 뽑으면 모양이 좋아짐 · 최대 ${liveTiles}장`
        : '현재 계산에서 바로 좋아지는 패가 적은 선택';
    return {tile,tenpai:waits.length>0,waits,improvements,liveTiles,reason,potential:base.score};
  });
  guides.sort((a,b)=>Number(b.tenpai)-Number(a.tenpai)||b.potential-a.potential||b.liveTiles-a.liveTiles||a.tile.suit.localeCompare(b.tile.suit)||a.tile.value-b.tile.value);
  return guides.slice(0,options.limit??3).map(({potential:_,...guide})=>guide);
}

export function chooseComputerDiscard(hand:MahjongTile[],options:{
  level?:MahjongAiLevel;
  opponentRiver?:MahjongTile[];
  opponentRiichi?:boolean;
  riichiRivers?:MahjongTile[][];
  visibleTiles?:MahjongTile[];
  includeHonors?:boolean;
  openMeldCount?:number;
  random?:()=>number;
}={}){
  const level=options.level??'normal',random=options.random??Math.random;
  if(!hand.length)throw new Error('버릴 패가 없습니다');
  if(level==='beginner')return hand[Math.floor(random()*hand.length)];

  // 예전 호출 방식(opponentRiver 한 개)도 그대로 받습니다
  const riichiRivers=options.riichiRivers?.length?options.riichiRivers
    :options.opponentRiichi&&options.opponentRiver?[options.opponentRiver]:[];
  const context:MahjongDangerContext={riichiRivers,visibleTiles:options.visibleTiles??[...hand,...riichiRivers.flat()]};
  const underThreat=riichiRivers.length>0;

  const scored=hand.map((tile,index)=>{
    const remaining=hand.filter((_,candidate)=>candidate!==index);
    const potential=normalizedPotential(remaining,options.includeHonors??true,options.openMeldCount??0);
    let score=level==='easy'?Math.floor(potential.score/20):potential.score;
    if(underThreat&&aiStrength[level]>=2){
      // 텐파이면 밀고, 아직 멀면 확실히 내려서 안전패를 고릅니다(베타오리)
      const weight=level==='expert'?(potential.tenpai?10:40):level==='hard'?(potential.tenpai?6:18):2;
      score-=tileDangerScore(tile,context)*weight;
    }
    return {tile,score,tie:random()};
  });
  scored.sort((a,b)=>b.score-a.score||b.tie-a.tie);
  return scored[0].tile;
}

const aiStrength:Record<MahjongAiLevel,number>={beginner:0,easy:1,normal:2,hard:3,expert:4};

export function shouldComputerDeclareRiichi(
  hand:MahjongTile[],
  level:MahjongAiLevel='normal',
  points=25000,
  includeHonors=true,
  options:{wallRemaining?:number;visibleTiles?:MahjongTile[];opponentRiichi?:boolean}={},
){
  if(points<1000||aiStrength[level]<1)return false;
  const waits=getMahjongWaits(hand,0,includeHonors);
  if(!waits.length)return false;
  if(level==='easy')return waits.length>=2;

  const wallRemaining=options.wallRemaining??70;
  // 남은 패가 없으면 리치해도 화료할 기회가 없습니다
  if(wallRemaining<4)return false;

  // 살아 있는 대기패가 몇 장인지 (이미 보이는 패는 뺍니다)
  const visible=options.visibleTiles??hand;
  const live=waits.reduce((total,wait)=>total+Math.max(0,4-visible.filter((tile)=>sameTile(tile,wait)).length),0);
  if(live===0)return false;
  if(level==='normal')return live>=2;

  // 상급은 대기가 얇으면 종반이나 상대 리치 앞에서 참습니다
  if(wallRemaining<12&&live<=2)return false;
  if(options.opponentRiichi&&live<=2&&aiStrength[level]>=4)return false;
  return true;
}

export function chooseComputerCall(hand:MahjongTile[],discarded:MahjongTile,canChi:boolean,options:{level?:MahjongAiLevel;openMeldCount?:number;includeHonors?:boolean;allowedCalls?:MahjongCallOption[]}={}):MahjongCallOption|null{
  const level=options.level??'normal';if(level==='beginner')return null;
  const calls=options.allowedCalls??getMahjongCallOptions(hand,discarded,canChi);if(!calls.length)return null;
  const before=computerHandPotential(hand,options.includeHonors??true,options.openMeldCount??0);
  const ranked=calls.map((call)=>{const called=applyMahjongCall(hand,discarded,call);let best=-Infinity;
    called.hand.forEach((tile,index)=>{const after=called.hand.filter((_,candidate)=>candidate!==index);best=Math.max(best,computerHandPotential(after,options.includeHonors??true,(options.openMeldCount??0)+1));});
    const valueTriplet=call.kind!=='chi'&&discarded.suit==='z'&&(discarded.value>=5||discarded.value===1);const bonus=valueTriplet?250:call.kind==='kan'&&aiStrength[level]>=3?80:0;return {call,score:best+bonus};});
  ranked.sort((a,b)=>b.score-a.score);const choice=ranked[0];const threshold=level==='easy'?before+120:level==='normal'?before+40:before-20;
  return choice.score>=threshold?choice.call:null;
}

export function playOneComputerTurn(hand: MahjongTile[], wall: MahjongTile[], random: () => number = Math.random, options:{level?:MahjongAiLevel;opponentRiver?:MahjongTile[];opponentRiichi?:boolean;riichiRivers?:MahjongTile[][];visibleTiles?:MahjongTile[];includeHonors?:boolean;riichiDeclared?:boolean;points?:number;openMeldCount?:number;openMelds?:MahjongTile[][];requireYaku?:boolean;
  /** 종목별 완성 판정. 사천의 정결이나 홍콩·중국식의 최소 점수처럼 리치와 다른 조건을 넘길 때 씁니다. */
  canWin?:(hand:MahjongTile[],drawn:MahjongTile)=>boolean}={}) {
  const draw = drawTile(hand, wall);
  if (!draw.drawn) return { hand, wall, discarded: null, win: false };
  const complete=options.canWin?options.canWin(draw.hand,draw.drawn):isWinningMahjongHand(draw.hand,options.openMeldCount??0);
  const hasYaku=options.canWin?true:(!options.requireYaku||evaluateBasicRiichiYaku({concealed:draw.hand,openMelds:options.openMelds,riichi:options.riichiDeclared,winType:'tsumo',winningTile:draw.drawn}).length>0);
  if (complete&&hasYaku) return { hand: draw.hand, wall: draw.wall, discarded: null, win: true,winningTile:draw.drawn };
  const discarded=options.riichiDeclared?draw.drawn:chooseComputerDiscard(draw.hand,{...options,random});
  const nextHand=sortMahjongHand(draw.hand.filter((tile) => tile.id !== discarded.id));const riichi=!options.riichiDeclared&&!(options.openMeldCount??0)&&shouldComputerDeclareRiichi(nextHand,options.level,options.points,options.includeHonors,{wallRemaining:draw.wall.length,visibleTiles:options.visibleTiles,opponentRiichi:options.opponentRiichi});
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

/** 자리 바람: 친 자리가 동(1), 이후 시계 반대 방향으로 남·서·북 */
export function seatWindFor(seat: number, dealerSeat: number) {
  return ((seat - dealerSeat) % 4 + 4) % 4 + 1;
}

/** 장 바람: 동장(0~3국)은 동, 남장(4~7국)은 남 */
export function roundWindFor(roundIndex: number) {
  return roundIndex < 4 ? 1 : 2;
}

/** 역만 배수 합계. 더블 역만은 2로 셉니다. */
export function countYakumanMultiplier(yaku: RiichiYaku[]) {
  return yaku.reduce((total, item) => total + (item.yakuman ? (item.yakumanMultiplier ?? 1) : 0), 0);
}

// ── 깡 ──────────────────────────────────────────────────────────────
export type MahjongKanKind = 'ankan' | 'minkan' | 'kakan';
export type MahjongKanOption = { kind: MahjongKanKind; tiles: MahjongTile[]; label: string; meldIndex?: number };

const kanLabel = (kind: MahjongKanKind, tile: MahjongTile) =>
  `${kind === 'ankan' ? '암깡' : kind === 'kakan' ? '가깡' : '대명깡'} ${tile.glyph} ×4`;

/** 손에 같은 패 네 장이 있으면 암깡할 수 있습니다. */
export function getAnkanOptions(hand: MahjongTile[]): MahjongKanOption[] {
  const groups = new Map<string, MahjongTile[]>();
  hand.forEach((tile) => { const key = `${tile.suit}${tile.value}`; groups.set(key, [...(groups.get(key) ?? []), tile]); });
  return [...groups.values()].filter((tiles) => tiles.length >= 4)
    .map((tiles) => ({ kind: 'ankan' as const, tiles: tiles.slice(0, 4), label: kanLabel('ankan', tiles[0]) }));
}

/** 이미 퐁해 둔 몸통과 같은 패를 손에 들고 있으면 가깡할 수 있습니다. */
export function getKakanOptions(hand: MahjongTile[], openMelds: MahjongTile[][]): MahjongKanOption[] {
  return openMelds.flatMap((meld, meldIndex) => {
    if (meld.length !== 3 || !isTripletMeld(meld)) return [];
    const match = hand.find((tile) => sameTile(tile, meld[0]));
    return match ? [{ kind: 'kakan' as const, tiles: [...meld, match], label: kanLabel('kakan', match), meldIndex }] : [];
  });
}

export function applyAnkan(hand: MahjongTile[], option: MahjongKanOption) {
  const ids = new Set(option.tiles.map((tile) => tile.id));
  return { hand: sortMahjongHand(hand.filter((tile) => !ids.has(tile.id))), kan: option.tiles };
}

export function applyKakan(hand: MahjongTile[], openMelds: MahjongTile[][], option: MahjongKanOption) {
  if (option.meldIndex === undefined) throw new Error('가깡에는 대상 몸통이 필요합니다.');
  const added = option.tiles[option.tiles.length - 1];
  const nextMelds = openMelds.map((meld, index) => index === option.meldIndex ? [...meld, added] : meld);
  return { hand: sortMahjongHand(hand.filter((tile) => tile.id !== added.id)), openMelds: nextMelds };
}

/**
 * 리치 중에는 대기가 전혀 바뀌지 않는 암깡만 허용됩니다.
 * concealedBeforeDraw는 뽑기 직전의 손패, drawn은 방금 뽑은 네 번째 패입니다.
 */
export function ankanKeepsWait(concealedBeforeDraw: MahjongTile[], drawn: MahjongTile, openMeldCount = 0, includeHonors = true) {
  const before = getMahjongWaits(concealedBeforeDraw, openMeldCount, includeHonors);
  if (!before.length) return false;
  const full = [...concealedBeforeDraw, drawn];
  const kanTiles = full.filter((tile) => sameTile(tile, drawn)).slice(0, 4);
  if (kanTiles.length < 4) return false;
  const ids = new Set(kanTiles.map((tile) => tile.id));
  const rest = full.filter((tile) => !ids.has(tile.id));
  const after = getMahjongWaits(rest, openMeldCount + 1, includeHonors);
  return before.length === after.length && before.every((wait) => after.some((candidate) => sameTile(candidate, wait)));
}

/** 가깡 선언 패는 다른 사람이 론으로 가로챌 수 있습니다(창깡). */
export function canRobKan(hand: MahjongTile[], declared: MahjongTile, openMeldCount = 0) {
  return canRonMahjong(hand, declared, openMeldCount);
}

// ── 왕패(영상패·도라·뒷도라) ────────────────────────────────────────
// 14장 구성: 0~3 영상패 4장, 4·6·8·10·12 도라 표시패, 5·7·9·11·13 뒷도라 표시패
export const MAX_KAN_PER_ROUND = 4;

/** 깡을 할 때마다 표시패가 한 장씩 늘어납니다(깡도라). */
export function deadWallDoraIndicators(deadWall: MahjongTile[], kanCount = 0) {
  return [4, 6, 8, 10, 12].slice(0, Math.min(kanCount, MAX_KAN_PER_ROUND) + 1)
    .map((index) => deadWall[index]).filter(Boolean);
}

/** 리치했을 때만 볼 수 있는 뒷도라. 깡을 하면 뒷도라도 함께 늘어납니다. */
export function deadWallUraIndicators(deadWall: MahjongTile[], kanCount = 0) {
  return [5, 7, 9, 11, 13].slice(0, Math.min(kanCount, MAX_KAN_PER_ROUND) + 1)
    .map((index) => deadWall[index]).filter(Boolean);
}

/**
 * 깡을 하면 왕패에서 영상패를 한 장 가져오고, 왕패는 산의 마지막 패로 채웁니다.
 * kanCount는 이번 깡을 하기 전까지의 깡 수입니다.
 */
export function drawReplacementTile(hand: MahjongTile[], wall: MahjongTile[], deadWall: MahjongTile[], kanCount = 0) {
  if (kanCount >= MAX_KAN_PER_ROUND) return { hand, wall, deadWall, drawn: null };
  const drawn = deadWall[kanCount];
  if (!drawn) return { hand, wall, deadWall, drawn: null };
  const nextDeadWall = [...deadWall];
  const nextWall = [...wall];
  const refill = nextWall.pop();
  // 가져간 영상패 자리를 산의 마지막 패로 메워 왕패를 14장으로 유지합니다.
  if (refill) nextDeadWall[kanCount] = refill;
  return { hand: sortMahjongHand([...hand, drawn]), wall: nextWall, deadWall: nextDeadWall, drawn };
}

// ── 다중 론과 우선순위 ──────────────────────────────────────────────
export type MultiRonResult = { winners: number[]; abortive: boolean; reason?: string };

/** 방총자에게서 시계 방향으로 몇 자리 떨어져 있는지 (론 우선순위) */
export const ronPriority = (seat: number, discarderSeat: number) => ((seat - discarderSeat) % 4 + 4) % 4;

/**
 * 같은 패로 여러 명이 론을 선언했을 때의 처리.
 * - headBump(두절)이면 방총자 다음 자리에 가장 가까운 한 명만 화료
 * - 세 명이 동시에 론하면 삼가화로 유국 (tripleRonAbort)
 */
export function resolveMultipleRon(claimSeats: number[], discarderSeat: number, options: { headBump?: boolean; tripleRonAbort?: boolean } = {}): MultiRonResult {
  const unique = [...new Set(claimSeats)].filter((seat) => seat !== discarderSeat && seat >= 0 && seat < 4);
  if (!unique.length) return { winners: [], abortive: false };
  if ((options.tripleRonAbort ?? true) && unique.length >= 3) return { winners: [], abortive: true, reason: '삼가화' };
  const ordered = unique.sort((a, b) => ronPriority(a, discarderSeat) - ronPriority(b, discarderSeat));
  return { winners: options.headBump ? [ordered[0]] : ordered, abortive: false };
}

/**
 * 더블 론 정산. 각 승자는 방총자에게서 자기 점수를 받고,
 * 리치봉과 혼바는 우선순위가 가장 높은(가장 가까운) 승자가 가져갑니다.
 */
export function settleMultipleRon(state: RiichiMatchState, args: { winners: { seat: number; score: RiichiScoreResult }[]; discarderSeat: number }) {
  if (!args.winners.length) throw new Error('론 승자가 없습니다');
  const ordered = [...args.winners].sort((a, b) => ronPriority(a.seat, args.discarderSeat) - ronPriority(b.seat, args.discarderSeat));
  const next: RiichiMatchState = { ...state, scores: [...state.scores] as RiichiMatchState['scores'] };
  ordered.forEach((winner, index) => {
    const honba = index === 0 ? state.honba * 300 : 0;
    const amount = winner.score.total + honba;
    next.scores[args.discarderSeat] -= amount;
    next.scores[winner.seat] += amount;
  });
  next.scores[ordered[0].seat] += state.riichiSticks * 1000;
  next.riichiSticks = 0;
  return advanceRiichiMatch(next, { winner: ordered[0].seat });
}

// ── 특수 유국과 도중유국 ────────────────────────────────────────────
export type AbortiveDraw = { kind: 'kyuushukyuuhai' | 'suufonRenda' | 'suuchaRiichi' | 'sanchaHou' | 'suukaikan'; label: string; detail: string };

const isOrphanTile = (tile: MahjongTile) => tile.suit === 'z' || tile.value === 1 || tile.value === 9;

/** 구종구패: 첫 순번에 1·9·자패가 아홉 종류 이상이면 유국을 선언할 수 있습니다. */
export function countNineTerminals(hand: MahjongTile[]) {
  return new Set(hand.filter(isOrphanTile).map((tile) => `${tile.suit}${tile.value}`)).size;
}
export function canDeclareNineTerminals(hand: MahjongTile[], firstTurn: boolean, anyCallMade: boolean) {
  return firstTurn && !anyCallMade && countNineTerminals(hand) >= 9;
}

/** 사풍연타: 첫 순번에 네 명이 같은 바람패를 버리면 유국 */
export function isFourWindDiscardAbort(rivers: MahjongTile[][], anyCallMade: boolean) {
  if (anyCallMade || rivers.length !== 4) return false;
  if (!rivers.every((river) => river.length === 1)) return false;
  const first = rivers[0][0];
  return first.suit === 'z' && first.value <= 4 && rivers.every((river) => river[0].suit === 'z' && river[0].value === first.value);
}

/** 사가리치: 네 명이 모두 리치하고 네 번째 리치 선언패가 통과하면 유국 */
export function isFourRiichiAbort(riichiFlags: boolean[]) {
  return riichiFlags.length === 4 && riichiFlags.every(Boolean);
}

/** 사개깡: 두 명 이상이 나눠서 깡을 네 번 하면 유국 (한 명이 네 번이면 사깡쯔라 계속) */
export function isFourKanAbort(kanOwners: number[]) {
  return kanOwners.length >= 4 && new Set(kanOwners).size >= 2;
}

/** 유국만관: 버린 패가 모두 1·9·자패이고 한 번도 울리지 않았으면 만관 취급 */
export function isNagashiMangan(river: MahjongTile[], anyoneClaimedMyDiscard: boolean) {
  return river.length > 0 && !anyoneClaimedMyDiscard && river.every(isOrphanTile);
}

export function detectAbortiveDraw(args: { rivers?: MahjongTile[][]; riichiFlags?: boolean[]; kanOwners?: number[]; anyCallMade?: boolean; ronClaims?: number[]; discarderSeat?: number }): AbortiveDraw | null {
  const anyCallMade = args.anyCallMade ?? false;
  if (args.ronClaims && args.discarderSeat !== undefined && resolveMultipleRon(args.ronClaims, args.discarderSeat).abortive)
    return { kind: 'sanchaHou', label: '삼가화', detail: '세 명이 같은 패로 동시에 론을 선언해 유국' };
  if (args.kanOwners && isFourKanAbort(args.kanOwners))
    return { kind: 'suukaikan', label: '사개깡', detail: '두 명 이상이 나눠서 깡을 네 번 해 유국' };
  if (args.riichiFlags && isFourRiichiAbort(args.riichiFlags))
    return { kind: 'suuchaRiichi', label: '사가리치', detail: '네 명이 모두 리치를 선언해 유국' };
  if (args.rivers && isFourWindDiscardAbort(args.rivers, anyCallMade))
    return { kind: 'suufonRenda', label: '사풍연타', detail: '첫 순번에 네 명이 같은 바람패를 버려 유국' };
  return null;
}

/** 유국만관 지불. 친이면 4,000 올, 자면 2,000/4,000 */
export function nagashiManganPayments(winnerSeat: number, dealerSeat: number): number[] {
  const payments = [0, 0, 0, 0];
  const dealerWins = winnerSeat === dealerSeat;
  [0, 1, 2, 3].filter((seat) => seat !== winnerSeat).forEach((seat) => {
    const amount = dealerWins ? 4000 : seat === dealerSeat ? 4000 : 2000;
    payments[seat] = -amount;
    payments[winnerSeat] += amount;
  });
  return payments;
}

// ── 적도라(赤ドラ)와 룰 옵션 ────────────────────────────────────────

/** 적도라: 각 종류의 5 한 장씩을 빨간 패로 씁니다. 한 장당 1판. */
export const RED_FIVE_IDS = ['m5-0', 'p5-0', 's5-0'] as const;

export function isRedFive(tile: MahjongTile) {
  return (RED_FIVE_IDS as readonly string[]).includes(tile.id);
}

export function countRedFives(tiles: MahjongTile[]) {
  return tiles.filter(isRedFive).length;
}

/** 화면에 빨간 5를 따로 표시할 때 씁니다. */
export function redFiveLabel(tile: MahjongTile) {
  return isRedFive(tile) ? `${tile.glyph}(적)` : tile.glyph;
}

export type RiichiRuleOptions = {
  /** 적도라를 쓸지 */
  redFives: boolean;
  /** 쿠이탕: 울어도 탕야오를 인정할지 (아리아리) */
  openTanyao: boolean;
  /** 형식텐파이만으로 노텐 벌부를 면할 수 있는지 */
  formalTenpai: boolean;
  /** 들통(점수가 마이너스가 되면 즉시 종료) */
  bankruptcyEnds: boolean;
  /** 3만점을 넘긴 사람이 없으면 서장으로 연장할지 */
  westRoundExtension: boolean;
  /** 다중 론을 인정할지 (false면 두절만) */
  multipleRon: boolean;
};

export const DEFAULT_RIICHI_RULES: RiichiRuleOptions = {
  redFives: true,
  openTanyao: true,
  formalTenpai: true,
  bankruptcyEnds: true,
  westRoundExtension: true,
  multipleRon: true,
};

export const riichiRuleLabels: Record<keyof RiichiRuleOptions, { name: string; detail: string }> = {
  redFives: { name: '적도라', detail: '각 종류의 5 한 장이 빨간 패이며 한 장당 1판' },
  openTanyao: { name: '쿠이탕(아리아리)', detail: '울어도 탕야오를 인정' },
  formalTenpai: { name: '형식텐파이', detail: '역이 없어도 텐파이 모양이면 노텐 벌부 면제' },
  bankruptcyEnds: { name: '들통', detail: '점수가 마이너스가 되면 그 자리에서 종료' },
  westRoundExtension: { name: '서입', detail: '3만점을 넘긴 사람이 없으면 서장으로 연장' },
  multipleRon: { name: '다중 론', detail: '두 명 이상 동시 론을 모두 인정' },
};

/**
 * 인화(人和): 자가가 첫 순번에 아무도 울지 않은 상태에서 남의 패로 완성.
 * 지역마다 취급이 달라 기본은 만관으로 둡니다.
 */
export function isHumanWin(args: { firstTurn: boolean; anyCallMade: boolean; winType: 'tsumo' | 'ron'; seatWind: number }) {
  return args.firstTurn && !args.anyCallMade && args.winType === 'ron' && args.seatWind !== 1;
}
