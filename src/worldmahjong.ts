import {
  canRonMahjong,
  chooseComputerCall,
  chooseComputerDiscard,
  createMahjongTiles,
  getMahjongWaits,
  getMahjongCallOptions,
  getStandardMahjongDecompositions,
  isSevenPairsHand,
  isThirteenOrphansHand,
  type MahjongGroup,
  type MahjongAiLevel,
  type MahjongTile,
} from './riichimahjong.ts';

export type WorldMahjongMode = 'chinese' | 'hongkong' | 'sichuan';
export type WorldMahjongPattern = { name:string; localName:string; points:number; detail:string };
export type HongKongFlowerTile={id:string;kind:'flower';value:number;glyph:string;name:string};
export type HongKongDeckTile=MahjongTile|HongKongFlowerTile;
export type HongKongOpening={hands:MahjongTile[][];flowers:HongKongFlowerTile[][];wall:HongKongDeckTile[]};
export type SichuanSuit='m'|'p'|'s';
export type SichuanExchangeDirection='left'|'right'|'across';
export type SichuanBloodBattleState={active:boolean[];winners:number[];scores:number[];finished:boolean};
export type SichuanKongTransfer={from:number;to:number;amount:number};
export type SichuanKongKind='ming'|'an'|'jia';
export type SichuanDrawSettlement={state:SichuanBloodBattleState;flowerPigs:number[];tenpai:number[];noten:number[];taxRefunds:number[]};
export type WorldMahjongEvaluation = {
  mode:WorldMahjongMode;
  unit:'점'|'번';
  minimum:number;
  total:number;
  qualifies:boolean;
  patterns:WorldMahjongPattern[];
};

const key=(tile:MahjongTile)=>`${tile.suit}${tile.value}`;
const allTiles=(concealed:MahjongTile[],openMelds:MahjongTile[][])=>[...concealed,...openMelds.flat()];
const groupsFor=(concealed:MahjongTile[],openMelds:MahjongTile[][])=>getStandardMahjongDecompositions(concealed,openMelds)[0]?.groups??[];
const hasPureStraight=(groups:MahjongGroup[])=>['m','p','s'].some((suit)=>[1,4,7].every((value)=>groups.some((group)=>group.kind==='sequence'&&group.suit===suit&&group.value===value)));
const hasMixedTripleSequence=(groups:MahjongGroup[])=>[1,2,3,4,5,6,7].some((value)=>['m','p','s'].every((suit)=>groups.some((group)=>group.kind==='sequence'&&group.suit===suit&&group.value===value)));
const permutations=<T,>(values:T[]):T[][]=>values.length<=1?[values]:values.flatMap((value,index)=>permutations(values.filter((_,candidate)=>candidate!==index)).map((rest)=>[value,...rest]));
const hasMixedStraight=(groups:MahjongGroup[])=>permutations(['m','p','s']).some(([first,middle,last])=>groups.some((group)=>group.kind==='sequence'&&group.suit===first&&group.value===1)&&groups.some((group)=>group.kind==='sequence'&&group.suit===middle&&group.value===4)&&groups.some((group)=>group.kind==='sequence'&&group.suit===last&&group.value===7));
const hasPureTripleSequence=(groups:MahjongGroup[])=>groups.some((candidate)=>candidate.kind==='sequence'&&groups.filter((group)=>group.kind==='sequence'&&group.suit===candidate.suit&&group.value===candidate.value).length>=3);
const hasPureQuadrupleSequence=(groups:MahjongGroup[])=>groups.some((candidate)=>candidate.kind==='sequence'&&groups.filter((group)=>group.kind==='sequence'&&group.suit===candidate.suit&&group.value===candidate.value).length>=4);
const hasPureShiftedTriplets=(groups:MahjongGroup[])=>['m','p','s'].some((suit)=>[1,2,3,4,5,6,7].some((value)=>[value,value+1,value+2].every((needed)=>groups.some((group)=>group.kind==='triplet'&&group.suit===suit&&group.value===needed))));
const hasFourPureShiftedTriplets=(groups:MahjongGroup[])=>['m','p','s'].some((suit)=>[1,2,3,4,5,6].some((value)=>[value,value+1,value+2,value+3].every((needed)=>groups.some((group)=>group.kind==='triplet'&&group.suit===suit&&group.value===needed))));
const hasMixedTripleTriplets=(groups:MahjongGroup[])=>[1,2,3,4,5,6,7,8,9].some((value)=>['m','p','s'].every((suit)=>groups.some((group)=>group.kind==='triplet'&&group.suit===suit&&group.value===value)));
const hasPureShiftedSequences=(groups:MahjongGroup[])=>['m','p','s'].some((suit)=>[1,2,3,4,5].some((start)=>[start,start+1,start+2].every((value)=>groups.some((group)=>group.kind==='sequence'&&group.suit===suit&&group.value===value))));
const hasMixedShiftedSequences=(groups:MahjongGroup[])=>permutations(['m','p','s']).some(([first,middle,last])=>[1,2,3,4,5].some((start)=>groups.some((group)=>group.kind==='sequence'&&group.suit===first&&group.value===start)&&groups.some((group)=>group.kind==='sequence'&&group.suit===middle&&group.value===start+1)&&groups.some((group)=>group.kind==='sequence'&&group.suit===last&&group.value===start+2)));
const hasTerminalOrHonorInEveryGroup=(groups:MahjongGroup[],pair:{suit:string;value:number})=>{
  const edge=(suit:string,value:number)=>suit==='z'||value===1||value===9;
  return edge(pair.suit,pair.value)&&groups.every((group)=>group.kind==='triplet'?edge(group.suit,group.value):group.value===1||group.value===7);
};

