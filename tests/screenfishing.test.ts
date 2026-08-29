import test from 'node:test';import assert from 'node:assert/strict';
import {biteDelay,biteDelayMax,biteDelayMin,fightBreak,fightGoal,fightStep,findFishingSpot,fishingMeasuredReturn,fishingPayout,fishingSpots,isHooked,pickFish,playOutFight,playOutFishing,startFight,type Fish} from '../src/screenfishing.ts';

const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};
const fishNamed=(name:string):Fish=>{const found=fishingSpots.flatMap(spot=>spot.fish).find(fish=>fish.name===name);if(!found)throw new Error(`없는 물고기 ${name}`);return found;};

test('자리는 셋이고 자리마다 여섯 가지가 뭅니다',()=>{
  assert.equal(fishingSpots.length,3);
  for(const spot of fishingSpots) assert.equal(spot.fish.length,6);
  assert.deepEqual(fishingSpots.map(spot=>spot.id),['shore','pier','open']);
});

test('자리마다 값어치 없는 것이 하나씩 섞여 있습니다',()=>{
  for(const spot of fishingSpots){
    const junk=spot.fish.filter(fish=>fish.payout===0);
    assert.equal(junk.length,1,`${spot.name}의 꽝이 하나가 아닙니다`);
  }
});

test('깊은 자리일수록 챔질할 틈이 짧고 힘이 셉니다',()=>{
  const biggest=fishingSpots.map(spot=>spot.fish[spot.fish.length-1]);
  for(let index=1;index<biggest.length;index+=1){
    assert.ok(biggest[index].hookWindow<biggest[index-1].hookWindow);
    assert.ok(biggest[index].power>biggest[index-1].power);
  }
});

test('같은 자리 안에서 값이 큰 물고기일수록 드물고 힘이 셉니다',()=>{
  for(const spot of fishingSpots){
    const real=spot.fish.filter(fish=>fish.payout>0);
    for(let index=1;index<real.length;index+=1){
      assert.ok(real[index].weight<real[index-1].weight,`${spot.name} ${real[index].name}이 더 흔합니다`);
      assert.ok(real[index].power>real[index-1].power,`${spot.name} ${real[index].name}이 더 약합니다`);
      assert.ok(real[index].payout>=real[index-1].payout,`${spot.name} ${real[index].name}이 덜 줍니다`);
    }
  }
});

test('잡으면 최소한 건 돈보다는 많이 받습니다',()=>{
  for(const spot of fishingSpots)
    for(const fish of spot.fish)
      assert.ok(fish.payout===0||fish.payout>1,`${fish.name} 배당 ${fish.payout}`);
});

test('없는 자리를 찾으면 알려 줍니다',()=>{
  assert.equal(findFishingSpot('pier').name,'방파제');
  assert.throws(()=>findFishingSpot('lake' as never),/없는 낚시 자리/);
});

test('입질까지 기다리는 시간은 정해진 사이에 들어옵니다',()=>{
  const random=seeded(3);
  for(let index=0;index<200;index+=1){
    const delay=biteDelay(random);
    assert.ok(delay>=biteDelayMin&&delay<=biteDelayMax,`${delay}ms`);
  }
});

test('뽑은 물고기는 그 자리에 있는 것입니다',()=>{
  const random=seeded(5);
  for(const spot of fishingSpots)
    for(let index=0;index<300;index+=1)
      assert.ok(spot.fish.includes(pickFish(spot,random)));
});

test('많이 뽑으면 정해 둔 비율에 가깝게 나옵니다',()=>{
  const spot=fishingSpots[0];
  const random=seeded(7);
  const counts=new Map<string,number>();
  const rounds=40000;
  for(let index=0;index<rounds;index+=1){
    const fish=pickFish(spot,random);
    counts.set(fish.name,(counts.get(fish.name)??0)+1);
  }
  const total=spot.fish.reduce((sum,fish)=>sum+fish.weight,0);
  for(const fish of spot.fish){
    const seen=(counts.get(fish.name)??0)/rounds;
    assert.ok(Math.abs(seen-fish.weight/total)<0.02,`${fish.name} ${(seen*100).toFixed(1)}%`);
  }
});

