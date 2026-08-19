import { createDeck, shuffleDeck, type Card } from './blackjack.ts';

export type BaccaratBet = 'player' | 'banker' | 'tie';
export type BaccaratWinner = 'player' | 'banker' | 'tie';

export type BaccaratRound = {
  player: Card[];
  banker: Card[];
  winner: BaccaratWinner;
  deck: Card[];
};

export function baccaratCardValue(card: Card) {
  if (card.rank === 'A') return 1;
  if (card.rank === '10' || card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 0;
  return Number(card.rank);
}

export function baccaratScore(hand: Card[]) {
  return hand.reduce((sum, card) => sum + baccaratCardValue(card), 0) % 10;
}

export function bankerDraws(bankerScore: number, playerThird?: Card) {
  if (!playerThird) return bankerScore <= 5;
  const third = baccaratCardValue(playerThird);
  if (bankerScore <= 2) return true;
  if (bankerScore === 3) return third !== 8;
  if (bankerScore === 4) return third >= 2 && third <= 7;
  if (bankerScore === 5) return third >= 4 && third <= 7;
  if (bankerScore === 6) return third === 6 || third === 7;
  return false;
}

export function dealBaccaratRound(sourceDeck = shuffleDeck(createDeck())): BaccaratRound {
  const deck = [...sourceDeck];
  const player = [deck.pop()!, deck.pop()!];
  const banker = [deck.pop()!, deck.pop()!];
  const natural = baccaratScore(player) >= 8 || baccaratScore(banker) >= 8;
  let playerThird: Card | undefined;

  if (!natural && baccaratScore(player) <= 5) {
    playerThird = deck.pop()!;
    player.push(playerThird);
  }
  if (!natural && bankerDraws(baccaratScore(banker), playerThird)) banker.push(deck.pop()!);

  const playerScore = baccaratScore(player);
  const bankerScore = baccaratScore(banker);
  const winner: BaccaratWinner = playerScore === bankerScore ? 'tie' : playerScore > bankerScore ? 'player' : 'banker';
  return { player, banker, winner, deck };
}

export function baccaratNet(bet: BaccaratBet, stake: number, winner: BaccaratWinner) {
  if (winner === 'tie' && bet !== 'tie') return 0;
  if (bet !== winner) return -stake;
  if (bet === 'tie') return stake * 8;
  if (bet === 'banker') return Math.floor(stake * 0.95);
  return stake;
}

export function baccaratPayout(bet: BaccaratBet, stake: number, winner: BaccaratWinner) {
  const net = baccaratNet(bet, stake, winner);
  return stake + net;
}