/**
 * 지역별 핵심 점수표. 전체 대회 규칙표의 모든 희귀 조합보다, 실제 플레이를
 * 막거나 허용하는 최소 점수와 초보자가 자주 만드는 조합부터 정확히 판정합니다.
 */
export function evaluateWorldMahjong(args:{
  mode:WorldMahjongMode;
  concealed:MahjongTile[];
  openMelds?:MahjongTile[][];
  winType:'tsumo'|'ron';
  seatWind?:number;
  roundWind?:number;
  flowers?:HongKongFlowerTile[];
  afterKan?:boolean;
}):WorldMahjongEvaluation{
  const open=args.openMelds??[];
  const tiles=allTiles(args.concealed,open);
  const groups=groupsFor(args.concealed,open);
  const decomposition=getStandardMahjongDecompositions(args.concealed,open)[0];
  const suits=new Set(tiles.filter((tile)=>tile.suit!=='z').map((tile)=>tile.suit));
  const honors=tiles.some((tile)=>tile.suit==='z');
  const terminals=tiles.some((tile)=>tile.suit!=='z'&&(tile.value===1||tile.value===9));
  const counts=new Map<string,number>();tiles.forEach((tile)=>counts.set(key(tile),(counts.get(key(tile))??0)+1));
  const triplet=(suit:string,value:number)=>groups.some((group)=>group.kind==='triplet'&&group.suit===suit&&group.value===value);
  const patterns:WorldMahjongPattern[]=[];
  const add=(name:string,localName:string,points:number,detail:string)=>patterns.push({name,localName,points,detail});

  if(args.mode==='chinese'){
    const dragonTriplets=[5,6,7].filter((value)=>triplet('z',value));
    const windTriplets=[1,2,3,4].filter((value)=>triplet('z',value));
    const dragonPair=decomposition?.pair.suit==='z'&&[5,6,7].includes(decomposition.pair.value);
    const windPair=decomposition?.pair.suit==='z'&&[1,2,3,4].includes(decomposition.pair.value);
    const allHonors=tiles.length>0&&tiles.every((tile)=>tile.suit==='z');
    const allTerminals=tiles.length>0&&tiles.every((tile)=>tile.suit!=='z'&&(tile.value===1||tile.value===9));
    const terminalHonors=tiles.length>0&&tiles.every((tile)=>tile.suit==='z'||tile.value===1||tile.value===9);
    const greenKeys=new Set(['s2','s3','s4','s6','s8','z6']);
    const allGreen=tiles.length>0&&tiles.every((tile)=>greenKeys.has(key(tile)));
    const nineGates=!open.length&&suits.size===1&&!honors&&(()=>{const suit=[...suits][0];const values=tiles.filter((tile)=>tile.suit===suit).map((tile)=>tile.value);return [1,1,1,2,3,4,5,6,7,8,9,9,9].every((value,index)=>values.filter((item)=>item===value).length>=(value===1||value===9?3:1));})();
    const sevenShiftedPairs=!open.length&&isSevenPairsHand(args.concealed)&&(()=>{const pairs=[...counts.entries()].filter(([,count])=>count===2).map(([code])=>({suit:code[0],value:Number(code.slice(1))})).sort((a,b)=>a.value-b.value);return pairs.length===7&&pairs.every((pair,index)=>pair.suit===pairs[0].suit&&pair.value===pairs[0].value+index);})();
    const fourKongs=open.filter((meld)=>meld.length===4).length===4;
    const allSmall=tiles.length>0&&tiles.every((tile)=>tile.suit!=='z'&&tile.value<=3);
    const allMiddle=tiles.length>0&&tiles.every((tile)=>tile.suit!=='z'&&tile.value>=4&&tile.value<=6);
    const allLarge=tiles.length>0&&tiles.every((tile)=>tile.suit!=='z'&&tile.value>=7);
    const allFives=Boolean(decomposition&&decomposition.pair.suit!=='z'&&decomposition.pair.value===5&&groups.every((group)=>group.suit!=='z'&&(group.kind==='triplet'?group.value===5:group.value===3||group.value===4||group.value===5)));
    const concealedTriplets=!open.length?groups.filter((group)=>group.kind==='triplet').length:0;
    const quadrupleChow=hasPureQuadrupleSequence(groups)||['m','p','s'].some((suit)=>[1,2,3,4,5,6,7].some((start)=>[start,start+1,start+2].every((value)=>(counts.get(`${suit}${value}`)??0)>=4)));
    const fourShiftedTriplets=hasFourPureShiftedTriplets(groups)||['m','p','s'].some((suit)=>[1,2,3,4,5,6].some((start)=>[start,start+1,start+2,start+3].every((value)=>(counts.get(`${suit}${value}`)??0)>=3)));
    if(isThirteenOrphansHand(args.concealed)&&!open.length)add('십삼요','十三幺',88,'1·9와 자패 13종에 같은 패 한 장을 더함');
    if(sevenShiftedPairs)add('연칠대','连七对',88,'한 무늬에서 숫자가 연속되는 일곱 쌍');
    if(nineGates)add('구련보등','九莲宝灯',88,'한 무늬 1112345678999에 같은 무늬 한 장');
    if(allGreen)add('녹일색','绿一色',88,'삭수 2·3·4·6·8과 발만 사용');
    if(fourKongs)add('사깡','四杠',88,'네 몸통이 모두 깡');
    if(allHonors)add('자일색','字一色',64,'바람패와 삼원패로만 완성');
    if(allTerminals)add('청요구','清幺九',64,'1과 9 숫자패로만 완성');
    if(!open.length&&groups.length===4&&groups.every((group)=>group.kind==='triplet'))add('사암각','四暗刻',64,'울지 않은 같은 패 몸통 네 개');
    if(quadrupleChow)add('일색사동순','一色四同顺',48,'같은 무늬의 같은 연속 몸통 네 개');
    if(fourShiftedTriplets)add('일색사절고','一色四节高',48,'같은 무늬에서 하나씩 커지는 몸통 네 개');
    if(terminalHonors&&!allHonors&&!allTerminals)add('혼요구','混幺九',32,'1·9와 자패만 사용');
    if(allSmall)add('전소','全小',24,'모든 숫자패가 1·2·3');
    if(allMiddle)add('전중','全中',24,'모든 숫자패가 4·5·6');
    if(allLarge)add('전대','全大',24,'모든 숫자패가 7·8·9');
    if(allFives)add('전대오','全带五',16,'모든 몸통과 머리에 5가 포함');
    if(windTriplets.length===4)add('대사희','大四喜',88,'동·남·서·북을 모두 세 장씩');
    else if(windTriplets.length===3&&windPair)add('소사희','小四喜',64,'바람패 몸통 세 개와 바람패 머리');
    else if(windTriplets.length===3)add('삼풍각','三风刻',12,'바람패 몸통 세 개');
    if(dragonTriplets.length===3)add('대삼원','大三元',88,'백·발·중을 모두 세 장씩');
    else if(dragonTriplets.length===2&&dragonPair)add('소삼원','小三元',64,'삼원패 몸통 두 개와 삼원패 머리');
    if(isSevenPairsHand(args.concealed)&&!open.length)add('칠대자','七对',24,'서로 다른 일곱 쌍');
    if(suits.size===1&&!honors&&!nineGates&&!allTerminals&&!sevenShiftedPairs)add('청일색','清一色',24,'한 가지 숫자 무늬만 사용');
    else if(suits.size===1&&honors)add('혼일색','混一色',6,'한 가지 숫자 무늬와 자패만 사용');
    if(groups.length&&groups.every((group)=>group.kind==='triplet')&&!allHonors&&!allTerminals&&!fourKongs&&!fourShiftedTriplets)add('또이또이','碰碰和',6,'네 몸통이 모두 같은 패 세 장');
    if(hasPureStraight(groups))add('일기통관','清龙',16,'같은 무늬의 123·456·789');
    if(hasMixedTripleSequence(groups))add('삼색동순','三色三同顺',8,'세 무늬에 같은 숫자 순서');
    if(hasMixedStraight(groups))add('화룡','花龙',8,'세 무늬로 123·456·789를 하나씩 구성');
    if(!quadrupleChow&&hasPureTripleSequence(groups))add('일색삼동순','一色三同顺',24,'같은 무늬의 같은 연속 몸통 세 개');
    if(!fourShiftedTriplets&&hasPureShiftedTriplets(groups))add('일색삼절고','一色三节高',24,'같은 무늬에서 숫자가 하나씩 커지는 세 몸통');
    if(hasPureShiftedSequences(groups))add('일색삼보고','一色三步高',16,'한 무늬에서 시작 숫자가 하나씩 커지는 연속 몸통 세 개');
    if(hasMixedShiftedSequences(groups))add('삼색삼보고','三色三步高',6,'세 무늬에서 시작 숫자가 하나씩 커지는 연속 몸통 세 개');
    if(hasMixedTripleTriplets(groups))add('삼색동각','三同刻',16,'세 무늬의 같은 숫자 몸통');
    if(concealedTriplets===3)add('삼암각','三暗刻',16,'울지 않은 같은 패 몸통 세 개');
    if(suits.size===3&&honors&&tiles.some((tile)=>tile.suit==='z'&&tile.value<=4)&&tiles.some((tile)=>tile.suit==='z'&&tile.value>=5))add('오문제','五门齐',6,'세 숫자 무늬와 바람패·삼원패를 모두 사용');
    if(decomposition&&hasTerminalOrHonorInEveryGroup(groups,decomposition.pair))add('혼전대요','混全带幺',4,'모든 몸통과 머리에 1·9·자패 포함');
    if(!honors&&!terminals)add('탕야오','断幺',2,'2~8 숫자패만 사용');
    if(dragonTriplets.length<2)dragonTriplets.forEach((value)=>add(['백','발','중'][value-5],['白板刻','发财刻','红中刻'][value-5],2,'삼원패 세 장'));
    if(windTriplets.length<3&&args.seatWind&&triplet('z',args.seatWind))add('자풍패','门风刻',2,'내 자리 바람 세 장');
    if(windTriplets.length<3&&args.roundWind&&triplet('z',args.roundWind))add('장풍패','圈风刻',2,'현재 판의 바람 세 장');
    if(!open.length&&args.winType==='tsumo')add('불구인','不求人',4,'울지 않고 스스로 뽑아 완성');
    else if(!open.length)add('문전청','门前清',2,'치·퐁·명깡 없이 론');
    else if(args.winType==='tsumo')add('자모','自摸',1,'내가 뽑은 패로 완성');
    if(patterns.length===0)add('무번화','无番和',8,'다른 점수 요소가 전혀 없는 특수 완성');
    return {mode:args.mode,unit:'점',minimum:8,total:patterns.reduce((sum,item)=>sum+item.points,0),qualifies:patterns.reduce((sum,item)=>sum+item.points,0)>=8,patterns};
  }

  if(args.mode==='hongkong'){
    const flowers=args.flowers??[];
    const matchingFlowers=flowers.filter((flower)=>((flower.value-1)%4)+1===(args.seatWind??1));
    const dragonTriplets=[5,6,7].filter((value)=>triplet('z',value));
    const windTriplets=[1,2,3,4].filter((value)=>triplet('z',value));
    const dragonPair=decomposition?.pair.suit==='z'&&[5,6,7].includes(decomposition.pair.value);
    const windPair=decomposition?.pair.suit==='z'&&[1,2,3,4].includes(decomposition.pair.value);
    const allHonors=tiles.length>0&&tiles.every((tile)=>tile.suit==='z');
    const allTerminals=tiles.length>0&&tiles.every((tile)=>tile.suit!=='z'&&(tile.value===1||tile.value===9));
    const terminalHonors=tiles.length>0&&tiles.every((tile)=>tile.suit==='z'||tile.value===1||tile.value===9);
    const greenKeys=new Set(['s2','s3','s4','s6','s8','z6']);
    const allGreen=tiles.length>0&&tiles.every((tile)=>greenKeys.has(key(tile)));
    const fourKongs=open.filter((meld)=>meld.length===4).length===4;
    const nineGates=!open.length&&suits.size===1&&!honors&&(()=>{const suit=[...suits][0];const values=tiles.filter((tile)=>tile.suit===suit).map((tile)=>tile.value);return [1,1,1,2,3,4,5,6,7,8,9,9,9].every((value)=>values.filter((item)=>item===value).length>=(value===1||value===9?3:1));})();
    if(isThirteenOrphansHand(args.concealed)&&!open.length)add('십삼요','十三幺',13,'1·9와 자패 13종에 같은 패 한 장을 더함');
    if(nineGates)add('구자련환','九子連環',13,'한 무늬 1112345678999에 같은 무늬 한 장');
    if(allGreen)add('녹일색','綠一色',13,'삭수 2·3·4·6·8과 발만 사용');
    if(fourKongs)add('십팔나한','十八羅漢',13,'네 몸통을 모두 깡으로 완성');
    if(windTriplets.length===4)add('대사희','大四喜',13,'동·남·서·북 몸통 네 개');
    else if(windTriplets.length===3&&windPair)add('소사희','小四喜',13,'바람패 몸통 세 개와 바람패 머리');
    if(dragonTriplets.length===3)add('대삼원','大三元',8,'백·발·중 몸통 세 개');
    else if(dragonTriplets.length===2&&dragonPair)add('소삼원','小三元',5,'삼원패 몸통 두 개와 삼원패 머리');
    if(allHonors)add('자일색','字一色',13,'바람패와 삼원패로만 완성');
    if(allTerminals)add('청노두','清幺九',13,'1과 9 숫자패로만 완성');
    if(terminalHonors&&!allHonors&&!allTerminals)add('혼노두','混幺九',7,'1·9와 자패만 사용');
    if(isSevenPairsHand(args.concealed)&&!open.length)add('칠대자','七對子',7,'서로 다른 일곱 쌍');
    if(suits.size===1&&!honors&&!allTerminals&&!nineGates)add('청일색','清一色',7,'한 가지 숫자 무늬만 사용');
    else if(suits.size===1&&honors)add('혼일색','混一色',3,'한 가지 숫자 무늬와 자패만 사용');
    if(groups.length&&groups.every((group)=>group.kind==='triplet'))add('대대호','對對胡',3,'네 몸통이 모두 같은 패 세 장');
    if(hasPureStraight(groups))add('일기통관','一條龍',3,'같은 무늬의 123·456·789');
    if(dragonTriplets.length<2)dragonTriplets.forEach((value)=>add(['백','발','중'][value-5],['白板','發財','紅中'][value-5],1,'삼원패 세 장'));
    if(windTriplets.length<3&&args.seatWind&&triplet('z',args.seatWind))add('자풍','門風',1,'내 자리 바람 세 장');
    if(windTriplets.length<3&&args.roundWind&&triplet('z',args.roundWind))add('장풍','圈風',1,'현재 판의 바람 세 장');
    if(args.afterKan)add('영상개화','嶺上開花',1,'깡 뒤 보충패로 완성');
    if(args.winType==='tsumo')add('자모','自摸',1,'내가 뽑은 패로 완성');
    if(flowers.length===0)add('무화','無花',1,'꽃패를 한 장도 가지지 않음');
    else if(flowers.length===8)add('팔선과해','八仙過海',8,'꽃패 여덟 장을 모두 모음');
    else{
      const values=new Set(flowers.map((flower)=>flower.value));
      if([1,2,3,4].every((value)=>values.has(value)))add('사군자','四君子',2,'매화·난초·국화·대나무 네 장');
      if([5,6,7,8].every((value)=>values.has(value)))add('사계절','四季',2,'봄·여름·가을·겨울 네 장');
      matchingFlowers.forEach((flower)=>add(flower.name,flower.glyph,1,`자리와 일치하는 꽃패 ${flower.glyph}`));
    }
    const total=patterns.reduce((sum,item)=>sum+item.points,0);
    return {mode:args.mode,unit:'번',minimum:3,total,qualifies:total>=3,patterns};
  }

  if(isSevenPairsHand(args.concealed)&&!open.length)add('칠대','七对',2,'서로 다른 일곱 쌍');
  if(suits.size===1)add('청일색','清一色',4,'한 가지 숫자 무늬만 사용');
  if(groups.length&&groups.every((group)=>group.kind==='triplet'))add('대대호','对对胡',2,'네 몸통이 모두 같은 패 세 장');
  if(!open.length)add('문전청','门清',1,'다른 사람의 패를 가져오지 않음');
  if(args.winType==='tsumo')add('자모','自摸',1,'내가 뽑은 패로 완성');
  const total=patterns.reduce((sum,item)=>sum+item.points,0);
  return {mode:args.mode,unit:'번',minimum:1,total,qualifies:total>=1,patterns};
}

