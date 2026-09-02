import { countByKind, countRibbons, createHwatuDeck, isRainBright, pieceValue, shuffleHwatu, type HwatuCard } from './hwatu.ts';

export type GoStopMode = 'gostop' | 'matgo';
export type GoStopDeckStyle = 'classic' | 'bonus';

export type GoStopScore = {
  total: number;
  bright: number;
  animal: number;
  ribbon: number;
  pi: number;
  bonuses: string[];
  counts: ReturnType<typeof countByKind>;
};

export type GoStopPlayer = {
  hand: HwatuCard[];
  captured: HwatuCard[];
  goCount: number;
  /**
   * 마지막으로 고를 외쳤을 때의 점수.
   * 고·스톱은 **점수가 오른 차례에만** 묻습니다. 3점에서 고를 외쳤으면 4점이 되어야
   * 다시 묻습니다. 이 값이 없으면 기준 점수만 넘으면 차례마다 계속 물어봅니다.
   */
  decidedAtScore?: number;
  /** 흔들기와 폭탄은 각각 최종 금액을 두 배로 만듭니다. */
  shakeCount?: number;
  shakenMonths?: number[];
};

export type GoStopSettlement = {
  baseScore: number;
  goScore: number;
  multiplier: number;
  finalPoints: number;
  reasons: string[];
};

export type GoStopRound = {
  mode: GoStopMode;
  deckStyle?: GoStopDeckStyle;
  players: GoStopPlayer[];
  floor: HwatuCard[];
  deck: HwatuCard[];
  turn: number;
  finished: boolean;
  winner: number | null;
  pendingDecision?: number | null;
  lastEvents?: string[];
  nagari?: boolean;
  message: string;
};

export type MatchChoice = { playedMatchId?: string; drawnMatchId?: string };

const removeCard = (cards: HwatuCard[], id: string) => cards.filter((card) => card.id !== id);
const sameMonth = (cards: HwatuCard[], month: number) => cards.filter((card) => card.month === month);

/** 고스톱은 3명 7장·바닥 6장, 맞고는 2명 10장·바닥 8장으로 시작합니다. */
export function createGoStopBonusCards(): HwatuCard[] {
  return [2, 3].map((value) => ({ id: `bonus-${value}pi`, month: 0, kind: '피' as const, bonus: value, name: `보너스 ${value}피` }));
}

/**
 * 새 판을 돌립니다. `firstTurn`은 **먼저 낼 사람**입니다 —
 * 고스톱은 **이긴 사람이 다음 판을 먼저 냅니다.** 안 주면 0번(나)부터입니다.
 */
export function dealGoStop(mode: GoStopMode = 'gostop', random: () => number = Math.random, deckStyle: GoStopDeckStyle = 'classic', firstTurn = 0): GoStopRound {
  return dealGoStopAttempt(mode, random, 0, deckStyle, firstTurn);
}

function dealGoStopAttempt(mode: GoStopMode, random: () => number, attempt: number, deckStyle: GoStopDeckStyle, firstTurn = 0): GoStopRound {
  const playerCount = mode === 'matgo' ? 2 : 3;
  const handSize = mode === 'matgo' ? 10 : 7;
  const floorSize = mode === 'matgo' ? 8 : 6;
  let deck = shuffleHwatu([...createHwatuDeck(), ...(deckStyle === 'bonus' ? createGoStopBonusCards() : [])], random);
  const players: GoStopPlayer[] = Array.from({ length: playerCount }, () => ({ hand: [], captured: [], goCount: 0, decidedAtScore: 0, shakeCount: 0, shakenMonths: [] }));

  // 실제 배분 순서처럼 한 장씩 돌려, 어떤 플레이어에도 같은 카드가 생기지 않게 합니다.
  for (let count = 0; count < handSize; count += 1) {
    for (const player of players) {
      let dealt = deck.shift()!;
      while (dealt?.bonus) { player.captured.push(dealt); dealt = deck.shift()!; }
      player.hand.push(dealt);
    }
  }
  const floor: HwatuCard[] = [];
  while (floor.length < floorSize) {
    const dealt = deck.shift()!;
    if (dealt.bonus) players[0].captured.push(dealt); else floor.push(dealt);
  }
  // 바닥 총통은 보통 다시 돌립니다. 잘못된 난수에서도 무한 반복하지 않도록 30회로 제한합니다.
  const floorHasFour = Array.from({ length: 12 }, (_, index) => index + 1).some((month) => sameMonth(floor, month).length === 4);
  if (floorHasFour && attempt < 30) return dealGoStopAttempt(mode, random, attempt + 1, deckStyle, firstTurn);
  const chongtongWinner = players.findIndex((player) => Array.from({ length: 12 }, (_, index) => index + 1).some((month) => sameMonth(player.hand, month).length === 4));
  return {
    mode, deckStyle, players, floor, deck, turn: Math.max(0, Math.min(playerCount - 1, firstTurn)),
    finished: chongtongWinner >= 0,
    winner: chongtongWinner >= 0 ? chongtongWinner : null,
    pendingDecision: null, lastEvents: chongtongWinner >= 0 ? ['총통'] : [], nagari: false,
    message: chongtongWinner >= 0 ? `${chongtongWinner + 1}번 총통 · 즉시 승리` : '낼 패를 고르세요',
  };
}

