// 윷 베팅 — 말을 옮기는 윷놀이가 아니라 '한 번 던진 결과'에 거는 게임입니다.
// 윷가락 네 개는 각각 배(평평한 면)와 등(둥근 면)이 있고, 배가 위로 오는 것을 셉니다.
// 배가 1개면 도, 2개면 개, 3개면 걸, 4개면 윷, 하나도 없으면 모입니다.

export type YutFace = '배' | '등';
export type YutOutcome = '도' | '개' | '걸' | '윷' | '모';

export const yutOutcomes: YutOutcome[] = ['도', '개', '걸', '윷', '모'];

// 배가 위로 올 확률을 1/2로 두면 네 개를 던졌을 때 배의 개수는 16가지 경우로 갈립니다.
// 도 4/16, 개 6/16, 걸 4/16, 윷 1/16, 모 1/16.
export const yutProbability: Record<YutOutcome, number> = {
  도: 4 / 16,
  개: 6 / 16,
  걸: 4 / 16,
  윷: 1 / 16,
  모: 1 / 16,
};

// 배당은 확률의 역수보다 살짝 낮게 두어 장기적으로 약 94%가 돌아오도록 맞췄습니다.
export const yutPayout: Record<YutOutcome, number> = {
  도: 3.8,
  개: 2.5,
  걸: 3.8,
  윷: 15,
  모: 15,
};

export const yutDescription: Record<YutOutcome, string> = {
  도: '배 1개 · 한 칸',
  개: '배 2개 · 두 칸',
  걸: '배 3개 · 세 칸',
  윷: '배 4개 · 한 번 더',
  모: '배 0개 · 한 번 더',
};

export const throwYutSticks = (random: () => number = Math.random): YutFace[] =>
  Array.from({ length: 4 }, () => (random() < 0.5 ? '배' : '등'));

export const readYutSticks = (sticks: YutFace[]): YutOutcome => {
  const flat = sticks.filter(face => face === '배').length;
  return flat === 0 ? '모' : flat === 1 ? '도' : flat === 2 ? '개' : flat === 3 ? '걸' : '윷';
};

export const throwYut = (random: () => number = Math.random) => {
  const sticks = throwYutSticks(random);
  return { sticks, outcome: readYutSticks(sticks) };
};

export const yutMultiplier = (choice: YutOutcome, outcome: YutOutcome): number =>
  choice === outcome ? yutPayout[choice] : 0;

// 배당률이 의도한 환급률을 벗어나지 않는지 확인할 때 씁니다.
export const yutReturnRate = (choice: YutOutcome): number => yutProbability[choice] * yutPayout[choice];
