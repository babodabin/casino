/** 오늘의 미션: 하루에 이만큼 플레이하면 보상을 한 번 받습니다. */
export const DAILY_MISSION_GOAL = 3;
export const DAILY_MISSION_REWARD = 300;

/** 저장에 쓰는 날짜 문자열. 기기의 자정을 기준으로 하루를 나눕니다. */
export const missionDayKey = (date: Date) => date.toDateString();

/** 오늘 몇 판 했는지. 기록의 playedAt을 그대로 셉니다. */
export function countPlayedOn(records: { playedAt: string }[], day: string) {
  return records.filter((record) => missionDayKey(new Date(record.playedAt)) === day).length;
}

/** 오늘 보상을 받을 수 있는 상태인지. 목표를 채웠고 아직 안 받은 날이어야 합니다. */
export function shouldClaimMission(playedToday: number, claimedDay: string, today: string) {
  return playedToday >= DAILY_MISSION_GOAL && claimedDay !== today;
}
