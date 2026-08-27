import test from 'node:test';import assert from 'node:assert/strict';
import {drawLotto,drawOddEven,lottoResult,oddEvenWins,scratchResult} from '../src/worldgames.ts';
test('홀짝은 1~100을 만들고 정확히 판정한다',()=>{assert.equal(drawOddEven(()=>0),1);assert.equal(drawOddEven(()=>.999),100);assert.equal(oddEvenWins('홀',7),true);});
test('로또는 겹치지 않는 6개와 보너스를 만든다',()=>{const r=drawLotto(()=>0);assert.equal(new Set([...r.numbers,r.bonus]).size,7);assert.equal(lottoResult([1,2,3,4,5,6],[1,2,3,4,5,6],7).multiplier,10000);});
test('즉석복권은 같은 그림 장수로 배당한다',()=>{assert.equal(scratchResult(['7','7','7','◆','★','♣','♛','●','◆']).multiplier,2);});