/** 점수 계산. 국진은 열끗으로 두며 피 전환은 화면에서 선택 규칙으로 확장할 수 있습니다. */
export function scoreGoStop(cards: HwatuCard[]): GoStopScore {
  const counts = countByKind(cards);
  const bonuses: string[] = [];
  const brights = cards.filter((card) => card.kind === '광');
  let bright = 0;
  if (brights.length === 3) {
    bright = brights.some(isRainBright) ? 2 : 3;
    bonuses.push(brights.some(isRainBright) ? '비삼광 2점' : '삼광 3점');
  } else if (brights.length === 4) {
    bright = 4; bonuses.push('사광 4점');
  } else if (brights.length >= 5) {
    bright = 15; bonuses.push('오광 15점');
  }

  let animal = counts.열끗 >= 5 ? counts.열끗 - 4 : 0;
  const godori = [2, 4, 8].every((month) => cards.some((card) => card.kind === '열끗' && card.month === month));
  if (godori) { animal += 5; bonuses.push('고도리 5점'); }

  let ribbon = counts.띠 >= 5 ? counts.띠 - 4 : 0;
  const ribbons = countRibbons(cards);
  if (ribbons.홍단 === 3) { ribbon += 3; bonuses.push('홍단 3점'); }
  if (ribbons.청단 === 3) { ribbon += 3; bonuses.push('청단 3점'); }
  if (ribbons.초단 === 3) { ribbon += 3; bonuses.push('초단 3점'); }

  const pi = counts.피 >= 10 ? counts.피 - 9 : 0;
  return { total: bright + animal + ribbon + pi, bright, animal, ribbon, pi, bonuses, counts };
}

export const goStopThreshold = (mode: GoStopMode) => mode === 'matgo' ? 7 : 3;
export const canCallGoStop = (round: GoStopRound, playerIndex = round.turn) =>
  scoreGoStop(round.players[playerIndex].captured).total >= goStopThreshold(round.mode);

/**
 * **물어볼지** 정합니다. 기준 점수를 넘은 것만으로는 모자랍니다 —
 * 고를 외친 뒤로는 **점수가 그때보다 올라야** 다시 묻습니다.
 * 그러지 않으면 한 장도 못 먹은 차례에도 고·스톱을 고르라고 합니다.
 */
export const shouldAskGoStop = (player: GoStopPlayer, mode: GoStopMode) => {
  const total = scoreGoStop(player.captured).total;
  return total >= goStopThreshold(mode) && total > (player.decidedAtScore ?? 0);
};

type CaptureResult = { floor: HwatuCard[]; captured: HwatuCard[]; matched: number };

