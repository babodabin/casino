import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeclareRiichiNow, chooseCallByPriority, drawModeSupplement, getModeCallOptions, isDoubleRiichiDeclaration, isMahjongSessionFinished, mahjongDealerSeat, reconcileSichuanKanEvent } from '../src/mahjongflow.ts';
import { createBloodState } from '../src/sichuanmahjong.ts';
import { chooseComputerCall, type MahjongCallOption, type MahjongTile } from '../src/riichimahjong.ts';

const hand=(codes:string[]):MahjongTile[]=>codes.map((code,index)=>({id:`${code}-${index}`,suit:code[0] as MahjongTile['suit'],value:Number(code.slice(1)),glyph:code}));
const call=(kind:MahjongCallOption['kind']):MahjongCallOption=>({kind,tiles:[],label:kind});

test('사천은 치를 금지하고 정결이 남으면 퐁과 깡도 먼저 참는다',()=>{
  const tiles=hand(['m2','m2','m2','p3','p4','s7']);
  const discarded=hand(['m2'])[0];
  assert.deepEqual(getModeCallOptions('sichuan',tiles,discarded,true,'p'),[]);
  const cleared=tiles.filter((tile)=>tile.suit!=='p');
  const options=getModeCallOptions('sichuan',cleared,discarded,true,'p');
  assert.equal(options.some((option)=>option.kind==='pon'),true);
  assert.equal(options.some((option)=>option.kind==='kan'),true);
  assert.equal(options.some((option)=>option.kind==='chi'),false);
});

test('나머지 세 마작은 왼쪽 자리에서 치를 허용한다',()=>{
  const tiles=hand(['m1','m3','p7']);
  const discarded=hand(['m2'])[0];
  for(const mode of ['riichi','chinese','hongkong'] as const){
    assert.equal(getModeCallOptions(mode,tiles,discarded,true).some((option)=>option.kind==='chi'),true,mode);
    assert.equal(getModeCallOptions(mode,tiles,discarded,false).some((option)=>option.kind==='chi'),false,mode);
  }
});

test('컴퓨터도 종목별로 허용된 부름 밖의 행동은 선택하지 않는다',()=>{
  const tiles=hand(['m1','m3','m5','p7']);
  const discarded=hand(['m2'])[0];
  const allowed=getModeCallOptions('sichuan',tiles,discarded,true,'p');
  assert.equal(chooseComputerCall(tiles,discarded,true,{level:'expert',allowedCalls:allowed}),null);
  const riichiAllowed=getModeCallOptions('riichi',tiles,discarded,true);
  assert.equal(chooseComputerCall(tiles,discarded,true,{level:'expert',allowedCalls:riichiAllowed})?.kind,'chi');
});

test('퐁과 깡이 먼 자리의 치보다 우선하고 같은 등급은 가까운 자리가 먼저다',()=>{
  const first=chooseCallByPriority([
    {seat:1,call:call('chi'),name:'가까운 치'},
    {seat:2,call:call('pon'),name:'먼 퐁'},
  ],0);
  assert.equal(first?.name,'먼 퐁');
  const nearest=chooseCallByPriority([
    {seat:3,call:call('pon'),name:'먼 퐁'},
    {seat:1,call:call('pon'),name:'가까운 퐁'},
  ],0);
  assert.equal(nearest?.name,'가까운 퐁');
});

test('리치 깡은 왕패에서, 다른 마작의 깡은 산 뒤에서 보충패를 뽑는다',()=>{
  const tiles=hand(['m1']);
  const wall=hand(['p1','p2','p3']);
  const dead=hand(['s1','s2','s3','s4','s5','s6','s7','s8','s9','z1','z2','z3','z4','z5']);
  const riichi=drawModeSupplement('riichi',tiles,wall,dead,0);
  assert.equal(riichi.drawn?.id,dead[0].id);
  assert.equal(riichi.wall.length,wall.length-1,'영상패 보충으로 산도 한 장 줄어야 함');
  for(const mode of ['chinese','hongkong','sichuan'] as const){
    const result=drawModeSupplement(mode,tiles,wall,[],0);
    assert.equal(result.drawn?.id,wall[wall.length-1].id,mode);
    assert.equal(result.wall.length,wall.length-1,mode);
  }
});

test('화면에서 놓친 컴퓨터 대명깡을 정확히 한 번만 정산한다',()=>{
  const state=createBloodState(0);
  const first=reconcileSichuanKanEvent(state,[0,2],0,0)!;
  assert.equal(first.owner,0);
  assert.deepEqual(first.state.scores,[0,0,0,0]);
  const second=reconcileSichuanKanEvent(first.state,[0,2],first.settledCount,0)!;
  assert.equal(second.owner,2);
  assert.equal(second.gained,2);
  assert.deepEqual(second.state.scores,[-2,0,2,0]);
  assert.equal(reconcileSichuanKanEvent(second.state,[0,2],second.settledCount,0),null);
});

test('새 경기 버튼은 네 마작 각각의 실제 종료 상태를 확인한다',()=>{
  const states={riichi:false,hongkong:true,chinese:false,sichuan:false};
  assert.equal(isMahjongSessionFinished('riichi',states),false);
  assert.equal(isMahjongSessionFinished('hongkong',states),true);
  assert.equal(isMahjongSessionFinished('chinese',{...states,chinese:true}),true);
  assert.equal(isMahjongSessionFinished('sichuan',{...states,sichuan:true}),true);
});

test('리치는 1,000점 이상·멘젠·산 4장 이상일 때만 선언한다',()=>{
  assert.equal(canDeclareRiichiNow({points:1000,closed:true,wallRemaining:4}),true);
  assert.equal(canDeclareRiichiNow({points:999,closed:true,wallRemaining:20}),false);
  assert.equal(canDeclareRiichiNow({points:25000,closed:false,wallRemaining:20}),false);
  assert.equal(canDeclareRiichiNow({points:25000,closed:true,wallRemaining:3}),false);
  assert.equal(canDeclareRiichiNow({points:25000,closed:true,wallRemaining:20,alreadyDeclared:true}),false);
});

test('첫 버림 전이고 아무도 울지 않았을 때만 더블리치다',()=>{
  assert.equal(isDoubleRiichiDeclaration(0,false),true);
  assert.equal(isDoubleRiichiDeclaration(1,false),false);
  assert.equal(isDoubleRiichiDeclaration(0,true),false);
});

test('국이 바뀌면 친이 동가부터 네 자리로 정확히 회전한다',()=>{
  assert.deepEqual([0,1,2,3,4,5,6,7].map(mahjongDealerSeat),[0,1,2,3,0,1,2,3]);
});