export function worldMahjongScoreLabel(result:WorldMahjongEvaluation){
  return `${result.total}${result.unit} · ${result.patterns.map((item)=>`${item.name}(${item.localName}) ${item.points}${result.unit}`).join(' · ')||'점수 패턴 없음'}`;
}

/** 구조적 완성뿐 아니라 지역별 최소 점수까지 통과해야 론할 수 있습니다. */
export function canWorldMahjongRon(args:{mode:WorldMahjongMode;hand:MahjongTile[];discarded:MahjongTile;openMelds?:MahjongTile[][];seatWind?:number;roundWind?:number;flowers?:HongKongFlowerTile[]}){
  const open=args.openMelds??[];
  if(!canRonMahjong(args.hand,args.discarded,open.length))return false;
  return evaluateWorldMahjong({mode:args.mode,concealed:[...args.hand,args.discarded],openMelds:open,winType:'ron',seatWind:args.seatWind,roundWind:args.roundWind,flowers:args.flowers}).qualifies;
}

/** 보통·전문가는 각 버림 뒤의 연결·쌍·대기패와 남은 유효패 수를 비교합니다. */
export function chooseWorldMahjongDiscard(hand:MahjongTile[],options:{mode:WorldMahjongMode;level?:MahjongAiLevel;openMeldCount?:number;visibleTiles?:MahjongTile[];random?:()=>number}){
  const level=options.level??'normal',random=options.random??Math.random;
  if(level==='beginner'||level==='easy')return chooseComputerDiscard(hand,{level,openMeldCount:options.openMeldCount,includeHonors:options.mode!=='sichuan',visibleTiles:options.visibleTiles,random});
  const visible=options.visibleTiles??hand,openMeldCount=options.openMeldCount??0;
  const visibleCounts=new Map<string,number>();visible.forEach((tile)=>visibleCounts.set(key(tile),(visibleCounts.get(key(tile))??0)+1));
  const candidates=hand.map((tile)=>{
    const after=hand.filter((candidate)=>candidate.id!==tile.id),counts=new Map<string,number>(),suits=new Map<string,number>();
    after.forEach((candidate)=>{counts.set(key(candidate),(counts.get(key(candidate))??0)+1);suits.set(candidate.suit,(suits.get(candidate.suit)??0)+1);});
    let potential=0;
    for(const candidate of after){
      const copies=counts.get(key(candidate))??0;
      if(copies>=2)potential+=copies===2?16:28;
      if(candidate.suit==='z'){potential+=copies>=2?10:-8;continue;}
      const sameSuit=after.filter((other)=>other.id!==candidate.id&&other.suit===candidate.suit);
      if(sameSuit.some((other)=>Math.abs(other.value-candidate.value)===1))potential+=12;
      if(sameSuit.some((other)=>Math.abs(other.value-candidate.value)===2))potential+=5;
      if(candidate.value>=3&&candidate.value<=7)potential+=2;
    }
    const dominant=Math.max(suits.get('m')??0,suits.get('p')??0,suits.get('s')??0);
    if(options.mode!=='sichuan'&&dominant>=8)potential+=(dominant-7)*(level==='expert'?18:9);
    const waits=getMahjongWaits(after,openMeldCount);
    const liveWaits=waits.reduce((sum,wait)=>sum+Math.max(0,4-(visibleCounts.get(key(wait))??0)),0);
    if(waits.length)potential+=600+waits.length*45+liveWaits*(level==='expert'?24:10);
    return {tile,potential,tie:random()};
  });
  candidates.sort((a,b)=>b.potential-a.potential||a.tie-b.tie);
  return candidates[0].tile;
}

