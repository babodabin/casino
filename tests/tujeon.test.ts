import test from 'node:test';import assert from 'node:assert/strict';
import {compareTujeon,createTujeonDeck,dealTujeon,evaluateTujeon,resolveTujeon,shouldFoldTujeon,tujeonFoldRefund,tujeonHandSize,tujeonMultiplier,tujeonPoint,tujeonPointName,tujeonSuits,tujeonWinPayout,type TujeonCard,type TujeonSuit} from '../src/tujeon.ts';

const deck=createTujeonDeck();
const card=(suit:TujeonSuit,number:number):TujeonCard=>{const found=deck.find(item=>item.suit===suit&&item.number===number);if(!found)throw new Error(`없는 패 ${suit}${number}`);return found;};
const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};

test('투전목은 여덟 무리에 1~10, 모두 여든 장이다',()=>{
  assert.equal(deck.length,80);
  assert.equal(new Set(deck.map(item=>item.id)).size,80);
  assert.equal(tujeonSuits.length,8);
  for(const suit of tujeonSuits){
    const mine=deck.filter(item=>item.suit===suit);
    assert.equal(mine.length,10);
    assert.deepEqual(mine.map(item=>item.number).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);
  }
});

test('다섯 장씩 겹치지 않게 나눠준다',()=>{
  const {player,opponent}=dealTujeon(seeded(5));
  assert.equal(player.length,tujeonHandSize);
  assert.equal(opponent.length,tujeonHandSize);
  assert.equal(new Set([...player,...opponent].map(item=>item.id)).size,10);
});

test('같은 숫자가 몇 장인지로 족보가 갈린다',()=>{
  const five=evaluateTujeon([card('사람',7),card('물고기',7),card('새',7),card('꿩',7),card('별',7)]);
  assert.equal(five.category,5);
  assert.equal(five.label,'7 오동');
  const four=evaluateTujeon([card('사람',3),card('물고기',3),card('새',3),card('꿩',3),card('별',9)]);
  assert.equal(four.category,4);
  assert.equal(four.label,'3 사동');
  const three=evaluateTujeon([card('사람',5),card('물고기',5),card('새',5),card('꿩',2),card('별',8)]);
  assert.equal(three.category,3);
  assert.equal(three.label,'5 삼동');
  const twoPair=evaluateTujeon([card('사람',6),card('물고기',6),card('새',2),card('꿩',2),card('별',9)]);
  assert.equal(twoPair.category,2);
  assert.equal(twoPair.label,'6·2 두동동');
  const pair=evaluateTujeon([card('사람',4),card('물고기',4),card('새',1),card('꿩',7),card('별',9)]);
  assert.equal(pair.category,1);
  assert.equal(pair.label,'4 동동');
});

test('삼동에 동동이 붙으면 붙은 짝까지 따진다',()=>{
  const full=evaluateTujeon([card('사람',5),card('물고기',5),card('새',5),card('꿩',8),card('별',8)]);
  assert.equal(full.category,3);
  assert.equal(full.label,'5 삼동에 8 동동');
  const plain=evaluateTujeon([card('말',5),card('노루',5),card('토끼',5),card('꿩',2),card('별',3)]);
  // 같은 5 삼동이라도 동동이 붙은 쪽이 셉니다.
  assert.ok(compareTujeon(full,plain)>0);
});

test('짝이 없으면 다섯 장 합의 끝자리가 끗이다',()=>{
  const gabo=[card('사람',1),card('물고기',2),card('새',3),card('꿩',4),card('별',9)];
  assert.equal(tujeonPoint(gabo),9);
  assert.equal(evaluateTujeon(gabo).label,'가보');
  const mangtong=[card('사람',1),card('물고기',2),card('새',3),card('꿩',4),card('별',10)];
  assert.equal(tujeonPoint(mangtong),0);
  assert.equal(evaluateTujeon(mangtong).label,'망통');
  assert.equal(tujeonPointName(5),'5끗');
});

test('짝이 하나라도 있으면 끗보다 세다',()=>{
  const lowPair=evaluateTujeon([card('사람',1),card('물고기',1),card('새',2),card('꿩',3),card('별',4)]);
  const gabo=evaluateTujeon([card('말',1),card('노루',2),card('토끼',3),card('꿩',4),card('별',9)]);
  assert.equal(gabo.label,'가보');
  assert.ok(compareTujeon(lowPair,gabo)>0);
});

test('같은 족보면 숫자가 큰 쪽이 이긴다',()=>{
  const high=evaluateTujeon([card('사람',9),card('물고기',9),card('새',2),card('꿩',3),card('별',4)]);
  const low=evaluateTujeon([card('말',8),card('노루',8),card('토끼',2),card('꿩',5),card('별',6)]);
  assert.ok(compareTujeon(high,low)>0);
  assert.equal(compareTujeon(high,high),0);
});

test('완전히 같은 패면 무승부다',()=>{
  const mine=[card('사람',9),card('물고기',9),card('새',2),card('꿩',3),card('별',4)];
  const result=resolveTujeon(mine,mine);
  assert.equal(result.result,'push');
  assert.equal(tujeonMultiplier('push'),1);
});

test('다섯 장이 아니면 판정하지 않는다',()=>{
  assert.throws(()=>evaluateTujeon([card('사람',9),card('물고기',9)]),/다섯 장/);
});

test('배당은 이기면 1.9배, 지면 0배다',()=>{
  assert.equal(tujeonMultiplier('win'),tujeonWinPayout);
  assert.equal(tujeonMultiplier('loss'),0);
  assert.ok(tujeonFoldRefund>0&&tujeonFoldRefund<1);
});

test('나쁜 끗에서만 죽자고 알려준다',()=>{
  assert.equal(shouldFoldTujeon(evaluateTujeon([card('사람',1),card('물고기',2),card('새',3),card('꿩',4),card('별',10)])),true);
  assert.equal(shouldFoldTujeon(evaluateTujeon([card('사람',1),card('물고기',2),card('새',3),card('꿩',4),card('별',9)])),false);
  assert.equal(shouldFoldTujeon(evaluateTujeon([card('사람',1),card('물고기',1),card('새',3),card('꿩',4),card('별',10)])),false);
});

test('죽지 않고 계속 받아도 환급률이 100%를 넘지 않는다',()=>{
  const random=seeded(13);
  let total=0;const rounds=20000;
  for(let round=0;round<rounds;round+=1){
    const {player,opponent}=dealTujeon(random);
    total+=tujeonMultiplier(resolveTujeon(player,opponent).result);
  }
  const rate=total/rounds;
  assert.ok(rate>0.93&&rate<0.98,`환급률 ${(rate*100).toFixed(2)}%`);
});

test('나쁜 끗에서 죽으면 이득이지만 그래도 100%를 넘지 않는다',()=>{
  const random=seeded(29);
  let plain=0,folding=0;const rounds=20000;
  for(let round=0;round<rounds;round+=1){
    const {player,opponent}=dealTujeon(random);
    const hand=evaluateTujeon(player);
    const straight=tujeonMultiplier(resolveTujeon(player,opponent).result);
    plain+=straight;
    folding+=shouldFoldTujeon(hand)?tujeonFoldRefund:straight;
  }
  const foldRate=folding/rounds;
  assert.ok(foldRate>plain/rounds,`죽기 ${(foldRate*100).toFixed(2)}% vs 계속 ${(plain/rounds*100).toFixed(2)}%`);
  assert.ok(foldRate<1,`죽기 환급률 ${(foldRate*100).toFixed(2)}%`);
});
