// 일본식 파치슬로(AT 타입)를 앱에 맞게 줄여 옮긴 것입니다.
//
// 실제 파치슬로가 파칭코와 다른 점은 딱 셋이고, 이 파일은 그 셋을 담습니다.
//   1. 천장   — 당첨 없이 999게임을 돌리면 무조건 당첨됩니다. 파칭코에는 없습니다
//   2. 찬스존 — 150게임마다 확정적으로 기회 구간이 옵니다
//   3. 순증   — 당첨(AT) 중에는 1게임마다 메달이 일정하게 불어납니다
//
// 단위는 실제 기기와 같은 '매'(메달)입니다. 1게임에 3매를 넣습니다.
// 통상에서는 넣은 3매 중 평균 1.6매만 돌아와 조금씩 줄고(순감),
// AT에 들어가면 평균 5.5매가 돌아와 1게임마다 2.5매씩 늘어납니다(순증 2.5).
//
// 화면에서는 3매 = 베팅 금액 한 번으로 바꿔 씁니다.

// ⚠️ 종(🔔) 대신 왕관(👑)을 씁니다. 배당을 정하는 것은 아래 '벨' 역할이고 여기 그림은 보이기만 합니다.
export const pachiSymbols = ['🍒', '🍋', '👑', '⭐', '💎', '7️⃣', '🔁'] as const;
export type PachiSymbol = typeof pachiSymbols[number];
export type PachiReels = [PachiSymbol, PachiSymbol, PachiSymbol];

/** 통상 → (찬스존) → AT → 통상으로 돌아옵니다. */
export type PachiPhase = '통상' | '찬스존' | 'AT';
export type PachiRole = '꽝' | '체리' | '벨' | '리플레이' | '찬스존' | 'AT';

export type PachiState = {
  phase: PachiPhase;
  /** 마지막 당첨 이후 돌린 게임 수. 천장은 이 수로 셉니다. */
  games: number;
  /** 찬스존 남은 게임 수. */
  zoneLeft: number;
  /** AT 남은 게임 수. */
  atLeft: number;
  /** AT가 몇 세트째 이어졌는지. */
  atSets: number;
  /** 이번 AT에서 지금까지 불어난 매수. AT가 끝나면 0으로 돌아갑니다. */
  atMedals: number;
  /** 다음 게임이 리플레이(무료)인지. */
  freeNext: boolean;
};

/** 1게임에 넣는 매수. 실제 기기와 같습니다. */
export const pachiBetMedals = 3;
/** 천장. 이 게임 수에 닿으면 무조건 당첨됩니다. */
export const pachiCeiling = 999;
/** 찬스존이 오는 간격. */
export const pachiZoneEvery = 150;
/** 찬스존이 이어지는 게임 수. */
export const pachiZoneGames = 5;
/** 찬스존 1게임마다의 성공 확률. 5게임 전체로는 1-(1-0.05)^5 = 22.6%입니다. */
export const pachiZoneHit = 0.05;
/** 통상 1게임마다의 직접 당첨 확률. */
export const pachiAtOdds = 1 / 299;
/** AT 한 세트의 게임 수. 천장으로 들어가면 은혜로 두 배를 받습니다. */
export const pachiAtSet = 50;
/** AT 한 세트가 끝날 때 이어질 확률. */
export const pachiAtContinue = 0.551;

/** 통상에서 나오는 작은 역과 그 매수. 평균 1.61매가 돌아옵니다. */
const normalRoles: { role: PachiRole; odds: number; medals: number }[] = [
  { role: '벨', odds: 1 / 7, medals: 8 },
  { role: '리플레이', odds: 1 / 7.3, medals: 0 },
  { role: '체리', odds: 1 / 35, medals: 2 },
];
/** AT 중에는 벨이 훨씬 자주 나옵니다. 이것이 순증의 정체입니다. */
const atBellOdds = 0.62;

const reelsOf: Record<PachiRole, PachiReels> = {
  'AT': ['7️⃣', '7️⃣', '7️⃣'],
  '찬스존': ['⭐', '⭐', '⭐'],
  '벨': ['👑', '👑', '👑'],
  '리플레이': ['🔁', '🔁', '🔁'],
  '체리': ['🍒', '🍋', '💎'],
  '꽝': ['🍋', '💎', '🍒'],
};

/** 꽝은 그림이 매번 달라 보여야 합니다. 당첨 줄만 안 만들면 됩니다. */
function missReels(random: () => number): PachiReels {
  const pick = () => pachiSymbols[Math.floor(random() * pachiSymbols.length)];
  for (let tries = 0; tries < 20; tries += 1) {
    const reels: PachiReels = [pick(), pick(), pick()];
    const [a, b, c] = reels;
    if (!(a === b && b === c) && a !== '🍒') return reels;
  }
  return reelsOf['꽝'];
}

export const createPachiState = (): PachiState => ({ phase: '통상', games: 0, zoneLeft: 0, atLeft: 0, atSets: 0, atMedals: 0, freeNext: false });

export type PachiSpin = {
  state: PachiState;
  role: PachiRole;
  reels: PachiReels;
  /** 이번 게임에 넣은 매수. 리플레이 다음 게임은 0입니다. */
  inMedals: number;
  /** 이번 게임에 돌아온 매수. */
  outMedals: number;
  /** 천장에 닿아 들어간 당첨인지. */
  byCeiling: boolean;
  label: string;
};

/** 천장까지 남은 게임 수. 통상에서만 뜻이 있습니다. */
export const pachiToCeiling = (state: PachiState): number => Math.max(0, pachiCeiling - state.games);
/** 다음 찬스존까지 남은 게임 수. */
export const pachiToZone = (state: PachiState): number => (state.phase === 'AT' ? 0 : Math.max(0, pachiZoneEvery - (state.games % pachiZoneEvery)));

