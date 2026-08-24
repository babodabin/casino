import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMahjongCoinSettlement, mahjongScoreFromDetail } from '../src/mahjongwallet.ts';

test('마작 종류별 결과 문구에서 점수 단위를 읽는다',()=>{
  assert.equal(mahjongScoreFromDetail('리치 마작','쯔모 · 총 6판 30부'),6);
  assert.equal(mahjongScoreFromDetail('중국식 마작','론 · 24점 · 청일색'),24);
  assert.equal(mahjongScoreFromDetail('홍콩 마작','쯔모 · 5번 · 대대호'),5);
  assert.equal(mahjongScoreFromDetail('사천 마작','론 · 3번 · 청일색'),3);
});

test('마작 승리는 종류별 점수에 따라 월드코인 배율이 올라간다',()=>{
  assert.deepEqual(calculateMahjongCoinSettlement({game:'중국식 마작',stake:100,result:'win',score:32}),{score:32,multiplier:4,payout:400,net:300});
  assert.deepEqual(calculateMahjongCoinSettlement({game:'홍콩 마작',stake:100,result:'win',score:9}),{score:9,multiplier:5,payout:500,net:400});
});

test('마작 무승부는 베팅을 반환하고 패배는 추가 지급하지 않는다',()=>{
  assert.equal(calculateMahjongCoinSettlement({game:'리치 마작',stake:500,result:'push'}).payout,500);
  assert.equal(calculateMahjongCoinSettlement({game:'사천 마작',stake:500,result:'loss'}).net,-500);
});
