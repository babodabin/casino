export type RouletteBetType =
  | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high'
  | 'dozen1' | 'dozen2' | 'dozen3'
  | 'column1' | 'column2' | 'column3'
  | 'straight' | 'split' | 'street' | 'corner' | 'sixline';

/**
 * 베팅 하나. 안쪽 베팅(숫자 하나 · 스플릿 · 스트리트 · 코너 · 식스 라인)은 덮는 숫자를 `numbers`에 담습니다.
 * 숫자 하나는 예전처럼 `number`만 써도 됩니다.
 */
export type RouletteBet = {
  type: RouletteBetType;
  number?: number;
  numbers?: number[];
};

const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function rouletteColor(number: number): 'green' | 'red' | 'black' {
  if (number === 0) return 'green';
  return redNumbers.has(number) ? 'red' : 'black';
}

export function spinRoulette(random = Math.random): number {
  return Math.floor(random() * 37);
}

/*
 * 판 모양. 실제 룰렛 판과 같이 **가로 한 줄에 세 숫자**(1·2·3 / 4·5·6 / … / 34·35·36)이고
 * 0은 맨 끝에 따로 있습니다. 스플릿 · 코너 · 식스 라인은 이 모양에서 붙어 있는 칸끼리만 됩니다.
 */
const rowOf = (number: number) => Math.floor((number - 1) / 3);
const colOf = (number: number) => (number - 1) % 3;
const range = (from: number, count: number) => Array.from({ length: count }, (_, index) => from + index);

/** 가로 한 줄(스트리트). 0이면 빈 배열입니다. */
export const rouletteStreetOf = (number: number): number[] => (number < 1 ? [] : range(rowOf(number) * 3 + 1, 3));

/** 세로 한 줄(컬럼) 번호 1~3. 0이면 0입니다. */
export const rouletteColumnOf = (number: number): number => (number < 1 ? 0 : colOf(number) + 1);

/** 붙어 있는 숫자 두 개. 0은 1·2·3과 붙어 있습니다(실제 판에서 0 칸이 그 셋과 맞닿아 있습니다). */
export function rouletteSplitsOf(number: number): number[][] {
  if (number === 0) return [[0, 1], [0, 2], [0, 3]];
  const pairs: number[][] = [];
  if (number <= 3) pairs.push([0, number]);
  if (colOf(number) > 0) pairs.push([number - 1, number]);
  if (colOf(number) < 2) pairs.push([number, number + 1]);
  if (number > 3) pairs.push([number - 3, number]);
  if (number <= 33) pairs.push([number, number + 3]);
  return pairs;
}

/** 이 숫자가 들어간 네 칸 묶음(코너). 0은 코너가 없습니다. */
export function rouletteCornersOf(number: number): number[][] {
  if (number < 1) return [];
  const corners: number[][] = [];
  for (let row = 0; row < 11; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const first = row * 3 + col + 1;
      const corner = [first, first + 1, first + 3, first + 4];
      if (corner.includes(number)) corners.push(corner);
    }
  }
  return corners;
}

/** 이 숫자가 들어간 가로 두 줄(식스 라인). 0은 식스 라인이 없습니다. */
export function rouletteSixLinesOf(number: number): number[][] {
  if (number < 1) return [];
  const row = rowOf(number);
  const lines: number[][] = [];
  if (row > 0) lines.push(range((row - 1) * 3 + 1, 6));
  if (row < 11) lines.push(range(row * 3 + 1, 6));
  return lines;
}

