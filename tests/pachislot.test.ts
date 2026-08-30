import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPachiState,
  pachiAtSet,
  pachiCeiling,
  pachiToCeiling,
  pachiToZone,
  pachiZoneGames,
  spinPachi,
  type PachiState,
} from '../src/pachislot.ts';

/** 시험용으로 상태를 임의의 지점에 놓습니다. */
const at = (patch: Partial<PachiState>): PachiState => ({ ...createPachiState(), ...patch });

test('천장에 닿으면 다른 추첨을 보지 않고 무조건 당첨된다', () => {
  // 0.999는 통상 당첨(1/299)에도 찬스존 성공(0.05)에도 못 미치는 값입니다.
  const spin = spinPachi(at({ games: pachiCeiling - 1 }), () => 0.999);
  assert.equal(spin.role, 'AT');
  assert.equal(spin.byCeiling, true);
  assert.equal(spin.state.phase, 'AT');
});

test('천장으로 들어가면 은혜로 AT 게임 수가 두 배가 된다', () => {
  const ceiling = spinPachi(at({ games: pachiCeiling - 1 }), () => 0.999);
  const normal = spinPachi(at({ games: 10 }), () => 0);
  assert.equal(ceiling.state.atLeft, pachiAtSet * 2);
  assert.equal(normal.state.atLeft, pachiAtSet);
});

test('150게임마다 찬스존에 들어간다', () => {
  const spin = spinPachi(at({ games: 149 }), () => 0.999);
  assert.equal(spin.role, '찬스존');
  assert.equal(spin.state.phase, '찬스존');
  assert.equal(spin.state.zoneLeft, pachiZoneGames);
});

test('찬스존에서 성공하면 AT로 들어간다', () => {
  const spin = spinPachi(at({ phase: '찬스존', zoneLeft: pachiZoneGames, games: 150 }), () => 0.01);
  assert.equal(spin.role, 'AT');
  assert.equal(spin.state.phase, 'AT');
});

test('찬스존은 정해진 게임 수만 이어지고 통상으로 돌아온다', () => {
  let state = at({ phase: '찬스존', zoneLeft: pachiZoneGames, games: 150 });
  for (let i = 0; i < pachiZoneGames; i += 1) state = spinPachi(state, () => 0.999).state;
  assert.equal(state.phase, '통상');
});

test('리플레이가 나오면 다음 게임은 메달을 넣지 않는다', () => {
  const first = spinPachi(at({ games: 1 }), () => 0.2);
  assert.equal(first.role, '리플레이');
  assert.equal(first.inMedals, 3);
  assert.equal(first.state.freeNext, true);
  assert.equal(spinPachi(first.state, () => 0.2).inMedals, 0);
});

test('AT 중에는 메달이 줄지 않고 늘어난다', () => {
  let state = at({ phase: 'AT', atLeft: 1000, atSets: 1 });
  let net = 0;
  for (let i = 0; i < 5000; i += 1) {
    const spin = spinPachi(state, Math.random);
    net += spin.outMedals - spin.inMedals;
    state = spin.state;
  }
  assert.equal(net > 0, true, `AT 5000게임에서 ${net}매`);
});

test('남은 게임 수를 바르게 알려준다', () => {
  assert.equal(pachiToCeiling(at({ games: 900 })), 99);
  assert.equal(pachiToZone(at({ games: 140 })), 10);
  assert.equal(pachiToZone(at({ phase: 'AT' })), 0);
});

/**
 * 범위가 넓은 것은 대충 잡아서가 아닙니다. AT가 세트로 이어지는 구조라 아주 긴 AT가
 * 드물게 나오고, 100만 게임을 돌려도 잴 때마다 표준편차 0.5%p로 흔들립니다.
 * 좁게 잡으면 코드가 멀쩡해도 가끔 깨집니다. 실제 값은 2000만 게임에서 94.8%입니다.
 */
test('오래 돌리면 환급률이 93~97% 사이에 들어온다', () => {
  let state = createPachiState();
  let inSum = 0, outSum = 0;
  for (let i = 0; i < 2_000_000; i += 1) {
    const spin = spinPachi(state, Math.random);
    inSum += spin.inMedals;
    outSum += spin.outMedals;
    state = spin.state;
  }
  const rate = outSum / inSum;
  assert.equal(rate > 0.93 && rate < 0.97, true, `환급률 ${(rate * 100).toFixed(2)}%`);
});

test('오래 돌리면 세 갈래를 모두 지나간다', () => {
  let state = createPachiState();
  const seen = new Set<string>();
  for (let i = 0; i < 100_000; i += 1) {
    seen.add(state.phase);
    state = spinPachi(state, Math.random).state;
  }
  assert.deepEqual([...seen].sort(), ['AT', '찬스존', '통상']);
});
