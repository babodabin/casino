import test from 'node:test';import assert from 'node:assert/strict';
import {aimCenter,aimEdge,aimFullest,aimRandom,clampColumn,columnAdvance,createPusherField,dropPusherCoin,pusherCenterColumn,pusherChuteStart,pusherCoinPayout,pusherColumns,pusherGoldPayout,pusherPackedAt,pusherPayout,pusherStartingCoins,pusherStartingPrizes,pusherStroke,runPusherSession,type PusherCoin,type PusherField} from '../src/coinpusher.ts';

const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};
// 0.5를 계속 돌려주면 밀판은 정확히 한 걸음만 밀고, 옆으로 밀리지도 구멍에 빠지지도 않습니다.
const steady=()=>0.5;
const field=(...coins:PusherCoin[]):PusherField=>({coins,nextId:100});
const coin=(column:number,depth:number,kind:PusherCoin['kind']='코인',id=1):PusherCoin=>({id,depth,column,kind});

test('기계에는 동전 마흔다섯 개와 경품 네 개가 미리 깔려 있다',()=>{
  const start=createPusherField(seeded(5));
  assert.equal(start.coins.length,pusherStartingCoins+pusherStartingPrizes.length);
  assert.deepEqual(start.coins.filter(item=>item.kind!=='코인').map(item=>item.kind).sort(),[...pusherStartingPrizes].sort());
  for(const item of start.coins){
    assert.ok(item.depth>0&&item.depth<1,`깊이 ${item.depth}`);
    assert.ok(item.column>=0&&item.column<pusherColumns,`줄 ${item.column}`);
  }
});

test('넣을 줄을 고를 수 있고 판 밖을 고르면 가장 가까운 줄로 맞춘다',()=>{
  assert.equal(dropPusherCoin(field(),0,steady).dropped.column,0);
  assert.equal(dropPusherCoin(field(),6,steady).dropped.column,6);
  assert.equal(dropPusherCoin(field(),-3,steady).dropped.column,0);
  assert.equal(dropPusherCoin(field(),99,steady).dropped.column,pusherColumns-1);
  assert.equal(clampColumn(2.4),2);
});

test('동전이 뭉친 줄이 더 세게 밀린다',()=>{
  const empty=columnAdvance(field(coin(0,0.5)),steady);
  const packed=columnAdvance(field(...Array.from({length:pusherPackedAt},(_,index)=>coin(3,0.3+index*0.05,'코인',index+1))),steady);
  assert.ok(packed[3]>empty[0],`뭉친 줄 ${packed[3]} vs 한 개짜리 줄 ${empty[0]}`);
  assert.ok(empty[0]>empty[1],'동전이 한 개라도 있는 줄이 빈 줄보다 세게 밀립니다');
  assert.equal(Number(empty[1].toFixed(6)),Number(pusherStroke.toFixed(6)));
  // 동전이 없는 줄은 기본만큼만 밀립니다.
  assert.equal(Number(packed[0].toFixed(6)),Number(pusherStroke.toFixed(6)));
});

test('앞턱을 넘은 것만 내 몫이 된다',()=>{
  const push=dropPusherCoin(field(coin(2,0.995),coin(4,0.5,'코인',2)),3,steady);
  assert.equal(push.won.length,1);
  assert.equal(push.won[0].id,1);
  assert.equal(push.multiplier,pusherCoinPayout);
  assert.ok(push.field.coins.every(item=>item.id!==1));
});

test('경품은 여러 배로 쳐준다',()=>{
  assert.equal(dropPusherCoin(field(coin(3,0.995,'금화')),3,steady).multiplier,pusherGoldPayout);
  assert.equal(pusherPayout('금화'),pusherGoldPayout);
  assert.equal(pusherPayout('코인'),pusherCoinPayout);
});

test('여러 개가 한꺼번에 넘어가면 그만큼 더 받는다',()=>{
  const push=dropPusherCoin(field(coin(1,0.995),coin(3,0.996,'코인',2),coin(5,0.997,'금화',3)),3,steady);
  assert.equal(push.won.length,3);
  assert.equal(push.multiplier,pusherCoinPayout*2+pusherGoldPayout);
});

test('동전은 판 밖으로 밀려나지 않는다',()=>{
  const random=seeded(17);
  let current=createPusherField(random);
  for(let drop=0;drop<300;drop+=1){
    const push=dropPusherCoin(current,drop%pusherColumns,random);
    for(const item of [...push.field.coins,...push.won,...push.lost]){
      assert.ok(item.column>=0&&item.column<pusherColumns,`줄 ${item.column}`);
    }
    current=push.field;
  }
});

test('구멍은 앞쪽에만 있다',()=>{
  // 벽이 끝나는 지점보다 뒤에 있으면 밀려도 빠지지 않습니다.
  const random=seeded(23);
  const inside=coin(0,pusherChuteStart-pusherStroke*2.5,'코인',7);
  for(let attempt=0;attempt<80;attempt+=1){
    const push=dropPusherCoin(field(inside),3,random);
    assert.equal(push.lost.length,0);
  }
});

test('동전은 없어지지 않는다 — 남은 것 + 딴 것 + 빠진 것이 언제나 맞는다',()=>{
  const random=seeded(13);
  let current=createPusherField(random);
  for(let drop=0;drop<250;drop+=1){
    const before=current.coins.length;
    const push=dropPusherCoin(current,drop%pusherColumns,random);
    assert.equal(push.field.coins.length+push.won.length+push.lost.length,before+1);
    current=push.field;
  }
});

test('넣은 동전마다 번호가 새로 붙는다',()=>{
  const random=seeded(3);
  let current=createPusherField(random);
  const seen=new Set<number>();
  for(let drop=0;drop<60;drop+=1){
    const push=dropPusherCoin(current,pusherCenterColumn,random);
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
    const push=dropPusherCoin(current,pusherCenterColumn,random);
    if(push.won.length===0)empty+=1;
    if(push.won.length>=2)burst+=1;
    current=push.field;
  }
  assert.ok(empty>120,`빈 판 ${empty}회`);
  assert.ok(burst>60,`두 개 이상 ${burst}회`);
});

test('어느 줄을 골라도 환급률이 비슷하고 100%를 넘지 않는다',()=>{
  // 이 게임의 핵심입니다. 한 줄이 유리하면 나머지 여섯 줄은 덫이 되고 고르는 재미가 사라집니다.
  // 그래서 구멍 확률을 줄에 상관없이 똑같이 두었습니다. 정확한 값은 src/coinpusher.ts 주석 참고.
  const rates:number[]=[];
  for(const aim of [aimCenter,aimEdge,aimRandom,aimFullest]){
    const random=seeded(101);
    const drops=900,runs=3;
    let paid=0;
    for(let run=0;run<runs;run+=1) paid+=runPusherSession(drops,aim,random).paid;
    const rate=paid/(drops*runs);
    rates.push(rate);
    assert.ok(rate>0.85&&rate<1,`환급률 ${(rate*100).toFixed(1)}%`);
  }
  const spread=Math.max(...rates)-Math.min(...rates);
  assert.ok(spread<0.06,`겨누기별 차이 ${(spread*100).toFixed(1)}%p`);
});

test('앞턱으로 넘어가는 것이 구멍에 빠지는 것보다 훨씬 많다',()=>{
  const random=seeded(53);
  const result=runPusherSession(900,aimCenter,random);
  assert.ok(result.won>result.lost*5,`앞턱 ${result.won} 구멍 ${result.lost}`);
  assert.ok(result.lost>0,'구멍에 하나도 안 빠지면 하우스 몫이 없습니다');
});
