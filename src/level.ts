/**
 * 플레이어 레벨.
 *
 * 실제 카지노의 등급이 "얼마나 이겼는지"가 아니라 "얼마나 플레이했는지"로
 * 오르는 것과 같게, 누적 플레이 판수만으로 올라갑니다.
 * 이렇게 하면 잃는 판에도 레벨이 오르고, 레벨이 내려가는 일이 없습니다.
 *
 * 레벨 n에서 다음 레벨까지 필요한 판수는 n × 10판입니다.
 * 그래서 레벨 n이 시작되는 누적 판수는 5 × n × (n − 1)판이 됩니다.
 *   LV.1 = 0판 · LV.2 = 10판 · LV.3 = 30판 · LV.4 = 60판 · LV.5 = 100판 …
 */
export const PLAYS_PER_LEVEL_STEP = 10;

/** 그 레벨이 시작되는 누적 판수 */
export const playsToReachLevel = (level: number) =>
  level <= 1 ? 0 : PLAYS_PER_LEVEL_STEP * (level * (level - 1)) / 2;

export type LevelProgress = {
  level: number;
  /** 지금 레벨에서 몇 판 했는지 */
  playsIntoLevel: number;
  /** 지금 레벨을 통과하는 데 필요한 총 판수 */
  playsForLevel: number;
  /** 다음 레벨까지 남은 판수 */
  playsToNext: number;
  /** 0~1. 진행 막대에 그대로 씁니다 */
  progress: number;
};

/** 누적 판수로 레벨과 진행도를 계산합니다. */
export function levelFromPlays(totalPlays: number): LevelProgress {
  const plays = Math.max(0, Math.floor(totalPlays));
  let level = 1;
  // 판수가 아주 커도 몇 번만 돌면 끝납니다(레벨 100이면 49,500판).
  while (plays >= playsToReachLevel(level + 1)) level += 1;
  const start = playsToReachLevel(level);
  const playsForLevel = level * PLAYS_PER_LEVEL_STEP;
  const playsIntoLevel = plays - start;
  return {
    level,
    playsIntoLevel,
    playsForLevel,
    playsToNext: playsForLevel - playsIntoLevel,
    progress: playsIntoLevel / playsForLevel,
  };
}
