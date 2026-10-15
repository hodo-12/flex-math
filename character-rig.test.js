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

// Clothing regression checks use the real geometry, including maximum sway/jump.
for(const [id,color] of Object.entries({hood:0xc82f4b,smile:0x4c82cf,cat:0xf1bd36,cap:0xe77da7})){
 test(`${id}: dress selection, seam attachment, hem clearance and bounded cloth motion`,()=>{
  const rig=createCharacterRig(T,new T.Scene()),photo=new T.Texture();rig.setCharacter(id,photo);rig.reset();
  const dress=rig.princessDress,world=new T.Vector3();
  assert.equal(dress.materials.satin.color.getHex(),color);
  assert.equal(Object.values(dress.skirts).filter(g=>g.visible).length,1);
  assert.equal(dress.bodice.parent,rig.head.parent);
  let minHem=Infinity,maxMovement=0;
  for(let frame=0;frame<300;frame++){
   const moving=frame<150,turn=frame<70?0:Math.PI*.7,jumping=frame>=180&&frame<280;
   if(moving){rig.root.position.x+=Math.sin(turn)*1.4/60;rig.root.position.z+=Math.cos(turn)*1.4/60;}
   rig.tick({dt:1/60,time:frame/60,moving,targetAngle:turn,cameraPosition,celebrating:jumping});
   assert.equal(rig.face.material.map,photo);
   dress.skirts[id].traverse(m=>{
    if(m.name!=='dress-cloth')return;
    const p=m.geometry.attributes.position,b=m.userData.base;
    for(let i=0;i<p.count;i+=8){
     const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
     assert([x,y,z].every(Number.isFinite));
     const movement=Math.hypot(x-b[i*3],y-b[i*3+1],z-b[i*3+2]);maxMovement=Math.max(maxMovement,movement);
     if(Math.abs(b[i*3+1]+.17)<.00001)assert(movement<.00001,'Waist seam must stay fixed');
     world.set(x,y,z).applyMatrix4(m.matrixWorld);minHem=Math.min(minHem,world.y);
    }
   });
  }
  assert(minHem>.025,`dress penetrates ground: ${minHem}`);
  assert(maxMovement>.005&&maxMovement<.07,`bounded cloth motion: ${maxMovement}`);
  rig.reset();rig.setCharacter('hood',photo);assert.equal(dress.style,'hood');
  console.log(`${id}: hem min ${minHem.toFixed(3)}, fabric displacement max ${maxMovement.toFixed(3)}`);
 });
}
