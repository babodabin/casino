import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMahjongCall, calculateNotenPayments, calculateRiichiFu, calculateRiichiScore, canRonMahjong, chooseComputerDiscard, countMahjongDora, createMahjongTiles, dealRiichi, doraFromIndicator, evaluateBasicRiichiYaku, getMahjongCallOptions, getMahjongWaits, getRiichiDiscardOptions, getStandardMahjongDecompositions, isMahjongFuriten, isSevenPairsHand, isThirteenOrphansHand, isWinningMahjongHand, type MahjongTile } from '../src/riichimahjong.ts';

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

test('14장에서 어떤 패를 버리면 리치인지 찾는다', () => {
  const ready = hand(['m1','m1','m1','m2','m3','p2','p3','p4','s7','s8','s9','z1','z1','z2']);
  const choices = getRiichiDiscardOptions(ready);
  assert.equal(choices.some((choice) => choice.tile.suit === 'z' && choice.tile.value === 2), true);
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
