// 물고기 룰렛 — 둥근 바다가 곧 룰렛판입니다.
//
// 바깥 둘레에 자리 12곳이 있고, 판이 시작되면 물고기 12마리를 풀어 놓습니다.
// 물고기는 한동안 헤엄쳐 다니다 자리 하나로 들어갑니다. 들어가면 거기서 끝이고 다시 안 나옵니다.
// 정해진 시간이 지나면 판이 끝나며, 그때까지 못 들어간 물고기는 세지 않습니다.
//
// 여기에 큰 놈 한 마리 — 문어 — 가 따로 있습니다. 문어는 느리고, 자리를 **두 칸** 차지하며,
// 그 두 칸에는 보통 물고기가 아예 못 들어갑니다. 문어 자체는 물고기로 세지 않습니다.
//
// 어느 자리로 들어갈지는 자리 12곳이 똑같은 확률입니다. 문어가 어느 두 칸을 막든 그 대칭이
// 안 깨지므로 '먼저'와 '많이'는 어느 자리를 골라도 여전히 정확히 1/12이고, 이웃 두 자리는
// 2/12, 홀짝과 전후반은 6/12입니다. '문어 자리'는 1/12에 문어가 제때 앉을 확률을 곱한 값입니다.
// '없음'만 몇 마리가 시간 안에 들어왔는지에 따라 달라지므로 시뮬레이션으로 재서 정했습니다.
// (문어가 막은 두 칸은 '없음'이 반드시 이깁니다. 그래서 문어를 넣고 '없음'이 크게 올랐습니다.)
// 잰 값은 이 파일 맨 아래 주석에 있습니다.

export const slotCount = 12;
export const fishCount = 12;

/** 한 판의 길이. 이 시간이 지나면 아직 헤엄치던 물고기는 안 셉니다. */
export const roundMs = 20000;
/** 아무리 빨라도 이만큼은 헤엄치고 나서 들어갑니다. 시작하자마자 끝나면 볼 게 없습니다. */
const entryEarliest = 3000;
/** 들어가는 시각이 흩어지는 폭. roundMs를 조금 넘겨 두어 못 들어가는 물고기가 가끔 생깁니다. */
const entrySpread = 17900;
/**
 * 문어는 **느립니다.** 아무리 빨라도 8초는 헤엄치고 나서 자리에 앉습니다.
 * 8000~21000이라 20초를 넘겨 못 앉는 판이 13분의 1(7.7%)쯤 생깁니다.
 * 보통 물고기(3000~20900, 평균 12.0초)보다 늘 늦게 들어가 보입니다.
 */
const octopusEarliest = 8000;
const octopusSpread = 13000;

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

/**
 * 문어 — 큰 놈 한 마리. 보통 물고기 12마리와 따로 셉니다.
 *
 * - 앉은 자리와 **시계 방향 옆자리** 두 칸을 차지합니다(5번에 앉으면 5·6번).
 *   시계 방향으로 고정이라 걸 때 어디가 막힐지 미리 알 수 있습니다.
 * - 그 두 칸에는 보통 물고기가 **아예 못 들어갑니다.** 판이 시작될 때부터 막혀 있습니다.
 * - 기존 여섯 승식에서는 **물고기로 안 셉니다.** 그래서 막힌 두 칸은 '없음'이 반드시 이기고
 *   '먼저'와 '많이'는 반드시 집니다.
 * - 20초 안에 못 앉으면 보통 물고기와 같이 **안 셉니다.** 그때 '문어 자리'는 꽝입니다.
 *   막는 것은 그대로입니다 — 문어가 두 칸 위를 맴돌아 물고기가 못 들어온 것으로 봅니다.
 */
export type Octopus = {
  /** 차지한 두 칸 가운데 앞쪽(1~12). 옆 칸은 nextSlot으로 구합니다. */
  slot: number;
  /** 자리에 앉는 시각(ms). roundMs를 넘으면 못 앉은 것입니다. */
  at: number;
  /** 화면용 — 물고기와 같은 뜻입니다. */
  startAngle: number;
  startRadius: number;
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
  /** 큰 놈 한 마리. 세지는 않지만 자리 두 칸을 막습니다. */
  octopus: Octopus;
  /** 문어가 막은 자리 두 곳. 여기에는 물고기가 한 마리도 안 들어갑니다. */
  blocked: number[];
};

/** 문어가 시간 안에 자리에 앉았는지. 못 앉으면 '문어 자리'는 꽝입니다. */
export const octopusSettled = (result: FishRouletteResult): boolean => result.octopus.at <= roundMs;

/** 자리 번호 → 판 위의 각도(도). 1번이 맨 위이고 시계 방향으로 돌아갑니다. */
export const slotAngle = (slot: number): number => -90 + (slot - 1) * (360 / slotCount);

