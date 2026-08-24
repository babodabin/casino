import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceRiichiMatch, applyMahjongCall, calculateNotenPayments, calculateRiichiFu, calculateRiichiScore, canRonMahjong, chooseComputerCall, chooseComputerDiscard, countMahjongDora, createMahjongTiles, dealRiichi, doraFromIndicator, evaluateBasicRiichiYaku, getMahjongCallOptions, getMahjongWaits, getRiichiDiscardOptions, getStandardMahjongDecompositions, isMahjongFuriten, isSevenPairsHand, isThirteenOrphansHand, isWinningMahjongHand, playOneComputerTurn, rankRiichiScores, riichiRoundLabel, settleRiichiWin, shouldComputerDeclareRiichi, seatWindFor, roundWindFor, countYakumanMultiplier, getAnkanOptions, getKakanOptions, applyAnkan, applyKakan, ankanKeepsWait, deadWallDoraIndicators, deadWallUraIndicators, drawReplacementTile, resolveMultipleRon, settleMultipleRon, countNineTerminals, canDeclareNineTerminals, isFourWindDiscardAbort, isFourRiichiAbort, isFourKanAbort, isNagashiMangan, nagashiManganPayments, detectAbortiveDraw, tileDangerScore, type MahjongTile } from '../src/riichimahjong.ts';

const hand = (codes: string[]): MahjongTile[] => codes.map((code, index) => ({ id: `${code}-${index}`, suit: code[0] as MahjongTile['suit'], value: Number(code.slice(1)), glyph: code }));

test('마작패 136장을 네 장씩 만든다', () => {
  const tiles = createMahjongTiles(); assert.equal(tiles.length, 136); assert.equal(new Set(tiles.map((tile) => tile.id)).size, 136);
});

test('사천식은 자패를 제외한 108장을 사용한다', () => {
  const tiles = createMahjongTiles(false); assert.equal(tiles.length, 108); assert.equal(tiles.some((tile) => tile.suit === 'z'), false);
});

test('네 명에게 13장씩 나누고 벽패를 남긴다', () => {
  const round = dealRiichi(() => 0.42); assert.equal(round.player.length, 13); assert.deepEqual(round.opponents.map((cards) => cards.length), [13,13,13]); assert.equal(round.wall.length, 70); assert.equal(round.deadWall.length,14);
});

test('머리 하나와 몸통 네 개의 완성패를 판정한다', () => {
  assert.equal(isWinningMahjongHand(hand(['m1','m1','m1','m2','m3','m4','p2','p3','p4','s7','s8','s9','z1','z1'])), true);
  assert.equal(isWinningMahjongHand(hand(['m1','m1','m2','m2','m3','m4','p2','p3','p5','s7','s8','s9','z1','z1'])), false);
});

test('버림패 한 장을 더해 론을 판정한다', () => {
  const waiting = hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']);
  assert.equal(canRonMahjong(waiting, hand(['m4'])[0]), true);
});

test('왼쪽 상대에게서만 치를 선택하고 퐁과 깡도 찾는다', () => {
  const mine = hand(['m1','m2','m4','m4','m4','p1','p2','p3','s1','s2','s3','z1','z1']);
  const m3 = hand(['m3'])[0]; const m4 = hand(['m4'])[0];
  assert.equal(getMahjongCallOptions(mine, m3, true).filter((option) => option.kind === 'chi').length, 2);
  assert.equal(getMahjongCallOptions(mine, m3, false).some((option) => option.kind === 'chi'), false);
  assert.deepEqual(getMahjongCallOptions(mine, m4, false).map((option) => option.kind), ['pon','kan']);
});

test('퐁을 하면 손패 두 장을 빼고 공개 몸통을 만든다', () => {
  const mine = hand(['m4','m4','p1','p2','p3','s1','s2','s3','z1','z1','z2','z2','z2']);
  const discarded = hand(['m4'])[0]; const option = getMahjongCallOptions(mine, discarded, false)[0];
  const called = applyMahjongCall(mine, discarded, option);
  assert.equal(called.hand.length, 11); assert.equal(called.meld.length, 3);
});

test('공개 몸통이 있는 완성패도 판정한다', () => {
  assert.equal(isWinningMahjongHand(hand(['m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']), 1), true);
});

test('텐파이 손패에서 기다리는 패를 알려준다', () => {
  const waiting = hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']);
  assert.deepEqual(getMahjongWaits(waiting).map((tile) => `${tile.suit}${tile.value}`), ['m1','m4','z1']);
});

test('대기패 중 하나를 이미 버렸으면 후리텐이다', () => {
  const waiting = hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']);
  assert.equal(isMahjongFuriten(waiting, hand(['m4'])), true);
  assert.equal(isMahjongFuriten(waiting, hand(['p9'])), false);
});

test('유국 때 텐파이 인원이 노텐에게서 총 3000점을 받는다', () => {
  assert.deepEqual(calculateNotenPayments([true,false,false,false]), [3000,-1000,-1000,-1000]);
  assert.deepEqual(calculateNotenPayments([true,true,false,false]), [1500,1500,-1500,-1500]);
  assert.deepEqual(calculateNotenPayments([true,true,true,false]), [1000,1000,1000,-3000]);
  assert.deepEqual(calculateNotenPayments([true,true,true,true]), [0,0,0,0]);
});

test('친이 이기면 같은 국에서 본장이 늘고 자가 이기면 다음 국으로 간다', () => {
  const state={roundIndex:0,honba:0,riichiSticks:0,scores:[25000,25000,25000,25000] as [number,number,number,number],finished:false};
  const dealerWin=advanceRiichiMatch(state,{winner:0});assert.equal(dealerWin.roundIndex,0);assert.equal(dealerWin.honba,1);
  const otherWin=advanceRiichiMatch(dealerWin,{winner:1});assert.equal(otherWin.roundIndex,1);assert.equal(otherWin.honba,0);assert.equal(riichiRoundLabel(otherWin.roundIndex),'동2국');
});

