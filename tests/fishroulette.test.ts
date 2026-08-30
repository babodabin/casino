import test from 'node:test';import assert from 'node:assert/strict';
import {approachMs,createFishRouletteField,fishCount,fishPositionAt,fishRouletteBetLabels,fishRouletteCovers,fishRouletteMultiplier,fishRouletteOdds,fishRoulettePayout,fishRouletteSummary,fishRouletteWins,nextSlot,octopusAngle,octopusApproachMs,octopusPositionAt,octopusSettled,roundMs,slotAngle,slotCount,spinFishRoulette,type FishRouletteBet,type FishRouletteBetType,type Swimmer} from '../src/fishroulette.ts';

// 다른 테스트가 쓰는 단순 LCG는 한 판에서 난수를 여섯 개씩 뽑아 쓰면 자리가 고르게 안 나옵니다.
// 게임 자체는 Math.random을 쓰므로 문제가 없지만, 확률을 재는 테스트는 품질 좋은 난수가 필요합니다.
const seeded=(seed:number)=>{let state=seed>>>0;return()=>{state=(state+0x6D2B79F5)>>>0;let value=state;value=Math.imul(value^(value>>>15),value|1);value^=value+Math.imul(value^(value>>>7),value|61);return((value^(value>>>14))>>>0)/4294967296;};};
const types:FishRouletteBetType[]=['first','most','none','neighbour','octopus','parity','half'];

test('물고기 열두 마리가 각자 자리 하나를 고른다',()=>{
  const result=spinFishRoulette(seeded(7));
  assert.equal(result.swimmers.length,fishCount);
  assert.equal(new Set(result.swimmers.map(fish=>fish.id)).size,fishCount);
  for(const fish of result.swimmers){assert.ok(fish.slot>=1&&fish.slot<=slotCount);assert.ok(Number.isInteger(fish.slot));}
});

test('문어는 앉은 자리와 시계 방향 옆 칸 두 칸을 막는다',()=>{
  for(let seed=1;seed<=300;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    assert.ok(result.octopus.slot>=1&&result.octopus.slot<=slotCount);
    assert.deepEqual(result.blocked,[result.octopus.slot,nextSlot(result.octopus.slot)]);
  }
});

test('문어가 막은 두 칸에는 물고기가 한 마리도 안 들어간다',()=>{
  for(let seed=1;seed<=400;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    for(const fish of result.swimmers) assert.ok(!result.blocked.includes(fish.slot),`${fish.slot}번은 막힌 자리입니다`);
    for(const slot of result.blocked) assert.equal(result.counts[slot-1],0);
    // 막혀 있으니 '없음'은 반드시 맞고 '먼저'와 '많이'는 반드시 틀립니다.
    for(const slot of result.blocked){
      assert.equal(fishRouletteWins({type:'none',slot},result),true);
      assert.equal(fishRouletteWins({type:'first',slot},result),false);
      assert.equal(fishRouletteWins({type:'most',slot},result),false);
    }
  }
});

test('문어는 물고기로 안 세고 마릿수에도 안 들어간다',()=>{
  for(let seed=1;seed<=300;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    assert.equal(result.swimmers.length,fishCount);
    assert.equal(result.counts.reduce((sum,count)=>sum+count,0),result.entered.length);
    assert.ok(result.first===null||!result.blocked.includes(result.first));
    assert.ok(result.most===null||!result.blocked.includes(result.most));
  }
});

test('문어는 보통 물고기보다 늦게 앉는다',()=>{
  for(let seed=1;seed<=300;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    assert.ok(result.octopus.at>=8000,`${result.octopus.at}ms`);
    assert.ok(result.octopus.at<=21000,`${result.octopus.at}ms`);
  }
});

test('문어 자리는 문어가 시간 안에 앉았을 때만 맞는다',()=>{
  let missed=0;
  for(let seed=1;seed<=600;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    assert.equal(octopusSettled(result),result.octopus.at<=roundMs);
    for(let slot=1;slot<=slotCount;slot+=1){
      const expected=octopusSettled(result)&&result.octopus.slot===slot;
      assert.equal(fishRouletteWins({type:'octopus',slot},result),expected);
    }
    if(!octopusSettled(result)){
      missed+=1;
      // 못 앉아도 막은 것은 그대로입니다. 두 칸은 여전히 비어 있습니다.
      for(const slot of result.blocked) assert.equal(result.counts[slot-1],0);
    }
  }
  assert.ok(missed>0,'문어가 못 앉은 판이 한 번도 안 나왔습니다');
});