/** 지역 규칙의 점수 가능성을 반영한 치·퐁·깡 선택입니다. */
export function chooseWorldMahjongCall(hand:MahjongTile[],discarded:MahjongTile,canChi:boolean,options:{mode:WorldMahjongMode;level?:MahjongAiLevel;openMeldCount?:number}={mode:'chinese'}){
  const level=options.level??'normal';
  if(level==='beginner')return null;
  const includeHonors=options.mode!=='sichuan';
  const ordinary=chooseComputerCall(hand,discarded,canChi,{level,openMeldCount:options.openMeldCount,includeHonors});
  if(level!=='expert')return ordinary;
  const calls=getMahjongCallOptions(hand,discarded,canChi);
  if(!calls.length)return null;
  const suitCount=hand.filter((tile)=>tile.suit===discarded.suit).length;
  const valuableHonor=discarded.suit==='z'&&(discarded.value>=5||discarded.value===1);
  const tripletCall=calls.find((call)=>call.kind==='kan')??calls.find((call)=>call.kind==='pon');
  if(valuableHonor&&tripletCall)return tripletCall;
  if(discarded.suit!=='z'&&suitCount>=7)return tripletCall??calls.find((call)=>call.kind==='chi')??ordinary;
  return ordinary;
}

const flowerNames=['매화(梅)','난초(蘭)','국화(菊)','대나무(竹)','봄(春)','여름(夏)','가을(秋)','겨울(冬)'];
const flowerGlyphs=['🀢','🀣','🀥','🀤','🀦','🀧','🀨','🀩'];

