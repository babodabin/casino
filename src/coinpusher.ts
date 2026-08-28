// 코인 푸셔 — 오락실 동전 밀어내기 기계입니다.
// 동전을 한 개 넣으면 밀판이 한 번 앞으로 밀고, 앞턱을 넘어간 동전이 내 몫이 됩니다.
//
// 판은 세로 줄 일곱 개로 나뉘어 있습니다. 넣을 때 **어느 줄에 떨어뜨릴지 고릅니다.**
// 이게 이 게임의 유일한 판단이고, 두 가지가 걸려 있습니다.
//
//   쌓기 — 한 줄에 동전이 많이 모일수록 그 줄이 한 번에 더 많이 밀립니다.
//          실제 기계에서 뭉쳐 있는 동전이 한꺼번에 쏟아지는 것과 같습니다.
//   흘림 — 동전은 밀리면서 옆줄로 조금씩 새는데, 바깥 줄에서 더 새면 옆홈으로 빠져 사라집니다.
//          가장자리는 위험하고 가운데는 안전합니다.
//
// depth는 앞턱까지의 거리로 0이 안쪽, 1이 앞턱입니다.

export type PusherKind = '코인' | '금화';
export type PusherCoin = { id: number; column: number; depth: number; kind: PusherKind };
export type PusherField = { coins: PusherCoin[]; nextId: number };
export type PusherPush = {
  field: PusherField;
  dropped: PusherCoin;
  won: PusherCoin[];
  lost: PusherCoin[];
  /** 이번에 각 줄이 얼마나 밀렸는지. 화면에서 밀리는 모습을 그릴 때 씁니다. */
  advance: number[];
  multiplier: number;
};

/** 앞턱을 넘어가면 받습니다. 금화는 여러 배입니다. */
export const pusherCoinPayout = 1;
export const pusherGoldPayout = 8;
export const pusherColumns = 7;
export const pusherCenterColumn = 3;

// 아래 수치는 여러 조합을 돌려 보고 골랐습니다. 자세한 값은 커밋 메시지에 적어 두었습니다.
/** 밀판이 미는 거리. 줄에 동전이 없으면 이만큼만, 꽉 차 있으면 아래 배수까지 밀립니다. */
export const pusherStroke = 0.045;
export const pusherPackedBoost = 1.9;
/** 이 개수쯤 모이면 미는 힘이 다 붙습니다. */
export const pusherPackedAt = 5;
export const pusherStrokeJitter = 0.45;
/** 한 번 밀 때 옆줄로 밀려나는 확률. 바깥 벽에 닿으면 튕겨 나오고 판 밖으로 나가지는 않습니다. */
export const pusherDriftChance = 0.3;
/** 이 깊이보다 앞쪽은 벽이 끝나 동전이 흔들리고, 바닥 구멍에 빠질 수도 있습니다. */
export const pusherChuteStart = 0.2;
/**
 * 앞쪽 바닥 구멍에 빠질 확률. 어느 줄이든 똑같습니다.
 * 줄마다 다르게 두면 한 줄이 정답이 되어 고르는 재미가 사라지므로 일부러 고르게 두었습니다.
 * 이 구멍이 이 게임의 하우스 몫 전부입니다.
 */
export const pusherSwallow = 0.0055;
/** 처음 한 번만 깔아 주는 동전입니다. 판을 저장해 이어 쓰므로 다시 깔리지 않습니다. */
export const pusherStartingCoins = 12;
export const pusherStartingGold = 1;

export const pusherPayout = (kind: PusherKind): number => (kind === '금화' ? pusherGoldPayout : pusherCoinPayout);
export const clampColumn = (column: number): number => Math.max(0, Math.min(pusherColumns - 1, Math.round(column)));

export function createPusherField(random: () => number = Math.random): PusherField {
  const coins: PusherCoin[] = [];
  let nextId = 1;
  // 앞뒤로 고루 깔아 둡니다. 전부 안쪽에 두면 처음 열 번쯤 아무것도 안 넘어와 고장 난 것처럼 보입니다.
  for (let index = 0; index < pusherStartingCoins; index += 1) {
    coins.push({ id: nextId++, column: 1 + Math.floor(random() * (pusherColumns - 2)), depth: 0.1 + random() * 0.8, kind: '코인' });
  }
  for (let index = 0; index < pusherStartingGold; index += 1) {
    coins.push({ id: nextId++, column: 2 + Math.floor(random() * 3), depth: 0.3 + random() * 0.35, kind: '금화' });
  }
  return { coins: coins.sort((a, b) => b.depth - a.depth), nextId };
}