test('시간 안에 들어간 물고기만 세고 들어간 순서대로 담긴다',()=>{
  for(let seed=1;seed<=200;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    for(const fish of result.entered) assert.ok(fish.at<=roundMs);
    for(const fish of result.swimmers.filter(item=>!result.entered.includes(item))) assert.ok(fish.at>roundMs);
    for(let index=1;index<result.entered.length;index+=1) assert.ok(result.entered[index-1].at<=result.entered[index].at);
  }
});

test('자리별 마릿수 합이 들어간 물고기 수와 같다',()=>{
  for(let seed=1;seed<=200;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    assert.equal(result.counts.length,slotCount);
    assert.equal(result.counts.reduce((sum,count)=>sum+count,0),result.entered.length);
  }
});

test('먼저는 제일 처음 들어간 물고기의 자리다',()=>{
  for(let seed=1;seed<=200;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    assert.equal(result.first,result.entered[0]?.slot??null);
  }
});

test('많이는 제일 많이 받은 자리이고 같은 수면 먼저 받은 쪽이 이긴다',()=>{
  for(let seed=1;seed<=300;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    if(result.most===null){assert.equal(result.entered.length,0);continue;}
    const top=result.counts[result.most-1];
    assert.equal(top,Math.max(...result.counts));
    // 같은 마릿수인 다른 자리가 있다면, 이긴 자리가 더 먼저 받았어야 합니다.
    const firstAt=(slot:number)=>result.entered.find(fish=>fish.slot===slot)?.at??Infinity;
    for(let slot=1;slot<=slotCount;slot+=1){
      if(slot===result.most||result.counts[slot-1]!==top)continue;
      assert.ok(firstAt(result.most)<firstAt(slot),`${result.most}번이 ${slot}번보다 먼저 받아야 합니다`);
    }
  }
});

test('많이에서는 동점이 절대 남지 않는다',()=>{
  for(let seed=1;seed<=500;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    if(result.entered.length>0) assert.equal(typeof result.most,'number');
  }
});

test('한 자리 승식은 자리 하나만, 이웃은 두 자리, 홀짝과 절반은 여섯 자리를 덮는다',()=>{
  assert.deepEqual(fishRouletteCovers({type:'first',slot:5}),[5]);
  assert.deepEqual(fishRouletteCovers({type:'most',slot:5}),[5]);
  assert.deepEqual(fishRouletteCovers({type:'none',slot:5}),[5]);
  assert.deepEqual(fishRouletteCovers({type:'neighbour',slot:5}),[5,6]);
  assert.deepEqual(fishRouletteCovers({type:'neighbour',slot:12}),[12,1]);
  assert.deepEqual(fishRouletteCovers({type:'octopus',slot:5}),[5,6]);
  assert.deepEqual(fishRouletteCovers({type:'octopus',slot:12}),[12,1]);
  assert.deepEqual(fishRouletteCovers({type:'parity',parity:'odd'}),[1,3,5,7,9,11]);
  assert.deepEqual(fishRouletteCovers({type:'parity',parity:'even'}),[2,4,6,8,10,12]);
  assert.deepEqual(fishRouletteCovers({type:'half',half:'front'}),[1,2,3,4,5,6]);
  assert.deepEqual(fishRouletteCovers({type:'half',half:'back'}),[7,8,9,10,11,12]);
});

test('12번 다음은 1번이다',()=>{
  assert.equal(nextSlot(12),1);
  assert.equal(nextSlot(1),2);
  for(let slot=1;slot<=slotCount;slot+=1) assert.ok(nextSlot(slot)>=1&&nextSlot(slot)<=slotCount);
});

test('먼저 계열 승식은 먼저 받은 자리를 덮을 때만 맞는다',()=>{
  for(let seed=1;seed<=200;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    if(result.first===null)continue;
    const bets:FishRouletteBet[]=[
      {type:'first',slot:result.first},
      {type:'neighbour',slot:result.first},
      {type:'parity',parity:result.first%2===1?'odd':'even'},
      {type:'half',half:result.first<=6?'front':'back'},
    ];
    for(const bet of bets) assert.ok(fishRouletteWins(bet,result),`${bet.type}가 맞아야 합니다`);
    assert.equal(fishRouletteWins({type:'parity',parity:result.first%2===1?'even':'odd'},result),false);
    assert.equal(fishRouletteWins({type:'half',half:result.first<=6?'back':'front'},result),false);
  }
});

test('없음은 그 자리가 끝까지 비어 있을 때만 맞는다',()=>{
  for(let seed=1;seed<=200;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    for(let slot=1;slot<=slotCount;slot+=1){
      assert.equal(fishRouletteWins({type:'none',slot},result),result.counts[slot-1]===0);
    }
  }
});

