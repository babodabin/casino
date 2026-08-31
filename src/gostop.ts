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

/** 컴퓨터는 먹을 수 있는 패의 가치와 당장 완성되는 월을 보고 손패를 고릅니다. */
export function chooseComputerGoStopCard(round: GoStopRound, playerIndex = round.turn): HwatuCard {
  const player = round.players[playerIndex];
  if (!player?.hand.length) throw new Error('컴퓨터가 낼 손패가 없습니다.');
  const value = (card: HwatuCard) => card.kind === '광' ? 8 : card.kind === '열끗' ? 5 : card.kind === '띠' ? 4 : card.double ? 3 : 2;
  return [...player.hand].sort((a, b) => {
    const score = (card: HwatuCard) => {
      const matches = sameMonth(round.floor, card.month);
      const capturedValue = matches.reduce((sum, item) => sum + value(item), 0);
      const sameInHand = sameMonth(player.hand, card.month).length;
      const preserveTriple = sameInHand === 3 && matches.length === 0 ? -10 : 0;
      return matches.length * 20 + capturedValue + value(card) + preserveTriple;
    };
    return score(b) - score(a) || a.month - b.month;
  })[0];
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
