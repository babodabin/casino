export type MahjongGameName='리치 마작'|'중국식 마작'|'홍콩 마작'|'사천 마작';
export type MahjongSettlementResult='win'|'loss'|'push';

export type MahjongCoinSettlement={score:number;multiplier:number;payout:number;net:number};

export function mahjongScoreFromDetail(game:MahjongGameName,detail:string){
  const pattern=game==='리치 마작'?/총\s*(\d+)판/:game==='중국식 마작'?/(\d+)점/:/(\d+)번/;
  return Number(detail.match(pattern)?.[1]??0);
}

/** 베팅은 시작할 때 이미 차감되므로 payout은 지갑에 되돌려 줄 총액입니다. */
export function calculateMahjongCoinSettlement(args:{game:MahjongGameName;stake:number;result:MahjongSettlementResult;detail?:string;score?:number}):MahjongCoinSettlement{
  const score=args.score??mahjongScoreFromDetail(args.game,args.detail??'');
  if(args.result==='loss')return {score,multiplier:0,payout:0,net:-args.stake};
  if(args.result==='push')return {score,multiplier:1,payout:args.stake,net:0};
  let bonus=0;
  if(args.game==='리치 마작')bonus=Math.floor(score/3);
  else if(args.game==='중국식 마작')bonus=Math.floor(score/16);
  else if(args.game==='홍콩 마작')bonus=Math.floor(score/3);
  else bonus=Math.floor(score/2);
  const cap=args.game==='홍콩 마작'?6:8;
  const multiplier=Math.min(cap,2+bonus);
  const payout=args.stake*multiplier;
  return {score,multiplier,payout,net:payout-args.stake};
}
