import { createDeck, shuffleDeck, type Card, type Rank } from './blackjack.ts';
import { compareHands, evaluateFive, type PokerHand } from './texasholdem.ts';

export type PaiGowTwoHand = { category: 0 | 1; label: string; tiebreak: number[]; cards: Card[] };
export type PaiGowSplit = { high: Card[]; low: Card[]; highRank: PokerHand; lowRank: PaiGowTwoHand };
export type PaiGowResult = 'win' | 'loss' | 'push';

const values: Record<Rank, number> = { A:14, K:13, Q:12, J:11, '10':10, '9':9, '8':8, '7':7, '6':6, '5':5, '4':4, '3':3, '2':2 };

export function evaluatePaiGowTwo(cards: Card[]): PaiGowTwoHand {
  if (cards.length !== 2) throw new Error('파이 고우 로우 핸드는 두 장이어야 합니다.');
  const ordered = [...cards].sort((a,b)=>values[b.rank]-values[a.rank]);
  const pair = ordered[0].rank === ordered[1].rank;
  return { category: pair ? 1 : 0, label: pair ? `${ordered[0].rank} 원 페어` : `${ordered[0].rank} 하이`, tiebreak: pair ? [values[ordered[0].rank]] : ordered.map(card=>values[card.rank]), cards:ordered };
}

export function comparePaiGowTwo(a: PaiGowTwoHand, b: PaiGowTwoHand): number {
  if (a.category !== b.category) return Math.sign(a.category-b.category);
  for (let index=0; index<Math.max(a.tiebreak.length,b.tiebreak.length); index+=1) {
    const difference=(a.tiebreak[index]??0)-(b.tiebreak[index]??0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

export function isValidPaiGowSplit(high: Card[], low: Card[]): boolean {
  if (high.length !== 5 || low.length !== 2) return false;
  const highRank=evaluateFive(high), lowRank=evaluatePaiGowTwo(low);
  if (highRank.category !== lowRank.category) return highRank.category > lowRank.category;
  return compareHands(highRank, { ...highRank, category:lowRank.category, label:lowRank.label, tiebreak:lowRank.tiebreak, cards:lowRank.cards }) >= 0;
}

export function splitPaiGow(cards: Card[], lowIds: string[]): PaiGowSplit {
  if (cards.length !== 7 || lowIds.length !== 2 || new Set(lowIds).size !== 2) throw new Error('7장 중 로우 핸드 두 장을 선택하세요.');
  const low=cards.filter(card=>lowIds.includes(card.id));
  const high=cards.filter(card=>!lowIds.includes(card.id));
  if (!isValidPaiGowSplit(high,low)) throw new Error('하이 핸드는 로우 핸드보다 강해야 합니다.');
  return { high, low, highRank:evaluateFive(high), lowRank:evaluatePaiGowTwo(low) };
}

const rankScore=(rank:{category:number;tiebreak:number[]})=>rank.category*1_000_000+rank.tiebreak.reduce((sum,value,index)=>sum+value*15**(4-index),0);

/** 초보용 하우스 웨이: 유효한 분할 중 약한 쪽을 가장 강하게 만드는 균형형 자동 배치입니다. */
export function arrangePaiGow(cards: Card[]): PaiGowSplit {
  if (cards.length !== 7) throw new Error('파이 고우 배치에는 7장이 필요합니다.');
  const candidates:PaiGowSplit[]=[];
  for(let first=0;first<6;first+=1) for(let second=first+1;second<7;second+=1) {
    const low=[cards[first],cards[second]], high=cards.filter((_,index)=>index!==first&&index!==second);
    if(isValidPaiGowSplit(high,low)) candidates.push({high,low,highRank:evaluateFive(high),lowRank:evaluatePaiGowTwo(low)});
  }
  return candidates.sort((a,b)=>{
    const lowDifference=rankScore(b.lowRank)-rankScore(a.lowRank);
    return lowDifference || rankScore(b.highRank)-rankScore(a.highRank);
  })[0];
}

export function dealPaiGow(random:()=>number=Math.random) {
  const deck=shuffleDeck(createDeck(),random);
  return { player:deck.slice(0,7), dealer:deck.slice(7,14) };
}

export function resolvePaiGow(player:PaiGowSplit,dealer:PaiGowSplit):{result:PaiGowResult;high:'win'|'loss';low:'win'|'loss'} {
  // 같은 패는 뱅커가 이기는 일반 규칙을 적용합니다.
  const high=compareHands(player.highRank,dealer.highRank)>0?'win':'loss';
  const low=comparePaiGowTwo(player.lowRank,dealer.lowRank)>0?'win':'loss';
  return { result:high==='win'&&low==='win'?'win':high==='loss'&&low==='loss'?'loss':'push', high, low };
}
