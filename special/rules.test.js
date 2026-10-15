import {test} from 'node:test';
import assert from 'node:assert/strict';
import {models,rounds,homeomorphic,Match} from './rules.js';
test('catalogue separates surfaces from curves even with similar silhouettes',()=>{
  assert.equal(homeomorphic('torus','circle'),false);
  assert.equal(homeomorphic('sphere','circle'),false);
  assert.equal(homeomorphic('circle','ellipse'),true);
  assert.equal(homeomorphic('segment','arc'),true);
  assert.equal(homeomorphic('circle','segment'),false);
  assert.equal(homeomorphic('sphere','egg'),true);
  assert.equal(homeomorphic('torus','ovalTorus'),true);
  assert.equal(homeomorphic('torus','sphere'),false);
});
test('classification is reflexive, symmetric and transitive on the entire catalogue',()=>{
  for(const a of Object.keys(models))for(const b of Object.keys(models)){
    assert.equal(homeomorphic(a,a),true);
    assert.equal(homeomorphic(a,b),homeomorphic(b,a));
    for(const c of Object.keys(models))if(homeomorphic(a,b)&&homeomorphic(b,c))assert.ok(homeomorphic(a,c));
  }
  assert.throws(()=>homeomorphic('missing','circle'));
  assert.throws(()=>homeomorphic('toString','circle'));
});
test('every round supports both correct and incorrect choices',()=>{
  for(const r of rounds){assert.ok(r.options.some(id=>homeomorphic(r.target,id)));assert.ok(r.options.some(id=>!homeomorphic(r.target,id)));}
});
test('exhaustive pair of choices and claims: only correct judges win and score',()=>{
  for(let round=0;round<rounds.length;round++)for(const a of rounds[round].options)for(const b of rounds[round].options)for(const ca of [true,false])for(const cb of [true,false]){
    const m=new Match();m.index=round;
    const expected=[homeomorphic(m.round.target,a)===ca,homeomorphic(m.round.target,b)===cb];
    const result=m.submit([a,b],[ca,cb]);
    assert.deepEqual(result.correct,expected);
    assert.deepEqual(result.winners,expected.flatMap((ok,i)=>ok?[i]:[]));
    assert.deepEqual(m.scores,expected.map(Number));
    assert.throws(()=>m.submit([a,b],[ca,cb]));
    assert.deepEqual(m.scores,expected.map(Number));
  }
});
test('correct rejection wins; incorrect possession never wins',()=>{
  const m=new Match();assert.deepEqual(m.submit(['sphere','ovalTorus'],[false,false]).winners,[0]);assert.deepEqual(m.scores,[1,0]);
});
test('invalid or incomplete submissions leave state unchanged',()=>{
  const m=new Match();
  for(const args of [[[],[]],[['torus','sphere'],[true,false]],[['sphere','sphere'],[null,true]],[null,null]]){
    assert.throws(()=>m.submit(...args));assert.equal(m.phase,'select');assert.deepEqual(m.scores,[0,0]);
  }
  assert.throws(()=>m.next());
});
test('all wrong yields no round winners and no champions; restart is isolated',()=>{
  const m=new Match();
  do{const r=m.round,ids=r.options.slice(0,2);assert.deepEqual(m.submit(ids,ids.map(id=>!homeomorphic(r.target,id))).winners,[]);}while(m.next());
  assert.equal(m.phase,'complete');assert.deepEqual(m.champions,[]);assert.deepEqual(m.scores,[0,0]);assert.throws(()=>m.next());
  assert.equal(new Match().index,0);assert.deepEqual(new Match().scores,[0,0]);
});
test('both right yields shared wins and a shared championship',()=>{
  const m=new Match();do{const r=m.round,ids=r.options.slice(0,2);assert.deepEqual(m.submit(ids,ids.map(id=>homeomorphic(r.target,id))).winners,[0,1]);}while(m.next());assert.deepEqual(m.champions,[0,1]);assert.deepEqual(m.scores,[4,4]);
});
test('a sole top scorer wins the championship',()=>{
  const m=new Match();do{const r=m.round,ids=r.options.slice(0,2);m.submit(ids,[homeomorphic(r.target,ids[0]),!homeomorphic(r.target,ids[1])]);}while(m.next());assert.deepEqual(m.champions,[0]);assert.deepEqual(m.scores,[4,0]);
});