export function createHongKongMahjongTiles():HongKongDeckTile[]{
  return [...createMahjongTiles(),...flowerNames.map((name,index)=>({id:`f${index+1}`,kind:'flower' as const,value:index+1,glyph:flowerGlyphs[index],name}))];
}

export function isHongKongFlower(tile:HongKongDeckTile):tile is HongKongFlowerTile{return 'kind' in tile&&tile.kind==='flower';}

/** 꽃패는 손패에 남지 않고 즉시 공개한 뒤 벽 뒤쪽에서 보충합니다. */
export function drawHongKongNormalTile(hand:MahjongTile[],flowers:HongKongFlowerTile[],wall:HongKongDeckTile[]){
  const nextHand=[...hand],nextFlowers=[...flowers],nextWall=[...wall];
  while(nextWall.length){
    const drawn=nextWall.shift()!;
    if(isHongKongFlower(drawn)){nextFlowers.push(drawn);continue;}
    nextHand.push(drawn);
    return {hand:nextHand,flowers:nextFlowers,wall:nextWall,drawn};
  }
  return {hand:nextHand,flowers:nextFlowers,wall:nextWall,drawn:null};
}

export function dealHongKongOpening(random:()=>number=Math.random):HongKongOpening{
  const wall=createHongKongMahjongTiles();
  for(let index=wall.length-1;index>0;index--){const target=Math.floor(random()*(index+1));[wall[index],wall[target]]=[wall[target],wall[index]];}
  const hands:MahjongTile[][]=[[],[],[],[]],flowers:HongKongFlowerTile[][]=[[],[],[],[]];
  for(let count=0;count<13;count++)for(let seat=0;seat<4;seat++){
    const draw=drawHongKongNormalTile(hands[seat],flowers[seat],wall);
    hands[seat]=draw.hand;flowers[seat]=draw.flowers;wall.splice(0,wall.length,...draw.wall);
  }
  return {hands,flowers,wall};
}

