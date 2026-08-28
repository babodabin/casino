import test from 'node:test';import assert from 'node:assert/strict';
import {bigTwoClosePayout,bigTwoHandSize,bigTwoMultiplier,bigTwoOpeningCard,bigTwoPenalty,bigTwoWinPayout,bigTwoValue,canBeatBigTwo,chooseBigTwoPlay,classifyBigTwo,dealBigTwo,diamondThreeId,legalBigTwoPlays,passBigTwo,playBigTwo,playOutBigTwo,startBigTwo} from '../src/bigtwo.ts';
import {createDeck,type Card} from '../src/blackjack.ts';

const deck=createDeck();
const card=(id:string):Card=>{const found=deck.find(item=>item.id===id);if(!found)throw new Error(`없는 카드 ${id}`);return found;};
const hand=(...ids:string[]):Card[]=>ids.map(card);
const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};

test('3이 가장 약하고 2가 가장 세다',()=>{
  assert.ok(bigTwoValue(card('♦-3'))<bigTwoValue(card('♦-4')));
  assert.ok(bigTwoValue(card('♠-A'))<bigTwoValue(card('♦-2')));
  assert.ok(bigTwoValue(card('♦-2'))<bigTwoValue(card('♠-2')));
});

test('같은 숫자는 ♦ ♣ ♥ ♠ 순으로 세진다',()=>{
  const suits=['♦','♣','♥','♠'].map(suit=>bigTwoValue(card(`${suit}-7`)));
  assert.deepEqual(suits,[...suits].sort((a,b)=>a-b));
  assert.equal(new Set(suits).size,4);
});

test('낼 수 있는 모양을 가려낸다',()=>{
  assert.equal(classifyBigTwo(hand('♠-9'))?.type,'싱글');
  assert.equal(classifyBigTwo(hand('♠-9','♥-9'))?.type,'페어');
  assert.equal(classifyBigTwo(hand('♠-9','♥-9','♦-9'))?.type,'트리플');
  assert.equal(classifyBigTwo(hand('♠-3','♥-4','♦-5','♣-6','♠-7'))?.type,'스트레이트');
  assert.equal(classifyBigTwo(hand('♠-3','♠-5','♠-9','♠-J','♠-K'))?.type,'플러시');
  assert.equal(classifyBigTwo(hand('♠-8','♥-8','♦-8','♣-K','♠-K'))?.type,'풀하우스');
  assert.equal(classifyBigTwo(hand('♠-8','♥-8','♦-8','♣-8','♠-K'))?.type,'포카드');
  assert.equal(classifyBigTwo(hand('♠-3','♠-4','♠-5','♠-6','♠-7'))?.type,'스트레이트 플러시');
});

test('낼 수 없는 모양은 받지 않는다',()=>{
  assert.equal(classifyBigTwo(hand('♠-9','♥-8')),null);
  assert.equal(classifyBigTwo(hand('♠-9','♥-9','♦-8')),null);
  assert.equal(classifyBigTwo(hand('♠-9','♥-9','♦-9','♣-9')),null);   // 네 장은 못 냅니다
  assert.equal(classifyBigTwo(hand('♠-3','♥-4','♦-5','♣-6','♠-9')),null);
  assert.equal(classifyBigTwo([]),null);
});

test('다섯 장은 스트레이트 · 플러시 · 풀하우스 · 포카드 · 스트레이트 플러시 순이다',()=>{
  const straight=classifyBigTwo(hand('♠-9','♥-10','♦-J','♣-Q','♠-K'))!;
  const flush=classifyBigTwo(hand('♦-3','♦-5','♦-7','♦-9','♦-J'))!;
  const full=classifyBigTwo(hand('♠-4','♥-4','♦-4','♣-6','♠-6'))!;
  const quad=classifyBigTwo(hand('♠-4','♥-4','♦-4','♣-4','♠-6'))!;
  const straightFlush=classifyBigTwo(hand('♥-3','♥-4','♥-5','♥-6','♥-7'))!;
  const powers=[straight,flush,full,quad,straightFlush].map(combo=>combo.power);
  assert.deepEqual(powers,[...powers].sort((a,b)=>a-b));
  // 낮은 플러시라도 아무리 높은 스트레이트를 이깁니다.
  assert.ok(canBeatBigTwo(flush,straight));
  assert.ok(!canBeatBigTwo(straight,flush));
});

test('같은 장수로만 받아칠 수 있다',()=>{
  const single=classifyBigTwo(hand('♠-9'))!;
  const pair=classifyBigTwo(hand('♠-9','♥-9'))!;
  const higher=classifyBigTwo(hand('♠-10'))!;
  assert.ok(canBeatBigTwo(higher,single));
  assert.ok(!canBeatBigTwo(pair,single));
  assert.ok(!canBeatBigTwo(single,pair));
  assert.ok(canBeatBigTwo(single,null));
});

test('네 명이면 열세 장씩 쉰두 장을 다 나눈다',()=>{
  const hands=dealBigTwo(4,seeded(3));
  assert.equal(hands.length,4);
  for(const item of hands) assert.equal(item.length,bigTwoHandSize);
  assert.equal(new Set(hands.flat().map(item=>item.id)).size,52);
});

test('두 명에서 네 명까지만 나눈다',()=>{
  assert.throws(()=>dealBigTwo(5,seeded(1)),/두 명에서 네 명/);
  assert.throws(()=>dealBigTwo(1,seeded(1)),/두 명에서 네 명/);
});

