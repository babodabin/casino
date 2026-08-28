// 스포츠 / 사회문제 — 이미 결과가 나온 실제 사건을 놓고 예·아니오를 맞히는 게임입니다.
//
// 문제와 결과는 kalshi.com에서 받아옵니다(scripts/fetch-kalshi.mjs).
// 배당은 그 사건이 끝나기 전에 시장이 매기고 있던 값에서 뽑습니다.
// 마감가는 결과가 이미 드러난 뒤라 0.99나 0.01이어서 못 쓰고,
// 마감 몇 시간 전 값을 씁니다. 그때 사람들이 실제로 그렇게 봤다는 뜻입니다.
//
// 시장이 예를 61%로 봤다면 예의 배당은 0.94/0.61 = 1.54배, 아니오는 0.94/0.39 = 2.41배입니다.
// 어느 쪽에 걸든 환급률은 94%로 같습니다. 시장보다 잘 아는 만큼만 이깁니다.

export type PredictSide = 'yes' | 'no';
export type PredictBucket = '어제' | '지난주' | '예전';
export type PredictGroup = '스포츠' | '사회문제';

export type PredictQuestion = {
  id: string;
  bucket: PredictBucket;
  /** kalshi가 붙인 갈래. Sports면 스포츠, 나머지는 전부 사회문제로 묶습니다. */
  category: string;
  /** 화면에 보여줄 문장. 스포츠는 우리말로 바꿔 두었고 사회문제는 원문 그대로입니다. */
  title: string;
  sourceTitle: string;
  yesLabel: string;
  noLabel: string;
  closeTime: string;
  result: PredictSide;
  /** 끝나기 전에 시장이 본 '예'의 확률. 0.08~0.92 사이입니다. */
  probability: number;
  volume: number;
};

/** 어느 쪽에 걸어도 이만큼만 돌려줍니다. 나머지가 하우스 몫입니다. */
export const predictHouseReturn = 0.94;
// 확률이 이 밖으로 나가면 문제로 쓰지 않습니다.
// 위아래로 0.94를 넘어가면 배당이 1배 아래로 떨어져서, 맞혀도 손해가 납니다.
// 여유를 두어 0.08~0.92로 잡았습니다. 배당은 1.02배에서 11.75배 사이가 됩니다.
export const predictMinProbability = 0.08;
export const predictMaxProbability = 0.92;

export const predictGroupOf = (question: PredictQuestion): PredictGroup => (question.category === 'Sports' ? '스포츠' : '사회문제');

export const predictChance = (question: PredictQuestion, side: PredictSide): number =>
  side === 'yes' ? question.probability : 1 - question.probability;

/** 배당. 시장이 본 확률의 역수에 하우스 몫을 곱한 값입니다. */
export function predictMultiplier(question: PredictQuestion, side: PredictSide): number {
  const chance = predictChance(question, side);
  if (!(chance > 0)) throw new Error('확률이 0인 쪽에는 걸 수 없습니다.');
  return Number((predictHouseReturn / chance).toFixed(2));
}

export function settlePredict(question: PredictQuestion, side: PredictSide): { won: boolean; multiplier: number } {
  const won = question.result === side;
  return { won, multiplier: won ? predictMultiplier(question, side) : 0 };
}

export const isUsablePredictQuestion = (question: PredictQuestion): boolean =>
  (question.result === 'yes' || question.result === 'no') &&
  question.probability >= predictMinProbability &&
  question.probability <= predictMaxProbability &&
  question.title.trim().length > 0;

/**
 * 다음에 낼 문제를 고릅니다.
 * 이미 푼 것은 건너뛰고, 다 풀었으면 처음부터 다시 냅니다.
 */
export function pickPredictQuestion(
  questions: PredictQuestion[],
  group: PredictGroup,
  solved: string[] = [],
  random: () => number = Math.random,
): PredictQuestion | null {
  const pool = questions.filter((item) => isUsablePredictQuestion(item) && predictGroupOf(item) === group);
  if (pool.length === 0) return null;
  const fresh = pool.filter((item) => !solved.includes(item.id));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(random() * from.length)] ?? from[0];
}

/** 시장이 어느 쪽을 더 유력하게 봤는지. 화면에서 '시장은 이렇게 봤다'로 보여 줍니다. */
export const predictFavourite = (question: PredictQuestion): PredictSide => (question.probability >= 0.5 ? 'yes' : 'no');

export const predictPercent = (question: PredictQuestion, side: PredictSide): number =>
  Math.round(predictChance(question, side) * 100);
