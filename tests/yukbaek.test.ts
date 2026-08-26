import test from 'node:test';import assert from 'node:assert/strict';
import {chooseComputerYukbaekCard,createYukbaekMatch,createYukbaekRound,scoreYukbaek,settleYukbaekRound,yukbaekCardValue} from '../src/yukbaek.ts';
import {createHwatuDeck,type HwatuCard} from '../src/hwatu.ts';
const deck=createHwatuDeck();const card=(month:number,kind?:HwatuCard['kind'])=>deck.find((item)=>item.month===month&&(!kind||item.kind===kind))!;

test('육백도 두 명 10장·바닥 8장으로 한 판을 시작한다',()=>{const round=createYukbaekRound(()=>0.33);assert.deepEqual(round.players.map((p)=>p.hand.length),[10,10]);assert.equal(round.floor.length,8);});
test('광과 2월 매조는 50점, 열끗과 띠는 10점, 피는 0점이다',()=>{assert.equal(yukbaekCardValue(card(1,'광')),50);assert.equal(yukbaekCardValue(card(2,'열끗')),50);assert.equal(yukbaekCardValue(card(4,'열끗')),10);assert.equal(yukbaekCardValue(card(4,'띠')),10);assert.equal(yukbaekCardValue(card(4,'피')),0);});
test('홍단은 150점, 청단과 초단은 100점이다',()=>{assert.equal(scoreYukbaek(deck.filter((c)=>c.ribbon==='홍단')).yakuPoints,150);assert.equal(scoreYukbaek(deck.filter((c)=>c.ribbon==='청단')).yakuPoints,100);assert.equal(scoreYukbaek(deck.filter((c)=>c.ribbon==='초단')).yakuPoints,100);});
test('대삼·꽃놀이술·달맞이술을 판정한다',()=>{assert.equal(scoreYukbaek([card(1,'광'),card(2,'열끗'),card(3,'광')]).yaku.some((y)=>y.name==='대삼'),true);assert.equal(scoreYukbaek([card(3,'광'),card(9,'열끗')]).yaku.some((y)=>y.name==='꽃놀이술'),true);assert.equal(scoreYukbaek([card(8,'광'),card(9,'열끗')]).yaku.some((y)=>y.name==='달맞이술'),true);});
test('지정된 월 네 장은 섬 50점이다',()=>{for(const month of [1,2,3,4,8,10,11])assert.equal(scoreYukbaek(deck.filter((c)=>c.month===month)).yaku.some((y)=>y.name===`${month}월 섬`),true);});
test('비광을 제외한 사광과 띠 일곱 장은 즉시 승리다',()=>{assert.equal(scoreYukbaek([card(1,'광'),card(3,'광'),card(8,'광'),card(11,'광')]).instant,true);assert.equal(scoreYukbaek(deck.filter((c)=>c.kind==='띠').slice(0,7)).instant,true);});
test('각 판 점수를 누적해 먼저 600점 이상인 쪽을 정한다',()=>{const round=createYukbaekRound(()=>0.2);round.players[0].captured=[card(1,'광'),card(3,'광'),card(8,'광')];let match=createYukbaekMatch();match={...match,totals:[500,0]};const settled=settleYukbaekRound(match,round);assert.equal(settled.match.totals[0]>=600,true);assert.equal(settled.match.winner,0);});
test('컴퓨터는 바닥의 50점 패를 먹는 손패를 우선한다',()=>{const bright=card(3,'광');const matching=deck.find((c)=>c.month===3&&c.id!==bright.id)!;const round=createYukbaekRound(()=>0.4);round.turn=1;round.floor=[bright];round.players[1].hand=[card(7,'피'),matching];assert.equal(chooseComputerYukbaekCard(round).id,matching.id);});
