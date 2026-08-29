// 스크린낚시 — 오락실 낚시 기계를 옮긴 것입니다.
// 한 판은 네 단계입니다. 던지기 → 입질 기다리기 → 챔질(정해진 짧은 시간 안에 누르기) → 릴 싸움.
//
// 자리를 세 곳 중에 고릅니다. 깊은 자리일수록 큰 물고기가 나오지만 챔질할 시간이 짧고
// 힘도 세서 놓치기 쉽습니다. 배당은 자리마다 다르지만 환급률은 세 자리가 비슷하게 맞췄습니다.
//
// 환급률은 아래 playOutFishing으로 20만 판을 돌려 실제로 재고 정한 값입니다.
// 값은 이 파일 아래 주석에 적어 두었습니다.

export type FishingSpotId = 'shore' | 'pier' | 'open';

export type Fish = {
  name: string;
  /** 뽑기 가중치. 같은 자리 안에서의 상대 비율입니다. */
  weight: number;
  /** 잡았을 때 받는 배수 */
  payout: number;
  /** 챔질을 받아 주는 시간(ms). 큰 물고기일수록 짧습니다. */
  hookWindow: number;
  /** 버티는 힘. 클수록 릴 싸움에서 줄이 잘 끊깁니다. */
  power: number;
};

export type FishingSpot = {
  id: FishingSpotId;
  name: string;
  detail: string;
  fish: Fish[];
};

export const fishingSpots: FishingSpot[] = [
  {
    id: 'shore',
    name: '갯바위',
    detail: '작은 고기가 자주 뭅니다 · 챔질이 쉽고 힘도 약합니다',
    fish: [
      { name: '불가사리', weight: 22, payout: 0, hookWindow: 900, power: 6 },
      { name: '망둑어', weight: 26, payout: 1.2, hookWindow: 900, power: 8 },
      { name: '볼락', weight: 22, payout: 1.2, hookWindow: 820, power: 13 },
      { name: '우럭', weight: 18, payout: 1.2, hookWindow: 740, power: 19 },
      { name: '광어', weight: 10, payout: 2, hookWindow: 640, power: 26 },
      { name: '돌돔', weight: 4, payout: 5.8, hookWindow: 520, power: 34 },
    ],
  },
  {
    id: 'pier',
    name: '방파제',
    detail: '중간 크기가 섞여 나옵니다',
    fish: [
      { name: '복어', weight: 20, payout: 0, hookWindow: 840, power: 10 },
      { name: '전갱이', weight: 24, payout: 1.2, hookWindow: 820, power: 12 },
      { name: '농어', weight: 21, payout: 1.2, hookWindow: 720, power: 19 },
      { name: '감성돔', weight: 18, payout: 1.3, hookWindow: 620, power: 26 },
      { name: '부시리', weight: 12, payout: 2.2, hookWindow: 540, power: 34 },
      { name: '방어', weight: 5, payout: 7, hookWindow: 460, power: 42 },
    ],
  },
  {
    id: 'open',
    name: '먼바다',
    detail: '큰 고기만 뭅니다 · 챔질할 틈이 짧고 힘이 셉니다',
    fish: [
      { name: '해파리', weight: 18, payout: 0, hookWindow: 720, power: 14 },
      { name: '삼치', weight: 22, payout: 1.2, hookWindow: 700, power: 18 },
      { name: '대구', weight: 20, payout: 1.3, hookWindow: 620, power: 26 },
      { name: '참돔', weight: 18, payout: 1.6, hookWindow: 540, power: 34 },
      { name: '다랑어', weight: 14, payout: 2.5, hookWindow: 460, power: 44 },
      { name: '청새치', weight: 8, payout: 7.4, hookWindow: 380, power: 54 },
    ],
  },
];

export const findFishingSpot = (id: FishingSpotId): FishingSpot => {
  const found = fishingSpots.find((spot) => spot.id === id);
  if (!found) throw new Error(`없는 낚시 자리 ${id}`);
  return found;
};

/** 입질까지 기다리는 시간. 너무 짧으면 준비할 틈이 없고 너무 길면 지루합니다. */
export const biteDelayMin = 1200;
export const biteDelayMax = 4200;
export const biteDelay = (random: () => number = Math.random): number =>
  Math.round(biteDelayMin + random() * (biteDelayMax - biteDelayMin));

/** 자리 안에서 물고기 한 마리를 뽑습니다. */
export function pickFish(spot: FishingSpot, random: () => number = Math.random): Fish {
  const total = spot.fish.reduce((sum, fish) => sum + fish.weight, 0);
  let point = random() * total;
  for (const fish of spot.fish) {
    point -= fish.weight;
    if (point <= 0) return fish;
  }
  return spot.fish[spot.fish.length - 1];
}

