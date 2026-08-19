import { createDeck, shuffleDeck, type Card } from './blackjack.ts';
import { compareHands, evaluateHoldem } from './texasholdem.ts';

export type SevenPokerDeal = { player: Card[]; opponent: Card[] };

export function dealSevenPoker(random: () => number = Math.random): SevenPokerDeal {
  const deck = shuffleDeck(createDeck(), random);
  return { player: deck.slice(0, 7), opponent: deck.slice(7, 14) };
}

export function resolveSevenPoker(player: Card[], opponent: Card[]) {
  if (player.length !== 7 || opponent.length !== 7) throw new Error('세븐 포커는 각자 카드 7장이 필요합니다.');
  const playerHand = evaluateHoldem(player);
  const opponentHand = evaluateHoldem(opponent);
  const compared = compareHands(playerHand, opponentHand);
  return { result: compared > 0 ? 'win' as const : compared < 0 ? 'loss' as const : 'push' as const, playerHand, opponentHand };
}
