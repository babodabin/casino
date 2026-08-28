import test from 'node:test';import assert from 'node:assert/strict';
import {createFishField,fishEventText,fishRaceLaps,fishTicketPayout,simulateFishRace} from '../src/fishrace.ts';

const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};

test('여섯 마리가 모두 순위에 정확히 한 번씩 들어간다',()=>{
  const result=simulateFishRace(createFishField(),seeded(5));
  assert.equal(result.order.length,6);
  assert.equal(new Set(result.order).size,6);
  assert.deepEqual([...result.order].sort((a,b)=>a-b),[1,2,3,4,5,6]);
});

test('구간 사건은 물고기 수 곱하기 구간 수만큼 기록된다',()=>{
  const result=simulateFishRace(createFishField(),seeded(9));
  assert.equal(result.events.length,6*fishRaceLaps);
  for(const event of result.events) assert.ok(fishEventText[event.kind]);
});

test('1위 기록이 가장 빠르고 꼴찌가 가장 느리다',()=>{
  const result=simulateFishRace(createFishField(),seeded(13));
  const first=result.times[result.order[0]],last=result.times[result.order[5]];
  assert.ok(first<=last);
  assert.ok(first>=46);
});

test('중간 순위도 여섯 마리가 빠짐없이 들어간다',()=>{
  const result=simulateFishRace(createFishField(),seeded(21));
  assert.equal(new Set(result.halfwayOrder).size,6);
});

test('1위를 맞혔을 때만 배당을 준다',()=>{
  const result=simulateFishRace(createFishField(),seeded(33));
  const winner=result.order[0],loser=result.order[5];
  assert.equal(fishTicketPayout({selection:winner,stake:1000,odds:4},result),4000);
  assert.equal(fishTicketPayout({selection:loser,stake:1000,odds:4},result),0);
});

test('중간에 뒤집히는 경주가 실제로 나온다',()=>{
  let flipped=0;
  for(let seed=1;seed<=300;seed+=1){
    const result=simulateFishRace(createFishField(),seeded(seed));
    if(result.halfwayOrder[0]!==result.order[0]) flipped+=1;
  }
  assert.ok(flipped>30,`역전 경주 ${flipped}회`);
});

test('한 마리가 독주하지 않는다',()=>{
  const wins:Record<number,number>={};
  for(let seed=1;seed<=600;seed+=1){
    const result=simulateFishRace(createFishField(),seeded(seed));
    wins[result.order[0]]=(wins[result.order[0]]??0)+1;
  }
  for(let id=1;id<=6;id+=1) assert.ok((wins[id]??0)>=40,`${id}번 우승 ${wins[id]??0}회`);
});
