import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseComputerMinhwatuCard, dealMinhwatu, playMinhwatuTurn, scoreMinhwatu, settleMinhwatu, type MinhwaPlayer, type MinhwaRound } from '../src/minhwatu.ts';
import { createHwatuDeck, type HwatuCard } from '../src/hwatu.ts';

const deck=createHwatuDeck();
const card=(month:number,kind?:HwatuCard['kind'])=>deck.find((item)=>item.month===month&&(!kind||item.kind===kind))!;

test('두 명이 열 장씩, 바닥 여덟 장을 받고 48장이 겹치지 않는다',()=>{
  const round=dealMinhwatu(()=>0.41);
  assert.deepEqual(round.players.map((player)=>player.hand.length),[10,10]);
  assert.equal(round.floor.length,8);assert.equal(round.deck.length,20);
  const all=[...round.players.flatMap((player)=>player.hand),...round.floor,...round.deck];
  assert.equal(new Set(all.map((item)=>item.id)).size,48);
});

test('광 20점, 열끗 10점, 띠 5점, 피 0점이다',()=>{
  const score=scoreMinhwatu([card(1,'광'),card(2,'열끗'),card(4,'띠'),card(6,'피')]);
  assert.deepEqual({base:score.base,bright:score.bright,animal:score.animal,ribbon:score.ribbon},{base:35,bright:20,animal:10,ribbon:5});
});

test('홍단·청단·초단은 각각 30점 약이다',()=>{
  for(const ribbon of ['홍단','청단','초단'] as const){
    const score=scoreMinhwatu(deck.filter((item)=>item.ribbon===ribbon));
    assert.deepEqual(score.medicines,[{name:ribbon,value:30}]);
  }
});

test('5월 초약·10월 풍약·12월 비약은 각각 20점 약이다',()=>{
  assert.deepEqual(scoreMinhwatu(deck.filter((item)=>item.month===5)).medicines,[{name:'초약',value:20}]);
  assert.deepEqual(scoreMinhwatu(deck.filter((item)=>item.month===10)).medicines,[{name:'풍약',value:20}]);
  assert.deepEqual(scoreMinhwatu(deck.filter((item)=>item.month===12)).medicines,[{name:'비약',value:20}]);
});

test('약 점수는 완성한 사람에게 더하고 상대에게서 뺀다',()=>{
  const players:MinhwaPlayer[]=[{hand:[],captured:deck.filter((item)=>item.ribbon==='홍단')},{hand:[],captured:[card(1,'광')]}];
  const result=settleMinhwatu(players);
  assert.deepEqual(result.transfers,[30,-30]);
  assert.equal(result.winner,0);
});

test('같은 월을 내면 바닥 패와 함께 먹고 더미도 처리한다',()=>{
  const hand=card(1,'광');const match=deck.find((item)=>item.month===1&&item.id!==hand.id)!;const draw=card(6,'열끗');
  const round:MinhwaRound={players:[{hand:[hand],captured:[]},{hand:[],captured:[]}],floor:[match,card(4,'띠')],deck:[draw],turn:0,finished:false,message:''};
  const next=playMinhwatuTurn(round,hand.id);
  assert.equal(next.players[0].captured.length,2);assert.equal(next.floor.some((item)=>item.id===draw.id),true);
});

test('바닥에 같은 월 두 장이면 가져갈 패를 골라야 한다',()=>{
  const month=deck.filter((item)=>item.month===8);
  const round:MinhwaRound={players:[{hand:[month[0]],captured:[]},{hand:[],captured:[]}],floor:[month[1],month[2]],deck:[],turn:0,finished:false,message:''};
  assert.throws(()=>playMinhwatuTurn(round,month[0].id),/골라야/);
  assert.equal(playMinhwatuTurn(round,month[0].id,{playedMatchId:month[2].id}).players[0].captured.some((item)=>item.id===month[2].id),true);
});

test('컴퓨터는 바닥의 광을 먹을 수 있는 패를 우선한다',()=>{
  const bright=card(3,'광');const matching=deck.find((item)=>item.month===3&&item.id!==bright.id)!;
  const round:MinhwaRound={players:[{hand:[],captured:[]},{hand:[card(7,'피'),matching],captured:[]}],floor:[bright],deck:[card(6)],turn:1,finished:false,message:''};
  assert.equal(chooseComputerMinhwatuCard(round).id,matching.id);
});
