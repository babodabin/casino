import test from 'node:test';import assert from 'node:assert/strict';
import {arrangeChinesePoker,chineseMaxUnits,chineseMultiplier,chineseTableMultiplier,dealChinesePoker,dealChinesePokerTable,resolveChinesePokerTable,evaluateChineseArrangement,evaluateThree,isValidChineseLayout,resolveChinesePoker,type ChineseLayout} from '../src/chinesepoker.ts';
import {createDeck,type Card} from '../src/blackjack.ts';
import {compareHands,evaluateFive} from '../src/texasholdem.ts';

const deck=createDeck();
const card=(id:string):Card=>{const found=deck.find(item=>item.id===id);if(!found)throw new Error(`없는 카드 ${id}`);return found;};
const hand=(...ids:string[]):Card[]=>ids.map(card);
const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};

const combos=<T,>(items:T[],pick:number):T[][]=>{const out:T[][]=[];const walk=(start:number,left:number,acc:T[])=>{if(!left){out.push(acc);return;}for(let index=start;index<=items.length-left;index+=1)walk(index+1,left-1,[...acc,items[index]]);};walk(0,pick,[]);return out;};
/** 비교용 기준선: 뒷줄에 가장 센 다섯 장, 남은 여덟 장에서 다시 가장 센 다섯 장을 가운뎃줄에 두는 방식입니다. */
const greedyLayout=(cards:Card[]):ChineseLayout=>{
  const back=combos(cards,5).map(five=>({five,rank:evaluateFive(five)})).sort((a,b)=>compareHands(b.rank,a.rank))[0].five;
  const rest=cards.filter(item=>!back.includes(item));
  const middle=combos(rest,5).map(five=>({five,rank:evaluateFive(five)})).sort((a,b)=>compareHands(b.rank,a.rank))[0].five;
  return {back,middle,front:rest.filter(item=>!middle.includes(item))};
};

test('앞줄 세 장은 트리플·원 페어·하이 카드만 센다',()=>{
  assert.equal(evaluateThree(hand('♠-5','♥-5','♦-5')).category,3);
  assert.equal(evaluateThree(hand('♠-K','♥-K','♦-4')).category,1);
  // 세 장으로는 스트레이트와 플러시를 세지 않는 것이 규칙입니다.
  assert.equal(evaluateThree(hand('♠-5','♥-4','♦-3')).category,0);
  assert.equal(evaluateThree(hand('♠-K','♠-9','♠-4')).category,0);
});

test('앞줄은 세 장이 아니면 받지 않는다',()=>{
  assert.throws(()=>evaluateThree(hand('♠-5','♥-5')),/세 장/);
});

test('뒷줄이 가운뎃줄보다 약하면 파울이다',()=>{
  const foul=evaluateChineseArrangement({
    back:hand('♠-2','♥-3','♦-5','♣-7','♠-9'),          // 하이 카드
    middle:hand('♠-A','♥-A','♦-K','♣-K','♠-4'),        // 투 페어
    front:hand('♦-2','♣-3','♥-6'),
  });
  assert.equal(foul.foul,true);
  const clean=evaluateChineseArrangement({
    back:hand('♠-A','♥-A','♦-K','♣-K','♠-4'),
    middle:hand('♠-2','♥-3','♦-5','♣-7','♠-9'),
    front:hand('♦-2','♣-3','♥-6'),
  });
  assert.equal(clean.foul,false);
});

test('가운뎃줄이 앞줄보다 약하면 파울이다',()=>{
  const result=evaluateChineseArrangement({
    back:hand('♠-A','♥-A','♦-A','♣-A','♠-4'),
    middle:hand('♠-2','♥-3','♦-5','♣-7','♠-9'),        // 하이 카드
    front:hand('♦-K','♣-K','♥-K'),                      // 트리플
  });
  assert.equal(result.foul,true);
});

test('같은 카드를 두 줄에 놓을 수 없다',()=>{
  assert.throws(()=>evaluateChineseArrangement({
    back:hand('♠-A','♥-A','♦-K','♣-K','♠-4'),
    middle:hand('♠-A','♥-3','♦-5','♣-7','♠-9'),
    front:hand('♦-2','♣-3','♥-6'),
  }),/두 줄/);
});

test('열세 장씩 겹치지 않게 나눠준다',()=>{
  const {player,opponent}=dealChinesePoker(seeded(3));
  assert.equal(player.length,13);
  assert.equal(opponent.length,13);
  assert.equal(new Set([...player,...opponent].map(item=>item.id)).size,26);
});

