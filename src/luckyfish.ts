// 행운의 물고기 — 물고기 한 마리가 산호초의 갈림길을 지나 마지막에 동굴 여섯 개 중 하나로 들어갑니다.
// 갈림길마다 왼쪽 또는 오른쪽으로 갈리고, 다섯 번 갈리면 도착 가능한 동굴이 여섯 곳이 됩니다.
// 가운데로 몰릴수록 자주 나오므로 바깥쪽 동굴의 배당이 큽니다.

export type LuckyFishTurn = '왼쪽' | '오른쪽';
export type LuckyFishPath = { turns: LuckyFishTurn[]; cave: number };

export const luckyFishForks = 5;
export const luckyFishCaveCount = luckyFishForks + 1;

// 오른쪽으로 꺾은 횟수가 곧 동굴 번호(0~5)입니다. 경우의 수는 1,5,10,10,5,1 (합 32)입니다.
export const luckyFishWays = [1, 5, 10, 10, 5, 1];
export const luckyFishTotalWays = 32;

export const luckyFishProbability = (cave: number): number => luckyFishWays[cave] / luckyFishTotalWays;

// 배당은 확률의 역수보다 낮게 두어 환급률을 모든 동굴에서 93.75%로 똑같이 맞췄습니다.
export const luckyFishPayout = [30, 6, 3, 3, 6, 30];

export const luckyFishCaves = [
  { id: 0, name: '심해 동굴', color: '#1F3B73', payout: luckyFishPayout[0] },
  { id: 1, name: '보라 산호', color: '#6B4E9B', payout: luckyFishPayout[1] },
  { id: 2, name: '초록 수초', color: '#2F7D5C', payout: luckyFishPayout[2] },
  { id: 3, name: '모래 언덕', color: '#B08949', payout: luckyFishPayout[3] },
  { id: 4, name: '주황 말미잘', color: '#C4602E', payout: luckyFishPayout[4] },
  { id: 5, name: '보물 상자', color: '#8C2F39', payout: luckyFishPayout[5] },
];

export const swimLuckyFish = (random: () => number = Math.random): LuckyFishPath => {
  const turns: LuckyFishTurn[] = Array.from({ length: luckyFishForks }, () =>
    random() < 0.5 ? '왼쪽' : '오른쪽',
  );
  return { turns, cave: turns.filter(turn => turn === '오른쪽').length };
};

// 갈림길을 몇 번 지났을 때 물고기가 가로로 어디쯤 있는지 (0~1). 화면에서 헤엄치는 위치에 씁니다.
export const luckyFishOffset = (path: LuckyFishPath, step: number): number => {
  const passed = path.turns.slice(0, Math.max(0, Math.min(step, path.turns.length)));
  const right = passed.filter(turn => turn === '오른쪽').length;
  const remaining = luckyFishForks - passed.length;
  // 아직 남은 갈림길에서는 가운데를 향한다고 보고 위치를 잡습니다.
  return (right + remaining / 2) / luckyFishForks;
};

export const luckyFishMultiplier = (choice: number, path: LuckyFishPath): number =>
  choice === path.cave ? luckyFishPayout[choice] : 0;

export const luckyFishReturnRate = (cave: number): number => luckyFishProbability(cave) * luckyFishPayout[cave];
