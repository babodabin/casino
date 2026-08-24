import test from 'node:test';
import assert from 'node:assert/strict';
import { createMahjongTiles } from '../src/riichimahjong.ts';
import { canDiscardSichuan, canWinSichuan, canWorldMahjongRon, chooseSichuanComputerCall, chooseSichuanExchange, chooseSichuanMissingSuit, chooseWorldMahjongCall, chooseWorldMahjongDiscard, createHongKongMahjongTiles, createSichuanBloodBattleState, dealHongKongOpening, drawHongKongNormalTile, evaluateWorldMahjong, exchangeSichuanTiles, isHongKongFlower, isValidSichuanExchange, settleSichuanBloodBattle, settleSichuanDraw, settleSichuanKong, settleSichuanMultipleRon } from '../src/worldmahjong.ts';

const tiles=createMahjongTiles();
const take=(codes:string[])=>{
  const used=new Map<string,number>();
  return codes.map((code)=>{const copy=used.get(code)??0;used.set(code,copy+1);const tile=tiles.find((item)=>`${item.suit}${item.value}`===code&&item.id.endsWith(`-${copy}`));if(!tile)throw new Error(`없는 패 ${code}-${copy}`);return tile;});
};

test('중국 표준은 8점 이상이어야 화료 자격이 있다',()=>{
  const low=take(['m2','m3','m4','p2','p3','p4','s3','s4','s5','m6','m7','m8','p5','p5']);
  const lowResult=evaluateWorldMahjong({mode:'chinese',concealed:low,winType:'ron'});
  assert.equal(lowResult.qualifies,false);
  assert.ok(lowResult.total<8);

  const straight=take(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','z5','z5']);
  const result=evaluateWorldMahjong({mode:'chinese',concealed:straight,winType:'ron'});
  assert.equal(result.qualifies,true);
  assert.ok(result.patterns.some((item)=>item.localName==='清龙'));
});

test('중국 표준 론은 완성 모양이어도 8점 미만이면 거절한다',()=>{
  const lowHand=take(['m2','m3','m4','p2','p3','p4','s3','s4','s5','m6','m7','m8','p5']);
  const lowDiscard=take(['p5'])[0];
  assert.equal(canWorldMahjongRon({mode:'chinese',hand:lowHand,discarded:lowDiscard}),false);

  const scoringHand=take(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','z5']);
  const scoringDiscard=take(['z5'])[0];
  assert.equal(canWorldMahjongRon({mode:'chinese',hand:scoringHand,discarded:scoringDiscard}),true);
});

test('중국식 전문가 컴퓨터는 고립 자패보다 연결패와 쌍을 보존한다',()=>{
  const hand=take(['m2','m3','m4','m5','m6','m7','p3','p3','p4','p5','s6','s7','z4','z6']);
  const thrown=chooseWorldMahjongDiscard(hand,{mode:'chinese',level:'expert',random:()=>0.5});
  assert.equal(thrown.suit,'z');
});

test('세계 마작 전문가는 이미 다 보인 대기보다 살아 있는 대기를 남긴다',()=>{
  const tiles=take(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','z5','z1']);
  const visible=[...tiles,...take(['z1','z1','z1'])];
  const thrown=chooseWorldMahjongDiscard(tiles,{mode:'chinese',level:'expert',visibleTiles:visible,random:()=>0.5});
  assert.equal(`${thrown.suit}${thrown.value}`,'z1');
});

test('중국식 전문가 컴퓨터는 가치 자패 퐁을 우선한다',()=>{
  const hand=take(['z5','z5','m1','m2','m3','m4','m5','m6','p2','p3','p4','s7','s8']);
  const discarded=take(['z5'])[0];
  assert.equal(chooseWorldMahjongCall(hand,discarded,false,{mode:'chinese',level:'beginner'}),null);
  assert.equal(chooseWorldMahjongCall(hand,discarded,false,{mode:'chinese',level:'expert'})?.kind,'pon');
});

test('중국 표준의 화룡과 오문제를 판정한다',()=>{
  const flowerDragon=take(['m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1','z1','z5','z5']);
  const result=evaluateWorldMahjong({mode:'chinese',concealed:flowerDragon,winType:'ron'});
  assert.ok(result.patterns.some((item)=>item.localName==='花龙'));
  assert.ok(result.patterns.some((item)=>item.localName==='五门齐'));
  assert.equal(result.qualifies,true);
});

test('중국 표준의 대삼원은 개별 삼원패 점수와 중복하지 않는다',()=>{
  const hand=take(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m1','m2','m3','p5','p5']);
  const result=evaluateWorldMahjong({mode:'chinese',concealed:hand,winType:'ron'});
  assert.ok(result.patterns.some((item)=>item.localName==='大三元'));
  assert.equal(result.patterns.some((item)=>['白板刻','发财刻','红中刻'].includes(item.localName)),false);
});

test('중국 표준의 십삼요·구련보등·녹일색을 판정한다',()=>{
  const orphans=take(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  assert.ok(evaluateWorldMahjong({mode:'chinese',concealed:orphans,winType:'ron'}).patterns.some((item)=>item.localName==='十三幺'));
  const gates=take(['m1','m1','m1','m2','m3','m4','m5','m5','m6','m7','m8','m9','m9','m9']);
  assert.ok(evaluateWorldMahjong({mode:'chinese',concealed:gates,winType:'ron'}).patterns.some((item)=>item.localName==='九莲宝灯'));
  const green=take(['s2','s2','s2','s3','s3','s3','s4','s4','s4','s6','s6','s6','z6','z6']);
  assert.ok(evaluateWorldMahjong({mode:'chinese',concealed:green,winType:'ron'}).patterns.some((item)=>item.localName==='绿一色'));
});

test('중국 표준의 일색사동순과 일색사절고는 하위 세 몸통 조합과 중복하지 않는다',()=>{
  const repeated=take(['m1','m2','m3','m1','m2','m3','m1','m2','m3','m1','m2','m3','p5','p5']);
  const repeatedResult=evaluateWorldMahjong({mode:'chinese',concealed:repeated,winType:'ron'});
  assert.ok(repeatedResult.patterns.some((item)=>item.localName==='一色四同顺'));
  assert.ok(!repeatedResult.patterns.some((item)=>item.localName==='一色三同顺'));
  const shifted=take(['m1','m1','m1','m2','m2','m2','m3','m3','m3','m4','m4','m4','p5','p5']);
  const shiftedResult=evaluateWorldMahjong({mode:'chinese',concealed:shifted,winType:'ron'});
  assert.ok(shiftedResult.patterns.some((item)=>item.localName==='一色四节高'));
  assert.ok(!shiftedResult.patterns.some((item)=>item.localName==='一色三节高'));
});

test('중국 표준의 불구인은 문전청과 자모를 따로 중복하지 않는다',()=>{
  const hand=take(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','z5','z5']);
  const result=evaluateWorldMahjong({mode:'chinese',concealed:hand,winType:'tsumo'});
  assert.ok(result.patterns.some((item)=>item.localName==='不求人'));
  assert.equal(result.patterns.some((item)=>item.localName==='门前清'||item.localName==='自摸'),false);
});

test('중국 표준의 전소·전중·전대와 전대오를 판정한다',()=>{
  const allSmall=evaluateWorldMahjong({mode:'chinese',concealed:take(['m1','m1','m1','p2','p2','p2','s3','s3','s3','m1','m2','m3','p1','p1']),winType:'ron'});
  const allMiddle=evaluateWorldMahjong({mode:'chinese',concealed:take(['m4','m4','m4','p5','p5','p5','s6','s6','s6','m4','m5','m6','p4','p4']),winType:'ron'});
  const allLarge=evaluateWorldMahjong({mode:'chinese',concealed:take(['m7','m7','m7','p8','p8','p8','s9','s9','s9','m7','m8','m9','p7','p7']),winType:'ron'});
  const allFives=evaluateWorldMahjong({mode:'chinese',concealed:take(['m3','m4','m5','p3','p4','p5','s4','s5','s6','m5','m5','m5','p5','p5']),winType:'ron'});
  assert.ok(allSmall.patterns.some((item)=>item.localName==='全小'));
  assert.ok(allMiddle.patterns.some((item)=>item.localName==='全中'));
  assert.ok(allLarge.patterns.some((item)=>item.localName==='全大'));
  assert.ok(allFives.patterns.some((item)=>item.localName==='全带五'));
});

test('중국 표준의 일색삼보고와 삼색삼보고를 판정한다',()=>{
  const pure=evaluateWorldMahjong({mode:'chinese',concealed:take(['m1','m2','m3','m2','m3','m4','m3','m4','m5','p7','p7','p7','s9','s9']),winType:'ron'});
  const mixed=evaluateWorldMahjong({mode:'chinese',concealed:take(['m1','m2','m3','p2','p3','p4','s3','s4','s5','m7','m7','m7','z1','z1']),winType:'ron'});
  assert.ok(pure.patterns.some((item)=>item.localName==='一色三步高'));
  assert.ok(mixed.patterns.some((item)=>item.localName==='三色三步高'));
});

test('홍콩식은 기본 최소 3번을 적용한다',()=>{
  const mixed=take(['m1','m2','m3','p2','p3','p4','s3','s4','s5','m6','m7','m8','z5','z5']);
  assert.equal(evaluateWorldMahjong({mode:'hongkong',concealed:mixed,winType:'ron'}).qualifies,false);
  const triplets=take(['m2','m2','m2','p3','p3','p3','s4','s4','s4','z5','z5','z5','m7','m7']);
  const result=evaluateWorldMahjong({mode:'hongkong',concealed:triplets,winType:'ron'});
  assert.equal(result.qualifies,true);
  assert.ok(result.patterns.some((item)=>item.localName==='對對胡'));
});

test('홍콩 마작은 일반패 136장과 꽃패 8장으로 구성한다',()=>{
  const deck=createHongKongMahjongTiles();
  assert.equal(deck.length,144);
  assert.equal(deck.filter(isHongKongFlower).length,8);
});

test('홍콩식 첫 배패에서 꽃패를 공개하고 일반패로 보충한다',()=>{
  const opening=dealHongKongOpening(()=>0.37);
  assert.deepEqual(opening.hands.map((hand)=>hand.length),[13,13,13,13]);
  assert.equal(opening.hands.flat().some((tile)=>'kind' in tile),false);
  assert.equal(opening.hands.flat().length+opening.flowers.flat().length+opening.wall.length,144);
});

test('꽃패를 뽑으면 손에 넣지 않고 다음 일반패를 받는다',()=>{
  const deck=createHongKongMahjongTiles();
  const flower=deck.find(isHongKongFlower)!;
  const normal=deck.find((tile)=>!isHongKongFlower(tile))!;
  const draw=drawHongKongNormalTile([],[],[flower,normal]);
  assert.equal(draw.hand.length,1);
  assert.equal(draw.flowers[0].id,flower.id);
  assert.equal(draw.drawn?.id,normal.id);
});

test('홍콩식은 자리와 일치하는 꽃패와 무화를 번으로 계산한다',()=>{
  const hand=take(['m1','m2','m3','p2','p3','p4','s3','s4','s5','m6','m7','m8','z5','z5']);
  const flowers=createHongKongMahjongTiles().filter(isHongKongFlower);
  const matched=evaluateWorldMahjong({mode:'hongkong',concealed:hand,winType:'ron',seatWind:1,flowers:[flowers[0]]});
  assert.ok(matched.patterns.some((item)=>item.name==='매화(梅)'));
  const noFlower=evaluateWorldMahjong({mode:'hongkong',concealed:hand,winType:'ron',seatWind:1,flowers:[]});
  assert.ok(noFlower.patterns.some((item)=>item.localName==='無花'));
});

test('홍콩식은 꽃패 한 벌과 깡 뒤 보충패 화료를 번으로 계산한다',()=>{
  const hand=take(['m1','m2','m3','m4','m5','m6','p1','p2','p3','s4','s5','s6','p7','p7']);
  const flowers=createHongKongMahjongTiles().filter(isHongKongFlower);
  const result=evaluateWorldMahjong({mode:'hongkong',concealed:hand,winType:'tsumo',afterKan:true,flowers:flowers.slice(0,4)});
  assert.ok(result.patterns.some((item)=>item.localName==='四君子'));
  assert.ok(result.patterns.some((item)=>item.localName==='嶺上開花'));
});

test('홍콩식 대삼원은 8번이며 개별 삼원패 번과 중복하지 않는다',()=>{
  const hand=take(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m1','m2','m3','p5','p5']);
  const result=evaluateWorldMahjong({mode:'hongkong',concealed:hand,winType:'ron',flowers:[createHongKongMahjongTiles().filter(isHongKongFlower)[1]]});
  assert.ok(result.patterns.some((item)=>item.localName==='大三元'&&item.points===8));
  assert.equal(result.patterns.some((item)=>['白板','發財','紅中'].includes(item.localName)),false);
});

test('홍콩식 대사희와 자일색 같은 큰 패를 판정한다',()=>{
  const hand=take(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z4','z4','z4','z5','z5']);
  const result=evaluateWorldMahjong({mode:'hongkong',concealed:hand,winType:'ron'});
  assert.ok(result.patterns.some((item)=>item.localName==='大四喜'));
  assert.ok(result.patterns.some((item)=>item.localName==='字一色'));
  assert.equal(result.qualifies,true);
});

test('홍콩식 십삼요·구자련환·녹일색을 큰 패로 판정한다',()=>{
  const orphans=evaluateWorldMahjong({mode:'hongkong',concealed:take(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']),winType:'ron'});
  const nineGates=evaluateWorldMahjong({mode:'hongkong',concealed:take(['m1','m1','m1','m2','m3','m4','m5','m5','m6','m7','m8','m9','m9','m9']),winType:'ron'});
  const green=evaluateWorldMahjong({mode:'hongkong',concealed:take(['s2','s3','s4','s2','s3','s4','s6','s6','s6','s8','s8','s8','z6','z6']),winType:'ron'});
  assert.ok(orphans.patterns.some((item)=>item.localName==='十三幺'));
  assert.ok(nineGates.patterns.some((item)=>item.localName==='九子連環'));
  assert.ok(green.patterns.some((item)=>item.localName==='綠一色'));
});

test('사천식은 자패 없는 청일색과 대대호를 판정한다',()=>{
  const hand=take(['m1','m1','m1','m3','m3','m3','m5','m5','m5','m7','m7','m7','m9','m9']);
  const result=evaluateWorldMahjong({mode:'sichuan',concealed:hand,winType:'tsumo'});
  assert.equal(result.qualifies,true);
  assert.ok(result.patterns.some((item)=>item.localName==='清一色'));
  assert.ok(result.patterns.some((item)=>item.localName==='对对胡'));
});

test('환삼장은 같은 무늬 세 장만 선택할 수 있다',()=>{
  assert.equal(isValidSichuanExchange(take(['m1','m4','m8'])),true);
  assert.equal(isValidSichuanExchange(take(['m1','p4','m8'])),false);
  assert.equal(isValidSichuanExchange(take(['m1','m4'])),false);
});

test('컴퓨터는 가능한 같은 무늬 세 장을 환삼장으로 고른다',()=>{
  const hand=take(['m1','m4','m8','p1','p2','p3','p4','p5','s1','s2','s3','s4','s5']);
  const selected=chooseSichuanExchange(hand);
  assert.equal(selected.length,3);
  assert.equal(isValidSichuanExchange(selected),true);
  assert.ok(selected.every((tile)=>tile.suit==='m'));
});

test('환삼장은 방향에 맞춰 세 장씩 교환하고 손패 수를 유지한다',()=>{
  const hands=[
    take(['m1','m2','m3','p1','p2','p3','p4','p5','s1','s2','s3','s4','s5']),
    take(['p6','p7','p8','m4','m5','m6','m7','m8','s6','s7','s8','s9','m9']),
    take(['s1','s5','s9','m1','m2','m3','m4','m5','p1','p2','p3','p4','p5']),
    take(['m6','m7','m8','p6','p7','p8','p9','s2','s3','s4','s5','s6','s7']),
  ];
  const selections=[hands[0].slice(0,3),hands[1].slice(0,3),hands[2].slice(0,3),hands[3].slice(0,3)];
  const exchanged=exchangeSichuanTiles(hands,selections,'left');
  assert.deepEqual(exchanged.map((hand)=>hand.length),[13,13,13,13]);
  assert.ok(selections[3].every((tile)=>exchanged[0].some((received)=>received.id===tile.id)));
});

test('정결 무늬가 남아 있으면 그 무늬만 버리고 화료할 수 없다',()=>{
  const hand=take(['m1','m2','p1','p2','p3','p4','p5','s1','s2','s3','s4','s5','s6']);
  assert.equal(chooseSichuanMissingSuit(hand),'m');
  assert.equal(canDiscardSichuan(hand,hand[0],'m'),true);
  assert.equal(canDiscardSichuan(hand,hand[2],'m'),false);
  assert.equal(canWinSichuan(hand,'m'),false);
  assert.equal(canWinSichuan(hand.filter((tile)=>tile.suit!=='m'),'m'),true);
});

test('사천 컴퓨터는 정결을 마치기 전에는 울지 않고 치는 선택하지 않는다',()=>{
  const unfinished=take(['m1','p4','p4','p4','s2','s3','s4','s5','s6','s7','p7','p8','p9']);
  const discarded=take(['p4'])[0];
  assert.equal(chooseSichuanComputerCall(unfinished,discarded,{missingSuit:'m',level:'expert'}),null);
  const ready=unfinished.filter((tile)=>tile.suit!=='m');
  assert.ok(['pon','kan'].includes(chooseSichuanComputerCall(ready,discarded,{missingSuit:'m',level:'expert'})?.kind??''));
  const sequenceHand=take(['p2','p3','s2','s3','s4','s5','s6','s7','p7','p8','p9','m8','m9']);
  assert.equal(chooseSichuanComputerCall(sequenceHand,take(['p1'])[0],{missingSuit:'m',level:'expert'}),null);
});

test('혈전에서는 화료한 사람만 빠지고 남은 사람이 계속한다',()=>{
  let state=createSichuanBloodBattleState();
  state=settleSichuanBloodBattle(state,{winner:0,method:'tsumo',base:2});
  assert.deepEqual(state.active,[false,true,true,true]);
  assert.deepEqual(state.scores,[6,-2,-2,-2]);
  assert.equal(state.finished,false);
  state=settleSichuanBloodBattle(state,{winner:2,method:'ron',loser:1,base:4});
  state=settleSichuanBloodBattle(state,{winner:3,method:'ron',loser:1,base:2});
  assert.equal(state.finished,true);
  assert.deepEqual(state.winners,[0,2,3]);
});

test('사천 일포다향은 한 방총자가 여러 론 승자에게 각각 지불한다',()=>{
  const state=settleSichuanMultipleRon(createSichuanBloodBattleState(),{loser:0,winners:[{seat:1,base:2},{seat:3,base:4}]});
  assert.deepEqual(state.scores,[-6,2,0,4]);
  assert.deepEqual(state.active,[true,false,true,false]);
  assert.deepEqual(state.winners,[1,3]);
  assert.equal(state.finished,false);
});

test('사천 직공 명깡은 버린 사람 한 명이 2배를 지불한다',()=>{
  const result=settleSichuanKong(createSichuanBloodBattleState(),{declarer:1,kind:'ming',discarder:3});
  assert.deepEqual(result.state.scores,[0,2,0,-2]);
  assert.deepEqual(result.transfers,[{from:3,to:1,amount:2}]);
});

test('사천 암깡과 가깡은 아직 경기 중인 상대에게서만 받는다',()=>{
  const blood=createSichuanBloodBattleState();blood.active[2]=false;
  const concealed=settleSichuanKong(blood,{declarer:0,kind:'an'});
  assert.deepEqual(concealed.state.scores,[4,-2,0,-2]);
  assert.deepEqual(concealed.transfers,[{from:1,to:0,amount:2},{from:3,to:0,amount:2}]);
  const added=settleSichuanKong(blood,{declarer:0,kind:'jia'});
  assert.deepEqual(added.state.scores,[2,-1,0,-1]);
});

test('사천 유국은 화저·대교·퇴세를 순서대로 정산한다',()=>{
  const state=createSichuanBloodBattleState();state.active[3]=false;state.winners=[3];
  const pig=take(['m1','m2','m3','m4','m5','m6','p1','p2','p3','p4','p5','p7','s1']);
  const ready=take(['m1','m2','m3','m4','m5','m6','p1','p2','p3','p4','p5','p7','p7']);
  const noten=take(['m1','m3','m5','m7','m9','p1','p3','p5','p7','p9','m2','p2','p4']);
  const finished=take(['m1','m1','m1','m2','m2','m2','p1','p1','p1','p2','p2','p2','m3']);
  const result=settleSichuanDraw(state,{hands:[pig,ready,noten,finished],missingSuits:['s','s','s','s'],kongTransfers:[{from:1,to:2,amount:2}]});
  assert.deepEqual(result.flowerPigs,[0]);
  assert.deepEqual(result.tenpai,[1]);
  assert.deepEqual(result.noten,[2]);
  assert.equal(result.taxRefunds[2],2);
  assert.equal(result.state.finished,true);
  assert.ok(result.state.scores[1]>0);
  assert.ok(result.state.scores[0]<0);
});
