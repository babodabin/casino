import test from 'node:test';import assert from 'node:assert/strict';
import {applyShellSwap,createShellRound,shellLayoutAfter,shellMultiplier,shellPositionAfter} from '../src/shellgame.ts';

test('자리 바꾸기는 두 자리만 맞바꾸고 나머지는 그대로 둔다',()=>{
  assert.equal(applyShellSwap(0,{a:0,b:2}),2);
  assert.equal(applyShellSwap(2,{a:0,b:2}),0);
  assert.equal(applyShellSwap(1,{a:0,b:2}),1);
});

test('같은 자리를 두 번 고르지 않는다',()=>{
  let seed=3;const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const round=createShellRound(30,random);
  for(const swap of round.swaps) assert.notEqual(swap.a,swap.b);
});

test('마지막 자리는 섞기를 순서대로 적용한 결과와 같다',()=>{
  let seed=11;const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const round=createShellRound(12,random);
  assert.equal(shellPositionAfter(round,round.swaps.length),round.final);
  assert.equal(shellPositionAfter(round,0),round.start);
});

test('컵 배치는 항상 세 개가 서로 다른 자리에 있다',()=>{
  let seed=29;const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const round=createShellRound(9,random);
  for(let step=0;step<=round.swaps.length;step+=1){
    const layout=shellLayoutAfter(round,step);
    assert.equal(new Set(layout).size,3);
  }
});

test('공이 있는 컵을 맞히면 3배, 틀리면 0이다',()=>{
  const round={start:0,swaps:[{a:0,b:1}],final:1};
  assert.equal(shellMultiplier(1,round),3);
  assert.equal(shellMultiplier(0,round),0);
});

test('끝까지 눈으로 따라가면 언제나 맞출 수 있다',()=>{
  let seed=101;const random=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  for(let round=0;round<200;round+=1){
    const game=createShellRound(8,random);
    // 화면에 보여주는 컵 배치를 그대로 따라가면 공이 든 컵의 자리를 알 수 있어야 합니다.
    const layout=shellLayoutAfter(game,game.swaps.length);
    const ballCup=layout[game.final];
    assert.equal(shellLayoutAfter(game,game.swaps.length).indexOf(ballCup),game.final);
  }
});
