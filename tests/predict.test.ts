import test from 'node:test';import assert from 'node:assert/strict';
import {isUsablePredictQuestion,pickPredictQuestion,predictChance,predictFavourite,predictGroupOf,predictHouseReturn,predictMaxProbability,predictMinProbability,predictMultiplier,predictPercent,settlePredict,type PredictQuestion} from '../src/predict.ts';
import {predictGeneratedAt,predictQuestions} from '../src/predictdata.ts';

const seeded=(seed:number)=>{let value=seed;return()=>{value=(value*1103515245+12345)%2147483648;return value/2147483648;};};
const ask=(over:Partial<PredictQuestion>={}):PredictQuestion=>({
  id:'TEST-1',bucket:'어제',category:'Sports',title:'A가 이겼을까?',sourceTitle:'A wins',
  yesLabel:'A',noLabel:'B',closeTime:'2026-08-27T12:00:00Z',result:'yes',probability:0.6,volume:10000,...over,
});

test('배당은 시장이 본 확률의 역수에서 나온다',()=>{
  const question=ask({probability:0.6});
  assert.equal(predictMultiplier(question,'yes'),Number((predictHouseReturn/0.6).toFixed(2)));
  assert.equal(predictMultiplier(question,'no'),Number((predictHouseReturn/0.4).toFixed(2)));
  // 어렵게 본 쪽이 배당이 큽니다.
  assert.ok(predictMultiplier(question,'no')>predictMultiplier(question,'yes'));
});

test('어느 쪽에 걸어도 환급률이 같다',()=>{
  for(const probability of [0.05,0.2,0.5,0.75,0.95]){
    const question=ask({probability});
    const yes=predictChance(question,'yes')*predictMultiplier(question,'yes');
    const no=predictChance(question,'no')*predictMultiplier(question,'no');
    assert.ok(Math.abs(yes-predictHouseReturn)<0.01,`예 ${yes}`);
    assert.ok(Math.abs(no-predictHouseReturn)<0.01,`아니오 ${no}`);
  }
});

test('환급률은 100%를 넘지 않는다',()=>{
  assert.ok(predictHouseReturn>0.9&&predictHouseReturn<1);
});

test('맞히면 배당을 주고 틀리면 0이다',()=>{
  const question=ask({probability:0.3,result:'no'});
  assert.equal(settlePredict(question,'no').won,true);
  assert.equal(settlePredict(question,'no').multiplier,predictMultiplier(question,'no'));
  assert.equal(settlePredict(question,'yes').won,false);
  assert.equal(settlePredict(question,'yes').multiplier,0);
});

test('확률이 0인 쪽에는 걸 수 없다',()=>{
  assert.throws(()=>predictMultiplier(ask({probability:1}),'no'),/확률이 0/);
});

test('스포츠와 사회문제로 갈린다',()=>{
  assert.equal(predictGroupOf(ask({category:'Sports'})),'스포츠');
  for(const category of ['Politics','Elections','Economics','Entertainment','World']){
    assert.equal(predictGroupOf(ask({category})),'사회문제');
  }
});

test('시장이 유력하게 본 쪽과 백분율을 알려준다',()=>{
  assert.equal(predictFavourite(ask({probability:0.61})),'yes');
  assert.equal(predictFavourite(ask({probability:0.24})),'no');
  assert.equal(predictPercent(ask({probability:0.61}),'yes'),61);
  assert.equal(predictPercent(ask({probability:0.61}),'no'),39);
});

test('답이 뻔하거나 비어 있는 문제는 쓰지 않는다',()=>{
  assert.equal(isUsablePredictQuestion(ask()),true);
  assert.equal(isUsablePredictQuestion(ask({probability:0.005})),false);
  assert.equal(isUsablePredictQuestion(ask({probability:0.999})),false);
  assert.equal(isUsablePredictQuestion(ask({title:'   '})),false);
});

test('이미 푼 문제는 건너뛰고, 다 풀면 처음부터 다시 낸다',()=>{
  const pool=[ask({id:'A'}),ask({id:'B'}),ask({id:'C'})];
  const random=seeded(7);
  const first=pickPredictQuestion(pool,'스포츠',['A','B'],random);
  assert.equal(first?.id,'C');
  const again=pickPredictQuestion(pool,'스포츠',['A','B','C'],random);
  assert.ok(again&&['A','B','C'].includes(again.id));
  assert.equal(pickPredictQuestion(pool,'사회문제',[],random),null);
});

test('받아 둔 문제 파일이 쓸 만하다',()=>{
  assert.ok(predictQuestions.length>=20,`문제 ${predictQuestions.length}개`);
  assert.ok(Date.parse(predictGeneratedAt)>0);
  for(const question of predictQuestions){
    assert.ok(isUsablePredictQuestion(question),`못 쓰는 문제 ${question.id} (${question.probability})`);
    assert.ok(question.probability>=predictMinProbability&&question.probability<=predictMaxProbability);
    assert.ok(question.result==='yes'||question.result==='no');
    assert.ok(Date.parse(question.closeTime)>0,`시각이 이상함 ${question.closeTime}`);
  }
  assert.equal(new Set(predictQuestions.map(item=>item.id)).size,predictQuestions.length,'같은 문제가 두 번 들어갔습니다');
});

test('스포츠와 사회문제가 둘 다 들어 있다',()=>{
  const sports=predictQuestions.filter(item=>predictGroupOf(item)==='스포츠');
  const social=predictQuestions.filter(item=>predictGroupOf(item)==='사회문제');
  assert.ok(sports.length>=5,`스포츠 ${sports.length}개`);
  assert.ok(social.length>=5,`사회문제 ${social.length}개`);
});

test('실제 문제로도 배당이 터무니없지 않다',()=>{
  for(const question of predictQuestions){
    for(const side of ['yes','no'] as const){
      const multiplier=predictMultiplier(question,side);
      assert.ok(multiplier>1&&multiplier<=predictHouseReturn/predictMinProbability+0.01,`${question.id} ${side} ${multiplier}배`);
    }
  }
});
