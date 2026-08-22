import {
  isWinningMahjongHand, evaluateBasicRiichiYaku, calculateRiichiFu, calculateRiichiScore,
  countMahjongDora, countYakumanMultiplier, seatWindFor, roundWindFor,
  type MahjongTile, type RiichiScoreResult,
} from './riichimahjong.ts';
import {
  canSichuanWin, evaluateSichuanFan, sichuanScore, isSichuanWinningHand,
  type SichuanSuit,
} from './sichuanmahjong.ts';
import {
  isHongKongWinningHand, evaluateHongKongFaan, canHongKongDeclareWin, hongKongScore, totalFaan,
  HONG_KONG_MIN_FAAN, type HongKongFlower,
} from './hongkongmahjong.ts';
import {
  isChineseWinningHand, evaluateChineseYaku, canChineseDeclareWin, chineseScore, totalChinesePoints,
  CHINESE_MIN_POINTS,
} from './chinesemahjong.ts';

/**
 * 네 가지 마작이 각자의 규칙으로 돌도록 화면 쪽에 하나의 창구를 제공합니다.
 * 화면은 이 파일의 함수만 부르고, 종목별 차이는 여기서 흡수합니다.
 */

export type MahjongModeKey = 'riichi' | 'chinese' | 'hongkong' | 'sichuan';
export type MahjongWinType = 'tsumo' | 'ron';

export type MahjongWinContext = {
  mode: MahjongModeKey;
  hand: MahjongTile[];
  melds?: MahjongTile[][];
  concealedKans?: MahjongTile[][];
  winType: MahjongWinType;
  winningTile?: MahjongTile;
  seat: number;
  dealerSeat: number;
  roundIndex: number;
  /** 리치 전용 */
  riichi?: boolean;
  doubleRiichi?: boolean;
  ippatsu?: boolean;
  doraIndicators?: MahjongTile[];
  uraIndicators?: MahjongTile[];
  /** 사천 전용 */
  voidSuit?: SichuanSuit;
  activeOpponents?: number;
  /** 홍콩 전용 */
  flowers?: HongKongFlower[];
  /** 공통 상황 */
  afterKan?: boolean;
  robbingKan?: boolean;
  lastTile?: boolean;
  firstTurn?: boolean;
};

export type MahjongWinSummary = {
  /** 화료가 규칙상 인정되는가 (역 없음·최소 점수 미달이면 false) */
  allowed: boolean;
  /** 인정되지 않을 때 화면에 띄울 이유 */
  blockedReason: string;
  /** 역 목록. 이름과 값만 화면에 보여줍니다. */
  lines: { name: string; value: string; detail: string }[];
  /** '3판 30부', '24점', '4배' 같은 등급 표시 */
  grade: string;
  /** 점수 이동 설명 */
  scoreText: string;
  /** 종목별 원점수 (리치=점, 사천=배수, 홍콩=번, 중국=점) */
  rawPoints: number;
  /** 리치에서만 채워집니다. 국 진행·점수 이동에 그대로 씁니다. */
  riichiScore?: RiichiScoreResult;
};

export const mahjongUsesHonors: Record<MahjongModeKey, boolean> = {
  riichi: true, chinese: true, hongkong: true, sichuan: false,
};

/** 종목별 최소 조건을 한 줄로 설명합니다. */
export const mahjongMinimumNote: Record<MahjongModeKey, string> = {
  riichi: '역이 하나라도 있어야 화료할 수 있습니다',
  chinese: `역 합계 ${CHINESE_MIN_POINTS}점을 넘겨야 화료할 수 있습니다`,
  hongkong: `${HONG_KONG_MIN_FAAN}번을 넘겨야 화료할 수 있습니다`,
  sichuan: '정결한 종류를 전부 버려야 화료할 수 있습니다',
};

/** 손패 모양만으로 완성인지 판정합니다. 종목별 최소 조건은 보지 않습니다. */
export function isModeWinningShape(mode: MahjongModeKey, hand: MahjongTile[], meldCount: number) {
  if (mode === 'sichuan') return isSichuanWinningHand(hand, meldCount);
  if (mode === 'hongkong') return isHongKongWinningHand(hand, meldCount);
  if (mode === 'chinese') return isChineseWinningHand(hand, meldCount);
  return isWinningMahjongHand(hand, meldCount);
}

