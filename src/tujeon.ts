// 투전(鬪箋) — 조선시대에 돈을 걸고 하던 종이패 놀이입니다.
// 패는 여덟 무리(사람·물고기·새·꿩·별·말·노루·토끼)에 1부터 10까지, 모두 여든 장입니다.
//
// 투전에는 돌려대기·동동이·찍기 같은 여러 놀이가 있었고 지역마다 달랐습니다.
// 여기서는 같은 숫자를 짝지어 겨루는 '동동이' 계열로 정리했습니다.
// 돌려대기(가보잡기)는 다섯 장 중 셋으로 짓고 남은 둘로 겨루는 방식이라
// 이 앱의 도리짓고땡과 사실상 같아져서 택하지 않았습니다.
// 여든 장 구성은 전해지는 그대로지만, 아래 족보 순서와 배당은 이 앱에서 정한 것입니다.

export type TujeonSuit = '사람' | '물고기' | '새' | '꿩' | '별' | '말' | '노루' | '토끼';
export type TujeonCard = { id: string; suit: TujeonSuit; number: number };
export type TujeonResult = 'win' | 'loss' | 'push';
export type TujeonHand = { category: number; label: string; tiebreak: number[]; cards: TujeonCard[] };

export const tujeonSuits: TujeonSuit[] = ['사람', '물고기', '새', '꿩', '별', '말', '노루', '토끼'];
export const tujeonSuitMarks: Record<TujeonSuit, string> = { 사람: '人', 물고기: '魚', 새: '鳥', 꿩: '雉', 별: '星', 말: '馬', 노루: '獐', 토끼: '兎' };
export const tujeonHandSize = 5;

/** 족보 번호. 클수록 셉니다. */
export const tujeonCategories = { 끗: 0, 동동: 1, 두동동: 2, 삼동: 3, 사동: 4, 오동: 5 } as const;

export function createTujeonDeck(): TujeonCard[] {
  return tujeonSuits.flatMap((suit) => Array.from({ length: 10 }, (_, index) => ({ id: `${suit}-${index + 1}`, suit, number: index + 1 })));
}

export function shuffleTujeon(cards: TujeonCard[], random: () => number = Math.random): TujeonCard[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

export function dealTujeon(random: () => number = Math.random): { player: TujeonCard[]; opponent: TujeonCard[] } {
  const deck = shuffleTujeon(createTujeonDeck(), random);
  return { player: deck.slice(0, tujeonHandSize), opponent: deck.slice(tujeonHandSize, tujeonHandSize * 2) };
}

/** 짝이 하나도 없을 때 쓰는 끗. 다섯 장을 더한 끝자리이고 9가 가보, 0이 망통입니다. */
export const tujeonPoint = (cards: TujeonCard[]): number => cards.reduce((sum, card) => sum + card.number, 0) % 10;
export const tujeonPointName = (point: number): string => (point === 9 ? '가보' : point === 0 ? '망통' : `${point}끗`);

export function evaluateTujeon(cards: TujeonCard[]): TujeonHand {
  if (cards.length !== tujeonHandSize) throw new Error('투전은 다섯 장으로 겨룹니다.');
  const counts = new Map<number, number>();
  cards.forEach((card) => counts.set(card.number, (counts.get(card.number) ?? 0) + 1));
  // 많이 모인 숫자부터, 같은 개수면 큰 숫자부터 봅니다.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const [topNumber, topCount] = groups[0];
  const rest = (exclude: number[]) => cards.filter((card) => !exclude.includes(card.number)).map((card) => card.number).sort((a, b) => b - a);
  const ordered = [...cards].sort((a, b) => b.number - a.number);
  const grouped = groups.flatMap(([number]) => ordered.filter((card) => card.number === number));

  if (topCount === 5) return { category: 5, label: `${topNumber} 오동`, tiebreak: [topNumber], cards: grouped };
  if (topCount === 4) return { category: 4, label: `${topNumber} 사동`, tiebreak: [topNumber, ...rest([topNumber])], cards: grouped };
  if (topCount === 3) {
    // 삼동에 동동이 붙으면 붙은 짝의 숫자로 갈립니다. 짝이 없으면 남은 두 장을 봅니다.
    const pair = groups[1][1] === 2 ? groups[1][0] : 0;
    const tail = pair ? [] : rest([topNumber]);
    return { category: 3, label: pair ? `${topNumber} 삼동에 ${pair} 동동` : `${topNumber} 삼동`, tiebreak: [topNumber, pair, ...tail], cards: grouped };
  }
  if (topCount === 2 && groups[1][1] === 2) {
    const [high, low] = [topNumber, groups[1][0]].sort((a, b) => b - a);
    return { category: 2, label: `${high}·${low} 두동동`, tiebreak: [high, low, ...rest([high, low])], cards: grouped };
  }
  if (topCount === 2) return { category: 1, label: `${topNumber} 동동`, tiebreak: [topNumber, ...rest([topNumber])], cards: grouped };
  const point = tujeonPoint(cards);
  return { category: 0, label: tujeonPointName(point), tiebreak: [point, ...ordered.map((card) => card.number)], cards: ordered };
}

export function compareTujeon(a: TujeonHand, b: TujeonHand): number {
  if (a.category !== b.category) return Math.sign(a.category - b.category);
  const length = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a.tiebreak[index] ?? 0) - (b.tiebreak[index] ?? 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

// 배당은 20만 판을 돌려 맞췄습니다. 패를 보고 죽을 수 있어서 이기면 두 배로 두면
// 환급률이 100%를 넘습니다. 승리 1.9배·죽기 0.35배면 죽지 않고 계속 받는 사람이 95.4%,
// 나쁜 끗에서 잘 죽는 사람이 98.5%로 죽기가 이득이면서도 100%를 넘지 않습니다.
export const tujeonWinPayout = 1.9;
/** 죽었을 때 돌려받는 몫입니다. */
export const tujeonFoldRefund = 0.35;
/** 이기면 1.9배, 비기면 그대로, 지면 0입니다. 죽으면 위의 몫만 돌려받습니다. */
export const tujeonMultiplier = (result: TujeonResult): number => (result === 'win' ? tujeonWinPayout : result === 'push' ? 1 : 0);

export function resolveTujeon(player: TujeonCard[], opponent: TujeonCard[]): { result: TujeonResult; playerHand: TujeonHand; opponentHand: TujeonHand } {
  const playerHand = evaluateTujeon(player), opponentHand = evaluateTujeon(opponent);
  const compared = compareTujeon(playerHand, opponentHand);
  return { result: compared > 0 ? 'win' : compared < 0 ? 'loss' : 'push', playerHand, opponentHand };
}

/** 패가 이 정도면 죽는 게 낫다는 기준. 화면의 '죽기' 안내와 환급률 계산에 함께 씁니다. */
export const shouldFoldTujeon = (hand: TujeonHand): boolean => hand.category === 0 && hand.tiebreak[0] <= 4;
