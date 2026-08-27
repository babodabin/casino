export type OddEvenChoice='홀'|'짝';
export const drawOddEven=(random=Math.random)=>Math.floor(random()*100)+1;
export const oddEvenWins=(choice:OddEvenChoice,value:number)=>(value%2?'홀':'짝')===choice;

export const drawLotto=(random=Math.random)=>{
  const pool=Array.from({length:45},(_,i)=>i+1),picked:number[]=[];
  while(picked.length<7){const index=Math.floor(random()*pool.length);picked.push(pool.splice(index,1)[0]);}
  return {numbers:picked.slice(0,6).sort((a,b)=>a-b),bonus:picked[6]};
};
export const lottoResult=(chosen:number[],numbers:number[],bonus:number)=>{
  const matches=chosen.filter(value=>numbers.includes(value)).length,bonusHit=chosen.includes(bonus);
  const multiplier=matches===6?10000:matches===5&&bonusHit?500:matches===5?100:matches===4?10:matches===3?2:0;
  return {matches,bonusHit,multiplier};
};

export const scratchSymbols=['◆','7','★','♣','♛','●'] as const;
export type ScratchSymbol=typeof scratchSymbols[number];
export const drawScratch=(random=Math.random):ScratchSymbol[]=>Array.from({length:9},()=>scratchSymbols[Math.floor(random()*scratchSymbols.length)]);
export const scratchResult=(symbols:ScratchSymbol[])=>{
  const counts=symbols.reduce<Record<string,number>>((out,symbol)=>{out[symbol]=(out[symbol]??0)+1;return out;},{});
  const best=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]??['',0];
  const multiplier=best[1]>=5?20:best[1]===4?5:best[1]===3?2:0;
  return {symbol:best[0],count:best[1],multiplier};
};