test('맞히면 배당만큼 받고 틀리면 한 푼도 못 받는다',()=>{
  const result=spinFishRoulette(seeded(11));
  assert.ok(result.first!==null);
  const hit:FishRouletteBet={type:'first',slot:result.first as number};
  const miss:FishRouletteBet={type:'first',slot:nextSlot(nextSlot(result.first as number))};
  assert.equal(fishRoulettePayout(hit,1000,result),Math.round(1000*fishRouletteOdds.first));
  assert.equal(fishRoulettePayout(miss,1000,result),0);
});

test('이겼는데 손해 보는 배당이 없다',()=>{
  for(const type of types) assert.ok(fishRouletteOdds[type]>1,`${type} 배당 ${fishRouletteOdds[type]}배`);
});

test('승식마다 이름과 배당이 다 있다',()=>{
  for(const type of types){
    assert.ok(fishRouletteBetLabels[type]);
    assert.ok(Number.isFinite(fishRouletteOdds[type]));
  }
  assert.equal(fishRouletteMultiplier({type:'none',slot:3}),fishRouletteOdds.none);
});

// 환급률은 시뮬레이션으로 재서 정했습니다(src/fishroulette.ts 맨 아래 주석).
// 여기서는 짧게 돌려 그 값에서 크게 벗어나지 않는지만 확인합니다.
test('환급률이 어느 승식이든 92~98% 안에 든다',()=>{
  const random=seeded(2026);
  const rounds=100000;
  const won:Record<string,number>=Object.fromEntries(types.map(type=>[type,0]));
  for(let round=0;round<rounds;round+=1){
    const result=spinFishRoulette(random);
    won.first+=fishRouletteWins({type:'first',slot:1},result)?1:0;
    won.most+=fishRouletteWins({type:'most',slot:1},result)?1:0;
    won.none+=fishRouletteWins({type:'none',slot:1},result)?1:0;
    won.neighbour+=fishRouletteWins({type:'neighbour',slot:1},result)?1:0;
    won.octopus+=fishRouletteWins({type:'octopus',slot:1},result)?1:0;
    won.parity+=fishRouletteWins({type:'parity',parity:'odd'},result)?1:0;
    won.half+=fishRouletteWins({type:'half',half:'front'},result)?1:0;
  }
  for(const type of types){
    const ret=(won[type]/rounds)*fishRouletteOdds[type];
    assert.ok(ret>0.92&&ret<0.98,`${type} 환급률 ${(ret*100).toFixed(1)}%`);
  }
});

test('한 자리 승식은 열두 자리가 고르게 나온다',()=>{
  const random=seeded(4242);
  const rounds=60000;
  const firstBy=new Array(slotCount).fill(0),mostBy=new Array(slotCount).fill(0),octoBy=new Array(slotCount).fill(0);
  for(let round=0;round<rounds;round+=1){
    const result=spinFishRoulette(random);
    if(result.first!==null)firstBy[result.first-1]+=1;
    if(result.most!==null)mostBy[result.most-1]+=1;
    if(octopusSettled(result))octoBy[result.octopus.slot-1]+=1;
  }
  for(let slot=1;slot<=slotCount;slot+=1){
    assert.ok(Math.abs(firstBy[slot-1]/rounds-1/12)<0.006,`${slot}번 먼저 ${(firstBy[slot-1]/rounds*100).toFixed(2)}%`);
    assert.ok(Math.abs(mostBy[slot-1]/rounds-1/12)<0.006,`${slot}번 많이 ${(mostBy[slot-1]/rounds*100).toFixed(2)}%`);
    // 문어는 못 앉는 판이 있어 1/12보다 낮습니다. 대신 열두 곳이 서로 고르면 됩니다.
    assert.ok(Math.abs(octoBy[slot-1]/rounds-0.0768)<0.006,`${slot}번 문어 ${(octoBy[slot-1]/rounds*100).toFixed(2)}%`);
  }
});

test('1번 자리가 맨 위이고 시계 방향으로 30도씩 돌아간다',()=>{
  assert.equal(slotAngle(1),-90);
  assert.equal(slotAngle(4),0);
  assert.equal(slotAngle(7),90);
  assert.equal(slotAngle(slotCount),-90+330);
});

test('물고기는 들어간 뒤 자리에 붙어 다시 안 나온다',()=>{
  const result=spinFishRoulette(seeded(19));
  for(const fish of result.entered){
    for(const elapsed of [fish.at,fish.at+1,fish.at+3000,roundMs]){
      const spot=fishPositionAt(fish,elapsed);
      assert.equal(spot.settled,true);
      assert.equal(spot.radius,1);
      assert.equal(spot.angle,slotAngle(fish.slot));
    }
  }
});

