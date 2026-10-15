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
test('every selectable object wins exactly when it is homeomorphic',()=>{
  for(let index=0;index<rounds.length;index++)for(const id of rounds[index].options){
    const m=new Match();m.index=index;
    const result=m.submit(id),won=homeomorphic(m.round.target,id);
    assert.equal(result.won,won);assert.equal(result.winner,won?0:1);
    assert.equal(m.phase,'fighting');assert.deepEqual(m.scores,[0,0]);
    assert.throws(()=>m.submit(id));assert.throws(()=>m.next());
    m.finish();assert.deepEqual(m.scores,won?[1,0]:[0,1]);
    assert.throws(()=>m.finish());assert.throws(()=>m.submit(id));
  }
});
test('a non-homeomorphic object always loses, with no correct-rejection option',()=>{
  const m=new Match();assert.equal(m.submit('sphere',false).won,false);m.finish();assert.deepEqual(m.scores,[0,1]);
});
test('invalid and incomplete choices leave state unchanged',()=>{
  const m=new Match();
  for(const id of [null,undefined,'missing','torus',[],true,'toString']){
    assert.throws(()=>m.submit(id));assert.equal(m.phase,'select');assert.deepEqual(m.scores,[0,0]);
  }
  assert.throws(()=>m.finish());assert.throws(()=>m.next());
});
test('four wins and four losses produce exact totals; new matches reset cleanly',()=>{
  for(const win of [true,false]){
    const m=new Match();do{m.submit(m.round.options.find(id=>homeomorphic(m.round.target,id)===win));m.finish();}while(m.next());
    assert.equal(m.phase,'complete');assert.deepEqual(m.scores,win?[4,0]:[0,4]);assert.throws(()=>m.next());assert.throws(()=>m.submit('arc'));
  }
  const fresh=new Match();assert.equal(fresh.phase,'select');assert.equal(fresh.index,0);assert.deepEqual(fresh.scores,[0,0]);
});

import {combatFrame,FIGHT_DURATION} from './combat.js';
test('both fighters approach, throw distinct strikes and take damage',()=>{
  assert.ok(Math.abs(combatFrame(1.55,true).poses[0].x)<Math.abs(combatFrame(0,true).poses[0].x));
  for(const [t,attacker] of [[2.05,0],[2.95,1],[3.8,0],[4.5,1]]){
    const frame=combatFrame(t,true);assert.equal(frame.poses[attacker].punch,1);
    assert.equal(frame.impact.attacker,attacker);assert.ok(frame.health[1-attacker]<100);
    assert.ok(combatFrame(t+.09,true).poses[1-attacker].recoil>.9);
  }
});
test('winning and losing choices reverse the finisher, defeat pose and health',()=>{
  for(const won of [true,false]){
    const winner=won?0:1,loser=1-winner;
    assert.equal(combatFrame(5.65,won).impact.attacker,winner);
    const final=combatFrame(FIGHT_DURATION,won);
    assert.equal(final.health[loser],0);assert.ok(final.health[winner]>0);
    assert.equal(final.poses[loser].defeat,1);assert.equal(final.poses[winner].cheer,1);assert.equal(final.done,true);
  }
});
test('fight timeline remains finite and bounded at all frames and after completion',()=>{
  for(const won of [true,false])for(let t=0;t<=12;t+=1/60){
    const f=combatFrame(t,won);for(const p of f.poses){assert.ok(Number.isFinite(p.x));assert.ok(Math.abs(p.x)<2.2);assert.ok(p.punch>=0&&p.punch<=1);}
    assert.ok(f.health.every(h=>h>=0&&h<=100));assert.equal(f.done,t>=FIGHT_DURATION);
  }
});
