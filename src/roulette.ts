export type RouletteBetType = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'straight';

export type RouletteBet = {
  type: RouletteBetType;
  number?: number;
};

const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function rouletteColor(number: number): 'green' | 'red' | 'black' {
  if (number === 0) return 'green';
  return redNumbers.has(number) ? 'red' : 'black';
}

export function spinRoulette(random = Math.random): number {
  return Math.floor(random() * 37);
}

export function rouletteMultiplier(bet: RouletteBet): number {
  if (bet.type === 'straight') return 36;
  if (bet.type.startsWith('dozen')) return 3;
  return 2;
}

export function rouletteBetWins(bet: RouletteBet, number: number): boolean {
  if (bet.type === 'straight') return bet.number === number;
  if (number === 0) return false;
  if (bet.type === 'red' || bet.type === 'black') return rouletteColor(number) === bet.type;
  if (bet.type === 'odd') return number % 2 === 1;
  if (bet.type === 'even') return number % 2 === 0;
  if (bet.type === 'low') return number >= 1 && number <= 18;
  if (bet.type === 'high') return number >= 19 && number <= 36;
  if (bet.type === 'dozen1') return number >= 1 && number <= 12;
  if (bet.type === 'dozen2') return number >= 13 && number <= 24;
  return number >= 25 && number <= 36;
}

export function roulettePayout(bet: RouletteBet, stake: number, number: number): number {
  return rouletteBetWins(bet, number) ? stake * rouletteMultiplier(bet) : 0;
}

export function rouletteNet(bet: RouletteBet, stake: number, number: number): number {
  return roulettePayout(bet, stake, number) - stake;
}
