/**
 * 화투 48장.
 *
 * 한국 전통 게임(섰다·도리짓고땡·민화투·고스톱·맞고·육백)이 모두 이 한 벌을 씁니다.
 * 월마다 4장씩 12달, 종류별 장수는 광 5 · 열끗 9 · 띠 10 · 피 24로 정해져 있습니다.
 */

export type HwatuKind = '광' | '열끗' | '띠' | '피';
/** 띠의 종류. 홍단·청단·초단은 고스톱과 민화투에서 각각 다른 역이 됩니다. */
export type RibbonKind = '홍단' | '청단' | '초단' | '비띠';

export type HwatuCard = {
  id: string;
  /** 1~12월 */
  month: number;
  kind: HwatuKind;
  /** 띠일 때만 */
  ribbon?: RibbonKind;
  /** 피 한 장이 두 장 몫을 하는 쌍피 */
  double?: boolean;
  /** 화면에 보여 줄 이름 */
  name: string;
};

/** 월 이름. 화면 표시와 족보 설명에 씁니다. */
export const monthNames: Record<number, string> = {
  1: '송학', 2: '매조', 3: '벚꽃', 4: '흑싸리', 5: '난초', 6: '모란',
  7: '홍싸리', 8: '공산', 9: '국화', 10: '단풍', 11: '오동', 12: '비',
};

type CardSpec = { kind: HwatuKind; ribbon?: RibbonKind; double?: boolean; label?: string };

/**
 * 월별 네 장의 구성. 실제 화투 한 벌 그대로입니다.
 *  - 광 5장: 1·3·8·11·12월
 *  - 열끗 9장: 2·4·5·6·7·8·9·10·12월
 *  - 띠 10장: 홍단 1·2·3월, 청단 6·9·10월, 초단 4·5·7월, 비띠 12월
 *  - 나머지 24장이 피이고, 그중 11월과 12월에 쌍피가 한 장씩 있습니다.
 */
const monthSpecs: Record<number, CardSpec[]> = {
  1: [{ kind: '광' }, { kind: '띠', ribbon: '홍단' }, { kind: '피' }, { kind: '피' }],
  2: [{ kind: '열끗' }, { kind: '띠', ribbon: '홍단' }, { kind: '피' }, { kind: '피' }],
  3: [{ kind: '광' }, { kind: '띠', ribbon: '홍단' }, { kind: '피' }, { kind: '피' }],
  4: [{ kind: '열끗' }, { kind: '띠', ribbon: '초단' }, { kind: '피' }, { kind: '피' }],
  5: [{ kind: '열끗' }, { kind: '띠', ribbon: '초단' }, { kind: '피' }, { kind: '피' }],
  6: [{ kind: '열끗' }, { kind: '띠', ribbon: '청단' }, { kind: '피' }, { kind: '피' }],
  7: [{ kind: '열끗' }, { kind: '띠', ribbon: '초단' }, { kind: '피' }, { kind: '피' }],
  8: [{ kind: '광' }, { kind: '열끗', label: '기러기' }, { kind: '피' }, { kind: '피' }],
  9: [{ kind: '열끗', label: '국진' }, { kind: '띠', ribbon: '청단' }, { kind: '피' }, { kind: '피' }],
  10: [{ kind: '열끗' }, { kind: '띠', ribbon: '청단' }, { kind: '피' }, { kind: '피' }],
  11: [{ kind: '광' }, { kind: '피' }, { kind: '피' }, { kind: '피', double: true }],
  12: [{ kind: '광', label: '비광' }, { kind: '열끗', label: '제비' }, { kind: '띠', ribbon: '비띠' }, { kind: '피', double: true }],
};

/** 화투 48장 한 벌을 만듭니다. 순서는 항상 같습니다(섞는 것은 따로). */
export function createHwatuDeck(): HwatuCard[] {
  const deck: HwatuCard[] = [];
  for (let month = 1; month <= 12; month += 1) {
    monthSpecs[month].forEach((spec, index) => {
      const suffix = spec.label ?? spec.ribbon ?? (spec.double ? '쌍피' : spec.kind);
      deck.push({
        id: `h${month}-${index}`,
        month,
        kind: spec.kind,
        ribbon: spec.ribbon,
        double: spec.double,
        name: `${month}월 ${monthNames[month]} ${suffix}`,
      });
    });
  }
  return deck;
}

export function shuffleHwatu(cards: HwatuCard[], random: () => number = Math.random): HwatuCard[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const at = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[at]] = [shuffled[at], shuffled[index]];
  }
  return shuffled;
}

/** 피 점수. 쌍피는 두 장으로 셉니다. */
export const pieceValue = (card: HwatuCard) => (card.kind === '피' ? (card.double ? 2 : 1) : 0);

/** 종류별 장수를 셉니다. 점수 계산의 기본 재료입니다. */
export function countByKind(cards: HwatuCard[]) {
  return {
    광: cards.filter((card) => card.kind === '광').length,
    열끗: cards.filter((card) => card.kind === '열끗').length,
    띠: cards.filter((card) => card.kind === '띠').length,
    피: cards.reduce((sum, card) => sum + pieceValue(card), 0),
  };
}

/** 띠 종류별 장수. 홍단·청단·초단 역 판정에 씁니다. */
export function countRibbons(cards: HwatuCard[]) {
  const ribbons = cards.filter((card) => card.kind === '띠');
  return {
    홍단: ribbons.filter((card) => card.ribbon === '홍단').length,
    청단: ribbons.filter((card) => card.ribbon === '청단').length,
    초단: ribbons.filter((card) => card.ribbon === '초단').length,
    비띠: ribbons.filter((card) => card.ribbon === '비띠').length,
  };
}

/** 비광을 뺀 광 장수. 고스톱에서 비광은 다른 광 셋과 함께여야 광 역이 됩니다. */
export const isRainBright = (card: HwatuCard) => card.kind === '광' && card.month === 12;