test('유국 때 친이 노텐이면 다음 국, 텐파이면 연장한다', () => {
  const state={roundIndex:3,honba:0,riichiSticks:1,scores:[25000,25000,25000,25000] as [number,number,number,number],finished:false};
  const dealer=state.roundIndex%4;
  const repeat=advanceRiichiMatch(state,{exhaustive:true,tenpai:[false,false,false,true]});assert.equal(repeat.roundIndex,3);assert.equal(repeat.honba,1);
  const advance=advanceRiichiMatch(state,{exhaustive:true,tenpai:[true,false,false,false]});assert.equal(advance.roundIndex,4);assert.equal(riichiRoundLabel(advance.roundIndex),'남1국');assert.equal(advance.riichiSticks,1);
  assert.equal(advance.scores.reduce((sum,value)=>sum+value,0),100000);
  assert.equal(dealer,3);
});

test('승자가 테이블의 리치 공탁봉을 모두 가져간다', () => {
  const state={roundIndex:1,honba:0,riichiSticks:2,scores:[24000,25000,25000,24000] as [number,number,number,number],finished:false};
  const next=advanceRiichiMatch(state,{winner:2});assert.equal(next.riichiSticks,0);assert.equal(next.scores[2],27000);
});

test('론 점수와 본장 및 공탁봉을 승자와 방총자 사이에서 이동한다', () => {
  const state={roundIndex:1,honba:2,riichiSticks:1,scores:[24000,25000,25000,25000] as [number,number,number,number],finished:false};
  const score=calculateRiichiScore({han:3,fu:40,dealer:true,winType:'ron'});
  const next=settleRiichiWin(state,{winner:1,loser:3,score,winType:'ron'});
  assert.equal(next.scores[1],34300);assert.equal(next.scores[3],16700);assert.equal(next.riichiSticks,0);assert.equal(next.honba,3);
});

test('자가 쯔모하면 친은 더 내고 본장은 각자 100점씩 더 낸다', () => {
  const state={roundIndex:0,honba:1,riichiSticks:0,scores:[25000,25000,25000,25000] as [number,number,number,number],finished:false};
  const score=calculateRiichiScore({han:3,fu:30,dealer:false,winType:'tsumo'});
  const next=settleRiichiWin(state,{winner:2,score,winType:'tsumo'});
  assert.equal(next.scores[0],22900);assert.equal(next.scores[1],23900);assert.equal(next.scores[3],23900);assert.equal(next.scores[2],29300);
});

test('최종 점수가 높은 순서로 순위를 매긴다', () => {
  assert.deepEqual(rankRiichiScores([28000,19000,31000,22000]).map(({seat,rank})=>[seat,rank]),[[2,1],[0,2],[3,3],[1,4]]);
});

test('보통 컴퓨터는 텐파이를 유지하는 버림패를 고른다', () => {
  const tiles=hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1','z2']);
  const discarded=chooseComputerDiscard(tiles,{level:'normal',random:()=>0});
  assert.equal(`${discarded.suit}${discarded.value}`,'z2');
});

test('전문가 컴퓨터는 상대 리치 때 상대가 이미 버린 현물패를 우선한다', () => {
  const tiles=hand(['m1','m2','m3','p2','p3','p4','s4','s5','s6','z1','z1','z2','z3','z4']);
  const discarded=chooseComputerDiscard(tiles,{level:'expert',opponentRiichi:true,opponentRiver:hand(['z3']),random:()=>0});
  assert.equal(`${discarded.suit}${discarded.value}`,'z3');
});

test('텐파이이고 1000점 이상인 컴퓨터는 실력에 따라 리치를 선언한다', () => {
  const waiting=hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1']);
  assert.equal(shouldComputerDeclareRiichi(waiting,'normal',25000),true);
  assert.equal(shouldComputerDeclareRiichi(waiting,'beginner',25000),false);
  assert.equal(shouldComputerDeclareRiichi(waiting,'expert',900),false);
});

test('컴퓨터는 가치패 퐁처럼 패를 개선하는 부름을 선택한다', () => {
  const tiles=hand(['m1','m2','m3','p2','p3','p4','s4','s5','s7','z5','z5','z2','z3']);
  const call=chooseComputerCall(tiles,hand(['z5'])[0],false,{level:'expert'});
  assert.equal(call?.kind,'pon');
});

test('14장에서 어떤 패를 버리면 리치인지 찾는다', () => {
  const ready = hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1','z2']);
  const choices = getRiichiDiscardOptions(ready);
  assert.equal(choices.some((choice) => choice.tile.suit === 'z' && choice.tile.value === 2), true);
});

test('공개 몸통이 있어 손패가 줄어도 버림 뒤 대기패를 찾는다', () => {
  const tiles=hand(['m1','m2','m3','p1','p2','p3','s1','s2','s3','z5','z1']);
  const choices=getRiichiDiscardOptions(tiles,true,1);
  const choice=choices.find((item)=>`${item.tile.suit}${item.tile.value}`==='z1');
  assert.ok(choice);
  assert.ok(choice.waits.some((tile)=>`${tile.suit}${tile.value}`==='z5'));
});

test('리치와 멘젠쯔모 및 탕야오를 판정한다', () => {
  const result = evaluateBasicRiichiYaku({ concealed:hand(['m2','m3','m4','m3','m4','m5','p2','p3','p4','s6','s7','s8','p5','p5']), riichi:true, winType:'tsumo' });
  assert.deepEqual(result.map((yaku) => yaku.name), ['리치','멘젠쯔모','탕야오']);
});

test('리치 직후 방해 없이 완성하면 일발을 더한다', () => {
  const result = evaluateBasicRiichiYaku({ concealed:hand(['m2','m3','m4','m3','m4','m5','p2','p3','p4','s6','s7','s8','p5','p5']), riichi:true, ippatsu:true, winType:'tsumo' });
  assert.equal(result.some((yaku) => yaku.name === '일발'), true);
});

