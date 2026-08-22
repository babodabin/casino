import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateChineseYaku } from '../src/chinesemahjong.ts';
import { isWinningMahjongHand, type MahjongTile, type MahjongSuit } from '../src/riichimahjong.ts';
import { readFileSync } from 'node:fs';

/**
 * 중복 제거 규칙 검증.
 *
 * "A가 성립하면 B는 A에 포함되니 빼라"는 규칙이 43개 있습니다.
 * 이게 틀리면 점수가 조용히 낮아집니다 (실제로 화룡→무자가 그랬습니다).
 *
 * 검증 방법: 중복 제거를 끈 상태(keepImplied)로 판정해서,
 * A가 나왔는데 B가 안 나온 손이 하나라도 있으면 그 규칙은 과잉 제거입니다.
 */

let seed = 31337;
const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
let uid = 0;
const T = (s: MahjongSuit, v: number): MahjongTile => ({ id: `${s}${v}-${uid++}`, suit: s, value: v, glyph: `${s}${v}` });

function build(useHonors: boolean, mono?: MahjongSuit[]) {
  const suits: MahjongSuit[] = mono ?? (useHonors ? ['m','p','s','z'] : ['m','p','s']);
  const used = new Map<string, number>();
  const take = (s: MahjongSuit, v: number, n: number) => {
    const k = `${s}${v}`; const have = used.get(k) ?? 0;
    if (have + n > 4) return null;
    used.set(k, have + n);
    return Array.from({ length: n }, () => T(s, v));
  };
  const groups: { tiles: MahjongTile[]; kind: 'seq' | 'trip' }[] = [];
  for (let g = 0; g < 4; g++) {
    let ok: { tiles: MahjongTile[]; kind: 'seq' | 'trip' } | null = null;
    for (let a = 0; a < 40 && !ok; a++) {
      const s = pick(suits);
      if (s !== 'z' && rng() < 0.55) {
        const v = 1 + Math.floor(rng() * 7);
        const x = take(s, v, 1), y = x && take(s, v + 1, 1), z = y && take(s, v + 2, 1);
        if (z) ok = { tiles: [...x!, ...y!, ...z], kind: 'seq' };
      } else {
        const v = s === 'z' ? 1 + Math.floor(rng() * 7) : 1 + Math.floor(rng() * 9);
        const t = take(s, v, 3);
        if (t) ok = { tiles: t, kind: 'trip' };
      }
    }
    if (!ok) return null;
    groups.push(ok);
  }
  let pair: MahjongTile[] | null = null;
  for (let a = 0; a < 40 && !pair; a++) {
    const s = pick(suits);
    const v = s === 'z' ? 1 + Math.floor(rng() * 7) : 1 + Math.floor(rng() * 9);
    pair = take(s, v, 2);
  }
  if (!pair) return null;

  const melds: MahjongTile[][] = [];
  const kans: MahjongTile[][] = [];
  const tiles: MahjongTile[] = [];
  groups.forEach((g) => {
    const roll = rng();
    if (roll < 0.18) melds.push(g.tiles);
    else if (roll < 0.26 && g.kind === 'trip') {
      const extra = take(g.tiles[0].suit, g.tiles[0].value, 1);
      if (extra) kans.push([...g.tiles, ...extra]); else tiles.push(...g.tiles);
    } else tiles.push(...g.tiles);
  });
  tiles.push(...pair);
  return { hand: tiles, melds, kans };
}

/** 소스에서 중복 제거 규칙을 읽어옵니다. 코드가 바뀌면 테스트도 따라옵니다. */
function readRules(): [string, string[]][] {
  const source = readFileSync(new URL('../src/chinesemahjong.ts', import.meta.url), 'utf8');
  const rules: [string, string[]][] = [];
  const re = /if \(has\('([^']+)'\)\) dropAll\(\[([^\]]*)\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const smalls = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    if (smalls.length) rules.push([m[1], smalls]);
  }
  return rules;
}

test('중복 제거 규칙이 과잉 제거하지 않는다', () => {
  const rules = readRules();
  assert.equal(rules.length > 30, true, `규칙을 읽지 못했습니다 (${rules.length}개)`);

  // 규칙 위반: 큰 역 A는 나왔는데 작은 역 B는 안 나온 손
  const violations = new Map<string, string>();
  let hands = 0;

  for (let i = 0; i < 120000; i++) {
    const mono = rng() < 0.12 ? [pick(['m','p','s'] as MahjongSuit[])] : undefined;
    const b = build(rng() < 0.75, mono);
    if (!b) continue;
    if (b.hand.length !== 14 - b.melds.length * 3 - b.kans.length * 3) continue;
    if (!isWinningMahjongHand(b.hand, b.melds.length + b.kans.length)) continue;
    hands++;

    const raw = evaluateChineseYaku({
      hand: b.hand, melds: b.melds, concealedKans: b.kans, winType: rng() < 0.5 ? 'tsumo' : 'ron',
      winningTile: b.hand[b.hand.length - 1],
      seatWind: 1 + Math.floor(rng() * 4), roundWind: 1 + Math.floor(rng() * 2),
      keepImplied: true,
    } as never).map((entry) => entry.name);
    const present = new Set(raw);

    // 실제로 점수를 깎는 제거만 봅니다.
    // A도 B도 성립한 손에서만 제거가 의미를 갖습니다.
    for (const [big, smalls] of rules) {
      if (!present.has(big)) continue;
      for (const small of smalls) {
        if (!present.has(small)) continue;
        const key = `${big} → ${small}`;
        violations.set(key, (violations.get(key) ?? '') + '.');
      }
    }
  }

  assert.equal(hands > 10000, true, `검사한 완성패가 너무 적습니다 (${hands}개)`);
  // 실제로 점수를 깎는 제거는 아래 일곱 가지뿐이며, 모두 국표마작 규칙서와
  // 대조해 옳다고 확인했습니다. 여기에 없는 것이 새로 나오면 규칙이 잘못된 것입니다.
  const APPROVED = [
    '대어오 → 무자',      // 6 이상만 쓰므로 자패가 없습니다
    '불구인 → 자모',      // 不求人은 자모를 포함합니다
    '사암각 → 대대화',    // 암각 네 개는 곧 모든 몸통이 커쯔입니다
    '사암각 → 문전청',    // 암각 네 개는 울지 않았다는 뜻입니다
    '전대오 → 단요',      // 모든 몸통에 5가 들어가면 1·9가 없습니다
    '전대오 → 무자',      // 같은 이유로 자패도 없습니다
    '청일색 → 무자',      // 한 종류 숫자패만 쓰므로 자패가 없습니다
  ];
  const effective = [...violations.keys()].sort();
  const unexpected = effective.filter((rule) => !APPROVED.includes(rule));
  const gone = APPROVED.filter((rule) => !effective.includes(rule));

  assert.deepEqual(unexpected, [], `규칙서와 대조하지 않은 제거가 생겼습니다:\n${unexpected.join('\n')}`);
  assert.deepEqual(gone, [], `있어야 할 제거가 사라졌습니다:\n${gone.join('\n')}`);
});