function placeAndCapture(floor: HwatuCard[], card: HwatuCard, chosenId?: string): CaptureResult {
  const matches = sameMonth(floor, card.month);
  if (matches.length === 0) return { floor: [...floor, card], captured: [], matched: 0 };
  if (matches.length === 1) return { floor: removeCard(floor, matches[0].id), captured: [card, matches[0]], matched: 1 };
  if (matches.length === 3) {
    const ids = new Set(matches.map((item) => item.id));
    return { floor: floor.filter((item) => !ids.has(item.id)), captured: [card, ...matches], matched: 3 };
  }
  const chosen = matches.find((item) => item.id === chosenId);
  if (!chosen) throw new Error('같은 월 두 장 중 가져갈 패를 골라야 합니다.');
  return { floor: removeCard(floor, chosen.id), captured: [card, chosen], matched: 2 };
}

/**
 * 한 차례: 손패 한 장을 내고, 더미 한 장을 뒤집어 각각 같은 월을 먹습니다.
 * 두 장 중 선택해야 할 때는 choice에 바닥 패 id를 전달합니다.
 */
export function playGoStopTurn(round: GoStopRound, cardId: string, choice: MatchChoice = {}): GoStopRound {
  if (round.finished) throw new Error('이미 끝난 판입니다.');
  const player = round.players[round.turn];
  const played = player.hand.find((card) => card.id === cardId);
  if (!played) throw new Error('현재 플레이어의 손패가 아닙니다.');

  let drawIndex = 0;
  const drawnBonuses: HwatuCard[] = [];
  while (round.deck[drawIndex]?.bonus) { drawnBonuses.push(round.deck[drawIndex]); drawIndex += 1; }
  const drawn = round.deck[drawIndex];
  const originalMatches = sameMonth(round.floor, played.month);
  const events: string[] = [];
  let floor: HwatuCard[];
  let captured: HwatuCard[];

  // 뻑: 한 장을 맞춘 직후 뒤집은 패까지 같은 월이면 세 장 모두 바닥에 붙습니다.
  if (drawn && originalMatches.length === 1 && drawn.month === played.month) {
    floor = [...round.floor, played, drawn];
    captured = [];
    events.push('뻑');
  } else {
    const first = placeAndCapture(round.floor, played, choice.playedMatchId);
    const second = drawn ? placeAndCapture(first.floor, drawn, choice.drawnMatchId) : { floor: first.floor, captured: [], matched: 0 };
    floor = second.floor;
    captured = [...first.captured, ...second.captured];
    if (drawn && originalMatches.length === 0 && drawn.month === played.month) events.push('쪽');
    if (drawn && originalMatches.length === 2 && drawn.month === played.month) events.push('따닥');
    // 바닥에 같은 월 세 장이 깔려 있을 때 넷째를 내면 네 장을 한꺼번에 가져갑니다.
    // 먹기는 전부터 먹고 있었는데 **이름이 안 붙어** 화면에 아무 말도 안 떴습니다.
    if (originalMatches.length === 3) events.push('네 장 다 먹음');
    if (drawn && sameMonth(first.floor, drawn.month).length === 3) events.push('깐 패로 네 장 다 먹음');
    if (captured.length > 0 && floor.length === 0) events.push('싹쓸이');
  }

  if (drawnBonuses.length) events.unshift(...drawnBonuses.map((card) => `${card.bonus}피 보너스`));
  let players = round.players.map((item, index) => index === round.turn
    ? { ...item, hand: removeCard(item.hand, played.id), captured: [...item.captured, ...drawnBonuses, ...captured] }
    : { ...item, hand: [...item.hand], captured: [...item.captured] });
  players = stealPiFromOpponents(players, round.turn, events.filter((event) => ['쪽', '따닥', '싹쓸이', '폭탄'].includes(event)).length);
  const deck = drawn ? round.deck.slice(drawIndex + 1) : [];
  return finishGoStopTurn(round, players, floor, deck, events);
}

/**
 * 손에 같은 월 세 장, 바닥에 한 장이 있을 때 네 장을 한꺼번에 먹는 폭탄입니다.
 *
 * 폭탄 뒤에도 더미에서 한 장을 뒤집습니다. 그 패가 바닥의 같은 월 두 장과 맞으면
 * 어느 것을 가져갈지 골라야 하는데, 안 고르면 placeAndCapture가 예외를 던져
 * 판이 통째로 멈췄습니다(2026-08-30에 실제로 '1번 차례'에서 멈추는 것을 봤습니다).
 * choice를 안 주면 playGoStopTurn의 자동 선택과 같이 첫 장을 가져갑니다.
 */