/** 베팅이 덮는 숫자 전부. 당첨 판정 · 배당 · 화면 표시가 다 이것을 씁니다. */
export function rouletteBetNumbers(bet: RouletteBet): number[] {
  switch (bet.type) {
    case 'straight': return bet.numbers ?? (bet.number === undefined ? [] : [bet.number]);
    case 'split': case 'street': case 'corner': case 'sixline': return bet.numbers ?? [];
    case 'red': return range(1, 36).filter((number) => rouletteColor(number) === 'red');
    case 'black': return range(1, 36).filter((number) => rouletteColor(number) === 'black');
    case 'odd': return range(1, 36).filter((number) => number % 2 === 1);
    case 'even': return range(1, 36).filter((number) => number % 2 === 0);
    case 'low': return range(1, 18);
    case 'high': return range(19, 18);
    case 'dozen1': return range(1, 12);
    case 'dozen2': return range(13, 12);
    case 'dozen3': return range(25, 12);
    case 'column1': case 'column2': case 'column3': {
      const column = Number(bet.type.slice(-1));
      return range(1, 36).filter((number) => rouletteColumnOf(number) === column);
    }
  }
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort((x, y) => x - y).every((value, index) => value === [...b].sort((x, y) => x - y)[index]);

/** 판에서 실제로 걸 수 있는 칸인지. 떨어진 두 숫자를 스플릿이라고 넘기는 것 같은 일을 막습니다. */
export function isValidRouletteBet(bet: RouletteBet): boolean {
  const numbers = rouletteBetNumbers(bet);
  const anchor = numbers[0];
  switch (bet.type) {
    case 'straight': return numbers.length === 1 && anchor >= 0 && anchor <= 36;
    case 'split': return numbers.length === 2 && rouletteSplitsOf(anchor).some((pair) => sameSet(pair, numbers));
    case 'street': return numbers.length === 3 && sameSet(rouletteStreetOf(anchor), numbers);
    case 'corner': return numbers.length === 4 && rouletteCornersOf(anchor).some((corner) => sameSet(corner, numbers));
    case 'sixline': return numbers.length === 6 && rouletteSixLinesOf(anchor).some((line) => sameSet(line, numbers));
    default: return true;
  }
}

/**
 * 원금을 포함해 돌려받는 배수. **36을 덮는 숫자 개수로 나눈 값**입니다 —
 * 숫자 하나 36 · 스플릿 18 · 스트리트 12 · 코너 9 · 식스 라인 6 · 다즌과 컬럼 3 · 색과 홀짝 2.
 * 0이 하나 있어서 어느 칸이든 환급률은 36/37 = 97.3%로 같습니다.
 */
export function rouletteMultiplier(bet: RouletteBet): number {
  const count = rouletteBetNumbers(bet).length;
  return count > 0 ? 36 / count : 0;
}

export function rouletteBetWins(bet: RouletteBet, number: number): boolean {
  return rouletteBetNumbers(bet).includes(number);
}

export function roulettePayout(bet: RouletteBet, stake: number, number: number): number {
  return rouletteBetWins(bet, number) ? stake * rouletteMultiplier(bet) : 0;
}

export function rouletteNet(bet: RouletteBet, stake: number, number: number): number {
  return roulettePayout(bet, stake, number) - stake;
}

const insideNames: Partial<Record<RouletteBetType, string>> = { split: '스플릿', street: '스트리트', corner: '코너', sixline: '식스 라인' };

/** 기록과 버튼에 쓰는 이름. 예: `스플릿 1·2`, `세로 2줄`. */
export function rouletteBetLabel(bet: RouletteBet): string {
  if (bet.type === 'straight') return `숫자 ${rouletteBetNumbers(bet)[0]}`;
  if (bet.type.startsWith('column')) return `세로 ${bet.type.slice(-1)}줄`;
  const name = insideNames[bet.type];
  if (name) {
    const numbers = [...rouletteBetNumbers(bet)].sort((a, b) => a - b);
    return bet.type === 'sixline' ? `${name} ${numbers[0]}~${numbers[numbers.length - 1]}` : `${name} ${numbers.join('·')}`;
  }
  return '';
}

export type RouletteInsideMode = 'straight' | 'split' | 'street' | 'corner' | 'sixline';

/** 이 숫자를 넣어 걸 수 있는 묶음들. 하나뿐이면 바로 정해지고, 여럿이면 숫자를 하나 더 눌러 고릅니다. */
export function rouletteInsideOptions(mode: RouletteInsideMode, number: number): number[][] {
  if (mode === 'straight') return [[number]];
  if (mode === 'split') return rouletteSplitsOf(number);
  if (mode === 'street') return number < 1 ? [] : [rouletteStreetOf(number)];
  if (mode === 'corner') return rouletteCornersOf(number);
  return rouletteSixLinesOf(number);
}

/**
 * 첫 숫자를 잡은 뒤 **두 번째로 누를 수 있는 칸**과 그 칸을 누르면 정해지는 묶음.
 * 코너는 대각선 칸만 받습니다 — 옆 칸을 누르면 코너가 두 개라 하나로 안 정해집니다.
 * 식스 라인은 위나 아래 줄의 아무 칸이나 됩니다.
 */
export function rouletteTargets(mode: RouletteInsideMode, anchor: number): Map<number, number[]> {
  const targets = new Map<number, number[]>();
  if (mode === 'split') for (const pair of rouletteSplitsOf(anchor)) targets.set(pair[0] === anchor ? pair[1] : pair[0], pair);
  if (mode === 'corner') for (const corner of rouletteCornersOf(anchor)) targets.set(corner[3 - corner.indexOf(anchor)], corner);
  if (mode === 'sixline') {
    const own = new Set(rouletteStreetOf(anchor));
    for (const line of rouletteSixLinesOf(anchor)) for (const number of line) if (!own.has(number)) targets.set(number, line);
  }
  return targets;
}
