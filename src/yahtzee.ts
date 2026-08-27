export type YahtzeeDie = 1 | 2 | 3 | 4 | 5 | 6;
export type YahtzeeCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeKind' | 'fourKind' | 'fullHouse' | 'smallStraight'
  | 'largeStraight' | 'yahtzee' | 'chance';

export const yahtzeeCategories: YahtzeeCategory[] = [
  'ones','twos','threes','fours','fives','sixes','threeKind','fourKind',
  'fullHouse','smallStraight','largeStraight','yahtzee','chance',
];

export const yahtzeeCategoryLabels: Record<YahtzeeCategory,string> = {
  ones:'1의 합',twos:'2의 합',threes:'3의 합',fours:'4의 합',fives:'5의 합',sixes:'6의 합',
  threeKind:'트리플',fourKind:'포카드',fullHouse:'풀하우스',smallStraight:'스몰 스트레이트',
  largeStraight:'라지 스트레이트',yahtzee:'야찌',chance:'찬스',
};

export const rollYahtzeeDice = (dice: YahtzeeDie[] = [1,1,1,1,1], held: boolean[] = [false,false,false,false,false], random = Math.random): YahtzeeDie[] =>
  dice.map((value,index) => held[index] ? value : (Math.floor(random()*6)+1) as YahtzeeDie);

const countsOf = (dice: YahtzeeDie[]) => dice.reduce<Record<number,number>>((counts,value)=>{
  counts[value]=(counts[value]??0)+1; return counts;
},{});

export function scoreYahtzeeCategory(category: YahtzeeCategory, dice: YahtzeeDie[]) {
  const counts=countsOf(dice); const sum=dice.reduce((total,value)=>total+value,0);
  if(category==='ones'||category==='twos'||category==='threes'||category==='fours'||category==='fives'||category==='sixes'){
    const face=({ones:1,twos:2,threes:3,fours:4,fives:5,sixes:6} as const)[category];
    return (counts[face]??0)*face;
  }
  const groups=Object.values(counts).sort((a,b)=>b-a);
  if(category==='threeKind')return (groups[0]??0)>=3?sum:0;
  if(category==='fourKind')return (groups[0]??0)>=4?sum:0;
  if(category==='fullHouse')return groups.length===2&&groups[0]===3&&groups[1]===2?25:0;
  const unique=[...new Set(dice)].sort((a,b)=>a-b).join('');
  if(category==='smallStraight')return unique.includes('1234')||unique.includes('2345')||unique.includes('3456')?30:0;
  if(category==='largeStraight')return unique==='12345'||unique==='23456'?40:0;
  if(category==='yahtzee')return groups[0]===5?50:0;
  return sum;
}

export type YahtzeeScoreCard = Partial<Record<YahtzeeCategory,number>>;
export const yahtzeeUpperSubtotal = (card:YahtzeeScoreCard) =>
  (['ones','twos','threes','fours','fives','sixes'] as YahtzeeCategory[]).reduce((sum,key)=>sum+(card[key]??0),0);
export const yahtzeeUpperBonus = (card:YahtzeeScoreCard) => yahtzeeUpperSubtotal(card)>=63?35:0;
export const yahtzeeTotal = (card:YahtzeeScoreCard) => Object.values(card).reduce((sum,value)=>sum+(value??0),0)+yahtzeeUpperBonus(card);
export const yahtzeePayoutMultiplier = (score:number) => score>=250?3:score>=200?2:0;