test('역패와 동 중각의 자풍·장풍을 각각 판정한다', () => {
  const result = evaluateBasicRiichiYaku({ concealed:hand(['m1','m2','m3','p1','p2','p3','s7','s8','s9','z1','z1','z1','z5','z5']), winType:'ron' });
  assert.equal(result.some((yaku) => yaku.name === '자풍패 동'),true); assert.equal(result.some((yaku) => yaku.name === '장풍패 동'),true);
});

test('열린 혼일색과 또이또이를 판정한다', () => {
  const concealed = hand(['m1','m1','m1','m2','m2','m2','z1','z1']);
  const openMelds = [hand(['m3','m3','m3']),hand(['z5','z5','z5'])];
  const result = evaluateBasicRiichiYaku({ concealed,openMelds,winType:'ron' });
  assert.equal(result.find((yaku)=>yaku.name==='혼일색')?.han,2); assert.equal(result.find((yaku)=>yaku.name==='또이또이')?.han,2);
});

test('서로 다른 일곱 쌍을 칠대자로 완성 판정한다', () => {
  const tiles=hand(['m1','m1','m3','m3','p2','p2','p7','p7','s4','s4','s8','s8','z1','z1']);
  assert.equal(isSevenPairsHand(tiles),true); assert.equal(isWinningMahjongHand(tiles),true);
  assert.equal(evaluateBasicRiichiYaku({concealed:tiles,winType:'ron'}).some((yaku)=>yaku.name==='칠대자'),true);
});

test('한 종류를 네 장 모은 것은 칠대자의 두 쌍으로 세지 않는다', () => {
  assert.equal(isSevenPairsHand(hand(['m1','m1','m1','m1','m3','m3','p2','p2','p7','p7','s4','s4','z1','z1'])),false);
});

test('1·9·자패 13종과 짝 하나를 국사무쌍으로 판정한다', () => {
  const tiles=hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  assert.equal(isThirteenOrphansHand(tiles),true); assert.equal(isWinningMahjongHand(tiles),true);
  assert.equal(evaluateBasicRiichiYaku({concealed:tiles,winType:'ron'})[0].yakuman,true);
});

test('국사무쌍 13면 대기의 기다리는 패를 모두 찾는다', () => {
  const thirteen=hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7']);
  assert.equal(getMahjongWaits(thirteen).length,13);
});

test('완성패를 머리와 네 몸통으로 분해한다', () => {
  const tiles=hand(['m1','m2','m3','m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1']);
  const result=getStandardMahjongDecompositions(tiles);
  assert.equal(result.length>0,true);assert.equal(result[0].groups.length,4);assert.deepEqual(result[0].pair,{suit:'z',value:1});
});

