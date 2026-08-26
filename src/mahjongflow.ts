import { drawSichuanReplacement, settleSichuanKan, type SichuanBloodState, type SichuanSuit } from './sichuanmahjong.ts';
import { drawReplacementTile, getMahjongCallOptions, type MahjongCallOption, type MahjongTile } from './riichimahjong.ts';

export type SharedMahjongMode='riichi'|'chinese'|'hongkong'|'sichuan';

/** 공통 시작 버튼이 각 종목의 실제 경기 종료 상태를 읽도록 통일합니다. */
export function isMahjongSessionFinished(mode:SharedMahjongMode,states:{riichi:boolean;chinese:boolean;hongkong:boolean;sichuan:boolean}){
  return states[mode];
}

/** 종목별 공개 부름 규칙을 공통 게임 진행부에서 한 곳으로 강제합니다. */
export function getModeCallOptions(mode:SharedMahjongMode,hand:MahjongTile[],discarded:MahjongTile,canChi:boolean,voidSuit?:SichuanSuit){
  if(mode==='sichuan'){
    // 사천은 정결한 종류가 손에 남아 있으면 먼저 버려야 하며 치가 없습니다.
    if(voidSuit&&hand.some((tile)=>tile.suit===voidSuit))return [];
    return getMahjongCallOptions(hand,discarded,false);
  }
  return getMahjongCallOptions(hand,discarded,canChi);
}

/** 퐁·깡은 치보다 우선하며, 같은 우선순위면 방총자 다음 자리부터 가까운 쪽이 먼저입니다. */
export function chooseCallByPriority<T extends {seat:number;call:MahjongCallOption}>(reactions:T[],discarderSeat:number):T|null{
  const priority=(call:MahjongCallOption)=>call.kind==='kan'?2:call.kind==='pon'?2:1;
  const distance=(seat:number)=>(seat-discarderSeat+4)%4||4;
  return [...reactions].sort((a,b)=>priority(b.call)-priority(a.call)||distance(a.seat)-distance(b.seat))[0]??null;
}

/** 리치만 왕패의 영상패를 쓰고, 나머지 세 종목은 별도 왕패 없이 산 뒤에서 보충합니다. */
export function drawModeSupplement(mode:SharedMahjongMode,hand:MahjongTile[],wall:MahjongTile[],deadWall:MahjongTile[],revealedKans:number){
  if(mode==='riichi')return drawReplacementTile(hand,wall,deadWall,revealedKans);
  return {...drawSichuanReplacement(hand,wall),deadWall};
}

/** 아직 화면 정산에 반영되지 않은 다음 쓰촨 깡 이벤트 하나를 처리합니다. */
export function reconcileSichuanKanEvent(state:SichuanBloodState,owners:number[],settledCount:number,discarder=0){
  if(settledCount>=owners.length)return null;
  const owner=owners[settledCount];
  if(owner===0)return {state,owner,settledCount:settledCount+1,gained:0,label:'플레이어 깡',transfers:[]};
  const settled=settleSichuanKan(state,{kanner:owner,kind:'minkan',discarder,basePoints:1});
  return {...settled,owner,settledCount:settledCount+1};
}
