export type CycleStyle='선행'|'젖히기'|'추입'|'마크';
export type Cyclist={id:number;name:string;color:string;sprint:number;endurance:number;tactics:number;style:CycleStyle;winOdds:number;placeOdds:number};
export type CycleBetType='win'|'place'|'quinella'|'exacta';
export type CycleRaceResult={order:number[];times:Record<number,number>;lastLapOrder:number[]};
export type CycleTicket={type:CycleBetType;selections:number[];stake:number;odds:number};
const names=['강태풍','윤스피드','백두산','최강호','김번개','한질주','박챔피언','이돌풍','정바람','송에이스'];
const colors=['#FFFFFF','#202020','#E53935','#1976D2','#F4C430','#2E9E4D','#F28C28'];
const styles:CycleStyle[]=['선행','젖히기','추입','마크'];
export const cycleBetLabels:Record<CycleBetType,string>={win:'단승',place:'연승',quinella:'복승',exacta:'쌍승'};

export function createCycleField(random:()=>number=Math.random):Cyclist[]{
  const pool=[...names].sort(()=>random()-.5).slice(0,7);
  const raw=pool.map((name,index)=>({id:index+1,name,color:colors[index],sprint:62+Math.floor(random()*36),endurance:62+Math.floor(random()*36),tactics:62+Math.floor(random()*36),style:styles[Math.floor(random()*styles.length)]}));
  const scores=raw.map(rider=>rider.sprint*.42+rider.endurance*.3+rider.tactics*.28),total=scores.reduce((sum,value)=>sum+value,0);
  return raw.map((rider,index)=>{const p=scores[index]/total;return {...rider,winOdds:Number(Math.max(1.4,.82/p).toFixed(1)),placeOdds:Number(Math.max(1.1,.27/p).toFixed(1))};});
}
export function simulateCycleRace(riders:Cyclist[],random:()=>number=Math.random):CycleRaceResult{
  const lastLap=[...riders].map(rider=>({id:rider.id,score:rider.endurance*.45+rider.tactics*.4+(random()-.5)*18})).sort((a,b)=>b.score-a.score).map(item=>item.id);
  const finish=[...riders].map(rider=>{const styleBonus=rider.style==='추입'?rider.sprint*.08:rider.style==='젖히기'?rider.tactics*.06:rider.style==='선행'?rider.endurance*.05:rider.tactics*.04;return {id:rider.id,time:145-(rider.sprint*.45+rider.endurance*.27+rider.tactics*.28+styleBonus)*.34+(random()-.5)*9};}).sort((a,b)=>a.time-b.time||a.id-b.id);
  return {order:finish.map(item=>item.id),times:Object.fromEntries(finish.map(item=>[item.id,Number(item.time.toFixed(3))])),lastLapOrder:lastLap};
}
export const requiredCycleSelections=(type:CycleBetType)=>type==='win'||type==='place'?1:2;
export function cycleTicketOdds(type:CycleBetType,selections:number[],riders:Cyclist[]):number{if(selections.length!==requiredCycleSelections(type))return 0;const picked=selections.map(id=>riders.find(rider=>rider.id===id));if(picked.some(item=>!item))return 0;if(type==='win')return picked[0]!.winOdds;if(type==='place')return picked[0]!.placeOdds;const base=picked[0]!.winOdds*picked[1]!.winOdds;return Number((type==='exacta'?base*.7:base*.46).toFixed(1));}
export function cycleTicketWins(ticket:CycleTicket,result:CycleRaceResult){const [first,second]=result.order;if(ticket.type==='win')return ticket.selections[0]===first;if(ticket.type==='place')return result.order.slice(0,2).includes(ticket.selections[0]);if(ticket.type==='exacta')return ticket.selections[0]===first&&ticket.selections[1]===second;return ticket.selections.includes(first)&&ticket.selections.includes(second);}
export const settleCycleTicket=(ticket:CycleTicket,result:CycleRaceResult)=>cycleTicketWins(ticket,result)?Math.round(ticket.stake*ticket.odds):0;