test('자동 배치는 언제나 파울이 나오지 않는다',()=>{
  const random=seeded(7);
  for(let round=0;round<20;round+=1){
    const {player,opponent}=dealChinesePoker(random);
    for(const cards of [player,opponent]){
      const layout=arrangeChinesePoker(cards);
      assert.equal(layout.front.length,3);
      assert.equal(layout.middle.length,5);
      assert.equal(layout.back.length,5);
      assert.equal(new Set([...layout.front,...layout.middle,...layout.back].map(item=>item.id)).size,13);
      assert.ok(isValidChineseLayout(layout));
    }
  }
});

test('자동 배치는 뒷줄만 챙기는 배치보다 낫다',()=>{
  const random=seeded(41);
  let units=0,wins=0,losses=0;
  for(let round=0;round<60;round+=1){
    const {player,opponent}=dealChinesePoker(random);
    const mine=evaluateChineseArrangement(arrangeChinesePoker(player));
    const theirs=evaluateChineseArrangement(greedyLayout(opponent));
    const result=resolveChinesePoker(mine,theirs);
    units+=result.units;
    if(result.units>0)wins+=1;else if(result.units<0)losses+=1;
  }
  assert.ok(units>0,`누적 ${units}`);
  assert.ok(wins>losses,`승 ${wins} 패 ${losses}`);
});

test('세 줄을 모두 이기면 스쿱이라 두 배가 된다',()=>{
  const strong=evaluateChineseArrangement({
    back:hand('♠-A','♥-A','♦-A','♣-A','♠-4'),
    middle:hand('♠-K','♥-K','♦-K','♣-Q','♠-Q'),
    front:hand('♦-J','♣-J','♥-9'),
  });
  const weak=evaluateChineseArrangement({
    back:hand('♠-2','♥-3','♦-5','♣-7','♠-9'),
    middle:hand('♠-6','♥-8','♦-10','♣-J','♠-3'),
    front:hand('♦-2','♣-4','♥-6'),
  });
  const result=resolveChinesePoker(strong,weak);
  assert.equal(result.rows.filter(row=>row.outcome==='win').length,3);
  assert.equal(result.scoop,'player');
  assert.equal(result.units,chineseMaxUnits);
  assert.equal(result.multiplier,2);

  const flipped=resolveChinesePoker(weak,strong);
  assert.equal(flipped.scoop,'opponent');
  assert.equal(flipped.units,-chineseMaxUnits);
  assert.equal(flipped.multiplier,0);
});

test('한 줄만 이기고 두 줄을 지면 베팅금이 줄어든다',()=>{
  const mine=evaluateChineseArrangement({
    back:hand('♥-K','♦-K','♣-K','♥-Q','♦-Q'),      // 풀하우스
    middle:hand('♦-A','♣-A','♠-K','♠-Q','♠-J'),    // 원 페어 A
    front:hand('♠-A','♥-A','♣-6'),                  // 원 페어 A
  });
  const theirs=evaluateChineseArrangement({
    back:hand('♠-2','♥-2','♦-2','♣-2','♠-3'),      // 포카드 — 풀하우스를 이깁니다
    middle:hand('♠-10','♥-10','♦-9','♣-9','♠-4'),  // 투 페어 — 원 페어를 이깁니다
    front:hand('♥-3','♦-4','♣-7'),                  // 하이 카드 — 앞줄만 내줍니다
  });
  assert.equal(mine.foul,false);
  assert.equal(theirs.foul,false);
  const result=resolveChinesePoker(mine,theirs);
  assert.deepEqual(result.rows.map(row=>row.outcome),['win','loss','loss']);
  assert.equal(result.units,-1);
  assert.equal(Number(result.multiplier.toFixed(4)),Number((1-1/6).toFixed(4)));
});

test('파울이면 줄 비교 없이 세 줄을 모두 내준다',()=>{
  const fouled=evaluateChineseArrangement({
    back:hand('♠-2','♥-3','♦-5','♣-7','♠-9'),
    middle:hand('♠-A','♥-A','♦-K','♣-K','♠-4'),
    front:hand('♦-2','♣-3','♥-6'),
  });
  const clean=evaluateChineseArrangement({
    back:hand('♠-Q','♥-Q','♦-J','♣-J','♠-8'),
    middle:hand('♥-10','♦-10','♣-6','♠-6','♥-2'),
    front:hand('♦-4','♣-7','♥-K'),
  });
  assert.equal(fouled.foul,true);
  const result=resolveChinesePoker(fouled,clean);
  assert.equal(result.playerFoul,true);
  assert.equal(result.units,-chineseMaxUnits);
  assert.equal(result.scoop,'opponent');
  assert.ok(result.rows.every(row=>row.outcome==='loss'));

  const other=resolveChinesePoker(clean,fouled);
  assert.equal(other.opponentFoul,true);
  assert.equal(other.units,chineseMaxUnits);
  assert.equal(other.multiplier,2);
});

