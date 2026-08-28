import test from 'node:test';import assert from 'node:assert/strict';
import {bestJokerPlay,cardChips,discardJokerCards,drawJokers,handBase,isJokerRoundOver,jokerCount,jokerDiscards,jokerHandSize,jokerLadder,jokerMultiplier,jokerPlays,jokerTarget,jokers,playJokerHand,playOutJokerRound,scoreHandType,scoreWithJokers,startJokerRound,type JokerId} from '../src/jokerpoker.ts';
import {createDeck,type Card} from '../src/blackjack.ts';

const deck=createDeck();
const card=(id:string):Card=>{const found=deck.find(item=>item.id===id);if(!found)throw new Error(`없는 카드 ${id}`);return found;};
const hand=(...ids:string[]):Card[]=>ids.map(card);
const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};

test('한 장에서 다섯 장까지 족보를 본다',()=>{
  assert.equal(scoreHandType(hand('♠-K')).type,'하이 카드');
  assert.equal(scoreHandType(hand('♠-9','♥-9')).type,'원 페어');
  assert.equal(scoreHandType(hand('♠-9','♥-9','♦-4','♣-4')).type,'투 페어');
  assert.equal(scoreHandType(hand('♠-9','♥-9','♦-9')).type,'트리플');
  assert.equal(scoreHandType(hand('♠-5','♥-6','♦-7','♣-8','♠-9')).type,'스트레이트');
  assert.equal(scoreHandType(hand('♠-2','♠-6','♠-9','♠-J','♠-K')).type,'플러시');
  assert.equal(scoreHandType(hand('♠-9','♥-9','♦-9','♣-4','♠-4')).type,'풀하우스');
  assert.equal(scoreHandType(hand('♠-9','♥-9','♦-9','♣-9','♠-4')).type,'포카드');
  assert.equal(scoreHandType(hand('♠-5','♠-6','♠-7','♠-8','♠-9')).type,'스트레이트 플러시');
});

test('A부터 5까지도 스트레이트로 친다',()=>{
  assert.equal(scoreHandType(hand('♠-A','♥-2','♦-3','♣-4','♠-5')).type,'스트레이트');
});

test('여섯 장을 내거나 한 장도 안 내면 받지 않는다',()=>{
  assert.throws(()=>scoreHandType(hand('♠-2','♠-3','♠-4','♠-5','♠-6','♠-7')),/다섯 장까지/);
  assert.throws(()=>scoreHandType([]),/다섯 장까지/);
});

test('점수에 들어가는 카드는 족보를 이룬 것뿐이다',()=>{
  // 페어를 내면 짝 두 장만 점수에 듭니다. 발라트로와 같습니다.
  assert.equal(scoreHandType(hand('♠-9','♥-9','♦-2','♣-3','♠-4')).scoring.length,2);
  assert.equal(scoreHandType(hand('♠-K','♥-2','♦-3','♣-4','♠-6')).scoring.length,1);
  assert.equal(scoreHandType(hand('♠-2','♠-6','♠-9','♠-J','♠-K')).scoring.length,5);
});

test('카드 칩은 A가 11, 그림과 10이 10이다',()=>{
  assert.equal(cardChips(card('♠-A')),11);
  assert.equal(cardChips(card('♠-K')),10);
  assert.equal(cardChips(card('♠-10')),10);
  assert.equal(cardChips(card('♠-7')),7);
});

test('점수는 (족보 칩 + 카드 칩) 곱하기 배수다',()=>{
  const cards=hand('♠-9','♥-9');
  const result=scoreWithJokers(cards,[]);
  const base=handBase['원 페어'];
  assert.equal(result.chips,base.chips+9+9);
  assert.equal(result.mult,base.mult);
  assert.equal(result.score,(base.chips+18)*base.mult);
});

test('조커가 칩과 배수를 올린다',()=>{
  const cards=hand('♠-9','♥-9');
  const plain=scoreWithJokers(cards,[]);
  assert.equal(scoreWithJokers(cards,['광대']).mult,plain.mult+4);
  assert.equal(scoreWithJokers(cards,['계산가']).chips,plain.chips+40);
  assert.equal(scoreWithJokers(cards,['막내']).chips,plain.chips+24);
  assert.equal(scoreWithJokers(cards,['쌍둥이']).mult,plain.mult*2);
  // 9는 홀수 두 장이라 배수 +4입니다.
  assert.equal(scoreWithJokers(cards,['홀수쟁이']).mult,plain.mult+4);
  assert.equal(scoreWithJokers(cards,['짝수쟁이']).mult,plain.mult);
});

test('무늬꾼은 무늬가 다 같을 때만 붙는다',()=>{
  const flush=hand('♠-2','♠-6','♠-9','♠-J','♠-K');
  const mixed=hand('♠-2','♥-6','♠-9','♠-J','♠-K');
  assert.equal(scoreWithJokers(flush,['무늬꾼']).mult,scoreWithJokers(flush,[]).mult*3);
  assert.equal(scoreWithJokers(mixed,['무늬꾼']).mult,scoreWithJokers(mixed,[]).mult);
});

test('욕심쟁이는 점수에 든 다이아만 센다',()=>{
  const cards=hand('♦-9','♥-9','♦-2','♣-3','♠-4');
  // 점수에 드는 건 9 두 장뿐이라 다이아는 하나입니다.
  assert.equal(scoreWithJokers(cards,['욕심쟁이']).mult,scoreWithJokers(cards,[]).mult+3);
});

