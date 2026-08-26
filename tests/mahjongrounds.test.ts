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

test('플레이어와 컴퓨터의 중국식 동시 론을 함께 정산한다',()=>{
  const score=chineseScore({yaku:[{name:'시험',chinese:'試',points:8,detail:''}],winType:'ron'});
  const result=settleChineseMultipleRon(createChineseMatch(),{loser:1,winners:[{seat:0,score},{seat:3,score}]});
  assert.ok(result.scores[0]>0&&result.scores[3]>0&&result.scores[1]<0);
  assert.equal(result.scores.reduce((sum,value)=>sum+value,0),0);
});

test('플레이어와 컴퓨터의 홍콩식 동시 론을 함께 정산한다',()=>{
  const score=hongKongScore({faan:[{name:'시험',chinese:'試',faan:3,detail:''}],winType:'ron'});
  const result=settleHongKongMultipleRon(createHongKongMatch(),{loser:1,winners:[{seat:0,score},{seat:2,score}]});
  assert.ok(result.scores[0]>500&&result.scores[2]>500&&result.scores[1]<500);
  assert.equal(result.scores.reduce((sum,value)=>sum+value,0),2000);
});

test('플레이어와 컴퓨터의 리치·쓰촨 동시 론도 총점을 보존한다',()=>{
  const riichi:RiichiMatchState={roundIndex:0,honba:0,riichiSticks:0,scores:[25000,25000,25000,25000],finished:false};
  const riichiScore=calculateRiichiScore({han:2,fu:40,dealer:false,winType:'ron'});
  const riichiResult=settleMultipleRon(riichi,{discarderSeat:1,winners:[{seat:0,score:riichiScore},{seat:2,score:riichiScore}]});
  assert.equal(riichiResult.scores.reduce((sum,value)=>sum+value,0),100000);

  const sichuanScoreResult=sichuanScore({fans:[],roots:0,basePoints:1,winType:'ron',activeOpponents:3});
  const sichuanResult=settleSichuanMultipleRon(createBloodState(0),{loser:1,winners:[{seat:0,score:sichuanScoreResult},{seat:2,score:sichuanScoreResult}]});
  assert.deepEqual(sichuanResult.winners,[0,2]);
  assert.equal(sichuanResult.scores.reduce((sum,value)=>sum+value,0),0);
});
