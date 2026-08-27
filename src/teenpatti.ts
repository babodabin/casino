import {createDeck,shuffleDeck,type Card} from './blackjack.ts';
export type TeenPattiRank={level:number;label:string;tiebreak:number[]};
const value=(card:Card)=>card.rank==='A'?14:card.rank==='K'?13:card.rank==='Q'?12:card.rank==='J'?11:Number(card.rank);
const compareArrays=(a:number[],b:number[])=>{for(let i=0;i<Math.max(a.length,b.length);i++){const diff=(a[i]??0)-(b[i]??0);if(diff)return Math.sign(diff);}return 0;};
export function evaluateTeenPatti(cards:Card[]):TeenPattiRank{
  const values=cards.map(value).sort((a,b)=>b-a),flush=cards.every(card=>card.suit===cards[0].suit);
  const counts=values.reduce<Record<number,number>>((out,v)=>{out[v]=(out[v]??0)+1;return out;},{}),groups=Object.entries(counts).map(([v,n])=>({v:Number(v),n})).sort((a,b)=>b.n-a.n||b.v-a.v);
  const sequenceKey=values.join(','),sequenceHigh=sequenceKey==='14,13,12'?15:sequenceKey==='14,3,2'?14:values[0]-values[2]===2&&new Set(values).size===3?values[0]:0;
  if(groups[0].n===3)return {level:6,label:'트레일(트리플)',tiebreak:[groups[0].v]};
  if(flush&&sequenceHigh)return {level:5,label:'퓨어 시퀀스',tiebreak:[sequenceHigh]};
  if(sequenceHigh)return {level:4,label:'시퀀스',tiebreak:[sequenceHigh]};
  if(flush)return {level:3,label:'컬러',tiebreak:values};
  if(groups[0].n===2)return {level:2,label:'페어',tiebreak:[groups[0].v,groups[1].v]};
  return {level:1,label:'하이 카드',tiebreak:values};
}
export const compareTeenPatti=(a:Card[],b:Card[])=>{const left=evaluateTeenPatti(a),right=evaluateTeenPatti(b);return left.level-right.level||compareArrays(left.tiebreak,right.tiebreak);};
export const dealTeenPatti=(random=Math.random)=>{const deck=shuffleDeck(createDeck(),random);return {player:deck.slice(0,3),opponent:deck.slice(3,6)};};
