import { createDeck, shuffleDeck, type Card, type Rank } from './blackjack.ts';

export type PokerHand = { category: number; label: string; tiebreak: number[]; cards: Card[] };
const rankValue: Record<Rank, number> = { A: 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

export function evaluateFive(cards: Card[]): PokerHand {
  const values = cards.map((card) => rankValue[card.rank]).sort((a, b) => b - a);
  const counts = new Map<number, number>(); values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = new Set(cards.map((card) => card.suit)).size === 1;
  const unique = [...new Set(values)]; const wheel = unique.join(',') === '14,5,4,3,2';
  const straight = unique.length === 5 && (wheel || unique[0] - unique[4] === 4); const highStraight = wheel ? 5 : unique[0];
  const order=(rankOrder:number[])=>rankOrder.flatMap((value)=>cards.filter((card)=>rankValue[card.rank]===value));
  const straightOrder=wheel?[5,4,3,2,14]:unique;
  const groupOrder=groups.map(([value])=>value);
  if (flush && straight) return { category: 8, label: highStraight === 14 ? '로열 플러시' : '스트레이트 플러시', tiebreak: [highStraight], cards:order(straightOrder) };
  if (groups[0][1] === 4) return { category: 7, label: '포카드', tiebreak: [groups[0][0], groups[1][0]], cards:order(groupOrder) };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { category: 6, label: '풀하우스', tiebreak: [groups[0][0], groups[1][0]], cards:order(groupOrder) };
  if (flush) return { category: 5, label: '플러시', tiebreak: values, cards:order(unique) };
  if (straight) return { category: 4, label: '스트레이트', tiebreak: [highStraight], cards:order(straightOrder) };
  if (groups[0][1] === 3) return { category: 3, label: '트리플', tiebreak: [groups[0][0], ...groups.slice(1).map((g) => g[0]).sort((a,b) => b-a)], cards:order(groupOrder) };
  if (groups[0][1] === 2 && groups[1][1] === 2) { const pairs=[groups[0][0],groups[1][0]].sort((a,b)=>b-a); return { category: 2, label: '투 페어', tiebreak: [...pairs, groups[2][0]], cards:order([...pairs,groups[2][0]]) }; }
  if (groups[0][1] === 2) return { category: 1, label: '원 페어', tiebreak: [groups[0][0], ...groups.slice(1).map((g)=>g[0]).sort((a,b)=>b-a)], cards:order(groupOrder) };
  return { category: 0, label: '하이 카드', tiebreak: values, cards:order(unique) };
}

const combinations = (cards: Card[]) => { const result: Card[][]=[]; for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<5;c++)for(let d=c+1;d<6;d++)for(let e=d+1;e<7;e++)result.push([cards[a],cards[b],cards[c],cards[d],cards[e]]); return result; };
export function compareHands(a: PokerHand, b: PokerHand) { if (a.category !== b.category) return Math.sign(a.category-b.category); const length=Math.max(a.tiebreak.length,b.tiebreak.length); for(let i=0;i<length;i++){ const diff=(a.tiebreak[i]??0)-(b.tiebreak[i]??0); if(diff) return Math.sign(diff); } return 0; }
export function evaluateHoldem(cards: Card[]): PokerHand { if(cards.length!==7) throw new Error('홀덤 판정에는 7장이 필요합니다.'); return combinations(cards).map(evaluateFive).sort((a,b)=>compareHands(b,a))[0]; }
export function dealHoldem(random:()=>number=Math.random){ const deck=shuffleDeck(createDeck(),random); return { player:deck.slice(0,2), opponent:deck.slice(2,4), community:deck.slice(4,9) }; }
export function resolveHoldem(player:Card[],opponent:Card[],community:Card[]){ const playerHand=evaluateHoldem([...player,...community]); const opponentHand=evaluateHoldem([...opponent,...community]); return { result: compareHands(playerHand,opponentHand)>0?'win' as const:compareHands(playerHand,opponentHand)<0?'loss' as const:'push' as const, playerHand, opponentHand }; }

export function dealOmaha(random:()=>number=Math.random){ const deck=shuffleDeck(createDeck(),random); return { player:deck.slice(0,4), opponent:deck.slice(4,8), community:deck.slice(8,13) }; }
export function evaluateOmaha(hole:Card[],community:Card[]){ if(hole.length!==4||community.length!==5)throw new Error('오마하는 개인 4장과 공용 5장이 필요합니다.'); const hands:PokerHand[]=[]; for(let a=0;a<3;a++)for(let b=a+1;b<4;b++)for(let c=0;c<3;c++)for(let d=c+1;d<4;d++)for(let e=d+1;e<5;e++)hands.push(evaluateFive([hole[a],hole[b],community[c],community[d],community[e]])); return hands.sort((x,y)=>compareHands(y,x))[0]; }
export function resolveOmaha(player:Card[],opponent:Card[],community:Card[]){ const playerHand=evaluateOmaha(player,community); const opponentHand=evaluateOmaha(opponent,community); const compared=compareHands(playerHand,opponentHand); return {result:compared>0?'win' as const:compared<0?'loss' as const:'push' as const,playerHand,opponentHand}; }