/** 줄마다 이번에 얼마나 밀릴지. 동전이 뭉쳐 있는 줄이 더 많이 밀립니다. */
export function columnAdvance(field: PusherField, random: () => number = Math.random): number[] {
  const counts = new Array(pusherColumns).fill(0);
  for (const coin of field.coins) counts[coin.column] += 1;
  return counts.map((count) => {
    const packed = Math.min(1, count / pusherPackedAt);
    const power = 1 + (pusherPackedBoost - 1) * packed;
    return pusherStroke * power * (1 - pusherStrokeJitter / 2 + random() * pusherStrokeJitter);
  });
}

/**
 * 동전 한 개를 고른 줄에 넣고 밀판을 한 번 밉니다.
 * column은 0부터 6까지이고, 범위를 벗어나면 가장 가까운 줄로 맞춥니다.
 */
export function dropPusherCoin(field: PusherField, column: number = pusherCenterColumn, random: () => number = Math.random): PusherPush {
  const target = clampColumn(column);
  const dropped: PusherCoin = { id: field.nextId, column: target, depth: 0.02 + random() * 0.06, kind: '코인' };
  const before: PusherField = { coins: [...field.coins, dropped], nextId: field.nextId };
  const advance = columnAdvance(before, random);

  const won: PusherCoin[] = [], lost: PusherCoin[] = [], staying: PusherCoin[] = [];
  for (const coin of before.coins) {
    const depth = coin.depth + advance[coin.column];
    let nextColumn = coin.column;
    // 앞쪽에서는 벽이 끝나 옆줄로 밀려납니다. 바깥 벽에 닿으면 튕겨 나옵니다.
    if (depth > pusherChuteStart && random() < pusherDriftChance) nextColumn = clampColumn(nextColumn + (random() < 0.5 ? -1 : 1));
    // 앞쪽 바닥 구멍. 어느 줄이든 확률이 같습니다.
    if (depth > pusherChuteStart && random() < pusherSwallow) { lost.push({ ...coin, depth, column: nextColumn }); continue; }
    if (depth >= 1) { won.push({ ...coin, depth: 1, column: nextColumn }); continue; }
    staying.push({ ...coin, depth, column: nextColumn });
  }

  const multiplier = won.reduce((sum, coin) => sum + pusherPayout(coin.kind), 0);
  return {
    field: { coins: staying.sort((a, b) => b.depth - a.depth), nextId: field.nextId + 1 },
    dropped, won, lost, advance, multiplier,
  };
}

/** 넣을 줄을 고르는 방식. 환급률을 잴 때 여러 방식을 견줍니다. */
export type PusherAim = (field: PusherField, random: () => number) => number;
export const aimCenter: PusherAim = () => pusherCenterColumn;
export const aimEdge: PusherAim = () => 0;
export const aimRandom: PusherAim = (_field, random) => Math.floor(random() * pusherColumns);
/** 앞쪽에 동전이 가장 많이 몰린 줄에 보태는 방식. 사람이 생각할 법한 가장 좋은 수입니다. */
export const aimFullest: PusherAim = (field) => {
  const weight = new Array(pusherColumns).fill(0);
  for (const coin of field.coins) if (coin.depth > 0.45) weight[coin.column] += coin.depth;
  let best = pusherCenterColumn;
  for (let column = 0; column < pusherColumns; column += 1) if (weight[column] > weight[best]) best = column;
  return best;
};

export function runPusherSession(drops: number, aim: PusherAim = aimCenter, random: () => number = Math.random): { paid: number; won: number; lost: number } {
  let field = createPusherField(random);
  let paid = 0, wonCount = 0, lostCount = 0;
  for (let drop = 0; drop < drops; drop += 1) {
    const push = dropPusherCoin(field, aim(field, random), random);
    field = push.field;
    paid += push.multiplier;
    wonCount += push.won.length;
    lostCount += push.lost.length;
  }
  return { paid, won: wonCount, lost: lostCount };
}
