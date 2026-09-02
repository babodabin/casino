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

/**
 * 같은 판에 앉은 다른 손님. **카드는 한 벌뿐입니다** —
 * 바카라는 손님이 몇이든 PLAYER · BANKER 한 벌을 다 같이 보고 각자 걸기만 합니다.
 * 그래서 카드 로직은 하나도 안 건드리고 거는 사람만 늘리면 됩니다.
 */
export type BaccaratGuest = { name: string; bet: BaccaratBet; stake: number };

/**
 * 손님이 어디에 걸지. 실제 바카라 판에서 뱅커가 조금 더 인기 있는 것을 그대로 옮겼습니다
 * (뱅커가 수수료를 떼고도 이길 확률이 조금 높습니다).
 * ⚠️ 손님이 무엇에 걸든 **내 정산에는 영향이 없습니다.** 판의 분위기일 뿐입니다.
 */
export function drawBaccaratGuestBet(random: () => number = Math.random): BaccaratBet {
  const roll = random();
  if (roll < 0.46) return 'banker';
  if (roll < 0.88) return 'player';
  return 'tie';
}

/** 판마다 손님 셋을 앉힙니다. 거는 돈은 내 베팅의 절반 · 한 배 · 두 배 중 하나입니다. */
export function seatBaccaratGuests(stake: number, random: () => number = Math.random): BaccaratGuest[] {
  const sizes = [0.5, 1, 2];
  return [1, 2, 3].map((seat) => ({
    name: `손님 ${seat}`,
    bet: drawBaccaratGuestBet(random),
    stake: Math.max(1, Math.round(stake * sizes[Math.floor(random() * sizes.length)])),
  }));
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