export function isValidSichuanExchange(tiles:MahjongTile[]){return tiles.length===3&&tiles.every((tile)=>tile.suit!=='z'&&tile.suit===tiles[0].suit);}

/** 컴퓨터는 가장 적게 가진 무늬에서 연결이 약한 패 세 장을 환삼장으로 냅니다. */
export function chooseSichuanExchange(hand:MahjongTile[]):MahjongTile[]{
  const suits=(['m','p','s'] as SichuanSuit[]).map((suit)=>({suit,tiles:hand.filter((tile)=>tile.suit===suit)})).filter((entry)=>entry.tiles.length>=3).sort((a,b)=>a.tiles.length-b.tiles.length);
  const selected=suits[0]?.tiles??[];
  return [...selected].sort((a,b)=>{const support=(tile:MahjongTile)=>selected.filter((other)=>other.id!==tile.id&&Math.abs(other.value-tile.value)<=2).length;return support(a)-support(b)||a.value-b.value;}).slice(0,3);
}

export function exchangeSichuanTiles(hands:MahjongTile[][],selections:MahjongTile[][],direction:SichuanExchangeDirection){
  if(hands.length!==4||selections.length!==4||!selections.every(isValidSichuanExchange))throw new Error('환삼장은 네 명이 같은 무늬 패 세 장씩 선택해야 합니다');
  const sourceFor=(receiver:number)=>direction==='left'?(receiver+3)%4:direction==='right'?(receiver+1)%4:(receiver+2)%4;
  return hands.map((hand,receiver)=>{
    const selectedIds=new Set(selections[receiver].map((tile)=>tile.id));
    return sortByMahjong([...hand.filter((tile)=>!selectedIds.has(tile.id)),...selections[sourceFor(receiver)]]);
  });
}

