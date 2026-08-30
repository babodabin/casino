// 물고기 룰렛 — 둥근 바다가 곧 룰렛판입니다.
//
// 바깥 둘레에 자리 12곳이 있고, 판이 시작되면 물고기 12마리를 풀어 놓습니다.
// 물고기는 한동안 헤엄쳐 다니다 자리 하나로 들어갑니다. 들어가면 거기서 끝이고 다시 안 나옵니다.
// 정해진 시간이 지나면 판이 끝나며, 그때까지 못 들어간 물고기는 세지 않습니다.
//
// 어느 자리로 들어갈지는 자리 12곳이 똑같은 확률입니다. 그래서 '먼저'와 '많이'는
// 어느 자리를 골라도 정확히 1/12이고, 이웃 두 자리는 2/12, 홀짝과 전후반은 6/12입니다.
// '없음'만 몇 마리가 시간 안에 들어왔는지에 따라 달라지므로 시뮬레이션으로 재서 정했습니다.
// 잰 값은 이 파일 맨 아래 주석에 있습니다.

export const slotCount = 12;
export const fishCount = 12;

/** 한 판의 길이. 이 시간이 지나면 아직 헤엄치던 물고기는 안 셉니다. */
export const roundMs = 20000;
/** 아무리 빨라도 이만큼은 헤엄치고 나서 들어갑니다. 시작하자마자 끝나면 볼 게 없습니다. */
const entryEarliest = 3000;
/** 들어가는 시각이 흩어지는 폭. roundMs를 조금 넘겨 두어 못 들어가는 물고기가 가끔 생깁니다. */
const entrySpread = 17900;

export type FishRouletteFish = {
  id: number;
  name: string;
  emoji: string;
  color: string;
};

const roster: FishRouletteFish[] = [
  { id: 1, name: '청산호', emoji: '🐟', color: '#3FA9F5' },
  { id: 2, name: '금비늘', emoji: '🐠', color: '#F2B807' },
  { id: 3, name: '붉은지느러미', emoji: '🐡', color: '#E4572E' },
  { id: 4, name: '먹구름', emoji: '🐟', color: '#7A6FF0' },
  { id: 5, name: '흰물결', emoji: '🐠', color: '#C9D6DF' },
  { id: 6, name: '검은등', emoji: '🐡', color: '#2E4057' },
  { id: 7, name: '풀치', emoji: '🐟', color: '#3FBF7F' },
  { id: 8, name: '분홍놀', emoji: '🐠', color: '#F07BA8' },
  { id: 9, name: '자주돔', emoji: '🐡', color: '#A34FC4' },
  { id: 10, name: '구릿빛', emoji: '🐟', color: '#C97B34' },
  { id: 11, name: '옥빛', emoji: '🐠', color: '#2BC4C4' },
  { id: 12, name: '잿빛', emoji: '🐡', color: '#8A94A6' },
];

export const createFishRouletteField = (): FishRouletteFish[] => roster.map((fish) => ({ ...fish }));

export type Swimmer = FishRouletteFish & {
  /** 들어간 자리(1~12). at이 roundMs를 넘으면 못 들어간 것이라 세지 않습니다. */
  slot: number;
  /** 자리로 들어가는 시각(ms). */
  at: number;
  /** 화면용 — 처음 있던 각도(도). */
  startAngle: number;
  /** 화면용 — 중심에서의 거리. 0이 한가운데, 1이 자리 둘레입니다. */
  startRadius: number;
  /** 화면용 — 도는 속도(초당 각도). 음수면 반대로 돕니다. */
  spin: number;
};

export type FishRouletteResult = {
  swimmers: Swimmer[];
  /** 시간 안에 들어간 물고기를 들어간 순서대로. */
  entered: Swimmer[];
  /** 자리별 마릿수. 0번째가 1번 자리입니다. */
  counts: number[];
  /** 제일 먼저 물고기를 받은 자리. 한 마리도 못 들어가면 null입니다. */
  first: number | null;
  /** 제일 많이 받은 자리. 같은 수면 먼저 받은 쪽이 이깁니다. */
  most: number | null;
};

/** 자리 번호 → 판 위의 각도(도). 1번이 맨 위이고 시계 방향으로 돌아갑니다. */
export const slotAngle = (slot: number): number => -90 + (slot - 1) * (360 / slotCount);

