export type BoatBetType='win'|'place'|'quinella'|'exacta';
export type BoatRacer={id:number;name:string;color:string;textColor:string;start:number;turn:number;motor:number;style:'인코스'|'속공'|'전속'|'선회';winOdds:number;placeOdds:number};
export type BoatRaceResult={order:number[];firstMarkOrder:number[];times:Record<number,number>};
export type BoatTicket={type:BoatBetType;selections:number[];stake:number;odds:number};
export const boatBetLabels:Record<BoatBetType,string>={win:'단승',place:'연승',quinella:'복승',exacta:'쌍승'};
const names=['김해성','이파도','박질주','최윤슬','정해풍','한물결','윤쾌속','강푸름'];
const lanes=[{color:'#F7F7F2',textColor:'#111'},{color:'#222',textColor:'#FFF'},{color:'#E53935',textColor:'#FFF'},{color:'#1976D2',textColor:'#FFF'},{color:'#F3D33B',textColor:'#111'},{color:'#2DA85B',textColor:'#FFF'}];
const styles:BoatRacer['style'][]=['인코스','속공','전속','선회'];
export function createBoatField(random:()=>number=Math.random):BoatRacer[]{
  const pool=[...names].sort(()=>random()-.5).slice(0,6);
  const raw=pool.map((name,index)=>({id:index+1,name,...lanes[index],start:62+Math.floor(random()*36),turn:62+Math.floor(random()*36),motor:62+Math.floor(random()*36),style:styles[Math.floor(random()*styles.length)]}));
  const strengths=raw.map(boat=>boat.start*.31+boat.turn*.38+boat.motor*.31+(boat.id===1?4:0)),total=strengths.reduce((sum,value)=>sum+value,0);
  return raw.map((boat,index)=>{const p=strengths[index]/total;return {...boat,winOdds:Number(Math.max(1.3,.8/p).toFixed(1)),placeOdds:Number(Math.max(1.1,.27/p).toFixed(1))};});
}
export function simulateBoatRace(boats:BoatRacer[],random:()=>number=Math.random):BoatRaceResult{
  const firstMark=[...boats].map(boat=>({id:boat.id,score:boat.start*.45+boat.turn*.4+boat.motor*.15+(boat.id===1?5:0)+(random()-.5)*16})).sort((a,b)=>b.score-a.score||a.id-b.id);
  const markRank=new Map(firstMark.map((boat,index)=>[boat.id,index]));
  const finish=[...boats].map(boat=>{const firstMarkBonus=(boats.length-(markRank.get(boat.id)??boats.length))*1.35;const score=boat.turn*.34+boat.motor*.39+boat.start*.27+firstMarkBonus+(random()-.5)*14;return {id:boat.id,time:112-score*.28};}).sort((a,b)=>a.time-b.time||a.id-b.id);
  return {order:finish.map(item=>item.id),firstMarkOrder:firstMark.map(item=>item.id),times:Object.fromEntries(finish.map(item=>[item.id,Number(item.time.toFixed(3))]))};
}
export const requiredBoatSelections=(type:BoatBetType)=>type==='win'||type==='place'?1:2;
export function boatTicketOdds(type:BoatBetType,selections:number[],boats:BoatRacer[]):number{if(selections.length!==requiredBoatSelections(type)||new Set(selections).size!==selections.length)return 0;const picked=selections.map(id=>boats.find(boat=>boat.id===id));if(picked.some(item=>!item))return 0;if(type==='win')return picked[0]!.winOdds;if(type==='place')return picked[0]!.placeOdds;const base=picked[0]!.winOdds*picked[1]!.winOdds;return Number((type==='exacta'?base*.68:base*.45).toFixed(1));}
export function boatTicketWins(ticket:BoatTicket,result:BoatRaceResult){const [first,second]=result.order;if(ticket.type==='win')return ticket.selections[0]===first;if(ticket.type==='place')return result.order.slice(0,2).includes(ticket.selections[0]);if(ticket.type==='exacta')return ticket.selections[0]===first&&ticket.selections[1]===second;return ticket.selections.includes(first)&&ticket.selections.includes(second);}
export const settleBoatTicket=(ticket:BoatTicket,result:BoatRaceResult)=>boatTicketWins(ticket,result)?Math.round(ticket.stake*ticket.odds):0;
