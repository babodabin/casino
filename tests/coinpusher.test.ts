import test from 'node:test';import assert from 'node:assert/strict';
import {createPusherField,dropPusherCoin,pusherChuteStart,pusherCoinPayout,pusherGoldPayout,pusherLaneMargin,pusherPayout,pusherStartingCoins,pusherStartingGold,pusherStroke,runPusherSession,type PusherCoin,type PusherField} from '../src/coinpusher.ts';

const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};
// 0.5를 계속 돌려주면 밀판은 정확히 한 걸음만 밀고 좌우로는 흔들리지 않습니다.
const steady=()=>0.5;
const field=(...coins:PusherCoin[]):PusherField=>({coins,nextId:100});
const coin=(depth:number,lane:number,kind:PusherCoin['kind']='코인',id=1):PusherCoin=>({id,depth,lane,kind});

test('기계에는 동전 열 개와 금화 한 개가 미리 깔려 있다',()=>{
  const start=createPusherField(seeded(5));
  assert.equal(start.coins.length,pusherStartingCoins+pusherStartingGold);
  assert.equal(start.coins.filter(item=>item.kind==='금화').length,pusherStartingGold);
  for(const item of start.coins){
    assert.ok(item.depth>0&&item.depth<1,`깊이 ${item.depth}`);
    assert.ok(item.lane>pusherLaneMargin&&item.lane<1-pusherLaneMargin,`자리 ${item.lane}`);
  }
});

test('동전을 넣으면 판의 동전이 앞으로 밀린다',()=>{
  const before=coin(0.4,0.5);
  const push=dropPusherCoin(field(before),steady);
  const after=push.field.coins.find(item=>item.id===before.id)!;
  assert.equal(Number(after.depth.toFixed(6)),Number((0.4+pusherStroke).toFixed(6)));
  assert.equal(after.lane,0.5);
});

test('넣은 동전도 판에 남는다',()=>{
  const push=dropPusherCoin(field(),steady);
  assert.equal(push.won.length,0);
  assert.equal(push.lost.length,0);
  assert.equal(push.field.coins.length,1);
  assert.equal(push.field.coins[0].id,push.dropped.id);
});

test('앞턱을 넘은 것만 내 몫이 된다',()=>{
  const push=dropPusherCoin(field(coin(0.95,0.5),coin(0.5,0.5,'코인',2)),steady);
  assert.equal(push.won.length,1);
  assert.equal(push.won[0].id,1);
  assert.equal(push.multiplier,pusherCoinPayout);
  assert.ok(push.field.coins.every(item=>item.id!==1));
});

test('금화는 여러 배로 쳐준다',()=>{
  const push=dropPusherCoin(field(coin(0.95,0.5,'금화')),steady);
  assert.equal(push.multiplier,pusherGoldPayout);
  assert.equal(pusherPayout('금화'),pusherGoldPayout);
  assert.equal(pusherPayout('코인'),pusherCoinPayout);
});

test('여러 개가 한꺼번에 넘어가면 그만큼 더 받는다',()=>{
  const push=dropPusherCoin(field(coin(0.95,0.5),coin(0.97,0.6,'코인',2),coin(0.99,0.4,'금화',3)),steady);
  assert.equal(push.won.length,3);
  assert.equal(push.multiplier,pusherCoinPayout*2+pusherGoldPayout);
});

test('앞쪽 양옆 홈으로 밀린 동전은 사라지고 몫이 되지 않는다',()=>{
  const push=dropPusherCoin(field(coin(0.5,0.02),coin(0.5,0.98,'코인',2)),steady);
  assert.equal(push.lost.length,2);
  assert.equal(push.won.length,0);
  assert.equal(push.multiplier,0);
  assert.ok(push.field.coins.every(item=>item.id!==1&&item.id!==2));
});

test('안쪽에서는 옆으로 빠지지 않는다',()=>{
  // 홈이 시작되는 깊이보다 뒤에 있으면 벽이 막고 있습니다.
  const inside=coin(pusherChuteStart-pusherStroke-0.05,0.02);
  const push=dropPusherCoin(field(inside),steady);
  assert.equal(push.lost.length,0);
  assert.ok(push.field.coins.some(item=>item.id===inside.id));
});

test('동전은 없어지지 않는다 — 남은 것 + 딴 것 + 빠진 것이 언제나 맞는다',()=>{
  const random=seeded(13);
  let current=createPusherField(random);
  for(let drop=0;drop<200;drop+=1){
    const before=current.coins.length;
    const push=dropPusherCoin(current,random);
    assert.equal(push.field.coins.length+push.won.length+push.lost.length,before+1);
    current=push.field;
  }
});

test('넣은 동전마다 번호가 새로 붙는다',()=>{
  const random=seeded(3);
  let current=createPusherField(random);
  const seen=new Set<number>();
  for(let drop=0;drop<50;drop+=1){
    const push=dropPusherCoin(current,random);
    assert.ok(!seen.has(push.dropped.id));
    seen.add(push.dropped.id);
    current=push.field;
  }
});

test('쌓였다가 쏟아진다 — 아무것도 안 나오는 판이 실제로 있다',()=>{
  const random=seeded(29);
  let current=createPusherField(random);
  let empty=0,burst=0;
  for(let drop=0;drop<600;drop+=1){
    const push=dropPusherCoin(current,random);
    if(push.won.length===0)empty+=1;
    if(push.won.length>=2)burst+=1;
    current=push.field;
  }
  assert.ok(empty>60,`빈 판 ${empty}회`);
  assert.ok(burst>30,`두 개 이상 ${burst}회`);
});

test('오래 돌리면 환급률이 100%를 넘지 않는다',()=>{
  // 정확한 값은 src/coinpusher.ts 주석에 적어 두었습니다. 여기서는 크게 어긋나지 않는지만 봅니다.
  const random=seeded(101);
  const drops=1200,runs=6;
  let paid=0;
  for(let run=0;run<runs;run+=1) paid+=runPusherSession(drops,random).paid;
  const rate=paid/(drops*runs);
  assert.ok(rate>0.85&&rate<1,`환급률 ${(rate*100).toFixed(1)}%`);
});

test('앞턱으로 넘어가는 것보다 옆홈으로 빠지는 것이 적다',()=>{
  const random=seeded(53);
  const result=runPusherSession(800,random);
  assert.ok(result.won>result.lost*5,`앞턱 ${result.won} 옆홈 ${result.lost}`);
  assert.ok(result.lost>0,'옆홈으로 하나도 안 빠지면 하우스 몫이 없습니다');
});
