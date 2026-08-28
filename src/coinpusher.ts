// 코인 푸셔 — 오락실 동전 밀어내기 기계입니다.
// 동전을 한 개 넣으면 밀판이 한 번 앞으로 밀고, 앞턱을 넘어간 동전이 내 몫이 됩니다.
// 넣은 것이 바로 나오지 않고 쌓였다가 한꺼번에 쏟아지는 것이 이 기계의 재미입니다.
//
// 자리는 두 방향으로 봅니다. depth는 앞턱까지의 거리(0이 안쪽, 1이 앞턱),
// lane은 좌우 자리(0이 왼쪽 끝, 1이 오른쪽 끝)입니다.
// 앞쪽 양옆에는 실제 기계처럼 빠지는 홈이 있어서, 그리로 간 동전은 사라집니다.
// 이 홈이 이 게임의 하우스 몫입니다.

export type PusherKind = '코인' | '금화';
export type PusherCoin = { id: number; depth: number; lane: number; kind: PusherKind };
export type PusherField = { coins: PusherCoin[]; nextId: number };
export type PusherPush = { field: PusherField; dropped: PusherCoin; won: PusherCoin[]; lost: PusherCoin[]; multiplier: number };

/** 앞턱을 넘어가면 받습니다. 금화는 여러 배입니다. */
export const pusherCoinPayout = 1;
export const pusherGoldPayout = 8;
// 아래 수치는 여러 조합을 돌려 보고 고른 것입니다. 넣은 동전은 결국 앞턱으로 넘어가거나
// 옆홈으로 빠지는데, 옆홈으로 빠지는 몫이 이 게임의 하우스 몫입니다.
// 실제로 재 보면 한 번 넣을 때 앞턱으로 0.92개가 넘어가고 0.08개가 옆홈으로 빠집니다.
//   30번 넣으면 111.9% · 60번 102.6% · 150번 96.3% · 400번 93.7% · 1500번 92.5%
// 처음에 깔아 준 동전 때문에 짧게 하면 높고, 오래 할수록 92%로 모입니다.
// 이 선물이 판을 저장해 두는 이유입니다. 열 때마다 다시 깔면 짧게 하고 나가기를
// 반복하는 것이 이득이 됩니다.
// 한 번 넣었을 때 나오는 개수는 없음 28% · 한 개 52% · 두 개 18% · 세 개 1.4%입니다.
/** 양옆 홈의 폭. 이 바깥으로 밀린 동전은 빠져서 사라집니다. */
export const pusherLaneMargin = 0.14;
/** 이 깊이보다 앞쪽에서만 옆으로 빠질 수 있습니다. 안쪽은 벽이 막고 있습니다. */
export const pusherChuteStart = 0.35;
/** 밀판이 한 번에 미는 거리. 실제로는 앞뒤로 흔들려서 판마다 조금씩 다릅니다. */
export const pusherStroke = 0.075;
export const pusherStrokeJitter = 0.5;
/** 동전이 서로 부딪히며 좌우로 흔들리는 정도. 이 값이 클수록 옆홈으로 많이 빠집니다. */
export const pusherLaneJitter = 0.165;
// 처음 한 번만 깔아 주는 동전입니다. 판을 저장해 두고 이어서 쓰기 때문에
// 게임을 다시 열어도 다시 깔리지 않습니다. 매번 새로 깔면 짧게 하고 나가는 것이 이득이 됩니다.
export const pusherStartingCoins = 10;
export const pusherStartingGold = 1;

export const pusherPayout = (kind: PusherKind): number => (kind === '금화' ? pusherGoldPayout : pusherCoinPayout);

/** 기계에 이미 쌓여 있는 동전. 빈 판에서 시작하면 한참 동안 아무것도 안 나오기 때문입니다. */
export function createPusherField(random: () => number = Math.random): PusherField {
  const coins: PusherCoin[] = [];
  let nextId = 1;
  // 앞뒤로 고루 깔아 둡니다. 전부 안쪽에 두면 처음 열 번쯤은 아무것도 안 넘어와서
  // 기계가 고장 난 것처럼 보입니다. 판을 저장해 이어 쓰므로 이 선물은 평생 한 번뿐입니다.
  for (let index = 0; index < pusherStartingCoins; index += 1) {
    coins.push({ id: nextId++, depth: 0.1 + random() * 0.8, lane: 0.25 + random() * 0.5, kind: '코인' });
  }
  for (let index = 0; index < pusherStartingGold; index += 1) {
    coins.push({ id: nextId++, depth: 0.3 + random() * 0.35, lane: 0.4 + random() * 0.2, kind: '금화' });
  }
  return { coins: coins.sort((a, b) => b.depth - a.depth), nextId };
}

/** 동전 한 개를 넣고 밀판을 한 번 밉니다. */
export function dropPusherCoin(field: PusherField, random: () => number = Math.random): PusherPush {
  const dropped: PusherCoin = { id: field.nextId, depth: 0.02 + random() * 0.07, lane: 0.36 + random() * 0.28, kind: '코인' };
  const moved = [...field.coins, dropped].map((coin) => ({
    ...coin,
    depth: coin.depth + pusherStroke * (1 - pusherStrokeJitter / 2 + random() * pusherStrokeJitter),
    lane: coin.lane + (random() - 0.5) * pusherLaneJitter,
  }));

  const won: PusherCoin[] = [], lost: PusherCoin[] = [], staying: PusherCoin[] = [];
  for (const coin of moved) {
    if (coin.depth >= 1) won.push(coin);
    else if (coin.depth > pusherChuteStart && (coin.lane < pusherLaneMargin || coin.lane > 1 - pusherLaneMargin)) lost.push(coin);
    else staying.push(coin);
  }

  const multiplier = won.reduce((sum, coin) => sum + pusherPayout(coin.kind), 0);
  return {
    field: { coins: staying.sort((a, b) => b.depth - a.depth), nextId: field.nextId + 1 },
    dropped, won, lost, multiplier,
  };
}

/** 한 판(여러 번 넣기)을 통째로 돌립니다. 환급률을 재거나 테스트할 때 씁니다. */
export function runPusherSession(drops: number, random: () => number = Math.random): { paid: number; won: number; lost: number } {
  let field = createPusherField(random);
  let paid = 0, wonCount = 0, lostCount = 0;
  for (let drop = 0; drop < drops; drop += 1) {
    const push = dropPusherCoin(field, random);
    field = push.field;
    paid += push.multiplier;
    wonCount += push.won.length;
    lostCount += push.lost.length;
  }
  return { paid, won: wonCount, lost: lostCount };
}