/** 챔질 성공 여부. 입질이 온 뒤 hookWindow 안에 눌러야 합니다. */
export const isHooked = (fish: Fish, reactionMs: number): boolean =>
  reactionMs >= 0 && reactionMs <= fish.hookWindow;

export type FightAction = '감기' | '버티기';

export type FightState = {
  /** 0에서 100까지 채우면 건져 올립니다. */
  progress: number;
  /** 100이 되면 줄이 끊어집니다. */
  tension: number;
  /** 물고기가 남은 힘. 줄어들수록 덜 저항합니다. */
  power: number;
  landed: boolean;
  snapped: boolean;
};

export const fightGoal = 100;
export const fightBreak = 100;

export const startFight = (fish: Fish): FightState => ({
  progress: 0,
  tension: 34,
  power: fish.power,
  landed: false,
  snapped: false,
});

/**
 * 한 번 조작할 때마다 벌어지는 일입니다.
 * 감기: 많이 당겨 오지만 줄이 팽팽해집니다.
 * 버티기: 줄을 늦춰 장력을 빼지만 거의 못 당겨 옵니다.
 * 어느 쪽이든 물고기가 스스로 저항해 장력을 조금 올리고 힘을 조금 뺍니다.
 */
export function fightStep(state: FightState, action: FightAction, random: () => number = Math.random): FightState {
  if (state.landed || state.snapped) return state;
  // 물고기가 스스로 버티는 힘. 큰 물고기일수록 가만히 있어도 줄이 팽팽해집니다.
  const resist = 2 + (state.power / 100) * (9 + random() * 12);
  // 가끔 갑자기 내달립니다. 큰 물고기일수록 자주 그럽니다.
  const run = random() < state.power / 340 ? 22 + random() * 12 : 0;
  let progress = state.progress;
  let tension = state.tension;
  if (action === '감기') {
    progress += 7 + random() * 5;
    tension += 12 + random() * 10;
  } else {
    progress += random() * 2;
    tension -= 12 + random() * 7;
  }
  tension += resist + run;
  const power = Math.max(0, state.power - (1 + random() * 2));
  if (tension < 0) tension = 0;
  if (tension >= fightBreak) return { progress, tension: fightBreak, power, landed: false, snapped: true };
  if (progress >= fightGoal) return { progress: fightGoal, tension, power, landed: true, snapped: false };
  return { progress, tension, power, landed: false, snapped: false };
}

/**
 * 사람이 한 판을 끝까지 다루는 것을 흉내 냅니다. 환급률을 재는 데 씁니다.
 * hold는 이 장력을 넘으면 버티는 기준입니다. 낮게 잡을수록 조심스러운 사람입니다.
 */
export function playOutFight(fish: Fish, random: () => number = Math.random, hold = 62): boolean {
  let state = startFight(fish);
  for (let turn = 0; turn < 60; turn += 1) {
    state = fightStep(state, state.tension >= hold ? '버티기' : '감기', random);
    if (state.landed) return true;
    if (state.snapped) return false;
  }
  return false;
}

/** 잡으면 배수를 받고 놓치면 0입니다. */
export const fishingPayout = (fish: Fish, landed: boolean): number => (landed ? fish.payout : 0);

/**
 * 한 판을 처음부터 끝까지 흉내 냅니다.
 * hookRate는 챔질을 성공하는 비율입니다. 실제 사람은 자리마다 조금씩 다르지만
 * 환급률을 잴 때는 하나로 두고 봅니다.
 */
export function playOutFishing(
  spot: FishingSpot,
  random: () => number = Math.random,
  hookRate = 0.9,
  hold = 62,
): number {
  const fish = pickFish(spot, random);
  if (random() > hookRate) return 0;
  return fishingPayout(fish, playOutFight(fish, random, hold));
}

// 자리마다 40만 판씩 돌려 실제로 잰 환급률입니다(장력 62에서 버티기).
//   챔질 100% — 갯바위 106.1% · 방파제 108.2% · 먼바다 104.7%
//   챔질  95% — 갯바위 101.1% · 방파제 102.5% · 먼바다  99.6%
//   챔질  90% — 갯바위  95.5% · 방파제  97.1% · 먼바다  94.3%
//   챔질  80% — 갯바위  85.2% · 방파제  86.4% · 먼바다  83.6%
//   챔질  70% — 갯바위  74.4% · 방파제  75.9% · 먼바다  73.7%
// 다른 게임들이 94~96%이므로 챔질을 열에 아홉 맞히는 사람 기준으로 맞춘 셈입니다.
// 다 맞히면 이기고 대충 누르면 크게 잃습니다. 그게 이 게임의 재미입니다.
export const fishingMeasuredReturn: Record<FishingSpotId, number> = {
  shore: 0.955,
  pier: 0.971,
  open: 0.943,
};
