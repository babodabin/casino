import test from 'node:test';
import assert from 'node:assert/strict';
import { dealFiveCardDraw, exchangeDrawCards, opponentKeepCards, resolveFiveCardDraw } from '../src/fivecarddraw.ts';
import type { Card, Rank, Suit } from '../src/blackjack.ts';

const cards = (values: Array<[Rank, Suit]>): Card[] => values.map(([rank, suit], index) => ({ id: `${suit}-${rank}-${index}`, rank, suit }));

test('각자 5장을 받고 교환용 카드가 남는다', () => { const deal=dealFiveCardDraw(()=>0.4); assert.equal(deal.player.length,5); assert.equal(deal.opponent.length,5); assert.equal(deal.drawPile.length,42); assert.equal(new Set([...deal.player,...deal.opponent,...deal.drawPile].map((card)=>card.id)).size,52); });
test('보관하지 않은 카드만 교환한다', () => { const hand=cards([['A','♠'],['A','♥'],['3','♣'],['4','♦'],['5','♠']]); const pile=cards([['K','♠'],['Q','♥'],['J','♣']]); const result=exchangeDrawCards(hand,[true,true,false,false,false],pile); assert.deepEqual(result.hand.map((card)=>card.rank),['A','A','K','Q','J']); assert.equal(result.exchanged,3); });
test('컴퓨터는 같은 숫자 조합을 우선 보관한다', () => { const hand=cards([['9','♠'],['9','♥'],['A','♣'],['4','♦'],['2','♠']]); assert.deepEqual(opponentKeepCards(hand),[true,true,false,false,false]); });
test('교환 후 완성된 5장 족보로 승패를 정한다', () => { const player=cards([['10','♠'],['J','♠'],['Q','♠'],['K','♠'],['A','♠']]); const opponent=cards([['9','♠'],['9','♥'],['9','♦'],['4','♣'],['4','♠']]); assert.equal(resolveFiveCardDraw(player,opponent).result,'win'); });