export function playGoStopBomb(round: GoStopRound, month: number, choice: MatchChoice = {}): GoStopRound {
  if (round.finished) throw new Error('이미 끝난 판입니다.');
  const actor = round.turn;
  const handCards = sameMonth(round.players[actor].hand, month);
  const floorCards = sameMonth(round.floor, month);
  if (handCards.length !== 3 || floorCards.length !== 1) throw new Error('폭탄은 손의 같은 월 세 장과 바닥 한 장이 필요합니다.');
  let floor = round.floor.filter((card) => card.month !== month);
  let drawIndex = 0;
  const drawnBonuses: HwatuCard[] = [];
  while (round.deck[drawIndex]?.bonus) { drawnBonuses.push(round.deck[drawIndex]); drawIndex += 1; }
  const drawn = round.deck[drawIndex];
  let drawCapture: HwatuCard[] = [];
  if (drawn) {
    const result = placeAndCapture(floor, drawn, choice.drawnMatchId ?? sameMonth(floor, drawn.month)[0]?.id);
    floor = result.floor; drawCapture = result.captured;
  }
  const events = [...drawnBonuses.map((card) => `${card.bonus}피 보너스`), '폭탄'];
  if (floor.length === 0) events.push('싹쓸이');
  let players = round.players.map((player, index) => index === actor ? {
    ...player,
    hand: player.hand.filter((card) => card.month !== month),
    captured: [...player.captured, ...drawnBonuses, ...handCards, ...floorCards, ...drawCapture],
    shakeCount: (player.shakeCount ?? 0) + 1,
  } : { ...player, hand: [...player.hand], captured: [...player.captured] });
  players = stealPiFromOpponents(players, actor, events.filter((event) => ['폭탄', '싹쓸이'].includes(event)).length);
  return finishGoStopTurn(round, players, floor, drawn ? round.deck.slice(drawIndex + 1) : [], events);
}

/** 같은 월 세 장을 보여 주는 흔들기 선언. 실제로 낼 패는 그다음에 고릅니다. */
export function declareGoStopShake(round: GoStopRound, month: number): GoStopRound {
  if (round.finished) throw new Error('이미 끝난 판입니다.');
  if (round.pendingDecision !== null && round.pendingDecision !== undefined) throw new Error('고 또는 스톱을 먼저 골라야 합니다.');
  const actor = round.turn;
  const player = round.players[actor];
  if (sameMonth(player.hand, month).length !== 3) throw new Error('흔들기는 손에 같은 월 세 장이 있어야 합니다.');
  if ((player.shakenMonths ?? []).includes(month)) throw new Error('이미 흔든 월입니다.');
  const players = round.players.map((item, index) => index === actor ? {
    ...item,
    shakeCount: (item.shakeCount ?? 0) + 1,
    shakenMonths: [...(item.shakenMonths ?? []), month],
  } : item);
  return { ...round, players, lastEvents: ['흔들기'], message: `${actor + 1}번이 ${month}월 세 장을 흔들었습니다` };
}

function stealPiFromOpponents(players: GoStopPlayer[], actor: number, times: number) {
  const next = players.map((player) => ({ ...player, captured: [...player.captured] }));
  for (let count = 0; count < times; count += 1) {
    next.forEach((player, index) => {
      if (index === actor) return;
      const pi = takeOnePi(player.captured);
      if (!pi) return;
      player.captured = removeCard(player.captured, pi.id);
      next[actor].captured.push(pi);
    });
  }
  return next;
}

/**
 * 패가 남은 다음 사람을 찾습니다.
 *
 * 폭탄은 한 번에 세 장을 내므로 그 사람만 먼저 손이 빕니다. 그대로 차례를 넘기면
 * 낼 패가 없어 판이 그 자리에서 멈춥니다(2026-08-30에 실제로 멈췄습니다).
 * 아무도 패가 없으면 판은 어차피 끝났으므로 바로 다음 자리를 돌려줍니다.
 */
