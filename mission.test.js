import {test} from 'node:test';import assert from 'node:assert/strict';import {Mission,objects} from './state.js';
test('exactly three distinct targets complete the mission',()=>{const m=new Mission();const targets=objects.filter(o=>o.correct);assert.equal(targets.length,3);assert.equal(m.answer(targets[0].id,true).complete,false);assert.equal(m.answer(targets[0].id,true).duplicate,true);assert.equal(m.found.size,1);assert.equal(m.answer(targets[1].id,true).complete,false);assert.equal(m.answer(targets[2].id,true).complete,true);});
test('wrong positive and wrong negative never collect; correct rejection never completes',()=>{const m=new Mission();for(const o of objects){assert.equal(m.answer(o.id,!o.correct).right,false);}assert.equal(m.found.size,0);for(const o of objects.filter(o=>!o.correct)){assert.equal(m.answer(o.id,false).right,true);}assert.equal(m.found.size,0);assert.equal(m.answer('cup',true).collected,true);});
test('restart clears progress',()=>{const m=new Mission();m.answer('cup',true);const fresh=new Mission();assert.equal(fresh.found.size,0);assert.equal(fresh.attempts,0);});

import {levels,forestObjects} from './state.js';
test('forest level finds exactly three sphere-like objects',()=>{assert.equal(forestObjects.filter(x=>x.correct).length,3);const m=new Mission(2);for(const o of forestObjects.filter(x=>!x.correct))assert.equal(m.answer(o.id,true).collected,false);const targets=forestObjects.filter(x=>x.correct);targets.forEach((o,i)=>assert.equal(m.answer(o.id,true).complete,i===2));assert.equal(m.found.size,3);});
test('level state never leaks across missions',()=>{const first=new Mission(1);const second=new Mission(2);first.answer('cup',true);assert.equal(second.found.size,0);assert.throws(()=>second.answer('cup',true));});

import {oceanObjects} from './state.js';
test('level three underwater ruins has exactly three distinct genus-two targets',()=>{
  const correct=oceanObjects.filter(o=>o.correct),incorrect=oceanObjects.filter(o=>!o.correct);
  assert.equal(correct.length,3);
  assert.equal(incorrect.length,5);
  assert.equal(new Set(oceanObjects.map(o=>o.id)).size,oceanObjects.length);
  const mission=new Mission(3);
  for(const o of incorrect){
    const result=mission.answer(o.id,true);
    assert.equal(result.right,false);
    assert.equal(result.collected,false);
    assert.equal(mission.found.size,0);
  }
  for(let i=0;i<correct.length;i++){
    const result=mission.answer(correct[i].id,true);
    assert.equal(result.right,true);
    assert.equal(result.collected,true);
    assert.equal(result.complete,i===2);
  }
  assert.equal(mission.answer(correct[0].id,true).duplicate,true);
  assert.equal(mission.found.size,3);
});
test('underwater non-targets can be correctly rejected but are never collected',()=>{
  const mission=new Mission(3);
  for(const o of oceanObjects.filter(x=>!x.correct)){
    const res=mission.answer(o.id,false);
    assert.equal(res.right,true);
    assert.equal(res.collected,false);
  }
  assert.equal(mission.found.size,0);
  assert.equal(mission.answer('ruinSlab',false).right,false);
  assert.equal(mission.found.size,0);
});
test('level three progress does not affect existing levels or a new playthrough',()=>{
  const ocean=new Mission(3);
  ocean.answer('twinGate',true);
  assert.equal(ocean.found.size,1);
  assert.equal(new Mission(3).found.size,0);
  assert.equal(new Mission(2).found.size,0);
  assert.equal(new Mission(1).found.size,0);
  assert.throws(()=>new Mission(1).answer('twinGate',true),/Unknown object/);
});