test('조커는 겹치지 않게 셋을 뽑는다',()=>{
  const random=seeded(11);
  for(let round=0;round<40;round+=1){
    const drawn=drawJokers(random);
    assert.equal(drawn.length,jokerCount);
    assert.equal(new Set(drawn).size,jokerCount);
    for(const id of drawn) assert.ok(jokers.some(joker=>joker.id===id),`모르는 조커 ${id}`);
  }
});

test('여덟 장을 들고 낼 기회 셋, 버릴 기회 둘로 시작한다',()=>{
  const round=startJokerRound(seeded(3));
  assert.equal(round.hand.length,jokerHandSize);
  assert.equal(round.playsLeft,jokerPlays);
  assert.equal(round.discardsLeft,jokerDiscards);
  assert.equal(round.score,0);
  assert.equal(new Set(round.hand.map(item=>item.id)).size,jokerHandSize);
});

test('내면 점수가 오르고 낸 자리는 새 카드로 채워진다',()=>{
  const round=startJokerRound(seeded(5));
  const played=playJokerHand(round,round.hand.slice(0,2));
  assert.equal(played.hand.length,jokerHandSize);
  assert.equal(played.playsLeft,jokerPlays-1);
  assert.ok(played.score>0);
  assert.equal(played.log.length,1);
  for(const gone of round.hand.slice(0,2)) assert.ok(!played.hand.some(item=>item.id===gone.id));
});

test('손에 없는 카드는 내지도 버리지도 못한다',()=>{
  const round=startJokerRound(seeded(7));
  const outside=deck.find(item=>!round.hand.some(mine=>mine.id===item.id))!;
  assert.throws(()=>playJokerHand(round,[outside]),/손에 없는/);
  assert.throws(()=>discardJokerCards(round,[outside]),/손에 없는/);
});

test('버릴 기회와 낼 기회를 다 쓰면 더 못 한다',()=>{
  let round=startJokerRound(seeded(9));
  for(let index=0;index<jokerDiscards;index+=1) round=discardJokerCards(round,round.hand.slice(0,3));
  assert.throws(()=>discardJokerCards(round,round.hand.slice(0,1)),/더 버릴 수 없/);
  for(let index=0;index<jokerPlays;index+=1) round=playJokerHand(round,round.hand.slice(0,1));
  assert.equal(isJokerRoundOver(round),true);
  assert.throws(()=>playJokerHand(round,round.hand.slice(0,1)),/더 낼 수 없/);
});

test('버려도 점수와 낼 기회는 그대로다',()=>{
  const round=startJokerRound(seeded(13));
  const after=discardJokerCards(round,round.hand.slice(0,4));
  assert.equal(after.score,0);
  assert.equal(after.playsLeft,jokerPlays);
  assert.equal(after.discardsLeft,jokerDiscards-1);
  assert.equal(after.hand.length,jokerHandSize);
});

test('가장 점수 높은 조합을 찾아 준다',()=>{
  const held:JokerId[]=[];
  const cards=hand('♠-9','♥-9','♦-9','♣-2','♠-3','♥-4','♦-5','♣-7');
  const best=bestJokerPlay(cards,held);
  assert.equal(scoreHandType(best.cards).type,'트리플');
  assert.equal(best.score,scoreWithJokers(best.cards,held).score);
});

test('배당은 목표를 넘겨야 나온다',()=>{
  assert.equal(jokerMultiplier(jokerTarget-1),0);
  assert.equal(jokerMultiplier(jokerTarget),jokerLadder[0].payout);
  assert.equal(jokerMultiplier(jokerTarget*2),jokerLadder[1].payout);
  assert.equal(jokerMultiplier(jokerTarget*3),jokerLadder[2].payout);
  assert.equal(jokerMultiplier(jokerTarget*100),jokerLadder[jokerLadder.length-1].payout);
  for(let index=1;index<jokerLadder.length;index+=1) assert.ok(jokerLadder[index].payout>jokerLadder[index-1].payout);
});

test('컴퓨터가 두면 환급률이 100%를 넘지 않는다',()=>{
  // 정확한 값은 src/jokerpoker.ts 주석에 있습니다. 여기서는 크게 어긋나지 않는지만 봅니다.
  const random=seeded(19);
  const rounds=700;let total=0,cleared=0;
  for(let index=0;index<rounds;index+=1){
    const end=playOutJokerRound(startJokerRound(random));
    const payout=jokerMultiplier(end.score);
    total+=payout;
    if(payout>0)cleared+=1;
  }
  const rate=total/rounds;
  assert.ok(rate>0.8&&rate<1,`환급률 ${(rate*100).toFixed(1)}%`);
  assert.ok(cleared/rounds>0.35&&cleared/rounds<0.7,`목표 넘김 ${(cleared/rounds*100).toFixed(0)}%`);
});

test('한 판을 끝까지 두면 낼 기회를 다 쓴다',()=>{
  const random=seeded(23);
  for(let index=0;index<20;index+=1){
    const end=playOutJokerRound(startJokerRound(random));
    assert.equal(end.playsLeft,0);
    assert.equal(end.log.length,jokerPlays);
    assert.equal(end.score,end.log.reduce((sum,item)=>sum+item.score,0));
  }
});
