import { dealMinhwatu, playMinhwatuTurn, chooseComputerMinhwatuCard, type MinhwaRound } from './minhwatu.ts';
import { type HwatuCard } from './hwatu.ts';

export type YukbaekYaku={name:string;points:number};
export type YukbaekScore={cardPoints:number;yakuPoints:number;total:number;yaku:YukbaekYaku[];instant:boolean};
export type YukbaekMatch={totals:[number,number];round:number;target:number;winner:number|null};

const has=(cards:HwatuCard[],month:number,kind?:HwatuCard['kind'])=>cards.some((card)=>card.month===month&&(!kind||card.kind===kind));

/** 육백 기본 점수: 광과 2월 매조 50, 나머지 열끗·띠 및 11월 쌍피 10, 일반 피 0. */
export function yukbaekCardValue(card:HwatuCard){
  if(card.kind==='광'||(card.month===2&&card.kind==='열끗'))return 50;
  if(card.kind==='열끗'||card.kind==='띠'||(card.month===11&&card.double))return 10;
  return 0;
}

export function scoreYukbaek(cards:HwatuCard[]):YukbaekScore{
  const yaku:YukbaekYaku[]=[];
  const add=(name:string,points:number)=>yaku.push({name,points});
  const ribbons=(kind:'홍단'|'청단'|'초단')=>cards.filter((card)=>card.ribbon===kind).length;
  if(ribbons('홍단')===3)add('소삼·홍단',150);
  if(has(cards,1,'광')&&has(cards,2,'열끗')&&has(cards,3,'광'))add('대삼',100);
  if(has(cards,3,'광')&&has(cards,9,'열끗'))add('꽃놀이술',100);
  if(has(cards,8,'광')&&has(cards,9,'열끗'))add('달맞이술',100);
  if(ribbons('청단')===3)add('청단',100);
  if(ribbons('초단')===3)add('초단',100);
  for(const month of [1,2,3,4,8,10,11])if(cards.filter((card)=>card.month===month).length===4)add(`${month}월 섬`,50);
  const dryBrights=[1,3,8,11].every((month)=>has(cards,month,'광'));
  const sevenRibbons=cards.filter((card)=>card.kind==='띠').length>=7;
  if(dryBrights)add('사광 즉시승리',600);
  if(sevenRibbons)add('칠단 즉시승리',600);
  const cardPoints=cards.reduce((sum,card)=>sum+yukbaekCardValue(card),0);
  const yakuPoints=yaku.reduce((sum,item)=>sum+item.points,0);
  return {cardPoints,yakuPoints,total:cardPoints+yakuPoints,yaku,instant:dryBrights||sevenRibbons};
}

export const createYukbaekRound=(random:()=>number=Math.random)=>dealMinhwatu(random);
export const playYukbaekTurn=(round:MinhwaRound,cardId:string,choices:{playedMatchId?:string;drawnMatchId?:string}={})=>playMinhwatuTurn(round,cardId,choices);
export const chooseComputerYukbaekCard=(round:MinhwaRound)=>{
  // 기본 민화투 판단을 쓰되 육백 고가치 패를 먹는 경우를 먼저 계산합니다.
  const hand=round.players[round.turn].hand;
  if(!hand.length)return chooseComputerMinhwatuCard(round);
  return [...hand].sort((a,b)=>{
    const worth=(card:HwatuCard)=>round.floor.filter((item)=>item.month===card.month).reduce((sum,item)=>sum+yukbaekCardValue(item),yukbaekCardValue(card));
    return worth(b)-worth(a)||a.month-b.month;
  })[0];
};

export const createYukbaekMatch=():YukbaekMatch=>({totals:[0,0],round:1,target:600,winner:null});

export function settleYukbaekRound(match:YukbaekMatch,round:MinhwaRound):{match:YukbaekMatch;scores:[YukbaekScore,YukbaekScore]}{
  const scores:[YukbaekScore,YukbaekScore]=[scoreYukbaek(round.players[0].captured),scoreYukbaek(round.players[1].captured)];
  const totals:[number,number]=[match.totals[0]+scores[0].total,match.totals[1]+scores[1].total];
  let winner:number|null=null;
  if(scores[0].instant&&!scores[1].instant)winner=0;else if(scores[1].instant&&!scores[0].instant)winner=1;
  else if(totals[0]>=match.target||totals[1]>=match.target)winner=totals[0]===totals[1]?null:totals[0]>totals[1]?0:1;
  return {match:{...match,totals,round:match.round+1,winner},scores};
}