/** 이웃 두 자리에 걸면 이 자리와 다음 자리를 함께 덮습니다. 12번의 다음은 1번입니다. */
export const nextSlot = (slot: number): number => (slot % slotCount) + 1;

export function spinFishRoulette(random: () => number = Math.random): FishRouletteResult {
  const swimmers: Swimmer[] = createFishRouletteField().slice(0, fishCount).map((fish) => ({
    ...fish,
    slot: 1 + Math.floor(random() * slotCount),
    at: Math.round(entryEarliest + entrySpread * random()),
    startAngle: random() * 360,
    // 바깥쪽 띠 안에서만 헤엄칩니다. 가운데로 들어가면 판 한가운데 적어 둔 글자를 가립니다.
    startRadius: 0.46 + random() * 0.24,
    spin: (random() < 0.5 ? -1 : 1) * (14 + random() * 26),
  }));

  const entered = swimmers
    .filter((swimmer) => swimmer.at <= roundMs)
    .sort((a, b) => (a.at - b.at) || (a.id - b.id));

  const counts = new Array<number>(slotCount).fill(0);
  const firstAt = new Array<number>(slotCount).fill(Infinity);
  for (const swimmer of entered) {
    counts[swimmer.slot - 1] += 1;
    if (swimmer.at < firstAt[swimmer.slot - 1]) firstAt[swimmer.slot - 1] = swimmer.at;
  }

  // 많이 들어간 자리. 같은 수면 먼저 받은 쪽이 이깁니다.
  // 이 규칙이 있어야 동점이 안 생기고, 자리마다 확률이 정확히 1/12로 떨어집니다.
  let most: number | null = null;
  for (let slot = 1; slot <= slotCount; slot += 1) {
    if (counts[slot - 1] === 0) continue;
    if (most === null) { most = slot; continue; }
    const better = counts[slot - 1] > counts[most - 1]
      || (counts[slot - 1] === counts[most - 1] && firstAt[slot - 1] < firstAt[most - 1]);
    if (better) most = slot;
  }

  return { swimmers, entered, counts, first: entered[0]?.slot ?? null, most };
}

export type FishRouletteBet =
  | { type: 'first'; slot: number }
  | { type: 'most'; slot: number }
  | { type: 'none'; slot: number }
  | { type: 'neighbour'; slot: number }
  | { type: 'parity'; parity: 'odd' | 'even' }
  | { type: 'half'; half: 'front' | 'back' };

export type FishRouletteBetType = FishRouletteBet['type'];

export const fishRouletteBetLabels: Record<FishRouletteBetType, string> = {
  first: '먼저',
  most: '많이',
  none: '없음',
  neighbour: '이웃 먼저',
  parity: '홀 / 짝',
  half: '앞 / 뒤 절반',
};

export const fishRouletteBetDetails: Record<FishRouletteBetType, string> = {
  first: '고른 자리가 제일 먼저 물고기를 받으면',
  most: '고른 자리가 제일 많이 받으면 · 같은 수면 먼저 받은 쪽',
  none: '고른 자리가 끝까지 비어 있으면',
  neighbour: '고른 자리나 그 옆자리가 제일 먼저 받으면',
  parity: '먼저 받은 자리가 홀수인지 짝수인지',
  half: '먼저 받은 자리가 1~6인지 7~12인지',
};

/** 이 베팅이 덮는 자리. 화면에서 고른 자리를 표시하는 데 씁니다. */
export function fishRouletteCovers(bet: FishRouletteBet): number[] {
  switch (bet.type) {
    case 'first':
    case 'most':
    case 'none':
      return [bet.slot];
    case 'neighbour':
      return [bet.slot, nextSlot(bet.slot)];
    case 'parity':
      return Array.from({ length: slotCount }, (_, index) => index + 1)
        .filter((slot) => (slot % 2 === 1) === (bet.parity === 'odd'));
    case 'half':
      return Array.from({ length: slotCount }, (_, index) => index + 1)
        .filter((slot) => (slot <= slotCount / 2) === (bet.half === 'front'));
  }
}

export function fishRouletteWins(bet: FishRouletteBet, result: FishRouletteResult): boolean {
  if (bet.type === 'none') return result.counts[bet.slot - 1] === 0;
  if (bet.type === 'most') return result.most === bet.slot;
  // 나머지는 전부 '먼저 받은 자리'를 봅니다.
  if (result.first === null) return false;
  return fishRouletteCovers(bet).includes(result.first);
}