test('둘 다 파울이면 무승부라 베팅금을 돌려받는다',()=>{
  const layout:ChineseLayout={
    back:hand('♠-2','♥-3','♦-5','♣-7','♠-9'),
    middle:hand('♠-A','♥-A','♦-K','♣-K','♠-4'),
    front:hand('♦-2','♣-3','♥-6'),
  };
  const fouled=evaluateChineseArrangement(layout);
  const result=resolveChinesePoker(fouled,fouled);
  assert.equal(result.units,0);
  assert.equal(result.scoop,null);
  assert.equal(result.multiplier,1);
});

test('배당은 0배와 2배 사이를 벗어나지 않는다',()=>{
  for(let units=-12;units<=12;units+=1){
    const multiplier=chineseMultiplier(units);
    assert.ok(multiplier>=0&&multiplier<=2,`${units} → ${multiplier}`);
  }
  assert.equal(chineseMultiplier(0),1);
});

test('실제로 여러 판 돌려도 배당이 범위를 벗어나지 않는다',()=>{
  const random=seeded(97);
  for(let round=0;round<15;round+=1){
    const {player,opponent}=dealChinesePoker(random);
    const result=resolveChinesePoker(
      evaluateChineseArrangement(arrangeChinesePoker(player)),
      evaluateChineseArrangement(arrangeChinesePoker(opponent)),
    );
    assert.ok(result.multiplier>=0&&result.multiplier<=2);
    assert.ok(Math.abs(result.units)<=chineseMaxUnits);
  }
});

test('여러 명이면 몫을 열세 장씩 나누고 카드가 겹치지 않는다', () => {
  for (const players of [2, 3, 4]) {
    const hands = dealChinesePokerTable(players);
    assert.equal(hands.length, players);
    hands.forEach((hand) => assert.equal(hand.length, 13));
    const ids = new Set(hands.flat().map((card) => card.id));
    assert.equal(ids.size, players * 13);
  }
});

test('다섯 명은 카드가 모자라 받지 않는다', () => {
  assert.throws(() => dealChinesePokerTable(5), /두 명에서 네 명까지/);
  assert.throws(() => dealChinesePokerTable(1), /두 명에서 네 명까지/);
});

test('상대마다 따로 겨루고 값을 다 더한다', () => {
  const hands = dealChinesePokerTable(4, seeded(11));
  const arranged = hands.map((hand) => evaluateChineseArrangement(arrangeChinesePoker(hand)));
  const table = resolveChinesePokerTable(arranged[0], arranged.slice(1));
  assert.equal(table.perSeat.length, 3);
  assert.deepEqual(table.perSeat.map((seat) => seat.seat), [1, 2, 3]);
  assert.equal(table.maxUnits, chineseMaxUnits * 3);
  assert.equal(table.units, table.perSeat.reduce((sum, seat) => sum + seat.units, 0));
  // 상대 한 명씩 따로 본 값과 같아야 합니다.
  table.perSeat.forEach((seat, index) => assert.equal(seat.units, resolveChinesePoker(arranged[0], arranged[index + 1]).units));
});

test('사람이 몇 명이든 모두에게 세 줄을 다 이기면 두 배다', () => {
  for (const opponents of [1, 2, 3]) {
    assert.equal(chineseTableMultiplier(chineseMaxUnits * opponents, chineseMaxUnits * opponents), 2);
    assert.equal(chineseTableMultiplier(-chineseMaxUnits * opponents, chineseMaxUnits * opponents), 0);
    assert.equal(chineseTableMultiplier(0, chineseMaxUnits * opponents), 1);
  }
});

test('한 명만 상대하면 1대1 배당과 똑같다', () => {
  const hands = dealChinesePokerTable(2, seeded(7));
  const mine = evaluateChineseArrangement(arrangeChinesePoker(hands[0]));
  const theirs = evaluateChineseArrangement(arrangeChinesePoker(hands[1]));
  const one = resolveChinesePoker(mine, theirs);
  const table = resolveChinesePokerTable(mine, [theirs]);
  assert.equal(table.multiplier, one.multiplier);
  assert.equal(table.units, one.units);
});
