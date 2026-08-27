export type FightingBull={id:number;name:string;color:string;power:number;endurance:number;spirit:number;odds:number};
export type BullMatch={round:'예선'|'준결승'|'결승';left:number;right:number;winner:number};
export type BullTournamentResult={champion:number;runnerUp:number;matches:BullMatch[]};
export type BullTicket={selection:number;stake:number;odds:number};

const bulls:FightingBull[]=[
  {id:1,name:'백두',color:'#E8E0D2',power:94,endurance:90,spirit:91,odds:3.4},
  {id:2,name:'천둥',color:'#37271E',power:92,endurance:94,spirit:89,odds:3.5},
  {id:3,name:'장군',color:'#8B5A36',power:90,endurance:88,spirit:95,odds:3.8},
  {id:4,name:'태산',color:'#292929',power:95,endurance:86,spirit:90,odds:4.0},
  {id:5,name:'황소',color:'#B78652',power:87,endurance:93,spirit:92,odds:4.7},
  {id:6,name:'돌풍',color:'#685044',power:89,endurance:89,spirit:94,odds:5.0},
];
export const createBullField=():FightingBull[]=>bulls.map(bull=>({...bull}));
function duel(left:FightingBull,right:FightingBull,random:()=>number){const score=(bull:FightingBull)=>bull.power*.43+bull.endurance*.31+bull.spirit*.26+(random()-.5)*17;return score(left)>=score(right)?left:right;}
export function simulateBullTournament(field:FightingBull[],random:()=>number=Math.random):BullTournamentResult{
  if(field.length!==6)throw new Error('소싸움 대회에는 6마리가 필요합니다.');
  const byId=(id:number)=>field.find(bull=>bull.id===id)!;const matches:BullMatch[]=[];
  const q1=duel(byId(3),byId(6),random);matches.push({round:'예선',left:3,right:6,winner:q1.id});
  const q2=duel(byId(4),byId(5),random);matches.push({round:'예선',left:4,right:5,winner:q2.id});
  const s1=duel(byId(1),q2,random);matches.push({round:'준결승',left:1,right:q2.id,winner:s1.id});
  const s2=duel(byId(2),q1,random);matches.push({round:'준결승',left:2,right:q1.id,winner:s2.id});
  const final=duel(s1,s2,random);matches.push({round:'결승',left:s1.id,right:s2.id,winner:final.id});
  return {champion:final.id,runnerUp:final.id===s1.id?s2.id:s1.id,matches};
}
export const bullTicketPayout=(ticket:BullTicket,result:BullTournamentResult)=>ticket.selection===result.champion?Math.round(ticket.stake*ticket.odds):0;