const worldSuitOrder={m:0,p:1,s:2,z:3};
const sortByMahjong=(hand:MahjongTile[])=>[...hand].sort((a,b)=>worldSuitOrder[a.suit]-worldSuitOrder[b.suit]||a.value-b.value||a.id.localeCompare(b.id));

/** 정결은 환삼장 뒤 가장 적게 남은 무늬를 고르는 기본 컴퓨터 전략입니다. */
export function chooseSichuanMissingSuit(hand:MahjongTile[]):SichuanSuit{return (['m','p','s'] as SichuanSuit[]).map((suit)=>({suit,count:hand.filter((tile)=>tile.suit===suit).length})).sort((a,b)=>a.count-b.count)[0].suit;}
export function canDiscardSichuan(hand:MahjongTile[],tile:MahjongTile,missingSuit:SichuanSuit){return !hand.some((candidate)=>candidate.suit===missingSuit)||tile.suit===missingSuit;}
export function canWinSichuan(hand:MahjongTile[],missingSuit:SichuanSuit){return !hand.some((tile)=>tile.suit===missingSuit);}

/** 사천식 컴퓨터는 정결을 끝낸 뒤에만 퐁·명깡을 검토하며 치는 사용하지 않습니다. */
export function chooseSichuanComputerCall(hand:MahjongTile[],discarded:MahjongTile,args:{missingSuit:SichuanSuit;level?:MahjongAiLevel;openMeldCount?:number}){
  if(hand.some((tile)=>tile.suit===args.missingSuit)||discarded.suit===args.missingSuit)return null;
  const call=chooseWorldMahjongCall(hand,discarded,false,{mode:'sichuan',level:args.level,openMeldCount:args.openMeldCount});
  return call?.kind==='pon'||call?.kind==='kan'?call:null;
}

export function createSichuanBloodBattleState():SichuanBloodBattleState{return {active:[true,true,true,true],winners:[],scores:[0,0,0,0],finished:false};}

/**
 * 사천 혈전의 깡 점수를 즉시 이동합니다.
 * 이 앱의 기본 탁 규칙은 직공 명깡 2배, 암깡 전원 2배, 가깡 전원 1배입니다.
 * 반환되는 transfers는 유국 때 퇴세(깡 점수 환급)를 계산할 때 그대로 사용합니다.
 */
