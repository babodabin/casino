import assert from 'node:assert/strict';import test from 'node:test';
import {bullTicketPayout,createBullField,simulateBullTournament} from '../src/bullfighting.ts';
test('한국 소싸움 대회에는 능력이 다른 6마리가 출전한다',()=>{const bulls=createBullField();assert.equal(bulls.length,6);assert.equal(new Set(bulls.map(b=>b.name)).size,6);assert.ok(bulls.every(b=>b.odds>1));});
test('예선부터 결승까지 다섯 경기를 치러 우승자를 정한다',()=>{const result=simulateBullTournament(createBullField(),()=>.5);assert.equal(result.matches.length,5);assert.equal(result.matches.at(-1)?.round,'결승');assert.equal(result.matches.at(-1)?.winner,result.champion);assert.notEqual(result.champion,result.runnerUp);});
test('선택한 소가 대회 우승일 때만 지급한다',()=>{const result={champion:2,runnerUp:1,matches:[]};assert.equal(bullTicketPayout({selection:2,stake:100,odds:3.5},result),350);assert.equal(bullTicketPayout({selection:1,stake:100,odds:3.4},result),0);});
