import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * 국표마작 공식 역 81개가 전부 구현되어 있는지 소스에서 직접 확인합니다.
 * 역 이름은 한국어로 바뀔 수 있으므로 원문 한자 이름으로 대조합니다.
 */
const OFFICIAL: Record<number, string[]> = {
  88: ['大四喜','大三元','綠一色','九蓮寶燈','四杠','連七對','十三幺'],
  64: ['清幺九','小四喜','小三元','字一色','四暗刻','一色雙龍會'],
  48: ['一色四同順','一色四節高'],
  32: ['一色四步高','三杠','混幺九'],
  24: ['七對','七星不靠','全雙刻','清一色','一色三同順','一色三節高','全大','全中','全小'],
  16: ['清龍','三色雙龍會','一色三步高','全帶五','三同刻','三暗刻'],
  12: ['全不靠','組合龍','大於五','小於五','三風刻'],
  8:  ['花龍','推不倒','三色三同順','三色三節高','無番和','妙手回春','海底撈月','槓上開花','搶槓和'],
  6:  ['碰碰和','混一色','三色三步高','五門齊','全求人','雙暗杠','雙箭刻'],
  4:  ['全帶幺','不求人','雙明杠','和絕張'],
  2:  ['箭刻','圈風刻','門風刻','門前清','平和','四歸一','雙同刻','雙暗刻','暗杠','斷幺'],
  1:  ['一般高','喜相逢','連六','老少副','幺九刻','明杠','缺一門','無字','邊張','坎張','單釣將','自摸'],
  0:  ['花牌'],
};

test('국표마작 공식 역 81개가 모두 구현되어 있다', () => {
  const source = readFileSync(new URL('../src/chinesemahjong.ts', import.meta.url), 'utf8');
  const all = Object.values(OFFICIAL).flat();
  assert.equal(all.length, 81, `공식 역 목록이 81개여야 합니다 (현재 ${all.length}개)`);

  const missing = all.filter((name) => !source.includes(`'${name}'`));
  assert.deepEqual(missing, [], `구현되지 않은 역: ${missing.join(' ')}`);
});

test('구현된 역의 점수가 공식 점수와 같다', () => {
  const source = readFileSync(new URL('../src/chinesemahjong.ts', import.meta.url), 'utf8');
  const wrong: string[] = [];
  for (const [points, names] of Object.entries(OFFICIAL)) {
    if (points === '0') continue; // 꽃패는 장수만큼이라 고정값이 아님
    for (const name of names) {
      // add('한글', '한자', 점수, ...) 또는 { name: '한글', chinese: '한자', points: 점수, ... }
      const addForm = new RegExp(`'${name}',\\s*(\\d+)`);
      const objForm = new RegExp(`chinese: '${name}', points: (\\d+)`);
      const found = source.match(addForm)?.[1] ?? source.match(objForm)?.[1];
      if (found === undefined) { wrong.push(`${name}: 점수를 찾지 못함`); continue; }
      if (Number(found) !== Number(points)) wrong.push(`${name}: ${found}점 (공식 ${points}점)`);
    }
  }
  assert.deepEqual(wrong, [], `점수가 다른 역:\n${wrong.join('\n')}`);
});
