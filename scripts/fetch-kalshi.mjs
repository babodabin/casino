// Kalshi에서 이미 결과가 나온 마켓을 받아 앱이 읽을 파일 하나로 만듭니다.
//
// 앱은 서버가 없는 정적 사이트이고 Kalshi는 CORS를 열어 두지 않아서, 브라우저에서 직접 부를 수 없습니다.
// 그래서 GitHub Actions가 하루 한 번 이 스크립트를 돌려 결과를 저장소에 넣고, 앱은 그 파일만 읽습니다.
//
// 배당은 '경기 전 가격'에서 뽑습니다. 마감가는 결과가 드러난 뒤라 0.99나 0.01이어서 쓸 수 없습니다.
// 캔들스틱으로 마감 여섯 시간 전 가격을 가져와 그때 시장이 본 확률을 씁니다.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'https://api.elections.kalshi.com/trade-api/v2';
// JSON이 아니라 .ts로 내보냅니다. 앱도 테스트도 그냥 import 하면 되고,
// 테스트를 돌리는 node --experimental-strip-types가 JSON은 못 읽기 때문입니다.
const OUT = 'src/predictdata.ts';
const HOUR = 3600, DAY = 86400;

/** 스포츠는 하루에도 수백 개가 정산되므로 널리 알려진 종목만 씁니다. */
const SPORT_SERIES = [
  'KXUCLGAME', 'KXEPLGAME', 'KXLALIGAGAME', 'KXSERIEAGAME', 'KXBUNDESLIGAGAME',
  'KXNBAGAME', 'KXMLBGAME', 'KXNFLGAME', 'KXNHLGAME', 'KXATPMATCH', 'KXWTAMATCH',
];
// 사회문제 쪽은 이 카테고리에서 고릅니다.
// 날씨(Climate and Weather)는 뺐습니다. "8월 27일 최고기온이 99도 미만일까?"처럼
// 도시 이름도 없이 기온만 묻는 문제가 대부분이라 문제로서 재미가 없습니다.
const SOCIAL_CATEGORIES = ['Politics', 'Elections', 'Economics', 'World', 'Health', 'Social', 'Science and Technology', 'Companies', 'Entertainment'];
/** 아무도 거래하지 않은 마켓은 문제로 쓰지 않습니다. 사람들이 실제로 관심을 둔 것만 씁니다. */
const MIN_VOLUME = 5000;
/** 사회문제는 스포츠보다 거래가 적어 문턱을 낮춥니다. */
const MIN_SOCIAL_VOLUME = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    const res = await fetch(BASE + path);
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await sleep(attempt * 1200); continue; }
    return null;
  }
  return null;
}

/** 마감 여섯 시간 전에 시장이 매긴 확률. 없으면 null을 돌려줍니다. */
async function priceBeforeClose(seriesTicker, market) {
  const end = Math.floor(new Date(market.close_time).getTime() / 1000);
  const data = await get(`/series/${seriesTicker}/markets/${market.ticker}/candlesticks?start_ts=${end - 12 * HOUR}&end_ts=${end - HOUR}&period_interval=60`);
  const candles = data?.candlesticks ?? [];
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    const price = Number(candles[index]?.price?.close_dollars);
    // 0.08~0.92 밖은 배당이 1배 아래로 떨어지거나 답이 뻔해서 문제로 쓰지 않습니다.
    if (Number.isFinite(price) && price >= 0.08 && price <= 0.92) return price;
  }
  return null;
}

const isSettled = (market) => market.result === 'yes' || market.result === 'no';

async function settledMarkets(seriesTicker) {
  const data = await get(`/markets?limit=200&status=settled&series_ticker=${seriesTicker}`);
  return (data?.markets ?? []).filter(isSettled);
}

/** 영어 제목을 그대로 두면 한국어 앱에서 겉돌아, 흔한 스포츠 형식만 우리말로 바꿉니다. */
function koreanTitle(market, category) {
  const title = (market.title ?? '').trim();
  // "A vs B Pro Football game: A wins?" 처럼 생긴 것. 팀 이름과 종목이 붙어 있어
  // 둘을 갈라내기 어려우므로 앞부분은 그대로 두고 묻는 말만 우리말로 바꿉니다.
  const gameAt = title.indexOf(' game: ');
  if (gameAt > 0 && /\s+wins\?$/i.test(title)) {
    const matchup = title.slice(0, gameAt).trim();
    const who = title.slice(gameAt + 7).replace(/\s+wins\?$/i, '').trim();
    if (matchup && who) return `${matchup} — ${who}이(가) 이겼을까?`;
  }
  const winner = title.match(/^(.+?)\s+wins$/i);
  if (winner) return `${winner[1]}이(가) 이겼을까?`;
  const regTime = title.match(/^Reg Time:\s*(.+)$/i);
  if (regTime) return regTime[1].toLowerCase() === 'tie' ? '정규시간에 비겼을까?' : `정규시간에 ${regTime[1]}이(가) 이겼을까?`;
  if (category === 'Sports') return title;
  return title;   // 사회문제는 문장이라 손대지 않고 그대로 둡니다.
}

