import test from 'node:test';
import assert from 'node:assert/strict';
import {createChineseMatch,chineseScore,settleChineseDraw,settleChineseMultipleRon} from '../src/chinesemahjong.ts';
import {createHongKongMatch,hongKongScore,settleHongKongDraw,settleHongKongMultipleRon} from '../src/hongkongmahjong.ts';
import {calculateRiichiScore,settleMultipleRon,type RiichiMatchState} from '../src/riichimahjong.ts';
import {createBloodState,settleSichuanKan,settleSichuanMultipleRon,sichuanScore} from '../src/sichuanmahjong.ts';

test('중국식은 복수 론과 유국을 섞어 16국을 진행해도 총점이 보존된다',()=>{
  let state=createChineseMatch();
  const score=chineseScore({yaku:[{name:'시험',chinese:'試',points:8,detail:''}],winType:'ron'});
  for(let round=0;round<16;round++)state=round%2===0
    ?settleChineseMultipleRon(state,{loser:0,winners:[{seat:1,score},{seat:2,score}]})
    :settleChineseDraw(state);
  assert.equal(state.roundIndex,16);
  assert.equal(state.finished,true);
  assert.equal(state.scores.reduce((sum,value)=>sum+value,0),0);
});

test('홍콩식은 친 포함 복수 론이면 연장하고 친이 없으면 다음 국으로 간다',()=>{
  const score=hongKongScore({faan:[{name:'시험',chinese:'試',faan:3,detail:''}],winType:'ron'});
  let state=createHongKongMatch();
  state=settleHongKongMultipleRon(state,{loser:3,winners:[{seat:0,score},{seat:1,score}]});
  assert.equal(state.roundIndex,0);
  assert.equal(state.dealerRepeat,1);
  state=settleHongKongMultipleRon(state,{loser:0,winners:[{seat:1,score},{seat:2,score}]});
  assert.equal(state.roundIndex,1);
  state=settleHongKongDraw(state);
  assert.equal(state.scores.reduce((sum,value)=>sum+value,0),2000);
});

test('리치 더블 론은 국을 한 번만 넘기고 점수 총합을 보존한다',()=>{
  const state:RiichiMatchState={roundIndex:0,honba:1,riichiSticks:2,scores:[25000,24000,25000,24000],finished:false};
  const score=calculateRiichiScore({han:3,fu:40,dealer:false,winType:'ron'});
  const result=settleMultipleRon(state,{discarderSeat:0,winners:[{seat:1,score},{seat:2,score}]});
  assert.equal(result.roundIndex,1);
  const beforeTotal=state.scores.reduce((sum,value)=>sum+value,0)+state.riichiSticks*1000;
  const afterTotal=result.scores.reduce((sum,value)=>sum+value,0)+result.riichiSticks*1000;
  assert.equal(afterTotal,beforeTotal);
});

test('쓰촨은 깡 뒤 일포다향까지 이어져도 점수 총합을 보존한다',()=>{
  let state=createBloodState(0);
  state=settleSichuanKan(state,{kanner:1,kind:'minkan',discarder:0,basePoints:1}).state;
  const score=sichuanScore({fans:[],roots:0,basePoints:1,winType:'ron',activeOpponents:3});
  state=settleSichuanMultipleRon(state,{loser:0,winners:[{seat:1,score},{seat:2,score}]});
  assert.deepEqual(state.winners,[1,2]);
  assert.equal(state.scores.reduce((sum,value)=>sum+value,0),0);
});
