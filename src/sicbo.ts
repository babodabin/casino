export type SicBoDice = [number, number, number];
export type SicBoBet =
  | { type: 'big' }
  | { type: 'small' }
  | { type: 'odd' }
  | { type: 'even' }
  | { type: 'total'; value: number }
  | { type: 'single'; value: number }
  | { type: 'double'; value: number }
  | { type: 'triple'; value: number };

export function rollSicBo(random: () => number = Math.random): SicBoDice {
  const die = () => Math.floor(random() * 6) + 1;
  return [die(), die(), die()];
}

export function sicBoPayout(bet: SicBoBet, stake: number, dice: SicBoDice): number {
  const total = dice[0] + dice[1] + dice[2];
  const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
  if (bet.type === 'big' || bet.type === 'small' || bet.type === 'odd' || bet.type === 'even') {
    if (isTriple) return 0;
    const won = bet.type === 'big' ? total >= 11 : bet.type === 'small' ? total <= 10 : bet.type === 'odd' ? total % 2 === 1 : total % 2 === 0;
    return won ? stake * 2 : 0;
  }
  if (bet.type === 'total') {
    if (total !== bet.value) return 0;
    const profitOdds: Record<number, number> = { 4: 50, 5: 18, 6: 14, 7: 12, 8: 8, 9: 6, 10: 6, 11: 6, 12: 6, 13: 8, 14: 12, 15: 14, 16: 18, 17: 50 };
    return stake * ((profitOdds[bet.value] ?? 0) + 1);
  }
  const count = dice.filter((value) => value === bet.value).length;
  if (bet.type === 'single') return count > 0 ? stake * (count + 1) : 0;
  if (bet.type === 'double') return count >= 2 ? stake * 12 : 0;
  return count === 3 ? stake * 181 : 0;
}

export function sicBoNet(bet: SicBoBet, stake: number, dice: SicBoDice) { return sicBoPayout(bet, stake, dice) - stake; }

export function sicBoBetLabel(bet: SicBoBet) {
  if (bet.type === 'big') return '대';
  if (bet.type === 'small') return '소';
  if (bet.type === 'odd') return '홀';
  if (bet.type === 'even') return '짝';
  if (bet.type === 'total') return `합계 ${bet.value}`;
  return `${bet.value} ${bet.type === 'single' ? '특정 숫자' : bet.type === 'double' ? '더블' : '트리플'}`;
}
