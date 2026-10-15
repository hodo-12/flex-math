import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../three.module.js';
import {createCharacterRig} from '../character-rig.js';
import {Match,rounds,homeomorphic} from '../special/rules.js';
import {danceFrame,DANCE_DURATION} from './choreography.js';
import {poseDancer,resetDancer} from './dance-rig.js';
const gitHash=data=>createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
test('existing runtime, SPECIAL ROUND and all original photos retain exact bytes',()=>{
  const baseline=JSON.parse(readFileSync(new URL('./baseline.json',import.meta.url),'utf8'));
  for(const [file,sha] of Object.entries(baseline))assert.equal(gitHash(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
});
test('lobby adds exactly one bonus entrance to the previously deployed page',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const link='<a id="bonusEntry" class="library-entry" href="bonus/index.html">♫ BONUS ROUND · 위상동형 비보잉 배틀 ↗</a>';
  assert.equal(html.split(link).length,2);
  const kart='<a id="kartEntry" class="library-entry" href="kart/index.html">♛ PRINCESS KART · 공주 카트라이더 ↗</a>';
  assert.equal(html.split(kart).length,2);
  assert.equal(gitHash(Buffer.from(html.replace(link,'').replace(kart,''))),'c344aad6d4d9fc84abcff6fb7f679ef0aba83d2f');
});
test('every offered choice drives the matching dance winner and one score',()=>{
  for(let index=0;index<rounds.length;index++)for(const id of rounds[index].options){
    const m=new Match();m.index=index;const r=m.submit(id);const f=danceFrame(DANCE_DURATION,r.won);
    const expected=homeomorphic(m.round.target,id)?0:1;
    assert.equal(f.winner,expected);assert.equal(f.flow[expected],100);assert.equal(f.poses[expected].cheer,1);assert.equal(f.poses[1-expected].defeat,1);
    m.finish();assert.equal(m.scores[expected],1);assert.throws(()=>m.finish());
  }
});
test('both characters perform solos and the correct winner performs the finale',()=>{
  assert.equal(danceFrame(1.3,true).active,0);assert.equal(danceFrame(4.5,true).active,1);
  assert.equal(danceFrame(2.9,true).move,'ONE-HAND FREEZE');assert.equal(danceFrame(6.2,true).move,'ONE-HAND FREEZE');
  for(const won of [true,false]){const f=danceFrame(8.5,won);assert.equal(f.active,won?0:1);assert.equal(f.move,'POWER SPIN');assert.ok(f.poses[f.winner].spin>Math.PI);}
  assert.equal(danceFrame(12.3,true).done,false);assert.equal(danceFrame(12.4,true).done,true);
});
for(const [i,id] of ['hood','cat'].entries())test(`${id}: planted supporting hand, floor clearance, attached original portrait, finite poses`,()=>{
  const r=createCharacterRig(T,new T.Scene()),photo=new T.Texture();r.setCharacter(id,photo);resetDancer(r);r.userDataSide=i===0?1:-1;
  const point=new T.Vector3(),cameraPosition=new T.Vector3(0,4.1,9.8);let minHem=Infinity,framesOnHand=0;
  for(const won of [true,false])for(let t=0;t<13;t+=1/24){
    const p=danceFrame(t,won).poses[i];poseDancer(r,p,{dt:1/24,time:t,cameraPosition});
    assert.equal(r.face.material.map,photo);assert.equal(r.face.visible,true);assert.equal(r.face.parent,r.head);assert.ok(r.root.matrixWorld.elements.every(Number.isFinite));
    assert.ok(Math.abs(r.root.position.x)<3.8&&Math.abs(r.root.position.z)<3.8);
    if(p.floor>.999){r.arms[i===0?0:1].glove.getWorldPosition(point);assert.ok(Math.abs(point.y-.115)<.004);assert.ok(Math.abs(point.x-p.x)<.004);assert.ok(Math.abs(point.z-p.z)<.004);framesOnHand++;}
    r.princessDress.skirts[id].traverse(m=>{if(m.name!=='dress-cloth')return;const a=m.geometry.attributes.position;for(let j=0;j<a.count;j+=16){point.fromBufferAttribute(a,j).applyMatrix4(m.matrixWorld);minHem=Math.min(minHem,point.y);}});
  }
  assert.ok(framesOnHand>25);assert.ok(minHem>.005,`cloth crossed floor: ${minHem}`);
  resetDancer(r);assert.equal(r.face.material.rotation,0);assert.equal(r.princessDress.skirts[id].scale.y,1);assert.equal(r.princessDress.skirts[id].position.y,0);
  console.log(id, 'minimum dancing hem height',minHem.toFixed(4));
});
test('reduced-motion dancer keeps a readable static victory pose and no spin',()=>{
  const r=createCharacterRig(T,new T.Scene());r.setCharacter('hood',new T.Texture());resetDancer(r);r.userDataSide=1;
  const options={dt:1/60,time:8.5,cameraPosition:new T.Vector3(0,4,10),motion:false};
  poseDancer(r,danceFrame(8.5,true).poses[0],options);assert.equal(r.root.rotation.y,0);
  poseDancer(r,danceFrame(12,true).poses[0],options);assert.ok(r.arms[1].shoulder.rotation.z>2);assert.ok(r.root.position.y<.1);
});
