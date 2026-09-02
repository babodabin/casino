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

export function canSplit(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const splitValue = (card: Card) => ['10', 'J', 'Q', 'K'].includes(card.rank) ? 10 : card.rank;
  return splitValue(cards[0]) === splitValue(cards[1]);
}

export function insuranceStake(bet: number): number {
  return Math.floor(bet / 2);
}

export function insurancePayout(stake: number, dealerHasBlackjack: boolean): number {
  return dealerHasBlackjack ? stake * 3 : 0;
}

export function dealInitialRound(deck: Card[]) {
  if (deck.length < 4) throw new Error('카드가 부족합니다.');
  const remaining = [...deck];
  const player = [remaining.shift()!, remaining.shift()!];
  const dealer = [remaining.shift()!, remaining.shift()!];
  return { deck: remaining, player, dealer };
}

/**
 * 같은 판에 앉은 다른 손님.
 * **딜러 한 사람이 모두를 상대합니다** — 손님마다 제 패를 받아 각자 딜러와 겨룹니다.
 * ⚠️ 손님이 이기든 지든 **내 정산에는 영향이 없습니다.** 같은 슈에서 카드만 나눠 받습니다.
 */
export type BlackjackGuest = { name: string; hand: Card[]; result?: RoundResult };

/**
 * 손님 몫까지 같이 돌립니다. 실제 테이블처럼 **딜러가 마지막**입니다.
 * guests가 0이면 예전과 똑같습니다(나 두 장 · 딜러 두 장).
 */
export function dealTableRound(deck: Card[], guests: number) {
  if (deck.length < 4 + guests * 2) throw new Error('카드가 부족합니다.');
  const remaining = [...deck];
  const player = [remaining.shift()!, remaining.shift()!];
  const hands = Array.from({ length: guests }, () => [remaining.shift()!, remaining.shift()!]);
  const dealer = [remaining.shift()!, remaining.shift()!];
  return { deck: remaining, player, guests: hands, dealer };
}

/**
 * 손님은 기본 전략의 제일 쉬운 꼴로 둡니다 — **17 미만이면 더 받습니다.**
 * 딜러와 같은 규칙이라 따로 배울 것이 없고, 옆자리가 무엇을 하는지 바로 읽힙니다.
 */
export function playGuestHand(deck: Card[], hand: Card[]) {
  let remaining = [...deck];
  let held = [...hand];
  while (handValue(held) < 17 && remaining.length > 0) {
    const drawn = drawCard(remaining, held);
    remaining = drawn.deck;
    held = drawn.hand;
  }
  return { deck: remaining, hand: held };
}

/** 손님 한 명과 딜러를 견줍니다. 규칙은 나와 똑같습니다. */
export function guestResult(hand: Card[], dealer: Card[]): RoundResult {
  const mine = handValue(hand);
  const theirs = handValue(dealer);
  if (mine > 21) return 'loss';
  if (isBlackjack(hand) && !isBlackjack(dealer)) return 'blackjack';
  if (theirs > 21) return 'win';
  if (mine > theirs) return 'win';
  if (mine < theirs) return 'loss';
  return 'push';
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

/**
 * 스플릿한 손은 2장으로 21을 만들어도 블랙잭이 아니라 일반 21입니다.
 * 그런 경우 playerCanBlackjack에 false를 넘기세요.
 */
export function resolveRound(player: Card[], dealer: Card[], playerCanBlackjack = true): RoundResult {
  const playerScore = handValue(player);
  const dealerScore = handValue(dealer);
  const playerBlackjack = playerCanBlackjack && isBlackjack(player);
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
