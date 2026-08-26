import { countByKind, countRibbons, createHwatuDeck, shuffleHwatu, type HwatuCard } from './hwatu.ts';

export type MinhwaMedicine = { name: string; value: number };
export type MinhwaScore = { base: number; bright: number; animal: number; ribbon: number; medicines: MinhwaMedicine[] };
export type MinhwaPlayer = { hand: HwatuCard[]; captured: HwatuCard[] };
export type MinhwaRound = { players: MinhwaPlayer[]; floor: HwatuCard[]; deck: HwatuCard[]; turn: number; finished: boolean; message: string };
export type MinhwaResult = { scores: number[]; baseScores: number[]; transfers: number[]; winner: number | null };

const sameMonth = (cards: HwatuCard[], month: number) => cards.filter((card) => card.month === month);
const remove = (cards: HwatuCard[], id: string) => cards.filter((card) => card.id !== id);

/** 앱 기본 민화투는 두 명이 열 장씩 받고 바닥 여덟 장으로 시작합니다. */
export function dealMinhwatu(random: () => number = Math.random): MinhwaRound {
  const deck = shuffleHwatu(createHwatuDeck(), random);
  const players: MinhwaPlayer[] = [{ hand: [], captured: [] }, { hand: [], captured: [] }];
  for (let count = 0; count < 10; count += 1) for (const player of players) player.hand.push(deck.shift()!);
  return { players, floor: deck.splice(0, 8), deck, turn: 0, finished: false, message: '낼 패를 고르세요' };
}

/** 민화투는 피를 0점으로 두고 그림에 적힌 원래 단위로 계산합니다. */
export function scoreMinhwatu(cards: HwatuCard[]): MinhwaScore {
  const counts = countByKind(cards);
  const bright = counts.광 * 20;
  const animal = counts.열끗 * 10;
  const ribbon = counts.띠 * 5;
  const medicines: MinhwaMedicine[] = [];
  const ribbons = countRibbons(cards);
  if (ribbons.홍단 === 3) medicines.push({ name: '홍단', value: 30 });
  if (ribbons.청단 === 3) medicines.push({ name: '청단', value: 30 });
  if (ribbons.초단 === 3) medicines.push({ name: '초단', value: 30 });
  for (const [month, name] of [[5, '초약'], [10, '풍약'], [12, '비약']] as const) {
    if (sameMonth(cards, month).length === 4) medicines.push({ name, value: 20 });
  }
  return { base: bright + animal + ribbon, bright, animal, ribbon, medicines };
}

function capture(floor: HwatuCard[], card: HwatuCard, chosenId?: string) {
  const matches = sameMonth(floor, card.month);
  if (!matches.length) return { floor: [...floor, card], won: [] as HwatuCard[] };
  if (matches.length === 1) return { floor: remove(floor, matches[0].id), won: [card, matches[0]] };
  if (matches.length === 3) return { floor: floor.filter((item) => item.month !== card.month), won: [card, ...matches] };
  const chosen = matches.find((item) => item.id === chosenId);
  if (!chosen) throw new Error('같은 월 두 장 중 가져갈 패를 골라야 합니다.');
  return { floor: remove(floor, chosen.id), won: [card, chosen] };
}

export function playMinhwatuTurn(round: MinhwaRound, cardId: string, choices: { playedMatchId?: string; drawnMatchId?: string } = {}): MinhwaRound {
  if (round.finished) throw new Error('이미 끝난 판입니다.');
  const player = round.players[round.turn];
  const played = player.hand.find((card) => card.id === cardId);
  if (!played) throw new Error('현재 플레이어의 손패가 아닙니다.');
  const first = capture(round.floor, played, choices.playedMatchId);
  const drawn = round.deck[0];
  const second = drawn ? capture(first.floor, drawn, choices.drawnMatchId) : { floor: first.floor, won: [] as HwatuCard[] };
  const players = round.players.map((item, index) => index === round.turn ? {
    hand: remove(item.hand, played.id), captured: [...item.captured, ...first.won, ...second.won],
  } : { hand: [...item.hand], captured: [...item.captured] });
  const deck = drawn ? round.deck.slice(1) : [];
  const finished = deck.length === 0 || players.every((item) => item.hand.length === 0);
  const next = (round.turn + 1) % players.length;
  return { players, floor: second.floor, deck, turn: finished ? round.turn : next, finished, message: finished ? '모든 패를 사용했습니다 · 점수를 계산합니다' : `${next + 1}번 차례` };
}

/** 약 점수는 상대에게서 가져오므로 얻은 사람은 +, 상대는 -로 이동합니다. */
export function settleMinhwatu(players: MinhwaPlayer[]): MinhwaResult {
  const summaries = players.map((player) => scoreMinhwatu(player.captured));
  const baseScores = summaries.map((score) => score.base);
  const transfers = players.map(() => 0);
  summaries.forEach((score, owner) => score.medicines.forEach((medicine) => {
    players.forEach((_, opponent) => {
      if (opponent === owner) return;
      transfers[owner] += medicine.value;
      transfers[opponent] -= medicine.value;
    });
  }));
  const scores = baseScores.map((score, index) => score + transfers[index]);
  const high = Math.max(...scores);
  const winner = scores.filter((score) => score === high).length === 1 ? scores.indexOf(high) : null;
  return { scores, baseScores, transfers, winner };
}

/** 컴퓨터는 먹을 수 있는 광·열끗·띠를 우선하고 피는 가장 나중에 냅니다. */
export function chooseComputerMinhwatuCard(round: MinhwaRound): HwatuCard {
  const hand = round.players[round.turn].hand;
  if (!hand.length) throw new Error('컴퓨터가 낼 패가 없습니다.');
  const value = (card: HwatuCard) => card.kind === '광' ? 20 : card.kind === '열끗' ? 10 : card.kind === '띠' ? 5 : 0;
  return [...hand].sort((a, b) => {
    const worth = (card: HwatuCard) => sameMonth(round.floor, card.month).reduce((sum, item) => sum + value(item), value(card));
    return worth(b) - worth(a) || a.month - b.month;
  })[0];
}
