import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from './three.module.js';
import {createCharacterRig} from './character-rig.js';
const cameraPosition=new T.Vector3(4,6,10);
for(const id of ['hood','smile','cat','cap']){
 test(`${id}: shared hierarchy, fixed face texture, finite joints, grounded stance and recovery`,()=>{
  const rig=createCharacterRig(T,new T.Scene()),tx=new T.Texture();
  rig.setCharacter(id,tx);rig.reset();
  let time=0,drift=0,count=0;
  for(let i=0;i<600;i++){
   const moving=i>=60&&i<350,angle=i<200?0:.7;
   if(moving){rig.root.position.x+=Math.sin(angle)*1.4/60;rig.root.position.z+=Math.cos(angle)*1.4/60;}
   const celebrating=i>=450&&i<570;
   rig.tick({dt:1/60,time:time+=1/60,moving,targetAngle:angle,cameraPosition,celebrating});
   assert.equal(rig.face.material.map,tx);assert.equal(rig.face.visible,true);
   assert.equal(rig.arms[0].shoulder.parent,rig.head.parent);
   assert.equal(rig.legs[0].hip.parent,rig.head.parent.parent);
   rig.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),o.name));
   for(const leg of rig.legs){
    const ankle=leg.foot.getWorldPosition(new T.Vector3());
    assert.ok(ankle.y>.04,`foot penetrated ground: ${ankle.y}`);
    if(leg.planted&&moving){drift=Math.max(drift,ankle.distanceTo(leg.anchor));count++;}
   }
  }
  assert.ok(count>30);assert.ok(drift<.025,`stance target error ${drift}`);
  assert.equal(rig.root.position.y,.02);
  console.log(`${id}: maximum planted ankle error ${drift.toFixed(5)}`);
 });
}
test('frame stalls and reset never lose the face or jump pose',()=>{
 const r=createCharacterRig(T,new T.Scene());r.setCharacter('hood',new T.Texture());r.reset();
 for(const dt of [0,1/120,1/30,.5])r.tick({dt,time:1,moving:false,cameraPosition,celebrating:true});
 r.reset();r.tick({dt:1/60,time:0,moving:false,cameraPosition,celebrating:false});
 assert.equal(r.root.position.y,.02);assert.equal(r.face.scale.x,.78);
});
