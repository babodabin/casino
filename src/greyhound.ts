export type GreyhoundBetType='win'|'place'|'quinella'|'exacta';
export type RunningLine='레일'|'중간'|'외곽';
export type Greyhound={id:number;name:string;vestColor:string;textColor:string;breakSpeed:number;cornering:number;finishSpeed:number;line:RunningLine;winOdds:number;placeOdds:number};
export type GreyhoundRaceResult={order:number[];firstBendOrder:number[];times:Record<number,number>};
export type GreyhoundTicket={type:GreyhoundBetType;selections:number[];stake:number;odds:number};
export const greyhoundBetLabels:Record<GreyhoundBetType,string>={win:'단승',place:'연승',quinella:'복승',exacta:'쌍승'};
const names=['붉은유성','블루번개','화이트문','검은질주','오렌지킹','실버애로','밤의추격자','윈드러너'];
const vests=[{vestColor:'#D62828',textColor:'#FFF'},{vestColor:'#1464C0',textColor:'#FFF'},{vestColor:'#F6F3E8',textColor:'#111'},{vestColor:'#202124',textColor:'#FFF'},{vestColor:'#F28C28',textColor:'#111'},{vestColor:'#D8D8D8',textColor:'#111'}];
const lines:RunningLine[]=['레일','중간','외곽'];
export function createGreyhoundField(random:()=>number=Math.random):Greyhound[]{
  const pool=[...names].sort(()=>random()-.5).slice(0,6);
  const raw=pool.map((name,index)=>({id:index+1,name,...vests[index],breakSpeed:62+Math.floor(random()*36),cornering:62+Math.floor(random()*36),finishSpeed:62+Math.floor(random()*36),line:lines[Math.floor(random()*lines.length)]}));
  const strength=raw.map(dog=>dog.breakSpeed*.34+dog.cornering*.31+dog.finishSpeed*.35),total=strength.reduce((sum,value)=>sum+value,0);
  return raw.map((dog,index)=>{const p=strength[index]/total;return {...dog,winOdds:Number(Math.max(1.4,.82/p).toFixed(1)),placeOdds:Number(Math.max(1.1,.28/p).toFixed(1))};});
}
export function simulateGreyhoundRace(dogs:Greyhound[],random:()=>number=Math.random):GreyhoundRaceResult{
  const firstBend=[...dogs].map(dog=>({id:dog.id,score:dog.breakSpeed*.5+dog.cornering*.38+(random()-.5)*18})).sort((a,b)=>b.score-a.score||a.id-b.id);
  const bendRank=new Map(firstBend.map((dog,index)=>[dog.id,index]));
  const finish=[...dogs].map(dog=>{const bendBonus=(dogs.length-(bendRank.get(dog.id)??dogs.length))*1.1;const lineBonus=dog.line==='레일'&&dog.id<=2?3:dog.line==='외곽'&&dog.id>=5?3:dog.line==='중간'&&dog.id>=3&&dog.id<=4?3:0;const score=dog.finishSpeed*.44+dog.cornering*.28+dog.breakSpeed*.28+bendBonus+lineBonus+(random()-.5)*14;return{id:dog.id,time:38-score*.105};}).sort((a,b)=>a.time-b.time||a.id-b.id);
  return {order:finish.map(item=>item.id),firstBendOrder:firstBend.map(item=>item.id),times:Object.fromEntries(finish.map(item=>[item.id,Number(item.time.toFixed(3))]))};
}
export const requiredGreyhoundSelections=(type:GreyhoundBetType)=>type==='win'||type==='place'?1:2;
export function greyhoundTicketOdds(type:GreyhoundBetType,selections:number[],dogs:Greyhound[]):number{if(selections.length!==requiredGreyhoundSelections(type)||new Set(selections).size!==selections.length)return 0;const picked=selections.map(id=>dogs.find(dog=>dog.id===id));if(picked.some(item=>!item))return 0;if(type==='win')return picked[0]!.winOdds;if(type==='place')return picked[0]!.placeOdds;const base=picked[0]!.winOdds*picked[1]!.winOdds;return Number((type==='exacta'?base*.7:base*.47).toFixed(1));}
export function greyhoundTicketWins(ticket:GreyhoundTicket,result:GreyhoundRaceResult){const[first,second]=result.order;if(ticket.type==='win')return ticket.selections[0]===first;if(ticket.type==='place')return result.order.slice(0,2).includes(ticket.selections[0]);if(ticket.type==='exacta')return ticket.selections[0]===first&&ticket.selections[1]===second;return ticket.selections.includes(first)&&ticket.selections.includes(second);}
export const settleGreyhoundTicket=(ticket:GreyhoundTicket,result:GreyhoundRaceResult)=>greyhoundTicketWins(ticket,result)?Math.round(ticket.stake*ticket.odds):0;
