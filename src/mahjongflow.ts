import { drawSichuanReplacement, type SichuanSuit } from './sichuanmahjong.ts';
import { drawReplacementTile, getMahjongCallOptions, type MahjongCallOption, type MahjongTile } from './riichimahjong.ts';

export type SharedMahjongMode='riichi'|'chinese'|'hongkong'|'sichuan';

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
