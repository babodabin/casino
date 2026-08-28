// 피시 레이스 — 물고기 여섯 마리가 수중 장애물 구간을 지나 산호 결승선까지 헤엄칩니다.
// 구간마다 물살·해초·거품·먹이·동굴 같은 사건이 걸려 속도가 계속 달라집니다.

export type RaceFish = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  speed: number;      // 기본 유영 속도
  agility: number;    // 장애물을 빠져나오는 민첩성
  stamina: number;    // 뒷심
  odds: number;
};

export type FishEventKind = '물살' | '해초' | '거품' | '먹이' | '동굴' | '순항';

export type FishSegment = { lap: number; fish: number; kind: FishEventKind; delta: number };

export type FishRaceResult = {
  order: number[];
  times: Record<number, number>;
  halfwayOrder: number[];
  events: FishSegment[];
};

export type FishTicket = { selection: number; stake: number; odds: number };

export const fishRaceLaps = 4;

const roster: RaceFish[] = [
  { id: 1, name: '청산호', emoji: '🐟', color: '#3FA9F5', speed: 90, agility: 88, stamina: 86, odds: 4.2 },
  { id: 2, name: '금비늘', emoji: '🐠', color: '#F2B807', speed: 93, agility: 85, stamina: 84, odds: 3.6 },
  { id: 3, name: '붉은지느러미', emoji: '🐡', color: '#E4572E', speed: 87, agility: 92, stamina: 89, odds: 4.0 },
  { id: 4, name: '먹구름', emoji: '🐟', color: '#7A6FF0', speed: 85, agility: 90, stamina: 94, odds: 4.4 },
  { id: 5, name: '흰물결', emoji: '🐠', color: '#C9D6DF', speed: 91, agility: 83, stamina: 90, odds: 4.1 },
  { id: 6, name: '검은등', emoji: '🐡', color: '#2E4057', speed: 88, agility: 94, stamina: 82, odds: 4.3 },
];

export const createFishField = (): RaceFish[] => roster.map(fish => ({ ...fish }));

// 각 사건이 구간 점수에 더하거나 빼는 값입니다. 동굴은 크게 앞서고, 해초는 크게 처집니다.
const eventTable: { kind: FishEventKind; weight: number; base: number; agilityScale: number }[] = [
  { kind: '순항', weight: 34, base: 0, agilityScale: 0 },
  { kind: '물살', weight: 16, base: 9, agilityScale: 0 },
  { kind: '해초', weight: 16, base: -10, agilityScale: 0.09 },
  { kind: '거품', weight: 14, base: -6, agilityScale: 0.05 },
  { kind: '먹이', weight: 10, base: -4, agilityScale: 0 },
  { kind: '동굴', weight: 10, base: 14, agilityScale: 0 },
];

const totalWeight = eventTable.reduce((sum, item) => sum + item.weight, 0);

const rollEvent = (random: () => number) => {
  let point = random() * totalWeight;
  for (const item of eventTable) {
    point -= item.weight;
    if (point <= 0) return item;
  }
  return eventTable[0];
};

export function simulateFishRace(field: RaceFish[], random: () => number = Math.random): FishRaceResult {
  const events: FishSegment[] = [];
  const scores = new Map<number, number>(field.map(fish => [fish.id, 0]));
  const halfway = new Map<number, number>();

  for (let lap = 1; lap <= fishRaceLaps; lap += 1) {
    for (const fish of field) {
      const event = rollEvent(random);
      // 뒷심은 후반 구간일수록 크게 작용합니다.
      const staminaBonus = ((fish.stamina - 87) * (lap - 1)) / (fishRaceLaps - 1) * 0.5;
      const base = fish.speed * 0.34 + fish.agility * 0.16 + staminaBonus;
      // 해초·거품처럼 걸리는 사건은 민첩할수록 손해가 줄어듭니다.
      const delta = event.base + (event.base < 0 ? (fish.agility - 80) * event.agilityScale : 0);
      const noise = (random() - 0.5) * 7;
      const gained = base + delta + noise;
      scores.set(fish.id, (scores.get(fish.id) ?? 0) + gained);
      events.push({ lap, fish: fish.id, kind: event.kind, delta: Number(delta.toFixed(2)) });
    }
    if (lap === Math.ceil(fishRaceLaps / 2)) field.forEach(fish => halfway.set(fish.id, scores.get(fish.id) ?? 0));
  }

  const order = [...field].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)).map(fish => fish.id);
  const halfwayOrder = [...field].sort((a, b) => (halfway.get(b.id) ?? 0) - (halfway.get(a.id) ?? 0)).map(fish => fish.id);
  const best = Math.max(...field.map(fish => scores.get(fish.id) ?? 0));
  const times = Object.fromEntries(
    field.map(fish => [fish.id, Number((46 + (best - (scores.get(fish.id) ?? 0)) * 0.22).toFixed(2))]),
  );
  return { order, halfwayOrder, times, events };
}

export const fishTicketPayout = (ticket: FishTicket, result: FishRaceResult): number =>
  ticket.selection === result.order[0] ? Math.round(ticket.stake * ticket.odds) : 0;

export const fishEventText: Record<FishEventKind, string> = {
  순항: '흐름을 타고 순항',
  물살: '물살을 타고 전진',
  해초: '해초에 걸려 지체',
  거품: '거품 구역에서 감속',
  먹이: '먹이를 발견해 멈칫',
  동굴: '지름길 동굴 통과',
};
