export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
};

export type RoundResult = 'blackjack' | 'win' | 'loss' | 'push';

const suits: Suit[] = ['♠', '♥', '♦', '♣'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  return suits.flatMap((suit) => ranks.map((rank) => ({ id: `${suit}-${rank}`, suit, rank })));
}

export function shuffleDeck(cards: Card[], random: () => number = Math.random): Card[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      total += 11;
      aces += 1;
    } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function dealInitialRound(deck: Card[]) {
  if (deck.length < 4) throw new Error('카드가 부족합니다.');
  const remaining = [...deck];
  const player = [remaining.shift()!, remaining.shift()!];
  const dealer = [remaining.shift()!, remaining.shift()!];
  return { deck: remaining, player, dealer };
}

export function drawCard(deck: Card[], hand: Card[]) {
  if (deck.length === 0) throw new Error('카드가 부족합니다.');
  const [card, ...remaining] = deck;
  return { deck: remaining, hand: [...hand, card] };
}

export function playDealer(deck: Card[], dealerHand: Card[]) {
  let remaining = [...deck];
  let hand = [...dealerHand];
  while (handValue(hand) < 17) {
    const next = drawCard(remaining, hand);
    remaining = next.deck;
    hand = next.hand;
  }
  return { deck: remaining, hand };
}

export function resolveRound(player: Card[], dealer: Card[]): RoundResult {
  const playerScore = handValue(player);
  const dealerScore = handValue(dealer);
  const playerBlackjack = isBlackjack(player);
  const dealerBlackjack = isBlackjack(dealer);

  if (playerBlackjack && !dealerBlackjack) return 'blackjack';
  if (dealerBlackjack && !playerBlackjack) return 'loss';
  if (playerBlackjack && dealerBlackjack) return 'push';
  if (playerScore > 21) return 'loss';
  if (dealerScore > 21) return 'win';
  if (playerScore > dealerScore) return 'win';
  if (playerScore < dealerScore) return 'loss';
  return 'push';
}

export function payoutForResult(bet: number, result: RoundResult): number {
  if (result === 'blackjack') return Math.floor(bet * 2.5);
  if (result === 'win') return bet * 2;
  if (result === 'push') return bet;
  return 0;
}

export function netForResult(bet: number, result: RoundResult): number {
  return payoutForResult(bet, result) - bet;
}
