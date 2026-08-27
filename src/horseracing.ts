export type Horse = { id:number; name:string; color:string; speed:number; stamina:number; form:number; winOdds:number; placeOdds:number };
export type HorseBetType = 'win'|'place'|'quinella'|'exacta';
export type HorseRaceResult = { order:number[]; times:Record<number,number> };
export type HorseTicket = { type:HorseBetType; selections:number[]; stake:number; odds:number };

const names=['황금질주','블루썬더','서울의별','레드코멧','바람의왕','문라이트','그린스톰','챔피언로드','실버애로','럭키퀸'];
const colors=['#E44343','#3478D4','#E4B83E','#51A85B','#8B56C9','#EA7C32','#3DB7B2','#E667A2','#747C8D','#A46C45'];

export function createHorseField(random:()=>number=Math.random,count=6):Horse[]{
  const pool=[...names].sort(()=>random()-0.5).slice(0,count);
  const raw=pool.map((name,index)=>({id:index+1,name,color:colors[index],speed:62+Math.floor(random()*35),stamina:62+Math.floor(random()*35),form:60+Math.floor(random()*38)}));
  const strengths=raw.map(horse=>horse.speed*.45+horse.stamina*.3+horse.form*.25);
  const total=strengths.reduce((sum,value)=>sum+value,0);
  return raw.map((horse,index)=>{const probability=strengths[index]/total;return {...horse,winOdds:Number(Math.max(1.5,0.82/probability).toFixed(1)),placeOdds:Number(Math.max(1.1,0.34/probability).toFixed(1))};});
}

export function simulateHorseRace(horses:Horse[],random:()=>number=Math.random):HorseRaceResult{
  const entries=horses.map(horse=>{const strength=horse.speed*.5+horse.stamina*.3+horse.form*.2;const time=100-(strength*.24)+(random()-.5)*9;return {id:horse.id,time:Number(time.toFixed(3))};}).sort((a,b)=>a.time-b.time||a.id-b.id);
  return {order:entries.map(entry=>entry.id),times:Object.fromEntries(entries.map(entry=>[entry.id,entry.time]))};
}

export function requiredHorseSelections(type:HorseBetType){return type==='win'||type==='place'?1:2;}

export function horseTicketOdds(type:HorseBetType,selections:number[],horses:Horse[]):number{
  if(selections.length!==requiredHorseSelections(type))return 0;
  const chosen=selections.map(id=>horses.find(horse=>horse.id===id));
  if(chosen.some(item=>!item))return 0;
  if(type==='win')return chosen[0]!.winOdds;
  if(type==='place')return chosen[0]!.placeOdds;
  const base=chosen[0]!.winOdds*chosen[1]!.winOdds;
  return Number((type==='exacta'?base*.72:base*.48).toFixed(1));
}

export function horseTicketWins(ticket:HorseTicket,result:HorseRaceResult):boolean{
  const [first,second]=result.order;
  if(ticket.type==='win')return ticket.selections[0]===first;
  if(ticket.type==='place')return result.order.slice(0,3).includes(ticket.selections[0]);
  if(ticket.type==='exacta')return ticket.selections[0]===first&&ticket.selections[1]===second;
  return ticket.selections.includes(first)&&ticket.selections.includes(second);
}

export function settleHorseTicket(ticket:HorseTicket,result:HorseRaceResult){return horseTicketWins(ticket,result)?Math.round(ticket.stake*ticket.odds):0;}

export const horseBetLabels:Record<HorseBetType,string>={win:'단승',place:'연승',quinella:'복승',exacta:'쌍승'};
