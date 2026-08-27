export type RaceCar = {
  id: number;
  brand: 'Mercedes' | 'McLaren' | 'Red Bull' | 'Ferrari' | 'Audi' | 'Aston Martin';
  koreanName: string;
  color: string;
  accent: string;
  speed: number;
  cornering: number;
  stability: number;
  odds: number;
};

export type CarRaceResult = { order: number[]; times: Record<number, number>; midRaceOrder: number[] };
export type CarRaceTicket = { selection: number; stake: number; odds: number };

const cars: RaceCar[] = [
  { id: 1, brand: 'Mercedes', koreanName: '메르세데스', color: '#C9D0D3', accent: '#00A19C', speed: 91, cornering: 90, stability: 94, odds: 3.8 },
  { id: 2, brand: 'McLaren', koreanName: '맥라렌', color: '#FF8000', accent: '#151515', speed: 94, cornering: 92, stability: 88, odds: 3.4 },
  { id: 3, brand: 'Red Bull', koreanName: '레드불', color: '#172B63', accent: '#F9D616', speed: 95, cornering: 94, stability: 87, odds: 3.1 },
  { id: 4, brand: 'Ferrari', koreanName: '페라리', color: '#E10600', accent: '#FFD000', speed: 93, cornering: 91, stability: 90, odds: 3.5 },
  { id: 5, brand: 'Audi', koreanName: '아우디', color: '#191919', accent: '#E32219', speed: 88, cornering: 89, stability: 92, odds: 5.2 },
  { id: 6, brand: 'Aston Martin', koreanName: '애스턴 마틴', color: '#006F62', accent: '#CEDC00', speed: 89, cornering: 93, stability: 91, odds: 4.6 },
];

export const createCarField = (): RaceCar[] => cars.map(car => ({ ...car }));

export function simulateCarRace(field: RaceCar[], random: () => number = Math.random): CarRaceResult {
  const scored = field.map(car => {
    const base = car.speed * .46 + car.cornering * .34 + car.stability * .2;
    const firstHalf = base + (random() - .5) * 13;
    const finish = firstHalf * .45 + base * .55 + (random() - .5) * 14;
    return { id: car.id, firstHalf, finish };
  });
  const order = [...scored].sort((a, b) => b.finish - a.finish).map(item => item.id);
  const midRaceOrder = [...scored].sort((a, b) => b.firstHalf - a.firstHalf).map(item => item.id);
  const best = Math.max(...scored.map(item => item.finish));
  const times = Object.fromEntries(scored.map(item => [item.id, Number((82 + (best - item.finish) * .16).toFixed(3))]));
  return { order, midRaceOrder, times };
}

export const carTicketPayout = (ticket: CarRaceTicket, result: CarRaceResult): number =>
  ticket.selection === result.order[0] ? Math.round(ticket.stake * ticket.odds) : 0;
