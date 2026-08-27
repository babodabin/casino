import test from 'node:test';import assert from 'node:assert/strict';import type {Card} from '../src/blackjack.ts';import {compareTeenPatti,dealTeenPatti,evaluateTeenPatti} from '../src/teenpatti.ts';
const c=(rank:Card['rank'],suit:Card['suit']):Card=>({id:`${rank}${suit}`,rank,suit});
test('틴 파티 족보 순서가 맞다',()=>{const trail=[c('A','♠'),c('A','♥'),c('A','♦')],pure=[c('A','♠'),c('K','♠'),c('Q','♠')],pair=[c('9','♠'),c('9','♥'),c('2','♦')];assert.equal(evaluateTeenPatti(trail).label,'트레일(트리플)');assert.ok(compareTeenPatti(trail,pure)>0);assert.ok(compareTeenPatti(pure,pair)>0);});
test('AKQ 다음으로 A23 시퀀스가 강하다',()=>{assert.ok(compareTeenPatti([c('A','♠'),c('3','♥'),c('2','♦')],[c('K','♠'),c('Q','♥'),c('J','♦')])>0);});
test('두 사람 카드 여섯 장은 겹치지 않는다',()=>{const r=dealTeenPatti();assert.equal(new Set([...r.player,...r.opponent].map(card=>card.id)).size,6);});
