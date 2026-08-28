// 공 어디에? — 컵 세 개 중 하나에 공을 넣고 여러 번 자리를 바꾼 뒤, 공이 든 컵을 찾는 게임입니다.
// 섞는 과정을 화면에서 그대로 보여줘야 하므로, 결과만 뽑지 않고 '자리를 바꾼 순서'를 그대로 남깁니다.

export type ShellSwap = { a: number; b: number };
export type ShellRound = {
  start: number;        // 처음에 공을 보여준 컵의 자리 (0, 1, 2)
  swaps: ShellSwap[];   // 순서대로 적용할 자리 바꾸기
  final: number;        // 섞기가 끝난 뒤 공이 있는 자리
};

export const shellCupCount = 3;
export const shellPayout = 3;

// 서로 다른 두 자리를 고릅니다. 같은 자리를 두 번 고르면 섞이지 않으므로 반드시 다르게 뽑습니다.
const pickPair = (random: () => number): ShellSwap => {
  const a = Math.floor(random() * shellCupCount);
  let b = Math.floor(random() * (shellCupCount - 1));
  if (b >= a) b += 1;
  return { a, b };
};

export const applyShellSwap = (position: number, swap: ShellSwap): number =>
  position === swap.a ? swap.b : position === swap.b ? swap.a : position;

export const createShellRound = (swapCount = 8, random: () => number = Math.random): ShellRound => {
  const start = Math.floor(random() * shellCupCount);
  const swaps: ShellSwap[] = [];
  let position = start;
  for (let index = 0; index < swapCount; index += 1) {
    const swap = pickPair(random);
    swaps.push(swap);
    position = applyShellSwap(position, swap);
  }
  return { start, swaps, final: position };
};

// 몇 번째 섞기까지 진행했을 때 공이 어디 있는지 — 화면에서 컵을 움직일 때 씁니다.
export const shellPositionAfter = (round: ShellRound, step: number): number =>
  round.swaps.slice(0, Math.max(0, Math.min(step, round.swaps.length))).reduce(applyShellSwap, round.start);

// 컵 세 개가 각각 어느 자리에 있는지. 컵의 정체(0,1,2)를 자리 기준으로 되돌려 줍니다.
export const shellLayoutAfter = (round: ShellRound, step: number): number[] => {
  const layout = [0, 1, 2];
  round.swaps.slice(0, Math.max(0, Math.min(step, round.swaps.length))).forEach(swap => {
    const temporary = layout[swap.a];
    layout[swap.a] = layout[swap.b];
    layout[swap.b] = temporary;
  });
  return layout;
};

export const shellMultiplier = (choice: number, round: ShellRound): number =>
  choice === round.final ? shellPayout : 0;