function nextPlayerWithCards(players: GoStopPlayer[], from: number): number {
  for (let step = 1; step <= players.length; step += 1) {
    const seat = (from + step) % players.length;
    if (players[seat].hand.length > 0) return seat;
  }
  return (from + 1) % players.length;
}

function finishGoStopTurn(round: GoStopRound, players: GoStopPlayer[], floor: HwatuCard[], deck: HwatuCard[], events: string[]) {
  const noCards = deck.length === 0 || players.every((item) => item.hand.length === 0);
  const actingPlayer = round.turn;
  const nextTurn = nextPlayerWithCards(players, actingPlayer);
  const mayDecide = !noCards && shouldAskGoStop(players[actingPlayer], round.mode);
  return {
    ...round,
    players,
    floor,
    deck,
    turn: noCards || mayDecide ? actingPlayer : nextTurn,
    finished: noCards,
    // 패를 다 썼는데 스톱한 사람이 없으면 **점수와 관계없이 승리 없이 끝납니다.**
    // 기준 점수를 넘긴 사람이 있어도 스톱을 안 외쳤으면 이긴 것이 아닙니다.
    winner: null,
    pendingDecision: mayDecide ? actingPlayer : null,
    lastEvents: events,
    nagari: noCards,
    message: noCards ? '승리 없이 끝났습니다 · 나가리 · 다음 판 정산이 두 배가 됩니다' : mayDecide ? '고 또는 스톱을 고르세요' : events.length ? `${events.join(' · ')}! ${nextTurn + 1}번 차례` : `${nextTurn + 1}번 차례`,
  };
}

/**
 * 컴퓨터 실력. 마작과 같은 세 단계입니다.
 * 자리마다 다른 실력을 주면 같은 판에서도 상대가 제각각으로 움직입니다.
 */
export type GoStopLevel = '쉬움' | '보통' | '전문가';

/**
 * 자리별 실력의 **기본값**입니다.
 * ⚠️ 2026-09-01부터 화면은 이걸 안 씁니다 — **준비 화면에서 고른 실력을 자리 모두에** 씁니다.
 * 자리마다 다른 실력을 주고 싶어지면 이 함수를 다시 쓰면 됩니다.
 */
export const goStopLevels: GoStopLevel[] = ['보통', '쉬움', '전문가'];

/**
 * 실력마다 **무엇이 다른지** 한 줄로. 화면에도 이 글을 씁니다.
 * ⚠️ 여기 적은 것과 코드가 어긋나면 안 됩니다. 고칠 때 같이 고치세요.
 */
export const goStopLevelNotes: Record<GoStopLevel, string> = {
  쉬움: '가끔 두 번째 수 · 늘 스톱',
  보통: '눈앞의 큰 패 · 2고까지',
  전문가: '상대 패를 세고 피박까지 · 이익이 클 때만 고',
};
export const goStopLevelOf = (mode: GoStopMode, seat: number): GoStopLevel =>
  mode === 'matgo' ? '보통' : (goStopLevels[seat] ?? '보통');

/**
 * 컴퓨터는 먹을 수 있는 패의 가치와 당장 완성되는 월을 보고 손패를 고릅니다.
 *
 * 실력에 따라 고르는 눈이 다릅니다 —
 * **쉬움**은 제일 좋은 수 대신 두 번째 수를 고를 때가 있고, 보통·전문가는 늘 제일 좋은 수입니다.
 * ⚠️ 난수를 안 주면 예전과 똑같이(늘 제일 좋은 수) 움직입니다. 기존 테스트가 그것을 봅니다.
 */
