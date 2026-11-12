// 끊긴 판 — 돈을 걸어 둔 채로 화면이 다시 열렸을 때(새로고침 · 폰이 탭을 내렸다 다시 올림).
//
// 전에는 건 돈이 **기록 없이** 사라졌습니다. 블랙잭에 500을 걸고 새로고침하면 코인만 줄고
// 기록 · 지갑 셈에는 아무것도 안 남았습니다(2026-11-11에 확인).
//
// 정한 것(2026-11-11): **끊긴 판은 패배**입니다. 돌려주면 지는 판에서 새로고침으로 물릴 수 있고,
// 판 중에 나가면 포기가 되는 규칙과도 안 맞습니다.
//
// 방법: 돈을 걸 때마다 "지금 걸려 있는 돈"을 저장소에 적어 두고, 판이 정산되면 지웁니다.
// 앱이 열릴 때 그 값이 남아 있으면 정산을 못 하고 끊긴 것이므로 패배 기록을 하나 만듭니다.

export type AtRisk = {
  /** 아직 정산되지 않은 돈. */
  amount: number;
  game: string;
  difficulty: string;
  /** 처음 건 때(ISO). 기록의 시각으로 씁니다. */
  at: string;
};

export const interruptedDetail = '끊긴 판 · 화면이 다시 열려 패배로 적었습니다';

/** 저장소에서 읽은 글자를 풉니다. 깨졌거나 걸린 돈이 없으면 null입니다. */
export function readAtRisk(raw: string | null | undefined): AtRisk | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AtRisk>;
    if (typeof parsed.amount !== 'number' || !Number.isFinite(parsed.amount) || parsed.amount <= 0) return null;
    if (typeof parsed.game !== 'string' || !parsed.game) return null;
    const at = typeof parsed.at === 'string' && !Number.isNaN(Date.parse(parsed.at)) ? parsed.at : new Date().toISOString();
    return { amount: Math.round(parsed.amount), game: parsed.game, difficulty: typeof parsed.difficulty === 'string' ? parsed.difficulty : '보통', at };
  } catch {
    return null;
  }
}

/** 돈을 더 걸었을 때. 한 판에 여러 번 걸어도(더블 · 레이즈 · 상점) 처음 건 때와 게임은 그대로 둡니다. */
export function addAtRisk(current: AtRisk | null, stake: number, game: string, difficulty: string, now: string): AtRisk {
  return current ? { ...current, amount: current.amount + stake } : { amount: stake, game, difficulty, at: now };
}

/** 끊긴 판을 패배 기록으로 바꿉니다. */
export function interruptedRecord(cut: AtRisk) {
  return {
    id: `${Date.parse(cut.at)}-cut`,
    game: cut.game,
    result: 'loss' as const,
    difficulty: cut.difficulty,
    bet: cut.amount,
    net: -cut.amount,
    playedAt: cut.at,
    detail: interruptedDetail,
  };
}
