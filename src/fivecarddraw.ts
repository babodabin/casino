import { createDeck, shuffleDeck, type Card } from './blackjack.ts';
import { compareHands, evaluateFive } from './texasholdem.ts';

export type FiveCardDrawDeal = { player: Card[]; opponent: Card[]; drawPile: Card[] };

export function dealFiveCardDraw(random: () => number = Math.random): FiveCardDrawDeal {
  const deck = shuffleDeck(createDeck(), random);
  return { player: deck.slice(0, 5), opponent: deck.slice(5, 10), drawPile: deck.slice(10) };
}

export function exchangeDrawCards(hand: Card[], keep: boolean[], drawPile: Card[]) {
  let drawIndex = 0;
  const nextHand = hand.map((card, index) => keep[index] ? card : drawPile[drawIndex++]);
  return { hand: nextHand, drawPile: drawPile.slice(drawIndex), exchanged: drawIndex };
}

export function opponentKeepCards(hand: Card[]): boolean[] {
  const counts = new Map<string, number>();
  hand.forEach((card) => counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1));
  const hasGroup = [...counts.values()].some((count) => count > 1);
  return hand.map((card) => hasGroup ? (counts.get(card.rank) ?? 0) > 1 : ['A', 'K', 'Q', 'J'].includes(card.rank));
}

export function resolveFiveCardDraw(player: Card[], opponent: Card[]) {
  if (player.length !== 5 || opponent.length !== 5) throw new Error('파이브 카드 드로우는 각자 5장이 필요합니다.');
  const playerHand = evaluateFive(player);
  const opponentHand = evaluateFive(opponent);
  const compared = compareHands(playerHand, opponentHand);
  return { result: compared > 0 ? 'win' as const : compared < 0 ? 'loss' as const : 'push' as const, playerHand, opponentHand };
}
