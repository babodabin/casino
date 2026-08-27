import test from 'node:test';
import assert from 'node:assert/strict';
import { rollYahtzeeDice, scoreYahtzeeCategory, yahtzeeTotal } from '../src/yahtzee.ts';

test('보관한 주사위는 다시 굴리지 않는다',()=>{
  assert.deepEqual(rollYahtzeeDice([6,2,3,4,5],[true,false,false,false,false],()=>0),[6,1,1,1,1]);
});
test('주요 야찌 조합을 계산한다',()=>{
  assert.equal(scoreYahtzeeCategory('yahtzee',[4,4,4,4,4]),50);
  assert.equal(scoreYahtzeeCategory('fullHouse',[2,2,3,3,3]),25);
  assert.equal(scoreYahtzeeCategory('smallStraight',[1,2,3,4,4]),30);
  assert.equal(scoreYahtzeeCategory('largeStraight',[2,3,4,5,6]),40);
  assert.equal(scoreYahtzeeCategory('fourKind',[5,5,5,5,2]),22);
});
test('상단 63점이면 35점 보너스를 더한다',()=>{
  assert.equal(yahtzeeTotal({ones:3,twos:6,threes:9,fours:12,fives:15,sixes:18,chance:20}),98+20);
});