export function chooseComputerGoStopCard(round: GoStopRound, playerIndex = round.turn, level: GoStopLevel = '보통', random?: () => number): HwatuCard {
  const player = round.players[playerIndex];
  if (!player?.hand.length) throw new Error('컴퓨터가 낼 손패가 없습니다.');
  const value = (card: HwatuCard) => card.kind === '광' ? 8 : card.kind === '열끗' ? 5 : card.kind === '띠' ? 4 : card.double ? 3 : 2;
  const plan = level === '전문가' ? expertPlan(round, playerIndex) : null;
  const ordered = [...player.hand].sort((a, b) => {
    const score = (card: HwatuCard) => {
      const matches = sameMonth(round.floor, card.month);
      const capturedValue = matches.reduce((sum, item) => sum + value(item), 0);
      const sameInHand = sameMonth(player.hand, card.month).length;
      const preserveTriple = sameInHand === 3 && matches.length === 0 ? -10 : 0;
      const base = matches.length * 20 + capturedValue + value(card) + preserveTriple;
      return plan ? base + expertBonus(plan, card, matches) : base;
    };
    return score(b) - score(a) || a.month - b.month;
  });
  // 쉬움은 셋에 한 번쯤 두 번째로 좋은 수를 냅니다. 사람이 이길 구석이 있어야 합니다.
  if (level === '쉬움' && random && ordered.length > 1 && random() < 0.34) return ordered[1];
  return ordered[0];
}

/**
 * 전문가가 판을 읽은 것. **한 수 앞만 보지 않기 위해** 판 전체를 한 번 세어 둡니다.
 *
 * 세는 것 네 가지입니다.
 *   1. **상대가 모은 것** — 상대 피가 적으면 피를 끊어 피박을, 광이 있으면 광을 뺏습니다
 *   2. **내가 모은 것** — 삼광·고도리·홍단처럼 한 장이면 되는 역을 마무리합니다
 *   3. **보이는 달** — 같은 달 넉 장이 다 드러났으면 그 달은 죽은 달이라 쥐고 있을 값이 없습니다
 *   4. **내 손에 든 달** — 바닥에 없는 달을 버릴 때는 값이 싼 것부터 버립니다
 */
type ExpertPlan = {
  seen: Map<number, number>;
  rivalPi: number;
  rivalBright: number;
  myBright: number;
  myGodori: number;
  myRibbons: { 홍단: number; 청단: number; 초단: number };
  myPi: number;
};

function expertPlan(round: GoStopRound, playerIndex: number): ExpertPlan {
  const me = round.players[playerIndex];
  const rivals = round.players.filter((_, seat) => seat !== playerIndex);
  const seen = new Map<number, number>();
  const note = (cards: HwatuCard[]) => cards.forEach((card) => seen.set(card.month, (seen.get(card.month) ?? 0) + 1));
  note(round.floor);
  note(me.hand);
  round.players.forEach((player) => note(player.captured));
  return {
    seen,
    // 여럿이 하면 제일 위험한 상대 하나를 봅니다.
    rivalPi: Math.min(...rivals.map((player) => countByKind(player.captured).피), 99),
    rivalBright: Math.max(0, ...rivals.map((player) => countByKind(player.captured).광)),
    myBright: countByKind(me.captured).광,
    myGodori: [2, 4, 8].filter((month) => me.captured.some((card) => card.kind === '열끗' && card.month === month)).length,
    myRibbons: countRibbons(me.captured),
    myPi: countByKind(me.captured).피,
  };
}

/**
 * 전문가가 얹는 값. 먹는 값(base)에 **판을 읽은 값**을 더합니다.
 * 숫자는 한 장 먹는 값(2~8)과 견주어 정했습니다 — 역을 마무리하는 한 장이 제일 큽니다.
 */
