// 발라트로 하드의 목표와 배당을 재는 자리입니다.
//
// 돌리는 법:
//   node --experimental-strip-types scripts/balatro-rtp.ts [판수] [작은] [큰] [보스]
//
// ⚠️ 하드는 상점에서 **진짜 WC를 더 겁니다.** 그래서 환급률은
//   받은 돈 총합 ÷ **건 돈 총합**(처음 베팅 + 상점에서 쓴 것)
// 으로 재야 합니다. 처음 베팅으로만 나누면 실제보다 높게 나옵니다.
//
// 사는 사람과 안 사는 사람을 **따로** 잽니다. 둘의 환급률이 크게 벌어지면
// 상점이 "무조건 사야 하는 것"이나 "사면 손해"가 되어 고르는 재미가 없어집니다.

import {
  balatroSpendCap, balatroStake, blindOf, blindTargets, buyShopOffer, leaveShop,
  bestBalatroPlay, bossOf, discardBalatroCards, playBalatroHand, startBalatroRun,
  targetOf, balatroDiscardBelow, type BalatroRun,
} from '../src/balatro.ts';

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** 컴퓨터 한 판. buy가 false면 상점에서 아무것도 안 삽니다. */
function playOut(start: BalatroRun, random: () => number, buy: boolean): BalatroRun {
  let run = start;
  let guard = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && guard < 60) {
    guard += 1;
    if (run.phase === 'shop') {
      let shopped = run;
      if (buy) for (const offer of run.shop) { try { shopped = buyShopOffer(shopped, offer); } catch { /* 못 사면 넘어갑니다 */ } }
      run = leaveShop(shopped, random);
      continue;
    }
    const boss = bossOf(run);
    const best = bestBalatroPlay(run.round.hand, run.held, run.levels, boss);
    const need = targetOf(run) - run.round.score;
    const enough = best.score >= need || best.score >= balatroDiscardBelow(blindOf(run));
    if (run.round.discardsLeft > 0 && !enough) {
      const keep = new Set(best.cards.map((card) => card.id));
      const trash = run.round.hand.filter((card) => !keep.has(card.id)).slice(0, 5);
      if (trash.length > 0) { run = discardBalatroCards(run, trash); continue; }
    }
    run = playBalatroHand(run, best.cards, random);
  }
  return run;
}

const rounds = Number(process.argv[2] ?? 20000);
const override = process.argv.length > 3
  ? { '작은': Number(process.argv[3]), '큰': Number(process.argv[4]), '보스': Number(process.argv[5]) }
  : null;
if (override) Object.assign(blindTargets, override);

const measure = (buy: boolean) => {
  let staked = 0; let wonStake = 0; let won = 0; let spent = 0;
  const stopped: Record<string, number> = { '작은': 0, '큰': 0, '보스': 0 };
  for (let index = 0; index < rounds; index += 1) {
    const random = seeded(index * 2654435761 + 12345);
    const run = playOut(startBalatroRun(random), random, buy);
    const stake = balatroStake(run);
    staked += stake; spent += run.spent;
    if (run.phase === 'won') { won += 1; wonStake += stake; } else stopped[blindOf(run)] += 1;
  }
  return { staked, wonStake, won, spent, stopped };
};

const pct = (value: number) => (value * 100).toFixed(1) + '%';
const buying = measure(true);
const plain = measure(false);
// 배당 하나로 둘을 함께 맞춥니다. 사는 쪽과 안 사는 쪽의 건 돈을 합쳐 95%가 되게 잡습니다.
// 배당은 **처음 베팅에만** 곱합니다. 상점에서 쓴 돈은 더 좋은 기회를 사는 값입니다.
const payout = 0.95 * (buying.staked + plain.staked) / (buying.won + plain.won);

console.log('판수            ', rounds.toLocaleString());
console.log('목표            ', JSON.stringify(blindTargets));
console.log('상점 한도       ', balatroSpendCap + '배');
console.log('');
for (const [label, data] of [['다 사는 사람', buying], ['안 사는 사람', plain]] as const) {
  console.log(label);
  console.log('  세 단 다 깸   ', pct(data.won / rounds));
  console.log('  막힌 단       ', `작은 ${pct(data.stopped['작은'] / rounds)} · 큰 ${pct(data.stopped['큰'] / rounds)} · 보스 ${pct(data.stopped['보스'] / rounds)}`);
  console.log('  평균 상점 지출', (data.spent / rounds).toFixed(3), '배');
  console.log('  평균 건 돈    ', (data.staked / rounds).toFixed(3), '배');
  console.log('  이 배당에서   ', pct(payout * data.won / data.staked));
}
console.log('');
console.log('95%가 되는 배당 ', payout.toFixed(3), '배');