function enterAt(state: PachiState, byCeiling: boolean): PachiState {
  return { ...state, phase: 'AT', games: 0, zoneLeft: 0, atLeft: byCeiling ? pachiAtSet * 2 : pachiAtSet, atSets: 1, atMedals: 0 };
}

/**
 * 한 게임을 돌립니다. 실제 기기처럼 역을 먼저 뽑고 그에 맞는 릴을 만듭니다.
 * (릴을 먼저 굴려 우연히 맞기를 기다리는 방식이 아닙니다.)
 */
export function spinPachi(state: PachiState, random: () => number = Math.random): PachiSpin {
  const inMedals = state.freeNext ? 0 : pachiBetMedals;
  const next: PachiState = { ...state, freeNext: false };

  if (next.phase === 'AT') {
    const roll = random();
    const role: PachiRole = roll < atBellOdds ? '벨' : roll < atBellOdds + 1 / 7.3 ? '리플레이' : roll < atBellOdds + 1 / 7.3 + 1 / 35 ? '체리' : '꽝';
    const outMedals = role === '벨' ? 8 : role === '체리' ? 2 : 0;
    next.freeNext = role === '리플레이';
    next.atLeft -= 1;
    next.atMedals += outMedals - inMedals;
    let label = `AT ${next.atLeft}게임 남음`;
    if (next.atLeft <= 0) {
      if (random() < pachiAtContinue) {
        next.atLeft = pachiAtSet;
        next.atSets += 1;
        label = `${next.atSets}세트째 계속!`;
      } else {
        label = `AT 종료 · ${next.atMedals}매 획득`;
        next.phase = '통상';
        next.atSets = 0;
      }
    }
    return { state: next, role, reels: role === '꽝' ? missReels(random) : reelsOf[role], inMedals, outMedals, byCeiling: false, label };
  }

  next.games += 1;

  // 천장이 먼저입니다. 999게임에 닿으면 다른 추첨을 보지 않습니다.
  if (next.games >= pachiCeiling) {
    return { state: enterAt(next, true), role: 'AT', reels: reelsOf['AT'], inMedals, outMedals: 0, byCeiling: true, label: `천장 도달! 은혜로 AT ${pachiAtSet * 2}게임` };
  }

  const zone = next.phase === '찬스존';
  const hit = zone ? random() < pachiZoneHit : random() < pachiAtOdds;
  if (hit) {
    return { state: enterAt(next, false), role: 'AT', reels: reelsOf['AT'], inMedals, outMedals: 0, byCeiling: false, label: zone ? `찬스존 성공! AT ${pachiAtSet}게임` : `AT 당첨! ${pachiAtSet}게임` };
  }

  if (zone) {
    next.zoneLeft -= 1;
    if (next.zoneLeft <= 0) next.phase = '통상';
  } else if (next.games % pachiZoneEvery === 0) {
    next.phase = '찬스존';
    next.zoneLeft = pachiZoneGames;
    return { state: next, role: '찬스존', reels: reelsOf['찬스존'], inMedals, outMedals: 0, byCeiling: false, label: `찬스존 돌입 · ${pachiZoneGames}게임` };
  }

  // 작은 역 추첨.
  let roll = random();
  for (const item of normalRoles) {
    if (roll < item.odds) {
      next.freeNext = item.role === '리플레이';
      const suffix = zone ? ` · 찬스존 ${next.zoneLeft}게임 남음` : '';
      return { state: next, role: item.role, reels: reelsOf[item.role], inMedals, outMedals: item.medals, byCeiling: false, label: `${item.role}${suffix}` };
    }
    roll -= item.odds;
  }

  const suffix = zone ? `찬스존 ${next.zoneLeft}게임 남음` : `${next.games}게임 · 천장까지 ${pachiToCeiling(next)}`;
  return { state: next, role: '꽝', reels: missReels(random), inMedals, outMedals: 0, byCeiling: false, label: suffix };
}

// ── 2000만 게임을 돌려 잰 값 (2026-08-30) ───────────────────────────────
//
//   환급률        94.82%            (3백만 게임씩 12번 따로 재면 평균 95.07%)
//   당첨 간격     평균 225게임 (통상 73.5% · 찬스존 25.7% · 천장 0.8%)
//   AT 한 번      평균 111.3게임 · 268매 획득
//   AT 순증       2.43매/G          (붙여 주신 글의 순증 2.5와 같은 자리)
//   통상 순감     1.40매/G          (천엔 250발 → 33회전과 같은 자리)
//   AT 비중       전체 게임의 33.1%
//
// 맞춘 방법: 통상 순감과 AT 순증은 실제 기기 값(1.5 / 2.5)에 맞춰 두고,
// AT가 이어질 확률(pachiAtContinue)만 움직여 환급률을 95%에 맞췄습니다.
// 이 값을 올리면 AT가 길어져 환급률이 같이 올라갑니다.
//
// ⚠️ 이 기계는 재는 값이 많이 흔들립니다. AT가 세트로 이어지는 구조라
// 아주 긴 AT가 드물게 나오고 그 한 번이 평균을 끌어올리기 때문입니다.
// 100만 게임을 돌리면 한 번 잴 때마다 94~96% 사이를 오갑니다(표준편차 0.5%p).
// 그래서 짧게 한 번 돌려 보고 배당을 고치면 안 됩니다. 최소 2000만 게임을 돌리세요.
// 테스트(tests/pachislot.test.ts)의 범위를 93~97%로 넉넉히 잡은 것도 같은 이유입니다.
//
// 천장 당첨이 0.8%로 드문 것은 찬스존이 150게임마다 오기 때문입니다.
// 찬스존이 없으면 (1-1/299)^999 = 3.5%가 천장까지 갑니다.