export function settleSichuanKong(state:SichuanBloodBattleState,args:{declarer:number;kind:SichuanKongKind;discarder?:number;base?:number}):{state:SichuanBloodBattleState;transfers:SichuanKongTransfer[]}{
  if(!state.active[args.declarer])throw new Error('경기 중인 사람만 깡을 선언할 수 있습니다');
  const unit=args.base??1;
  if(!Number.isFinite(unit)||unit<=0)throw new Error('깡 기본 점수는 0보다 커야 합니다');
  if(args.kind==='ming'&&(args.discarder===undefined||args.discarder===args.declarer||!state.active[args.discarder]))throw new Error('명깡에는 경기 중인 방총자가 필요합니다');
  const payers=args.kind==='ming'?[args.discarder!]:state.active.map((active,seat)=>active&&seat!==args.declarer?seat:-1).filter((seat)=>seat>=0);
  const multiplier=args.kind==='jia'?1:2;
  const transfers=payers.map((from)=>({from,to:args.declarer,amount:unit*multiplier}));
  const next:SichuanBloodBattleState={active:[...state.active],winners:[...state.winners],scores:[...state.scores],finished:state.finished};
  transfers.forEach(({from,to,amount})=>{next.scores[from]-=amount;next.scores[to]+=amount;});
  return {state:next,transfers};
}
export function settleSichuanBloodBattle(state:SichuanBloodBattleState,args:{winner:number;method:'tsumo'|'ron';loser?:number;base:number}){
  if(!state.active[args.winner])throw new Error('이미 화료한 사람은 다시 화료할 수 없습니다');
  if(args.method==='ron'&&(args.loser===undefined||!state.active[args.loser]||args.loser===args.winner))throw new Error('론에는 경기 중인 방총자가 필요합니다');
  const next:SichuanBloodBattleState={active:[...state.active],winners:[...state.winners,args.winner],scores:[...state.scores],finished:false};
  if(args.method==='ron'){next.scores[args.winner]+=args.base;next.scores[args.loser!]-=args.base;}
  else state.active.forEach((active,seat)=>{if(active&&seat!==args.winner){next.scores[seat]-=args.base;next.scores[args.winner]+=args.base;}});
  next.active[args.winner]=false;next.finished=next.active.filter(Boolean).length<=1;return next;
}

/** 한 사람이 버린 패에 여러 명이 동시에 론하는 일포다향 정산입니다. */
export function settleSichuanMultipleRon(state:SichuanBloodBattleState,args:{loser:number;winners:{seat:number;base:number}[]}){
  if(!state.active[args.loser])throw new Error('방총자는 아직 경기 중이어야 합니다');
  const unique=new Set(args.winners.map((winner)=>winner.seat));
  if(unique.size!==args.winners.length||args.winners.some((winner)=>winner.seat===args.loser||!state.active[winner.seat]))throw new Error('론 승자는 서로 다른 경기 참가자여야 합니다');
  const next:SichuanBloodBattleState={active:[...state.active],winners:[...state.winners],scores:[...state.scores],finished:false};
  args.winners.forEach(({seat,base})=>{next.scores[seat]+=base;next.scores[args.loser]-=base;next.active[seat]=false;next.winners.push(seat);});
  next.finished=next.active.filter(Boolean).length<=1;
  return next;
}

/** 패산이 끝났을 때 차화저 → 차대교 → 퇴세 순서로 정산합니다. */
export function settleSichuanDraw(state:SichuanBloodBattleState,args:{hands:MahjongTile[][];missingSuits:(SichuanSuit|null)[];openMelds?:MahjongTile[][][];kongTransfers?:SichuanKongTransfer[];flowerPigPenalty?:number}):SichuanDrawSettlement{
  if(args.hands.length!==4||args.missingSuits.length!==4)throw new Error('네 명의 손패와 정결 무늬가 필요합니다');
  const next:SichuanBloodBattleState={active:[...state.active],winners:[...state.winners],scores:[...state.scores],finished:true};
  const remaining=[0,1,2,3].filter((seat)=>state.active[seat]);
  const flowerPigs=remaining.filter((seat)=>Boolean(args.missingSuits[seat]&&args.hands[seat].some((tile)=>tile.suit===args.missingSuits[seat])));
  const eligible=remaining.filter((seat)=>!flowerPigs.includes(seat));
  const waits=new Map<number,MahjongTile[]>();eligible.forEach((seat)=>waits.set(seat,getMahjongWaits(args.hands[seat],args.openMelds?.[seat]?.length??0,false)));
  const tenpai=eligible.filter((seat)=>(waits.get(seat)?.length??0)>0);
  const noten=eligible.filter((seat)=>!tenpai.includes(seat));
  const pigPenalty=args.flowerPigPenalty??16;
  flowerPigs.forEach((pig)=>eligible.forEach((receiver)=>{next.scores[pig]-=pigPenalty;next.scores[receiver]+=pigPenalty;}));
  noten.forEach((payer)=>tenpai.forEach((receiver)=>{
    const maximum=Math.max(1,...(waits.get(receiver)??[]).map((tile)=>{
      const result=evaluateWorldMahjong({mode:'sichuan',concealed:[...args.hands[receiver],tile],openMelds:args.openMelds?.[receiver]??[],winType:'ron'});
      return result.qualifies?2**result.total:1;
    }));
    next.scores[payer]-=maximum;next.scores[receiver]+=maximum;
  }));
  const taxRefunds=[0,0,0,0];
  (args.kongTransfers??[]).forEach((transfer)=>{
    if(!noten.includes(transfer.to)&&!flowerPigs.includes(transfer.to))return;
    next.scores[transfer.to]-=transfer.amount;next.scores[transfer.from]+=transfer.amount;taxRefunds[transfer.to]+=transfer.amount;
  });
  return {state:next,flowerPigs,tenpai,noten,taxRefunds};
}