function expertBonus(plan: ExpertPlan, card: HwatuCard, matches: HwatuCard[]): number {
  let bonus = 0;
  const taking = [card, ...matches];
  for (const item of taking) {
    if (item.kind === '광') {
      // 삼광이 눈앞이면 크게, 상대 광을 끊는 것도 값이 됩니다.
      bonus += plan.myBright === 2 ? 26 : 10;
      if (plan.rivalBright >= 1) bonus += 6;
    }
    if (item.kind === '열끗' && [2, 4, 8].includes(item.month)) bonus += plan.myGodori === 2 ? 22 : 8;
    if (item.kind === '띠') {
      // 비띠는 역이 없어 세지 않습니다. 홍단·청단·초단만 두 장에서 한 장이면 마무리입니다.
      const kind = item.ribbon;
      if (kind === '홍단' || kind === '청단' || kind === '초단') {
        if (plan.myRibbons[kind] === 2) bonus += 20;
      }
    }
    if (item.kind === '피') {
      // 상대 피가 여덟 아래면 피박이 보입니다. 이때 피 한 장의 값이 확 올라갑니다.
      if (plan.rivalPi < 8) bonus += 7;
      // 내 피가 아홉이면 한 장마다 곧바로 점수입니다.
      if (plan.myPi >= 9) bonus += 5;
    }
  }
  // 먹을 것이 없어 버리는 수라면, **죽은 달부터** 버립니다(넉 장이 이미 다 보이는 달).
  if (matches.length === 0) {
    const seen = plan.seen.get(card.month) ?? 0;
    bonus += seen >= 3 ? 6 : 0;
    // 광·열끗을 그냥 버리지 않습니다. 나중에 짝이 올 수 있습니다.
    if (card.kind === '광') bonus -= 14;
    if (card.kind === '열끗') bonus -= 6;
  }
  return bonus;
}

/**
 * 고를 외칠지 스톱할지. **실력에 따라 다릅니다.**
 *
 * 전에는 컴퓨터가 점수만 되면 **무조건 스톱**했습니다. 그래서 컴퓨터가 고를 외치는 것을
 * 볼 수가 없었고, 판이 늘 3점에서 끝났습니다.
 *
 * 보는 것 네 가지입니다.
 *   1. **남은 차례** — 낼 패가 없으면 고를 외쳐도 점수를 못 올립니다
 *   2. **상대 점수** — 상대가 기준에 닿았으면 굳히는 편이 낫습니다
 *   3. **이미 외친 고** — 고를 외칠수록 지면 크게 물립니다(고박)
 *   4. **내 점수** — 크게 났으면 굳히고, 겨우 넘겼으면 더 갑니다
 */
export function chooseComputerGoStop(round: GoStopRound, playerIndex = round.turn, level: GoStopLevel = '보통'): 'go' | 'stop' {
  const me = round.players[playerIndex];
  if (!me) return 'stop';
  const threshold = goStopThreshold(round.mode);
  const score = scoreGoStop(me.captured).total;
  const handLeft = me.hand.length;
  const rivalBest = Math.max(0, ...round.players.map((player, seat) => seat === playerIndex ? 0 : scoreGoStop(player.captured).total));

  // 쉬움은 늘 스톱합니다. 처음 배우는 사람과 붙는 자리입니다.
  if (level === '쉬움') return 'stop';
  // 낼 패가 한 장 남짓이면 고를 외쳐도 올릴 자리가 없습니다.
  if (handLeft <= 1) return 'stop';
  // 상대가 기준 점수에 닿았습니다. 다음 차례에 뒤집힐 수 있으니 굳힙니다.
  if (rivalBest >= threshold - 1) return 'stop';

  /**
   * 전문가는 **셈으로 정합니다.** 몇 고까지라는 천장이 없습니다.
   *
   * 더 가서 얻는 것: 고를 한 번 더 외치면 배수가 오르고, 남은 차례만큼 점수도 오릅니다.
   * 더 가서 잃는 것: 상대가 뒤집으면 **고박**이라 내가 다 뭅니다.
   * 두 값을 견줘 얻는 것이 클 때만 갑니다. 그래서 손패가 많고 상대가 멀면 4고도 부르고,
   * 상대가 붙어 있으면 1고에서도 멈춥니다.
   */
  if (level === '전문가') {
    const rivalHands = round.players.reduce((sum, player, seat) => seat === playerIndex ? sum : sum + player.hand.length, 0);
    const rivals = Math.max(1, round.players.length - 1);
    // 남은 차례에 점수가 더 오를 가망. 손패가 많고 바닥에 짝이 많을수록 큽니다.
    const pairable = me.hand.filter((card) => round.floor.some((item) => item.month === card.month)).length;
    const chanceToGrow = Math.min(0.9, (pairable + handLeft * 0.5) / Math.max(1, handLeft + 2));
    // 상대가 나를 넘을 가망. 붙어 있을수록, 손패가 많을수록 큽니다.
    const chanceToLose = Math.min(0.85, (rivalBest / Math.max(1, threshold)) * 0.55 + (rivalHands / Math.max(1, rivalHands + handLeft)) * 0.35);
    const nowPoints = goStopPayoutPoints(score, me.goCount);
    const goPoints = goStopPayoutPoints(score + 2, me.goCount + 1);
    const gain = (goPoints - nowPoints) * chanceToGrow;
    // 고박은 상대 몫까지 뭅니다. 사람 수만큼 곱해집니다.
    const risk = nowPoints * rivals * chanceToLose;
    return gain > risk ? 'go' : 'stop';
  }

  // 보통은 두 번까지만 보고, 점수가 크면 굳힙니다.
  if (me.goCount >= 2) return 'stop';
  return handLeft >= 3 && score <= threshold + 1 ? 'go' : 'stop';
}