test('들어가기 전에는 둘레에 닿지 않고 헤엄친다',()=>{
  const result=spinFishRoulette(seeded(23));
  for(const fish of result.swimmers){
    const spot=fishPositionAt(fish,Math.max(0,fish.at-approachMs-1));
    assert.equal(spot.settled,false);
    assert.ok(spot.radius<1);
    assert.ok(spot.radius>0);
  }
});

test('자리로 들어가는 동안 거리가 끊기지 않고 늘어난다',()=>{
  const result=spinFishRoulette(seeded(29));
  for(const fish of result.entered){
    const begin=fish.at-approachMs;
    let previous=fishPositionAt(fish,begin).radius;
    for(let step=1;step<=16;step+=1){
      const spot=fishPositionAt(fish,begin+(approachMs*step)/16);
      assert.ok(spot.radius>=previous-1e-9,`거리가 줄었습니다 ${spot.radius} < ${previous}`);
      previous=spot.radius;
    }
    assert.ok(Math.abs(previous-1)<1e-9);
  }
});

test('자리로 들어갈 때 반 바퀴 넘게 돌아가지 않는다',()=>{
  const result=spinFishRoulette(seeded(31));
  for(const fish of result.entered){
    const begin=fish.at-approachMs;
    const from=fishPositionAt(fish,begin).angle;
    const to=fishPositionAt(fish,fish.at).angle;
    const turn=Math.abs(((((to-from)%360)+540)%360)-180);
    assert.ok(turn<=180.0001,`${turn}도`);
  }
});

test('물고기 명단은 부를 때마다 새로 만들어진다',()=>{
  const first=createFishRouletteField(),second=createFishRouletteField();
  assert.equal(first.length,slotCount);
  assert.notEqual(first[0],second[0]);
  assert.deepEqual(first[0],second[0]);
  assert.equal(new Set(first.map(fish=>fish.color)).size,first.length);
});

test('결과 한 줄 요약에 먼저와 많이와 문어와 못 들어간 수가 들어간다',()=>{
  for(const seed of [37,38,39,40]){
    const result=spinFishRoulette(seeded(seed));
    const summary=fishRouletteSummary(result);
    assert.match(summary,/먼저/);
    assert.match(summary,/많이/);
    assert.match(summary,new RegExp(`못 들어간 물고기 ${result.swimmers.length-result.entered.length}마리`));
    assert.match(summary,octopusSettled(result)?new RegExp(`문어 ${result.octopus.slot}·${nextSlot(result.octopus.slot)}번`):/문어 못 앉음/);
  }
});

test('문어는 차지한 두 칸 한가운데에 선다',()=>{
  assert.equal(octopusAngle(1),-90+15);
  assert.equal(octopusAngle(4),15);
  for(let slot=1;slot<=slotCount;slot+=1) assert.equal(octopusAngle(slot),slotAngle(slot)+15);
});

test('문어도 자리에 앉으면 둘레에 붙어 다시 안 나온다',()=>{
  for(let seed=1;seed<=100;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    if(!octopusSettled(result))continue;
    for(const elapsed of [result.octopus.at,result.octopus.at+1,roundMs]){
      const spot=octopusPositionAt(result.octopus,elapsed);
      assert.equal(spot.settled,true);
      assert.equal(spot.radius,1);
      assert.equal(spot.angle,octopusAngle(result.octopus.slot));
    }
    const before=octopusPositionAt(result.octopus,result.octopus.at-octopusApproachMs-1);
    assert.equal(before.settled,false);
    assert.ok(before.radius<1&&before.radius>0);
  }
});

test('시간 안에 못 들어간 물고기는 자리에 안 들어간 채 끝난다',()=>{
  let stragglers=0;
  for(let seed=1;seed<=400;seed+=1){
    const result=spinFishRoulette(seeded(seed));
    for(const fish of result.swimmers){
      if(fish.at<=roundMs)continue;
      stragglers+=1;
      assert.equal(fishPositionAt(fish,roundMs).settled,false);
      assert.equal(result.counts.reduce((sum,count)=>sum+count,0),result.entered.length);
    }
  }
  assert.ok(stragglers>0,'못 들어간 물고기가 한 번도 안 나왔습니다');
});

test('물고기가 서로 다른 방향과 속도로 돈다',()=>{
  const result=spinFishRoulette(seeded(43));
  const spins=result.swimmers.map((fish:Swimmer)=>fish.spin);
  assert.ok(spins.some(spin=>spin>0));
  assert.ok(spins.some(spin=>spin<0));
  for(const spin of spins) assert.ok(Math.abs(spin)>=14&&Math.abs(spin)<=40);
});
