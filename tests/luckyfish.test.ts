import test from 'node:test';import assert from 'node:assert/strict';
import {luckyFishCaveCount,luckyFishCaves,luckyFishForks,luckyFishMultiplier,luckyFishOffset,luckyFishProbability,luckyFishReturnRate,swimLuckyFish} from '../src/luckyfish.ts';

test('갈림길을 다섯 번 지나 동굴 여섯 곳 중 하나에 도착한다',()=>{
  const path=swimLuckyFish(()=>.9);
  assert.equal(path.turns.length,luckyFishForks);
  assert.equal(luckyFishCaves.length,luckyFishCaveCount);
  assert.ok(path.cave>=0&&path.cave<luckyFishCaveCount);
});

test('모두 왼쪽이면 0번, 모두 오른쪽이면 5번 동굴이다',()=>{
  assert.equal(swimLuckyFish(()=>0).cave,0);
  assert.equal(swimLuckyFish(()=>.9).cave,5);
});

test('여섯 동굴 확률을 더하면 1이 된다',()=>{
  const sum=luckyFishCaves.reduce((total,cave)=>total+luckyFishProbability(cave.id),0);
  assert.equal(sum,1);
});

test('바깥 동굴이 안쪽보다 드물게 나온다',()=>{
  assert.ok(luckyFishProbability(0)<luckyFishProbability(1));
  assert.ok(luckyFishProbability(1)<luckyFishProbability(2));
  assert.equal(luckyFishProbability(2),luckyFishProbability(3));
});

test('어느 동굴에 걸어도 환급률이 똑같다',()=>{
  const rates=luckyFishCaves.map(cave=>Number(luckyFishReturnRate(cave.id).toFixed(6)));
  assert.equal(new Set(rates).size,1);
  assert.equal(rates[0],.9375);
});

test('맞힌 동굴에만 표시된 배당을 준다',()=>{
  const path={turns:['오른쪽','오른쪽','오른쪽','오른쪽','오른쪽'] as ('왼쪽'|'오른쪽')[],cave:5};
  assert.equal(luckyFishMultiplier(5,path),30);
  assert.equal(luckyFishMultiplier(2,path),0);
});

test('헤엄치는 가로 위치는 0과 1 사이에서 마지막에 동굴과 맞아떨어진다',()=>{
  const path=swimLuckyFish(()=>0);
  for(let step=0;step<=luckyFishForks;step+=1){
    const offset=luckyFishOffset(path,step);
    assert.ok(offset>=0&&offset<=1);
  }
  assert.equal(luckyFishOffset(path,luckyFishForks),path.cave/luckyFishForks);
});

test('많이 헤엄치면 가운데 동굴이 가장 많이 나온다',()=>{
  let seed=17;const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const counts=new Array(luckyFishCaveCount).fill(0);
  for(let i=0;i<40000;i+=1) counts[swimLuckyFish(random).cave]+=1;
  for(let cave=0;cave<luckyFishCaveCount;cave+=1){
    const share=counts[cave]/40000;
    assert.ok(Math.abs(share-luckyFishProbability(cave))<.02,`${cave}번 실제 ${share}`);
  }
  assert.ok(counts[2]+counts[3]>counts[0]+counts[5]);
});
