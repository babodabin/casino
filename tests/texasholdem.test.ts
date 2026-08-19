import test from 'node:test'; import assert from 'node:assert/strict';
import { evaluateHoldem, evaluateOmaha, resolveHoldem } from '../src/texasholdem.ts'; import type { Card, Rank, Suit } from '../src/blackjack.ts';
const cards=(values:Array<[Rank,Suit]>):Card[]=>values.map(([rank,suit],i)=>({id:`${suit}-${rank}-${i}`,rank,suit}));
test('7장 중 가장 높은 홀덤 족보를 선택한다',()=>{ assert.equal(evaluateHoldem(cards([['A','♠'],['K','♠'],['Q','♠'],['J','♠'],['10','♠'],['2','♥'],['3','♦']])).label,'로열 플러시'); });
test('플레이어와 상대의 승패를 판정한다',()=>{ const community=cards([['A','♠'],['K','♥'],['7','♦'],['4','♣'],['2','♠']]); const result=resolveHoldem(cards([['A','♥'],['A','♦']]),cards([['K','♠'],['K','♦']]),community); assert.equal(result.result,'win'); });
test('같은 보드 족보면 무승부다',()=>{ const community=cards([['10','♠'],['J','♥'],['Q','♦'],['K','♣'],['A','♠']]); assert.equal(resolveHoldem(cards([['2','♥'],['3','♦']]),cards([['4','♥'],['5','♦']]),community).result,'push'); });
test('오마하는 개인 카드 정확히 2장과 공용 카드 3장을 사용한다',()=>{ const hole=cards([['A','♠'],['K','♠'],['2','♥'],['3','♦']]); const board=cards([['Q','♠'],['J','♠'],['10','♠'],['9','♠'],['8','♠']]); assert.equal(evaluateOmaha(hole,board).label,'로열 플러시'); const noSpade=cards([['A','♥'],['K','♦'],['2','♥'],['3','♦']]); assert.notEqual(evaluateOmaha(noSpade,board).label,'스트레이트 플러시'); });
