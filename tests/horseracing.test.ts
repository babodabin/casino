import test from 'node:test';
import assert from 'node:assert/strict';
import { createHorseField, horseTicketOdds, horseTicketWins, requiredHorseSelections, settleHorseTicket, simulateHorseRace, type HorseTicket } from '../src/horseracing.ts';

test('출전마 여섯 마리의 능력과 배당을 만든다',()=>{const horses=createHorseField(()=>0.5);assert.equal(horses.length,6);assert.equal(new Set(horses.map(h=>h.name)).size,6);assert.ok(horses.every(h=>h.winOdds>=1.5));});
test('경주 결과는 모든 말을 중복 없이 순위로 만든다',()=>{const horses=createHorseField(()=>0.4),result=simulateHorseRace(horses,()=>0.5);assert.equal(result.order.length,6);assert.equal(new Set(result.order).size,6);});
test('단승과 연승을 정확히 판정한다',()=>{const result={order:[3,1,4,2,5,6],times:{}};assert.equal(horseTicketWins({type:'win',selections:[3],stake:100,odds:4},result),true);assert.equal(horseTicketWins({type:'place',selections:[4],stake:100,odds:2},result),true);assert.equal(horseTicketWins({type:'place',selections:[2],stake:100,odds:2},result),false);});
test('복승은 순서 없이, 쌍승은 순서대로 맞힌다',()=>{const result={order:[3,1,4,2,5,6],times:{}};assert.equal(horseTicketWins({type:'quinella',selections:[1,3],stake:100,odds:8},result),true);assert.equal(horseTicketWins({type:'exacta',selections:[1,3],stake:100,odds:12},result),false);assert.equal(horseTicketWins({type:'exacta',selections:[3,1],stake:100,odds:12},result),true);});
test('적중하면 배당을 적용하고 미적중은 0이다',()=>{const result={order:[1,2,3],times:{}};const ticket:HorseTicket={type:'win',selections:[1],stake:500,odds:3.2};assert.equal(settleHorseTicket(ticket,result),1600);assert.equal(requiredHorseSelections('exacta'),2);assert.ok(horseTicketOdds('exacta',[1,2],createHorseField(()=>0.5))>0);});
