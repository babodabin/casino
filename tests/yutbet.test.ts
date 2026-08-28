import test from 'node:test';import assert from 'node:assert/strict';
import {readYutSticks,throwYut,yutMultiplier,yutOutcomes,yutProbability,yutReturnRate,type YutFace} from '../src/yutbet.ts';

const sticks=(flat:number):YutFace[]=>Array.from({length:4},(_,i)=>i<flat?'배':'등');

test('배의 개수로 도·개·걸·윷·모를 정한다',()=>{
  assert.equal(readYutSticks(sticks(0)),'모');
  assert.equal(readYutSticks(sticks(1)),'도');
  assert.equal(readYutSticks(sticks(2)),'개');
  assert.equal(readYutSticks(sticks(3)),'걸');
  assert.equal(readYutSticks(sticks(4)),'윷');
});

test('네 개가 모두 배면 윷, 모두 등이면 모가 나온다',()=>{
  assert.equal(throwYut(()=>0).outcome,'윷');
  assert.equal(throwYut(()=>.9).outcome,'모');
});

test('맞힌 결과에만 배당을 주고 틀리면 0이다',()=>{
  assert.equal(yutMultiplier('개','개'),2.5);
  assert.equal(yutMultiplier('모','윷'),0);
});

test('다섯 결과의 확률을 모두 더하면 1이 된다',()=>{
  const sum=yutOutcomes.reduce((total,outcome)=>total+yutProbability[outcome],0);
  assert.equal(Number(sum.toFixed(6)),1);
});

test('어떤 결과에 걸어도 환급률이 93~96% 사이에 들어온다',()=>{
  for(const outcome of yutOutcomes){
    const rate=yutReturnRate(outcome);
    assert.ok(rate>=.93&&rate<=.96,`${outcome} 환급률 ${rate}`);
  }
});

test('실제로 많이 던지면 이론 확률에 가깝게 나온다',()=>{
  let seed=7;const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const counts:Record<string,number>={};
  for(let i=0;i<40000;i+=1){const {outcome}=throwYut(random);counts[outcome]=(counts[outcome]??0)+1;}
  for(const outcome of yutOutcomes){
    const share=(counts[outcome]??0)/40000;
    assert.ok(Math.abs(share-yutProbability[outcome])<.02,`${outcome} 실제 ${share}`);
  }
});