test('네 명이면 ♦3을 가진 사람이 먼저 내고 첫 장에 ♦3이 들어가야 한다',()=>{
  const state=startBigTwo(4,seeded(9));
  assert.ok(state.hands[state.turn].some(item=>item.id===diamondThreeId));
  assert.equal(bigTwoOpeningCard(state),diamondThreeId);
  const wrong=state.hands[state.turn].find(item=>item.id!==diamondThreeId)!;
  assert.throws(()=>playBigTwo(state,[wrong]),/♦3/);
  const opened=playBigTwo(state,[card(diamondThreeId)]);
  assert.equal(opened.opening,false);
  assert.equal(opened.current?.type,'싱글');
});

test('손에 없는 카드는 낼 수 없다',()=>{
  const state=startBigTwo(4,seeded(11));
  const notMine=deck.find(item=>!state.hands[state.turn].some(mine=>mine.id===item.id))!;
  assert.throws(()=>playBigTwo(state,[notMine]),/손에 없는/);
});

test('앞사람보다 약하면 낼 수 없다',()=>{
  let state=startBigTwo(4,seeded(9));
  state=playBigTwo(state,[card(diamondThreeId)]);
  const weakest=state.hands[state.turn].filter(item=>bigTwoValue(item)<bigTwoValue(card(diamondThreeId)));
  if(weakest.length) assert.throws(()=>playBigTwo(state,[weakest[0]]),/세야/);
  const beats=legalBigTwoPlays(state.hands[state.turn],state.current);
  assert.ok(beats.length>0);
  assert.ok(beats.every(play=>bigTwoValue(play.cards[0])>bigTwoValue(card(diamondThreeId))));
});

test('새로 시작하는 차례에는 넘길 수 없다',()=>{
  const state=startBigTwo(4,seeded(9));
  assert.throws(()=>passBigTwo(state),/넘길 수 없/);
});

test('나머지가 모두 넘기면 마지막에 낸 사람이 새로 낸다',()=>{
  let state=startBigTwo(4,seeded(9));
  const leader=state.turn;
  state=playBigTwo(state,[card(diamondThreeId)]);
  state=passBigTwo(state);state=passBigTwo(state);state=passBigTwo(state);
  assert.equal(state.turn,leader);
  assert.equal(state.current,null);
  assert.equal(state.passes,0);
});

test('컴퓨터는 낼 수 있으면 내고 없으면 넘긴다',()=>{
  const mine=hand('♠-3','♥-4');
  const strong=classifyBigTwo(hand('♠-2'))!;
  assert.equal(chooseBigTwoPlay(mine,strong),null);
  const weak=classifyBigTwo(hand('♦-3'))!;
  assert.equal(chooseBigTwoPlay(mine,weak)?.cards.length,1);
});

test('한 번에 손을 비울 수 있으면 그것을 낸다',()=>{
  const mine=hand('♠-9','♥-9');
  const play=chooseBigTwoPlay(mine,classifyBigTwo(hand('♠-8','♥-8'))!);
  assert.equal(play?.cards.length,2);
});

test('벌점은 많이 남길수록 빠르게 커진다',()=>{
  assert.equal(bigTwoPenalty(0),0);
  assert.equal(bigTwoPenalty(7),7);
  assert.equal(bigTwoPenalty(8),16);
  assert.equal(bigTwoPenalty(10),30);
  assert.equal(bigTwoPenalty(13),52);
});

test('두 명이든 네 명이든 판이 반드시 끝난다',()=>{
  for(const players of [2,3,4]){
    const random=seeded(players*31+7);
    for(let round=0;round<12;round+=1){
      const end=playOutBigTwo(startBigTwo(players,random));
      assert.ok(end.winner!==null);
      assert.equal(end.hands[end.winner!].length,0);
      // 이긴 사람 말고는 카드가 남아 있어야 합니다.
      assert.equal(end.hands.filter(item=>item.length===0).length,1);
    }
  }
});

test('배당은 인원수에 따라 다르고 세 장 이하로 지면 절반을 돌려받는다',()=>{
  assert.equal(bigTwoMultiplier(4,true,0),bigTwoWinPayout[4]);
  assert.equal(bigTwoMultiplier(3,true,0),bigTwoWinPayout[3]);
  assert.equal(bigTwoMultiplier(2,true,0),bigTwoWinPayout[2]);
  assert.ok(bigTwoWinPayout[2]<bigTwoWinPayout[3]&&bigTwoWinPayout[3]<bigTwoWinPayout[4]);
  assert.equal(bigTwoMultiplier(4,false,3),bigTwoClosePayout);
  assert.equal(bigTwoMultiplier(4,false,4),0);
  assert.throws(()=>bigTwoMultiplier(5,true,0),/배당이 정해져/);
});

test('네 명으로 돌리면 환급률이 100%를 넘지 않는다',()=>{
  // 정확한 값은 6만 판으로 맞췄습니다(src/bigtwo.ts 주석). 여기서는 크게 어긋나지 않는지만 봅니다.
  const random=seeded(23);
  const rounds=120;let total=0;
  for(let round=0;round<rounds;round+=1){
    const end=playOutBigTwo(startBigTwo(4,random));
    total+=bigTwoMultiplier(4,end.winner===0,end.hands[0].length);
  }
  const rate=total/rounds;
  assert.ok(rate>0.75&&rate<1,`환급률 ${(rate*100).toFixed(1)}%`);
});