/**
 * 환급률 95%를 목표로 정한 배당입니다.
 * '없음'만 시뮬레이션으로 잰 값이고 나머지는 대칭이라 계산으로 나옵니다.
 * 어느 것도 1배 아래로 내려가지 않습니다.
 */
export const fishRouletteOdds: Record<FishRouletteBetType, number> = {
  first: 11.4,
  most: 11.4,
  none: 2.55,
  neighbour: 5.7,
  parity: 1.9,
  half: 1.9,
};

export const fishRouletteMultiplier = (bet: FishRouletteBet): number => fishRouletteOdds[bet.type];

export const fishRoulettePayout = (bet: FishRouletteBet, stake: number, result: FishRouletteResult): number =>
  fishRouletteWins(bet, result) ? Math.round(stake * fishRouletteMultiplier(bet)) : 0;

/** 판이 어떻게 끝났는지 한 줄로. 결과 화면과 기록에 씁니다. */
export const fishRouletteSummary = (result: FishRouletteResult): string =>
  `먼저 ${result.first ?? '-'}번 · 많이 ${result.most ?? '-'}번 · 못 들어간 물고기 ${result.swimmers.length - result.entered.length}마리`;

// ── 화면에서 물고기를 어디에 그릴지 ──────────────────────────────────────────
// 판정은 위에서 이미 끝나 있고, 아래는 그 결과를 시간에 따라 보여 주기만 합니다.

/** 자리로 들어가기 시작하는 시점. 이만큼 앞에서부터 자리 쪽으로 방향을 틉니다. */
export const approachMs = 1600;

const wanderAt = (swimmer: Swimmer, elapsed: number) => ({
  angle: swimmer.startAngle + swimmer.spin * (elapsed / 1000),
  radius: swimmer.startRadius,
});

/** 흐른 시간에서 물고기가 있는 곳. 각도는 도, 거리는 0(가운데)에서 1(자리 둘레)입니다. */
export function fishPositionAt(swimmer: Swimmer, elapsed: number): { angle: number; radius: number; settled: boolean } {
  const target = slotAngle(swimmer.slot);
  if (elapsed >= swimmer.at) return { angle: target, radius: 1, settled: true };
  const begin = swimmer.at - approachMs;
  if (elapsed <= begin) return { ...wanderAt(swimmer, elapsed), settled: false };
  const from = wanderAt(swimmer, begin);
  // 짧은 쪽으로 돌아 들어갑니다. 반 바퀴를 넘게 돌아가면 어색합니다.
  const turn = ((((target - from.angle) % 360) + 540) % 360) - 180;
  const step = (elapsed - begin) / approachMs;
  return { angle: from.angle + turn * step, radius: from.radius + (1 - from.radius) * step, settled: false };
}

// 200만 판을 돌려 실제로 잰 값입니다. 왼쪽이 맞을 확률, 오른쪽이 위 배당에서의 환급률입니다.
//   먼저       8.32% · 11.4배 → 94.8%
//   많이       8.32% · 11.4배 → 94.9%
//   없음      37.16% · 2.55배 → 94.8%
//   이웃 먼저 16.67% ·  5.7배 → 95.0%
//   홀 / 짝   50.04% ·  1.9배 → 95.1%
//   앞 / 뒤   49.97% ·  1.9배 → 94.9%
//
// 자리 12곳을 따로 세어 봐도 '먼저'와 '많이' 모두 8.30~8.38%로 고르게 나왔습니다.
// 어느 자리를 골라도 같다는 뜻이고, 동점을 '먼저 받은 쪽'으로 푸는 규칙이 그 대칭을 지킵니다.
//
// '없음'이 표의 35.2%보다 높은 것은 시간 안에 못 들어가는 물고기가 5.0%쯤 있기 때문입니다.
// 12마리가 다 들어간다면 (11/12)^12 = 35.2%가 됩니다.
// 200만 판 가운데 한 마리도 못 들어간 판은 없었습니다. '먼저'가 빈 판은 사실상 안 나옵니다.
// 제일 많이 받은 자리의 마릿수는 2마리 37% · 3마리 49% · 4마리 12%로, 동점 규칙이 자주 쓰입니다.