// 스포츠는 최근 것이라야 재미가 있지만, 사회문제는 오래된 일도 문제로 성립합니다.
// 최근 열흘로 막아 두었더니 사회문제가 예닐곱 개밖에 안 모여서 반년까지 넓혔습니다.
function bucketOf(closeTs, now, category) {
  const age = now - closeTs;
  if (age <= 2 * DAY) return '어제';
  if (age <= 10 * DAY) return '지난주';
  if (category !== 'Sports' && age <= 180 * DAY) return '예전';
  return null;
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const picked = [];
  const seen = new Set();

  const consider = async (market, seriesTicker, category) => {
    if (!isSettled(market) || seen.has(market.ticker)) return;
    const floor = category === 'Sports' ? MIN_VOLUME : MIN_SOCIAL_VOLUME;
    if (Number(market.volume_fp ?? market.volume ?? 0) < floor) return;
    const closeTs = Math.floor(new Date(market.close_time).getTime() / 1000);
    const bucket = bucketOf(closeTs, now, category);
    if (!bucket) return;
    const probability = await priceBeforeClose(seriesTicker, market);
    if (probability === null) return;
    seen.add(market.ticker);
    picked.push({
      id: market.ticker,
      bucket,
      category,
      title: koreanTitle(market, category),
      sourceTitle: (market.title ?? '').trim(),
      yesLabel: (market.yes_sub_title ?? '예').trim(),
      noLabel: (market.no_sub_title ?? '아니오').trim(),
      closeTime: market.close_time,
      result: market.result,
      probability: Number(probability.toFixed(4)),
      volume: Number(market.volume_fp ?? market.volume ?? 0),
    });
  };

  for (const series of SPORT_SERIES) {
    const markets = await settledMarkets(series);
    markets.sort((a, b) => Number(b.volume_fp ?? 0) - Number(a.volume_fp ?? 0));
    let taken = 0;
    for (const market of markets) {
      if (taken >= 6) break;
      const before = picked.length;
      await consider(market, series, 'Sports');
      if (picked.length > before) taken += 1;
    }
  }

  // 사회문제는 시리즈가 만 개가 넘어 전부 확인하면 너무 오래 걸립니다.
  // 해당 카테고리만 모은 뒤 섞어서 정해진 개수까지만 두드려 봅니다.
  // 예측 마켓을 스포츠와 사회문제 두 게임으로 나누면서 40 → 80개로 늘렸습니다.
  // 40개면 사회문제만 서른 판쯤 하고 나면 본 문제가 다시 나옵니다.
  const socialSeries = [];
  let cursor = '', pages = 0;
  while (pages < 14) {
    const data = await get(`/series?limit=1000${cursor ? `&cursor=${cursor}` : ''}`);
    if (!data) break;
    for (const series of data.series ?? []) if (SOCIAL_CATEGORIES.includes(series.category)) socialSeries.push(series);
    cursor = data.cursor; pages += 1;
    if (!cursor) break;
  }
  for (let index = socialSeries.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [socialSeries[index], socialSeries[swap]] = [socialSeries[swap], socialSeries[index]];
  }
  let socialTaken = 0, tried = 0;
  for (const series of socialSeries) {
    if (socialTaken >= 80 || tried >= 1400) break;
    tried += 1;
    const markets = await settledMarkets(series.ticker);
    markets.sort((a, b) => Number(b.volume_fp ?? 0) - Number(a.volume_fp ?? 0));
    for (const market of markets.slice(0, 3)) {
      const before = picked.length;
      await consider(market, series.ticker, series.category);
      if (picked.length > before) { socialTaken += 1; break; }
    }
  }

  picked.sort((a, b) => new Date(b.closeTime) - new Date(a.closeTime));
  mkdirSync(dirname(OUT), { recursive: true });
  const header = [
    '// 이 파일은 scripts/fetch-kalshi.mjs가 만듭니다. 손으로 고치지 마세요.',
    '// kalshi.com에서 이미 결과가 나온 마켓을 받아 온 것입니다.',
    `// 받은 때: ${new Date().toISOString()}`,
    '',
    "import type { PredictQuestion } from './predict.ts';",
    '',
    `export const predictGeneratedAt = '${new Date().toISOString()}';`,
    'export const predictQuestions: PredictQuestion[] = [',
  ].join('\n');
  const rows = picked.map((item) => `  ${JSON.stringify(item)},`).join('\n');
  writeFileSync(OUT, `${header}\n${rows}\n];\n`);

  const sports = picked.filter((x) => x.category === 'Sports').length;
  console.log(`${picked.length}문제 저장 · 스포츠 ${sports}개 · 사회문제 ${picked.length - sports}개`);
}

main().catch((error) => { console.error(error); process.exit(1); });