test('이페코와 일기통관을 몸통 구성으로 판정한다', () => {
  const iipeikou=hand(['m1','m2','m3','m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:iipeikou,winType:'ron'}).some((yaku)=>yaku.name==='이페코'),true);
  const ittsu=hand(['m1','m2','m3','m4','m5','m6','m7','m8','m9','p2','p3','p4','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:ittsu,winType:'ron'}).find((yaku)=>yaku.name==='일기통관')?.han,2);
});

test('삼색동순과 삼색동각을 판정한다', () => {
  const doujun=hand(['m2','m3','m4','p2','p3','p4','s2','s3','s4','m6','m7','m8','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:doujun,winType:'ron'}).some((yaku)=>yaku.name==='삼색동순'),true);
  const doukou=hand(['m5','m5','m5','p5','p5','p5','s5','s5','s5','m1','m2','m3','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:doukou,winType:'ron'}).some((yaku)=>yaku.name==='삼색동각'),true);
});

test('찬타와 준찬타 및 혼노두를 구분한다', () => {
  const chanta=hand(['m1','m2','m3','p7','p8','p9','s1','s1','s1','z2','z2','z2','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:chanta,winType:'ron'}).some((yaku)=>yaku.name==='찬타'),true);
  const junchan=hand(['m1','m2','m3','p7','p8','p9','s1','s1','s1','m9','m9','m9','p1','p1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:junchan,winType:'ron'}).some((yaku)=>yaku.name==='준찬타'),true);
  const honroutou=hand(['m1','m1','m1','p9','p9','p9','s1','s1','s1','z2','z2','z2','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:honroutou,winType:'ron'}).some((yaku)=>yaku.name==='혼노두'),true);
});

test('양면 대기의 비공개 연속패 손을 핑후로 판정한다', () => {
  const tiles=hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);const winning=tiles.find((tile)=>tile.suit==='s'&&tile.value===8)!;
  const fu=calculateRiichiFu({concealed:tiles,winningTile:winning,winType:'ron'});
  assert.equal(fu?.pinfu,true);assert.equal(fu?.fu,30);assert.equal(evaluateBasicRiichiYaku({concealed:tiles,winningTile:winning,winType:'ron'}).some((yaku)=>yaku.name==='핑후'),true);
});

test('핑후 쯔모는 쯔모 2부를 더하지 않고 20부다', () => {
  const tiles=hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);const winning=tiles.find((tile)=>tile.suit==='s'&&tile.value===8)!;
  assert.equal(calculateRiichiFu({concealed:tiles,winningTile:winning,winType:'tsumo'})?.fu,20);
});

test('간짱 대기와 멘젠 론을 더한 뒤 10부 단위로 올린다', () => {
  const tiles=hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);const winning=tiles.find((tile)=>tile.suit==='p'&&tile.value===3)!;
  const result=calculateRiichiFu({concealed:tiles,winningTile:winning,winType:'ron'});
  assert.equal(result?.wait,'kanchan');assert.equal(result?.fu,40);
});

test('칠대자는 다른 부를 더하지 않고 25부 고정이다', () => {
  const tiles=hand(['m1','m1','m3','m3','p2','p2','p7','p7','s4','s4','s8','s8','z1','z1']);
  assert.equal(calculateRiichiFu({concealed:tiles,winningTile:tiles[13],winType:'ron'})?.fu,25);
});

test('도라 표시패의 다음 패를 순환해 찾는다', () => {
  assert.deepEqual(doraFromIndicator(hand(['m9'])[0]),{suit:'m',value:1});assert.deepEqual(doraFromIndicator(hand(['z4'])[0]),{suit:'z',value:1});assert.deepEqual(doraFromIndicator(hand(['z7'])[0]),{suit:'z',value:5});
});

test('여러 도라 표시패가 가리키는 도라를 중복해 센다', () => {
  const tiles=hand(['m2','m2','z1']);const indicators=hand(['m1','m1','z4']);
  assert.equal(countMahjongDora(tiles,indicators),5);
});

test('판과 부로 론 점수를 계산한다', () => {
  assert.equal(calculateRiichiScore({han:3,fu:40,dealer:false,winType:'ron'}).total,5200);
  assert.equal(calculateRiichiScore({han:3,fu:40,dealer:true,winType:'ron'}).total,7700);
});

test('만관 이상과 친 쯔모 지불액을 계산한다', () => {
  const mangan=calculateRiichiScore({han:5,fu:30,dealer:true,winType:'tsumo'});assert.equal(mangan.limitName,'만관');assert.deepEqual(mangan.payments,[4000,4000,4000]);assert.equal(mangan.total,12000);
  assert.equal(calculateRiichiScore({han:8,fu:30,dealer:false,winType:'ron'}).limitName,'배만');assert.equal(calculateRiichiScore({han:13,fu:30,dealer:false,winType:'ron'}).limitName,'삼배만');
});

test('실제 역만은 판수와 별도로 역만 점수를 계산한다', () => {
  const result=calculateRiichiScore({han:0,fu:0,dealer:true,winType:'ron',yakumanCount:1});assert.equal(result.limitName,'역만');assert.equal(result.total,48000);
});

test('대삼원과 자일색 및 청노두 역만을 판정한다', () => {
  const daisangen=hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m1','m1','m1','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:daisangen,winType:'ron'}).some((yaku)=>yaku.name==='대삼원'&&yaku.yakuman),true);
  const honours=hand(['z1','z1','z1','z2','z2','z2','z3','z3','z3','z5','z5','z5','z7','z7']);
  assert.equal(evaluateBasicRiichiYaku({concealed:honours,winType:'ron'}).some((yaku)=>yaku.name==='자일색'&&yaku.yakuman),true);
  const terminals=hand(['m1','m1','m1','m9','m9','m9','p1','p1','p1','s9','s9','s9','p9','p9']);
  assert.equal(evaluateBasicRiichiYaku({concealed:terminals,winType:'ron'}).some((yaku)=>yaku.name==='청노두'&&yaku.yakuman),true);
});

test('녹일색과 구련보등 및 사암각을 판정한다', () => {
  const green=hand(['s2','s2','s2','s3','s3','s3','s4','s4','s4','s6','s6','s6','z6','z6']);
  assert.equal(evaluateBasicRiichiYaku({concealed:green,winType:'ron'}).some((yaku)=>yaku.name==='녹일색'),true);
  const nineGates=hand(['m1','m1','m1','m2','m3','m4','m5','m5','m6','m7','m8','m9','m9','m9']);
  assert.equal(evaluateBasicRiichiYaku({concealed:nineGates,winType:'tsumo'}).some((yaku)=>yaku.name==='구련보등'),true);
  const concealedTriplets=hand(['m1','m1','m1','m2','m2','m2','p3','p3','p3','s4','s4','s4','z1','z1']);
  assert.equal(evaluateBasicRiichiYaku({concealed:concealedTriplets,winType:'tsumo'}).some((yaku)=>yaku.name==='사암각'),true);
});

test('컴퓨터도 역이 없는 공개 완성패로는 화료하지 않는다', () => {
  const concealed=hand(['m4','m5','m6','p2','p3','p4','s6','s7','z1','z1']);
  const openMeld=hand(['m1','m2','m3']);
  const result=playOneComputerTurn(concealed,hand(['s8']),()=>0,{openMeldCount:1,openMelds:[openMeld],requireYaku:true});
  assert.equal(result.win,false);
});

test('자풍패와 장풍패를 자리·판에 맞는 이름으로 판정한다', () => {
  // 남2국의 남가: 자풍 남(2), 장풍 남(2) → 더블 남 2판
  const south = hand(['z2','z2','z2','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']);
  const names = evaluateBasicRiichiYaku({ concealed: south, winType: 'ron', seatWind: 2, roundWind: 2 }).map((yaku) => yaku.name);
  assert.equal(names.includes('자풍패 남'), true);
  assert.equal(names.includes('장풍패 남'), true);

  // 같은 손을 동장 서가가 완성하면 남은 그냥 오타패라 역이 붙지 않습니다
  const none = evaluateBasicRiichiYaku({ concealed: south, winType: 'ron', seatWind: 3, roundWind: 1 }).map((yaku) => yaku.name);
  assert.equal(none.some((name) => name.startsWith('자풍패')), false);
  assert.equal(none.some((name) => name.startsWith('장풍패')), false);
});

test('북가가 북 커쯔를 모으면 자풍패 북으로 판정한다', () => {
  const north = hand(['z4','z4','z4','m2','m3','m4','p5','p6','p7','s3','s4','s5','p9','p9']);
  const names = evaluateBasicRiichiYaku({ concealed: north, winType: 'ron', seatWind: 4, roundWind: 1 }).map((yaku) => yaku.name);
  assert.equal(names.includes('자풍패 북'), true);
  assert.equal(names.includes('장풍패 북'), false);
});

test('같은 연속 몸통 두 쌍은 량페코로 판정하고 이페코와 겹치지 않는다', () => {
  const ryanpeiko = hand(['m2','m3','m4','m2','m3','m4','p6','p7','p8','p6','p7','p8','s5','s5']);
  const names = evaluateBasicRiichiYaku({ concealed: ryanpeiko, winType: 'ron' }).map((yaku) => yaku.name);
  assert.equal(names.includes('량페코'), true);
  assert.equal(names.includes('이페코'), false);

  const iipeiko = hand(['m2','m3','m4','m2','m3','m4','p6','p7','p8','s2','s3','s4','s5','s5']);
  const single = evaluateBasicRiichiYaku({ concealed: iipeiko, winType: 'ron' }).map((yaku) => yaku.name);
  assert.equal(single.includes('이페코'), true);
  assert.equal(single.includes('량페코'), false);
});

test('하이테이·호테이·영상개화·창깡·더블리치를 판정한다', () => {
  const tiles = hand(['m1','m2','m3','m4','m5','m6','p2','p3','p4','s6','s7','s8','p5','p5']);
  const winning = tiles.find((tile) => tile.suit === 's' && tile.value === 8)!;
  const names = (extra: Parameters<typeof evaluateBasicRiichiYaku>[0]) => evaluateBasicRiichiYaku(extra).map((yaku) => yaku.name);

  assert.equal(names({ concealed: tiles, winningTile: winning, winType: 'tsumo', lastTile: true }).includes('하이테이'), true);
  assert.equal(names({ concealed: tiles, winningTile: winning, winType: 'ron', lastTile: true }).includes('호테이'), true);
  assert.equal(names({ concealed: tiles, winningTile: winning, winType: 'tsumo', afterKan: true }).includes('영상개화'), true);
  assert.equal(names({ concealed: tiles, winningTile: winning, winType: 'ron', robbingKan: true }).includes('창깡'), true);

  const doubled = names({ concealed: tiles, winningTile: winning, winType: 'ron', riichi: true, doubleRiichi: true });
  assert.equal(doubled.includes('더블리치'), true);
  assert.equal(doubled.includes('리치'), false);
});

test('국사 13면과 순정구련보등을 더블 역만으로 판정한다', () => {
  const orphans = hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  const winning = orphans[orphans.length - 1];
  const thirteen = evaluateBasicRiichiYaku({ concealed: orphans, winType: 'ron', winningTile: winning });
  assert.equal(thirteen[0].name, '국사무쌍 13면');
  assert.equal(thirteen[0].yakumanMultiplier, 2);

  const gates = hand(['m1','m1','m1','m2','m3','m4','m5','m6','m7','m8','m9','m9','m9','m5']);
  const pure = evaluateBasicRiichiYaku({ concealed: gates, winType: 'tsumo', winningTile: gates[gates.length - 1] });
  assert.equal(pure[0].name, '순정구련보등');
  assert.equal(pure[0].yakumanMultiplier, 2);
});

test('샹퐁 론으로 완성한 커쯔는 암각으로 세지 않는다', () => {
  const tiles = hand(['m1','m1','m1','p9','p9','p9','s3','s3','s3','z2','z2','z2','z1','z1']);
  const shanpon = tiles.find((tile) => tile.suit === 'z' && tile.value === 2)!;
  const ron = evaluateBasicRiichiYaku({ concealed: tiles, winType: 'ron', winningTile: shanpon }).map((yaku) => yaku.name);
  assert.equal(ron.includes('사암각'), false);
  assert.equal(ron.includes('삼암각'), true);

  const tsumo = evaluateBasicRiichiYaku({ concealed: tiles, winType: 'tsumo', winningTile: shanpon });
  assert.equal(tsumo[0].name, '사암각');
});

test('사암각을 머리 단기로 론하면 더블 역만이다', () => {
  const tiles = hand(['m1','m1','m1','p9','p9','p9','s3','s3','s3','z2','z2','z2','z1','z1']);
  const tanki = tiles.find((tile) => tile.suit === 'z' && tile.value === 1)!;
  const result = evaluateBasicRiichiYaku({ concealed: tiles, winType: 'ron', winningTile: tanki });
  assert.equal(result[0].name, '사암각 단기');
  assert.equal(result[0].yakumanMultiplier, 2);
});

test('역만이 성립하면 일반 역과 섞이지 않는다', () => {
  const daisangen = hand(['z5','z5','z5','z6','z6','z6','z7','z7','z7','m2','m3','m4','p5','p5']);
  const result = evaluateBasicRiichiYaku({ concealed: daisangen, winType: 'ron' });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, '대삼원');
  assert.equal(result[0].yakuman, true);
});

test('자리 바람과 장 바람을 국 진행에 맞게 계산한다', () => {
  // 동1국(roundIndex 0): 좌석 0이 친 → 동, 좌석 1 남, 좌석 2 서, 좌석 3 북
  assert.deepEqual([0,1,2,3].map((seat) => seatWindFor(seat, 0)), [1,2,3,4]);
  // 동3국(roundIndex 2): 좌석 2가 친
  assert.deepEqual([0,1,2,3].map((seat) => seatWindFor(seat, 2)), [3,4,1,2]);
  assert.equal(roundWindFor(0), 1);
  assert.equal(roundWindFor(3), 1);
  assert.equal(roundWindFor(4), 2);
  assert.equal(roundWindFor(7), 2);
});

test('더블 역만은 역만 두 개 몫으로 계산한다', () => {
  const orphans = hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','z4','z5','z6','z7','z7']);
  const yaku = evaluateBasicRiichiYaku({ concealed: orphans, winType: 'ron', winningTile: orphans[orphans.length - 1] });
  assert.equal(countYakumanMultiplier(yaku), 2);
  const score = calculateRiichiScore({ han: 0, fu: 0, dealer: false, winType: 'ron', yakumanCount: countYakumanMultiplier(yaku) });
  assert.equal(score.total, 64000);
  assert.equal(score.limitName, '2배 역만');
});

test('손에 같은 패 네 장이 있으면 암깡할 수 있다', () => {
  const tiles = hand(['m5','m5','m5','m5','p2','p3','p4','s6','s7','s8','z1','z1','z1','p9']);
  const options = getAnkanOptions(tiles);
  assert.equal(options.length, 1);
  assert.equal(options[0].kind, 'ankan');
  assert.equal(options[0].tiles.length, 4);
  const applied = applyAnkan(tiles, options[0]);
  assert.equal(applied.hand.length, 10);
  assert.equal(applied.kan.length, 4);
});

test('퐁한 몸통과 같은 패를 들고 있으면 가깡할 수 있다', () => {
  const melds = [hand(['s3','s3','s3'])];
  const tiles = hand(['s3','m1','m2','m3','p4','p5','p6','z5','z5','z5','p8']);
  const options = getKakanOptions(tiles, melds);
  assert.equal(options.length, 1);
  assert.equal(options[0].kind, 'kakan');
  assert.equal(options[0].meldIndex, 0);
  const applied = applyKakan(tiles, melds, options[0]);
  assert.equal(applied.openMelds[0].length, 4);
  assert.equal(applied.hand.some((tile) => tile.suit === 's' && tile.value === 3), false);
});

test('리치 중에는 대기가 바뀌지 않는 암깡만 허용한다', () => {
  // m5 암각을 이미 갖춘 텐파이: m5를 깡해도 대기가 그대로
  const safe = hand(['m5','m5','m5','p2','p3','p4','s6','s7','s8','z1','z1','z1','p8']);
  const safeDraw = hand(['m5'])[0];
  assert.equal(ankanKeepsWait(safe, safeDraw), true);

  // m5가 연속패의 일부라 깡하면 대기가 무너지는 형태
  const unsafe = hand(['m3','m4','m5','m5','m5','p2','p3','p4','s6','s7','s8','z1','z1']);
  const unsafeDraw = hand(['m5'])[0];
  assert.equal(ankanKeepsWait(unsafe, unsafeDraw), false);
});

test('암깡은 멘젠을 유지하고 비공개 깡 부수를 준다', () => {
  const concealed = hand(['p2','p3','p4','s6','s7','s8','z1','z1','z1','p9','p9']);
  const kans = [hand(['m5','m5','m5','m5'])];
  const winning = concealed.find((tile) => tile.suit === 's' && tile.value === 8)!;

  const fu = calculateRiichiFu({ concealed, concealedKans: kans, winningTile: winning, winType: 'ron' });
  // 기본 20 + 멘젠 론 10 + 비공개 깡(숫자패) 16 + 비공개 커쯔 자패 8 = 54 → 60부
  assert.equal(fu?.fu, 60);
  assert.equal(fu?.pinfu, false);

  const yaku = evaluateBasicRiichiYaku({ concealed, concealedKans: kans, winType: 'tsumo', winningTile: winning, riichi: true });
  assert.equal(yaku.some((item) => item.name === '리치'), true);
  assert.equal(yaku.some((item) => item.name === '멘젠쯔모'), true);
});

test('암깡 네 개는 사깡쯔, 세 개는 삼깡쯔로 판정한다', () => {
  const three = hand(['p2','p3','p4','z1','z1']);
  const threeKans = [hand(['m5','m5','m5','m5']), hand(['s2','s2','s2','s2']), hand(['p7','p7','p7','p7'])];
  const yaku = evaluateBasicRiichiYaku({ concealed: three, concealedKans: threeKans, winType: 'tsumo', winningTile: three[0] });
  assert.equal(yaku.some((item) => item.name === '삼깡쯔'), true);

  const one = hand(['z1','z1']);
  const fourKans = [hand(['m5','m5','m5','m5']), hand(['s2','s2','s2','s2']), hand(['p7','p7','p7','p7']), hand(['m1','m1','m1','m1'])];
  const yakuman = evaluateBasicRiichiYaku({ concealed: one, concealedKans: fourKans, winType: 'tsumo', winningTile: one[0] });
  assert.equal(yakuman.some((item) => item.name === '사깡쯔' && item.yakuman), true);
});

test('왕패에서 도라와 뒷도라 표시패를 깡 수만큼 공개한다', () => {
  const deadWall = hand(['m1','m2','m3','m4','p1','p2','p3','p4','p5','p6','p7','p8','p9','s1']);
  assert.deepEqual(deadWallDoraIndicators(deadWall, 0).map((tile) => tile.glyph), ['p1']);
  assert.deepEqual(deadWallUraIndicators(deadWall, 0).map((tile) => tile.glyph), ['p2']);
  assert.deepEqual(deadWallDoraIndicators(deadWall, 2).map((tile) => tile.glyph), ['p1','p3','p5']);
  assert.deepEqual(deadWallUraIndicators(deadWall, 2).map((tile) => tile.glyph), ['p2','p4','p6']);
  // 깡은 최대 네 번, 표시패도 다섯 장에서 멈춥니다
  assert.equal(deadWallDoraIndicators(deadWall, 9).length, 5);
});

test('깡을 하면 영상패를 가져오고 왕패는 산의 마지막 패로 채운다', () => {
  const deadWall = hand(['m1','m2','m3','m4','p1','p2','p3','p4','p5','p6','p7','p8','p9','s1']);
  const wall = hand(['s5','s6','s7']);
  const myHand = hand(['z1','z1']);
  const result = drawReplacementTile(myHand, wall, deadWall, 0);
  assert.equal(result.drawn?.glyph, 'm1');
  assert.equal(result.hand.length, 3);
  assert.equal(result.wall.length, 2);
  assert.equal(result.deadWall.length, 14);
  assert.equal(result.deadWall[0].glyph, 's7');

  // 다섯 번째 깡은 불가
  assert.equal(drawReplacementTile(myHand, wall, deadWall, 4).drawn, null);
});

const matchState = (over: Partial<Parameters<typeof advanceRiichiMatch>[0]> = {}) => ({
  roundIndex: 0, honba: 0, riichiSticks: 0,
  scores: [25000, 25000, 25000, 25000] as [number, number, number, number],
  finished: false, ...over,
});

test('같은 패에 여러 명이 론하면 방총자에게 가까운 순서로 정렬한다', () => {
  // 좌석 1이 버렸을 때 좌석 3과 좌석 2가 론 → 2가 더 가깝다
  const both = resolveMultipleRon([3, 2], 1);
  assert.deepEqual(both.winners, [2, 3]);
  assert.equal(both.abortive, false);

  // 두절 규칙이면 가까운 한 명만 화료
  assert.deepEqual(resolveMultipleRon([3, 2], 1, { headBump: true }).winners, [2]);

  // 방총자 본인은 제외
  assert.deepEqual(resolveMultipleRon([1, 2], 1).winners, [2]);
});

test('세 명이 동시에 론하면 삼가화로 유국한다', () => {
  const triple = resolveMultipleRon([1, 2, 3], 0);
  assert.equal(triple.abortive, true);
  assert.equal(triple.reason, '삼가화');
  assert.deepEqual(triple.winners, []);

  // 두절 규칙을 쓰면 삼가화 대신 한 명만 화료시킬 수도 있습니다
  assert.deepEqual(resolveMultipleRon([1, 2, 3], 0, { tripleRonAbort: false, headBump: true }).winners, [1]);
});

test('더블 론은 각자 점수를 받고 리치봉·본장은 가까운 쪽이 가져간다', () => {
  const state = matchState({ roundIndex: 1, honba: 2, riichiSticks: 1 });
  const score = calculateRiichiScore({ han: 3, fu: 30, dealer: false, winType: 'ron' });
  const next = settleMultipleRon(state, { winners: [{ seat: 3, score }, { seat: 2, score }], discarderSeat: 1 });
  // 좌석 2가 더 가까우므로 본장 600점 + 리치봉 1000점을 추가로 받습니다
  assert.equal(next.scores[2], 25000 + score.total + 600 + 1000);
  assert.equal(next.scores[3], 25000 + score.total);
  assert.equal(next.scores[1], 25000 - (score.total + 600) - score.total);
  assert.equal(next.riichiSticks, 0);
});

test('구종구패는 첫 순번에 요구패 아홉 종류가 있어야 선언할 수 있다', () => {
  const nine = hand(['m1','m9','p1','p9','s1','s9','z1','z2','z3','m5','m6','p4','s4']);
  assert.equal(countNineTerminals(nine), 9);
  assert.equal(canDeclareNineTerminals(nine, true, false), true);
  // 이미 누군가 울었거나 첫 순번이 아니면 불가
  assert.equal(canDeclareNineTerminals(nine, true, true), false);
  assert.equal(canDeclareNineTerminals(nine, false, false), false);

  const eight = hand(['m1','m9','p1','p9','s1','s9','z1','z2','m5','m6','m7','p4','s4']);
  assert.equal(countNineTerminals(eight), 8);
  assert.equal(canDeclareNineTerminals(eight, true, false), false);
});

test('사풍연타·사가리치·사개깡을 도중유국으로 판정한다', () => {
  const sameWind = [0,1,2,3].map(() => hand(['z1']));
  assert.equal(isFourWindDiscardAbort(sameWind, false), true);
  assert.equal(isFourWindDiscardAbort(sameWind, true), false);
  // 삼원패는 사풍연타가 아닙니다
  assert.equal(isFourWindDiscardAbort([0,1,2,3].map(() => hand(['z5'])), false), false);
  // 한 명이라도 다른 바람을 버리면 성립하지 않습니다
  assert.equal(isFourWindDiscardAbort([hand(['z1']),hand(['z1']),hand(['z2']),hand(['z1'])], false), false);

  assert.equal(isFourRiichiAbort([true,true,true,true]), true);
  assert.equal(isFourRiichiAbort([true,true,true,false]), false);

  // 서로 다른 사람이 나눠서 네 번 깡하면 유국, 한 명이 네 번이면 사깡쯔라 계속
  assert.equal(isFourKanAbort([0,1,2,3]), true);
  assert.equal(isFourKanAbort([0,0,1,1]), true);
  assert.equal(isFourKanAbort([2,2,2,2]), false);
  assert.equal(isFourKanAbort([0,1,2]), false);
});

test('버린 패가 모두 1·9·자패이고 울리지 않았으면 유국만관이다', () => {
  const river = hand(['m1','p9','z1','z5','s9','m9']);
  assert.equal(isNagashiMangan(river, false), true);
  assert.equal(isNagashiMangan(river, true), false);
  assert.equal(isNagashiMangan(hand(['m1','p9','s5']), false), false);

  // 친이 유국만관이면 4,000점씩 올, 자면 4,000/2,000
  assert.deepEqual(nagashiManganPayments(0, 0), [12000, -4000, -4000, -4000]);
  assert.deepEqual(nagashiManganPayments(1, 0), [-4000, 8000, -2000, -2000]);
});

test('점수가 마이너스가 되면 들통으로 즉시 끝난다', () => {
  const state = matchState({ roundIndex: 1, scores: [25000, 25000, 25000, 25000] });
  const score = calculateRiichiScore({ han: 13, fu: 0, dealer: false, winType: 'ron', yakumanCount: 1 });
  const next = settleRiichiWin(state, { winner: 2, loser: 3, score, winType: 'ron' });
  assert.equal(next.scores[3] < 0, true);
  assert.equal(next.finished, true);
});

test('오라스가 끝나도 3만점이 없으면 서입으로 연장한다', () => {
  const state = matchState({ roundIndex: 7, scores: [26000, 25000, 25000, 24000] });
  const next = advanceRiichiMatch(state, { winner: 0 });
  assert.equal(next.roundIndex, 8);
  assert.equal(next.finished, false);
  assert.equal(riichiRoundLabel(next.roundIndex), '서1국');

  // 3만점을 넘긴 사람이 있으면 종료
  const decided = advanceRiichiMatch(matchState({ roundIndex: 7, scores: [31000, 25000, 24000, 20000] }), { winner: 1 });
  assert.equal(decided.finished, true);

  // 연장을 끄면 오라스에서 바로 끝납니다
  const noExtension = advanceRiichiMatch(state, { winner: 0 }, { extension: false });
  assert.equal(noExtension.finished, true);
});

test('오라스에서 친이 선두로 화료하면 연장하지 않고 끝낸다', () => {
  // 좌석 3이 친인 남4국(roundIndex 7)에서 친이 1위이고 3만점 이상
  const top = matchState({ roundIndex: 7, scores: [20000, 22000, 23000, 35000] });
  assert.equal(advanceRiichiMatch(top, { winner: 3 }).finished, true);

  // 친이 화료했지만 선두가 아니면 계속(연장)
  const behind = matchState({ roundIndex: 7, scores: [40000, 22000, 23000, 15000] });
  const continued = advanceRiichiMatch(behind, { winner: 3 });
  assert.equal(continued.finished, false);
  assert.equal(continued.roundIndex, 7);
  assert.equal(continued.honba, 1);
});

test('도중유국은 친을 유지하고 본장만 올린다', () => {
  const state = matchState({ roundIndex: 2, honba: 1 });
  const next = advanceRiichiMatch(state, { abortive: true });
  assert.equal(next.roundIndex, 2);
  assert.equal(next.honba, 2);
  assert.equal(next.finished, false);
});

test('현물은 완전 안전하고 4·5·6이 1·9보다 위험하다', () => {
  const river = hand(['m3','p1','s9','z1']);
  const context = { riichiRivers: [river] };
  // 현물
  assert.equal(tileDangerScore(hand(['m3'])[0], context), 0);
  // 리치자가 없으면 위험도 없음
  assert.equal(tileDangerScore(hand(['m5'])[0], {}), 0);
  // 가운데 패가 끝패보다 위험
  assert.equal(tileDangerScore(hand(['s5'])[0], context) > tileDangerScore(hand(['s1'])[0], context), true);
});

test('스지가 걸린 패는 같은 숫자라도 덜 위험하다', () => {
  const plain = { riichiRivers: [hand(['z1'])] };
  const suji = { riichiRivers: [hand(['z1','m2'])] };   // m2가 버려져 m5의 한쪽 양면이 배제
  const m5 = hand(['m5'])[0];
  assert.equal(tileDangerScore(m5, suji) < tileDangerScore(m5, plain), true);

  const bothSuji = { riichiRivers: [hand(['m2','m8'])] };  // 중스지
  assert.equal(tileDangerScore(m5, bothSuji) < tileDangerScore(m5, suji), true);
});

test('자패는 보이는 장수가 많을수록 안전하다', () => {
  const river = hand(['m3']);
  const west = hand(['z3'])[0];
  const few = tileDangerScore(west, { riichiRivers: [river], visibleTiles: hand(['z3']) });
  const many = tileDangerScore(west, { riichiRivers: [river], visibleTiles: hand(['z3','z3','z3']) });
  assert.equal(many < few, true);
});

test('여러 명이 리치하면 가장 위험한 쪽을 기준으로 삼는다', () => {
  const safeRiver = hand(['m5','z1']);           // m5 현물
  const dangerRiver = hand(['z1']);              // m5 생짜
  const m5 = hand(['m5'])[0];
  assert.equal(tileDangerScore(m5, { riichiRivers: [safeRiver] }), 0);
  assert.equal(tileDangerScore(m5, { riichiRivers: [safeRiver, dangerRiver] }) > 0, true);
});

test('전문가는 손이 멀면 현물로 내려간다', () => {
  // 완성과 거리가 먼 손, 상대 리치의 현물은 z1
  const myHand = hand(['m1','m4','m7','p2','p5','p8','s3','s6','s9','z1','z2','z4','z6','m9']);
  const river = hand(['z1','p3','s4']);
  const expert = chooseComputerDiscard(myHand, {
    level: 'expert', riichiRivers: [river], random: () => 0.5,
  });
  assert.equal(expert.suit === 'z' && expert.value === 1, true);

  // 초보는 안전패를 신경 쓰지 않습니다
  const beginner = chooseComputerDiscard(myHand, { level: 'beginner', riichiRivers: [river], random: () => 0 });
  assert.equal(typeof beginner.id, 'string');
});

test('리치자가 없으면 안전패가 아니라 손패 효율로 고른다', () => {
  // z7만 버리면 s5·s8 양면 텐파이, 다른 패를 버리면 텐파이가 깨집니다
  const myHand = hand(['m2','m3','m4','p5','p6','p7','s2','s3','s4','z1','z1','s6','s7','z7']);
  const choice = chooseComputerDiscard(myHand, { level: 'expert', random: () => 0.5 });
  assert.equal(choice.suit === 'z' && choice.value === 7, true);
});

test('대기패가 이미 다 보이면 리치하지 않는다', () => {
  const tenpai = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1','m5','m6']);
  const waits = getMahjongWaits(tenpai);
  assert.equal(waits.length > 0, true);
  // 대기패 네 장이 전부 보이는 상황
  const allSeen = waits.flatMap((wait) => [0,1,2,3].map((copy) => ({ ...wait, id: `${wait.suit}${wait.value}-seen${copy}` })));
  assert.equal(shouldComputerDeclareRiichi(tenpai, 'expert', 25000, true, { visibleTiles: [...tenpai, ...allSeen] }), false);
  // 대기패가 살아 있으면 리치
  assert.equal(shouldComputerDeclareRiichi(tenpai, 'expert', 25000, true, { visibleTiles: tenpai }), true);
});

test('산이 거의 없으면 얇은 대기로 리치하지 않는다', () => {
  const tenpai = hand(['m1','m2','m3','p4','p5','p6','s7','s8','s9','z1','z1','m5','m6']);
  assert.equal(shouldComputerDeclareRiichi(tenpai, 'expert', 25000, true, { wallRemaining: 2 }), false);
  assert.equal(shouldComputerDeclareRiichi(tenpai, 'expert', 25000, true, { wallRemaining: 40 }), true);
  // 1,000점이 없으면 리치할 수 없습니다
  assert.equal(shouldComputerDeclareRiichi(tenpai, 'expert', 900, true, { wallRemaining: 40 }), false);
});