/** 이웃 두 자리에 걸면 이 자리와 다음 자리를 함께 덮습니다. 12번의 다음은 1번입니다. */
export const nextSlot = (slot: number): number => (slot % slotCount) + 1;

export function spinFishRoulette(random: () => number = Math.random): FishRouletteResult {
  // 문어를 먼저 뽑습니다. 어느 두 칸이 막히는지 정해져야 물고기가 자리를 고를 수 있습니다.
  const octopus: Octopus = {
    slot: 1 + Math.floor(random() * slotCount),
    at: Math.round(octopusEarliest + octopusSpread * random()),
    startAngle: random() * 360,
    startRadius: 0.44 + random() * 0.3,
    // 물고기(14~40)보다 훨씬 천천히 돕니다. 느린 놈으로 보여야 합니다.
    spin: (random() < 0.5 ? -1 : 1) * (5 + random() * 8),
  };
  const blocked = [octopus.slot, nextSlot(octopus.slot)];
  // 막힌 두 칸을 뺀 열 곳. 물고기는 여기서만 자리를 고릅니다.
  const open = Array.from({ length: slotCount }, (_, index) => index + 1).filter((slot) => !blocked.includes(slot));

  const swimmers: Swimmer[] = createFishRouletteField().slice(0, fishCount).map((fish) => ({
    ...fish,
    slot: open[Math.floor(random() * open.length)],
    at: Math.round(entryEarliest + entrySpread * random()),
    startAngle: random() * 360,
    // 바깥쪽 띠 안에서만 헤엄칩니다. 가운데로 들어가면 판 한가운데 적어 둔 글자를 가립니다.
    // 자리 둘레(화면에서 118)의 0.50~0.85라 59~100입니다. 물 반지름 124 안에 들어옵니다.
    startRadius: 0.50 + random() * 0.35,
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

  return { swimmers, entered, counts, first: entered[0]?.slot ?? null, most, octopus, blocked };
}

export type FishRouletteBet =
  | { type: 'first'; slot: number }
  | { type: 'most'; slot: number }
  | { type: 'none'; slot: number }
  | { type: 'neighbour'; slot: number }
  | { type: 'octopus'; slot: number }
  | { type: 'parity'; parity: 'odd' | 'even' }
  | { type: 'half'; half: 'front' | 'back' };

export type FishRouletteBetType = FishRouletteBet['type'];

export const fishRouletteBetLabels: Record<FishRouletteBetType, string> = {
  first: '먼저',
  most: '많이',
  none: '없음',
  neighbour: '이웃 먼저',
  octopus: '문어 자리',
  parity: '홀 / 짝',
  half: '앞 / 뒤 절반',
};

export const fishRouletteBetDetails: Record<FishRouletteBetType, string> = {
  first: '고른 자리가 제일 먼저 물고기를 받으면',
  most: '고른 자리가 제일 많이 받으면 · 같은 수면 먼저 받은 쪽',
  none: '고른 자리가 끝까지 비어 있으면',
  neighbour: '고른 자리나 그 옆자리가 제일 먼저 받으면',
  octopus: '문어가 고른 자리에 앉으면 · 옆 칸까지 두 칸을 막습니다',
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
    // 문어는 앉은 자리와 시계 방향 옆 칸을 같이 막으므로 이웃과 덮는 자리가 같습니다.
    case 'octopus':
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
  // 문어는 앉은 자리만 봅니다. 시간 안에 못 앉으면 어디에 걸었든 꽝입니다.
  if (bet.type === 'octopus') return octopusSettled(result) && result.octopus.slot === bet.slot;
  // 막힌 두 칸은 물고기가 못 들어오니 '없음'이 반드시 맞습니다. 마릿수 0으로 저절로 풀립니다.
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
  // 문어를 넣으면서 2.55에서 내렸습니다. 막힌 두 칸은 '없음'이 반드시 이겨 37.2% → 41.8%가 됐습니다.
  none: 2.27,
  neighbour: 5.7,
  // 1/12(8.33%)에 문어가 20초 안에 앉을 확률(92.3%)을 곱해 7.68%입니다.
  octopus: 12.37,
  parity: 1.9,
  half: 1.9,
};

export const fishRouletteMultiplier = (bet: FishRouletteBet): number => fishRouletteOdds[bet.type];

export const fishRoulettePayout = (bet: FishRouletteBet, stake: number, result: FishRouletteResult): number =>
  fishRouletteWins(bet, result) ? Math.round(stake * fishRouletteMultiplier(bet)) : 0;

/** 판이 어떻게 끝났는지 한 줄로. 결과 화면과 기록에 씁니다. */
export const fishRouletteSummary = (result: FishRouletteResult): string =>
  `먼저 ${result.first ?? '-'}번 · 많이 ${result.most ?? '-'}번 · 문어 ${octopusSettled(result) ? `${result.octopus.slot}·${nextSlot(result.octopus.slot)}번` : '못 앉음'} · 못 들어간 물고기 ${result.swimmers.length - result.entered.length}마리`;

// ── 화면에서 물고기를 어디에 그릴지 ──────────────────────────────────────────
// 판정은 위에서 이미 끝나 있고, 아래는 그 결과를 시간에 따라 보여 주기만 합니다.

/** 자리로 들어가기 시작하는 시점. 이만큼 앞에서부터 자리 쪽으로 방향을 틉니다. */
export const approachMs = 1600;
/** 문어는 느리니 더 멀리서부터 천천히 방향을 틉니다. */
export const octopusApproachMs = 2600;

/** 문어가 서는 각도. 차지한 두 칸 **한가운데**입니다(5번이면 5번과 6번 사이). */
export const octopusAngle = (slot: number): number => slotAngle(slot) + 180 / slotCount;

/** 물고기와 문어가 같이 쓰는 화면용 값. 판정에는 안 씁니다. */
type Drifter = { slot: number; at: number; startAngle: number; startRadius: number; spin: number };

const wanderAt = (drifter: Drifter, elapsed: number) => ({
  angle: drifter.startAngle + drifter.spin * (elapsed / 1000),
  radius: drifter.startRadius,
});

const positionAt = (drifter: Drifter, elapsed: number, target: number, approach: number) => {
  if (elapsed >= drifter.at) return { angle: target, radius: 1, settled: true };
  const begin = drifter.at - approach;
  if (elapsed <= begin) return { ...wanderAt(drifter, elapsed), settled: false };
  const from = wanderAt(drifter, begin);
  // 짧은 쪽으로 돌아 들어갑니다. 반 바퀴를 넘게 돌아가면 어색합니다.
  const turn = ((((target - from.angle) % 360) + 540) % 360) - 180;
  const step = (elapsed - begin) / approach;
  return { angle: from.angle + turn * step, radius: from.radius + (1 - from.radius) * step, settled: false };
};

/** 흐른 시간에서 물고기가 있는 곳. 각도는 도, 거리는 0(가운데)에서 1(자리 둘레)입니다. */
export function fishPositionAt(swimmer: Swimmer, elapsed: number): { angle: number; radius: number; settled: boolean } {
  return positionAt(swimmer, elapsed, slotAngle(swimmer.slot), approachMs);
}

/** 흐른 시간에서 문어가 있는 곳. 물고기와 같은 값이지만 두 칸 한가운데로 들어갑니다. */
export function octopusPositionAt(octopus: Octopus, elapsed: number): { angle: number; radius: number; settled: boolean } {
  return positionAt(octopus, elapsed, octopusAngle(octopus.slot), octopusApproachMs);
}

// 200만 판을 돌려 실제로 잰 값입니다(**문어를 넣고 다시 쟀습니다**).
// 왼쪽이 맞을 확률, 오른쪽이 위 배당에서의 환급률입니다.
//   먼저       8.34% · 11.40배 → 95.0%
//   많이       8.33% · 11.40배 → 95.0%
//   없음      41.80% ·  2.27배 → 94.9%   (문어 넣기 전 37.16% · 2.55배)
//   이웃 먼저 16.64% ·  5.71배 → 95.0%
//   문어 자리  7.68% · 12.37배 → 95.0%   (새로 넣은 승식)
//   홀 / 짝   50.05% ·  1.90배 → 95.1%
//   앞 / 뒤   49.98% ·  1.90배 → 95.0%
//
// 자리 12곳을 따로 세어 봐도 '먼저' 8.30~8.38% · '많이' 8.30~8.36% · '문어' 7.66~7.73%로
// 고르게 나왔습니다. 문어가 막는 두 칸이 시계 방향으로 붙어 돌기만 하므로 자리 사이의 대칭이
// 안 깨집니다. 어느 자리를 골라도 같다는 뜻입니다.
//
// 문어를 넣고 바뀐 것은 사실상 '없음' 하나뿐입니다. 문어가 막은 두 칸(2/12)은 '없음'이 반드시
// 이기고, 남은 열 칸에는 물고기가 더 빽빽하게 몰립니다.
//   막힌 칸일 확률 2/12 = 16.67%  +  열린 칸이면서 끝까지 빈 확률 (10/12)×(9/10)^11.4 ≈ 25.1%
//   = 41.8%. 잰 값과 맞습니다.
//
// 시간 안에 못 들어가는 물고기는 5.02%로 문어를 넣기 전과 같습니다(입장 시각은 안 건드렸습니다).
// 문어가 20초 안에 못 앉는 판은 7.68%입니다. 그 판에서는 '문어 자리'가 어디에 걸었든 꽝입니다.
// 200만 판 가운데 물고기가 한 마리도 못 들어간 판은 없었습니다. '먼저'가 빈 판은 사실상 안 나옵니다.
