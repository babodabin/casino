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

/**
 * 여러 명이 할 때 몫을 나눕니다. 0번이 나입니다.
 * 일곱 장씩이라 52장으로 일곱 명까지 되지만, 화면이 네 자리라 앱에서는 네 명까지 씁니다.
 */
export function dealSevenPokerTable(players: number, random: () => number = Math.random): Card[][] {
  if (players < 2 || players > 7) throw new Error('세븐 포커는 두 명에서 일곱 명까지 합니다.');
  const deck = shuffleDeck(createDeck(), random);
  return Array.from({ length: players }, (_, index) => deck.slice(index * 7, (index + 1) * 7));
}