/** 정결까지 포함해 그 손으로 화료를 시도할 수 있는지 봅니다. */
export function canModeWinShape(mode: MahjongModeKey, hand: MahjongTile[], melds: MahjongTile[][], voidSuit?: SichuanSuit) {
  if (mode === 'sichuan') return canSichuanWin(hand, melds, voidSuit ?? 'p');
  return isModeWinningShape(mode, hand, melds.length);
}

const formatPoints = (value: number) => value.toLocaleString();

export function summariseWin(context: MahjongWinContext): MahjongWinSummary {
  const melds = context.melds ?? [];
  const concealedKans = context.concealedKans ?? [];
  const seatWind = seatWindFor(context.seat, context.dealerSeat);
  const roundWind = roundWindFor(context.roundIndex);

  if (context.mode === 'sichuan') {
    const voidSuit = context.voidSuit ?? 'p';
    if (!canSichuanWin(context.hand, melds, voidSuit)) {
      return { allowed: false, blockedReason: '정결한 종류가 아직 손에 남아 있습니다', lines: [], grade: '', scoreText: '', rawPoints: 0 };
    }
    const fans = evaluateSichuanFan({
      hand: context.hand, melds, winType: context.winType,
      afterKan: context.afterKan, robbingKan: context.robbingKan, lastTile: context.lastTile,
    });
    const score = sichuanScore({
      fans, basePoints: 1, winType: context.winType,
      activeOpponents: context.activeOpponents ?? 3,
    });
    return {
      allowed: true,
      blockedReason: '',
      lines: fans.map((fan) => ({ name: fan.name, value: `×${fan.multiplier}`, detail: fan.detail })),
      grade: `${score.multiplier}배${score.capped ? ' (상한)' : ''}`,
      scoreText: context.winType === 'tsumo'
        ? `남은 ${score.total / score.perPlayer}명에게 ${formatPoints(score.perPlayer)}점씩 · 합계 ${formatPoints(score.total)}점`
        : `방총자에게 ${formatPoints(score.perPlayer)}점`,
      rawPoints: score.multiplier,
    };
  }

  if (context.mode === 'hongkong') {
    const faan = evaluateHongKongFaan({
      hand: context.hand, melds, concealedKans, winType: context.winType, winningTile: context.winningTile,
      seatWind, roundWind, flowers: context.flowers, seat: context.seat,
      afterKan: context.afterKan, robbingKan: context.robbingKan, lastTile: context.lastTile, firstTurn: context.firstTurn,
    });
    if (!canHongKongDeclareWin(faan)) {
      return {
        allowed: false,
        blockedReason: `${totalFaan(faan)}번이라 최소 ${HONG_KONG_MIN_FAAN}번에 미치지 못합니다`,
        lines: faan.map((entry) => ({ name: entry.name, value: `${entry.faan}번`, detail: entry.detail })),
        grade: '', scoreText: '', rawPoints: totalFaan(faan),
      };
    }
    const score = hongKongScore({ faan, basePoints: 1, winType: context.winType });
    return {
      allowed: true,
      blockedReason: '',
      lines: faan.map((entry) => ({ name: entry.name, value: entry.limit ? '한도' : `${entry.faan}번`, detail: entry.detail })),
      grade: `${score.total}번${score.limitName ? ` · ${score.limitName}` : ''}`,
      scoreText: context.winType === 'tsumo'
        ? `세 명에게 ${formatPoints(score.perPlayer)}점씩`
        : `방총자가 ${formatPoints(score.perPlayer * 3)}점 전액 지불`,
      rawPoints: score.total,
    };
  }

  if (context.mode === 'chinese') {
    const yaku = evaluateChineseYaku({
      hand: context.hand, melds, concealedKans, winType: context.winType, winningTile: context.winningTile,
      seatWind, roundWind, afterKan: context.afterKan, robbingKan: context.robbingKan,
      lastTile: context.lastTile && context.winType === 'tsumo',
      lastDiscard: context.lastTile && context.winType === 'ron',
    });
    const points = totalChinesePoints(yaku);
    if (!canChineseDeclareWin(yaku)) {
      return {
        allowed: false,
        blockedReason: `${points}점이라 최소 ${CHINESE_MIN_POINTS}점에 미치지 못합니다`,
        lines: yaku.map((entry) => ({ name: entry.name, value: `${entry.points}점`, detail: entry.detail })),
        grade: '', scoreText: '', rawPoints: points,
      };
    }
    const score = chineseScore({ yaku, winType: context.winType });
    return {
      allowed: true,
      blockedReason: '',
      lines: yaku.map((entry) => ({ name: entry.name, value: `${entry.points}점`, detail: entry.detail })),
      grade: `${points}점`,
      scoreText: context.winType === 'tsumo'
        ? `세 명에게 ${formatPoints(score.payments[0])}점씩 · 합계 ${formatPoints(score.total)}점`
        : `방총자 ${formatPoints(score.payments[0])}점 · 나머지 ${formatPoints(score.basePoints)}점씩`,
      rawPoints: points,
    };
  }

  // ── 리치 ────────────────────────────────────────────────────────
  const yaku = evaluateBasicRiichiYaku({
    concealed: context.hand, openMelds: melds, concealedKans,
    riichi: context.riichi, doubleRiichi: context.doubleRiichi, ippatsu: context.ippatsu,
    winType: context.winType, winningTile: context.winningTile, seatWind, roundWind,
    afterKan: context.afterKan, robbingKan: context.robbingKan, lastTile: context.lastTile, firstTurn: context.firstTurn,
  });
  if (!yaku.length) {
    return { allowed: false, blockedReason: '역이 하나도 없어 화료할 수 없습니다', lines: [], grade: '', scoreText: '', rawPoints: 0 };
  }
  const fu = context.winningTile
    ? calculateRiichiFu({ concealed: context.hand, openMelds: melds, concealedKans, winningTile: context.winningTile, winType: context.winType, seatWind, roundWind })
    : null;
  const allTiles = [...context.hand, ...melds.flat(), ...concealedKans.flat()];
  const dora = countMahjongDora(allTiles, context.doraIndicators ?? []);
  const ura = context.riichi ? countMahjongDora(allTiles, context.uraIndicators ?? []) : 0;
  const yakumanCount = countYakumanMultiplier(yaku);
  const han = yakumanCount ? 0 : yaku.reduce((sum, entry) => sum + entry.han, 0) + dora + ura;
  const score = calculateRiichiScore({
    han, fu: fu?.fu ?? 0, dealer: context.seat === context.dealerSeat,
    winType: context.winType, yakumanCount,
  });

  const lines = yaku.map((entry) => ({
    name: entry.name,
    value: entry.yakuman ? (entry.yakumanMultiplier && entry.yakumanMultiplier > 1 ? `${entry.yakumanMultiplier}배 역만` : '역만') : `${entry.han}판`,
    detail: entry.detail,
  }));
  if (!yakumanCount && dora) lines.push({ name: '도라', value: `${dora}판`, detail: '도라 표시패가 가리키는 패' });
  if (!yakumanCount && ura) lines.push({ name: '뒷도라', value: `${ura}판`, detail: '리치를 선언해야 볼 수 있는 도라' });

  return {
    allowed: true,
    blockedReason: '',
    lines,
    grade: yakumanCount
      ? (yakumanCount > 1 ? `${yakumanCount}배 역만` : '역만')
      : `${han}판 ${fu?.fu ?? 0}부${score.limitName ? ` · ${score.limitName}` : ''}`,
    scoreText: context.winType === 'tsumo'
      ? `지불 ${score.payments.map(formatPoints).join(' / ')}점`
      : `${formatPoints(score.total)}점 획득`,
    rawPoints: score.total,
    riichiScore: score,
  };
}

/** 화면 버튼에 쓸 문구. 완성 여부와 최소 조건을 구분해 보여줍니다. */
export function winButtonLabel(mode: MahjongModeKey, shapeComplete: boolean, summary: MahjongWinSummary | null) {
  if (!shapeComplete) return '아직 미완성';
  if (summary?.allowed) return '쯔모';
  if (mode === 'sichuan') return '정결 미완료';
  if (mode === 'hongkong') return `${summary?.rawPoints ?? 0}번 · 부족`;
  if (mode === 'chinese') return `${summary?.rawPoints ?? 0}점 · 부족`;
  return '역 없음';
}