/** 점수가 난 뒤 고를 수 있는 고/스톱. 고는 계속, 스톱은 즉시 승리입니다. */
export function chooseGoOrStop(round: GoStopRound, action: 'go' | 'stop'): GoStopRound {
  if (round.finished) throw new Error('이미 끝난 판입니다.');
  if (round.pendingDecision !== round.turn || !canCallGoStop(round)) throw new Error(`${goStopThreshold(round.mode)}점이 되어야 고 또는 스톱을 고를 수 있습니다.`);
  if (action === 'stop') return { ...round, finished: true, winner: round.turn, message: `${round.turn + 1}번이 스톱했습니다` };
  // 외친 그때의 점수를 적어 둡니다. 다음 차례에 점수가 안 오르면 다시 안 묻습니다.
  const players = round.players.map((player, index) => index === round.turn
    ? { ...player, goCount: player.goCount + 1, decidedAtScore: scoreGoStop(player.captured).total }
    : player);
  const actor = round.turn;
  return { ...round, players, turn: nextPlayerWithCards(players, actor), pendingDecision: null, message: `${actor + 1}번이 고를 외쳤습니다` };
}

/** 기본 정산 배수: 1·2고는 추가점, 3고부터 두 배씩 증가합니다. */
export function goStopPayoutPoints(baseScore: number, goCount: number) {
  const withEarlyGo = baseScore + Math.min(goCount, 2);
  return goCount >= 3 ? withEarlyGo * (2 ** (goCount - 2)) : withEarlyGo;
}

/** 승자와 한 패자의 패를 비교해 그 패자가 내야 할 최종 점수를 계산합니다. */
export function calculateGoStopSettlement(winner: GoStopPlayer, loser: GoStopPlayer, mode: GoStopMode): GoStopSettlement {
  const winnerScore = scoreGoStop(winner.captured);
  const loserScore = scoreGoStop(loser.captured);
  const goScore = goStopPayoutPoints(winnerScore.total, winner.goCount);
  let multiplier = 1;
  const reasons: string[] = [];
  const double = (reason: string) => { multiplier *= 2; reasons.push(`${reason} ×2`); };

  const piBakLimit = mode === 'matgo' ? 7 : 5;
  if (winnerScore.counts.피 >= 10 && loserScore.counts.피 <= piBakLimit) double('피박');
  if (winnerScore.counts.광 >= 3 && loserScore.counts.광 === 0) double('광박');
  if (winnerScore.counts.열끗 >= 7 && loserScore.counts.열끗 === 0) double('멍박');
  for (let count = 0; count < (winner.shakeCount ?? 0); count += 1) double(count === 0 ? '흔들기·폭탄' : '추가 흔들기·폭탄');
  // 3인 고스톱에서 먼저 고를 외친 사람이 다른 사람에게 지면 나머지 한 사람 몫도 냅니다.
  if (mode === 'gostop' && loser.goCount > 0) double('고박');

  return { baseScore: winnerScore.total, goScore, multiplier, finalPoints: goScore * multiplier, reasons };
}

/** 피를 빼앗는 상황에서 상대가 줄 일반 피를 고릅니다. */
export function takeOnePi(cards: HwatuCard[]) {
  return cards.find((card) => card.kind === '피' && !card.double) ?? cards.find((card) => pieceValue(card) > 0) ?? null;
}