test('챔질은 정해진 시간 안에 눌러야 성공합니다',()=>{
  const fish=fishNamed('청새치');
  assert.equal(isHooked(fish,0),true);
  assert.equal(isHooked(fish,fish.hookWindow),true);
  assert.equal(isHooked(fish,fish.hookWindow+1),false);
  assert.equal(isHooked(fish,-1),false);
});

test('감기는 당겨 오고 버티기는 장력을 뺍니다',()=>{
  const fish=fishNamed('망둑어');
  const random=seeded(11);
  const start=startFight(fish);
  const reeled=fightStep(start,'감기',random);
  assert.ok(reeled.progress>start.progress);
  // 버티기는 거의 못 당겨 옵니다.
  const held=fightStep(start,'버티기',seeded(11));
  assert.ok(held.progress-start.progress<2.5);
  assert.ok(held.tension<reeled.tension);
});

test('물고기는 싸울수록 힘이 빠집니다',()=>{
  const fish=fishNamed('방어');
  let state=startFight(fish);
  const random=seeded(13);
  const first=state.power;
  for(let index=0;index<5;index+=1) state=fightStep(state,'버티기',random);
  assert.ok(state.power<first);
});

test('장력이 한계를 넘으면 줄이 끊어지고 더 진행되지 않습니다',()=>{
  const fish=fishNamed('청새치');
  let state={...startFight(fish),tension:fightBreak-1};
  const random=seeded(17);
  for(let index=0;index<40&&!state.snapped;index+=1) state=fightStep(state,'감기',random);
  assert.equal(state.snapped,true);
  assert.equal(state.tension,fightBreak);
  const after=fightStep(state,'감기',random);
  assert.equal(after,state);
});

test('다 당겨 오면 잡힌 것으로 끝납니다',()=>{
  const fish=fishNamed('망둑어');
  let state={...startFight(fish),progress:fightGoal-5,tension:10};
  state=fightStep(state,'감기',seeded(19));
  assert.equal(state.landed,true);
  assert.equal(state.progress,fightGoal);
});

test('힘이 센 물고기일수록 놓치기 쉽습니다',()=>{
  const rounds=4000;
  const rate=(fish:Fish)=>{
    const random=seeded(23);let win=0;
    for(let index=0;index<rounds;index+=1) if(playOutFight(fish,random)) win+=1;
    return win/rounds;
  };
  const easy=rate(fishNamed('망둑어'));
  const hard=rate(fishNamed('청새치'));
  assert.ok(easy>0.9,`쉬운 물고기 ${(easy*100).toFixed(0)}%`);
  assert.ok(hard<0.55,`어려운 물고기 ${(hard*100).toFixed(0)}%`);
  assert.ok(hard>0.15,`어려운 물고기가 너무 안 잡힙니다 ${(hard*100).toFixed(0)}%`);
});

test('놓치면 한 푼도 못 받습니다',()=>{
  const fish=fishNamed('돌돔');
  assert.equal(fishingPayout(fish,false),0);
  assert.equal(fishingPayout(fish,true),fish.payout);
});

test('챔질을 열에 아홉 맞히면 환급률이 94~98%에 들어옵니다',()=>{
  // 정확한 값은 src/screenfishing.ts 주석에 있습니다. 여기서는 크게 어긋나지 않는지만 봅니다.
  const rounds=60000;
  for(const spot of fishingSpots){
    let total=0;
    for(let index=0;index<rounds;index+=1) total+=playOutFishing(spot,Math.random,0.9);
    const rate=total/rounds;
    assert.ok(rate>0.9&&rate<1.02,`${spot.name} 환급률 ${(rate*100).toFixed(1)}%`);
  }
});

test('대충 누르면 확실히 손해입니다',()=>{
  const rounds=40000;
  for(const spot of fishingSpots){
    let total=0;
    for(let index=0;index<rounds;index+=1) total+=playOutFishing(spot,Math.random,0.7);
    assert.ok(total/rounds<0.85,`${spot.name} ${(total/rounds*100).toFixed(1)}%`);
  }
});

test('적어 둔 환급률이 실제와 크게 다르지 않습니다',()=>{
  const rounds=60000;
  for(const spot of fishingSpots){
    let total=0;
    for(let index=0;index<rounds;index+=1) total+=playOutFishing(spot,Math.random,0.9);
    assert.ok(Math.abs(total/rounds-fishingMeasuredReturn[spot.id])<0.04,`${spot.name} 적어 둔 값 ${fishingMeasuredReturn[spot.id]}`);
  }
});
