import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * 네 종목이 각자의 공식 규칙을 얼마나 담고 있는지 소스에서 직접 확인합니다.
 * "다 됐다"는 말이 아니라 이 테스트가 근거입니다.
 */
const read = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');

test('리치 마작: 표준 역과 규칙이 모두 있다', () => {
  const source = read('riichimahjong.ts');
  const required = [
    // 역
    '리치', '더블리치', '일발', '멘젠쯔모', '핑후', '탕야오', '이페코', '량페코', '칠대자',
    '혼일색', '청일색', '또이또이', '삼암각', '일기통관', '삼색동순', '삼색동각', '찬타', '준찬타',
    '소삼원', '삼깡쯔', '혼노두', '하이테이', '호테이', '영상개화', '창깡', '인화',
    // 역만
    '국사무쌍', '대삼원', '대사희', '소사희', '자일색', '청노두', '녹일색', '구련보등',
    '사암각', '사깡쯔', '천화', '지화',
    // 더블 역만
    '국사무쌍 13면', '순정구련보등', '사암각 단기',
    // 규칙
    '깡도라', '뒷도라', '적도라', '구종구패', '사풍연타', '사가리치', '사개깡', '유국만관',
  ];
  const missing = required.filter((name) => !source.includes(name));
  assert.deepEqual(missing, [], `빠진 항목: ${missing.join(' ')}`);
});

test('홍콩 마작: 한도 역과 번, 꽃패 규칙이 있다', () => {
  const source = read('hongkongmahjong.ts');
  const required = [
    '십삼요', '대삼원', '대사희', '소사희', '자일색', '청요구', '녹일색', '십팔나한',
    '구련보등', '사암각', '천화',
    '청일색', '혼일색', '대대화', '혼요구', '삼암각', '칠대자', '소삼원',
    '일기통관', '삼색동순', '삼색동각', '혼전대요', '이배구', '평화', '문전청',
    '꽃패', '花牌', 'resolveFlowerDraws', 'HONG_KONG_MIN_OPTIONS',
  ];
  const missing = required.filter((name) => !source.includes(name));
  assert.deepEqual(missing, [], `빠진 항목: ${missing.join(' ')}`);
});

test('사천 마작: 고유 규칙이 모두 있다', () => {
  const source = read('sichuanmahjong.ts');
  const required = [
    '정결', '환삼장', '혈전', '금구',
    '평화', '대대화', '청일색', '칠대자', '청대대', '용칠대자', '청칠대자', '장대', '청룡칠대자', '십팔나한',
    '자모', '깡상화', '창깡', '해저포',
    'settleSichuanKan', 'kanInstantPoints', 'settleSichuanFullDraw', 'autoPlaySichuanRemainder',
    'swapThreeTiles', 'chooseVoidSuit', 'isSichuanSevenPairs', 'countRoots',
  ];
  const missing = required.filter((name) => !source.includes(name));
  assert.deepEqual(missing, [], `빠진 항목: ${missing.join(' ')}`);
});

test('네 종목이 각자의 최소 화료 조건을 갖고 있다', () => {
  const modes = read('mahjongmodes.ts');
  ['riichi', 'chinese', 'hongkong', 'sichuan'].forEach((mode) => {
    assert.equal(modes.includes(`'${mode}'`), true, `${mode} 분기가 없습니다`);
  });
  assert.equal(modes.includes('CHINESE_MIN_POINTS'), true);
  assert.equal(modes.includes('HONG_KONG_MIN_FAAN'), true);
  assert.equal(modes.includes('canSichuanWin'), true);
});
