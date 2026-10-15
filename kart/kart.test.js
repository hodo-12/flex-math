import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../three.module.js';
import {RACERS} from './racers.js';
import {Race,trackPoint,TRACK_LENGTH,TRACK} from './race.js';
import {createVehicle} from './vehicles.js';
import {createDriver} from './driver.js';
const hash=data=>createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
const read=path=>readFileSync(new URL(path,import.meta.url));
const run=(race,seconds,dt=1/60)=>{for(let t=0;t<seconds-1e-8;t+=dt)race.advance(dt);};
test('existing runtime, all five original files and exact one-link lobby addition',()=>{
  const baseline=JSON.parse(read('./baseline.json'));
  for(const [file,sha] of Object.entries(baseline))assert.equal(hash(read('../'+file)),sha,file);
  assert.equal(hash(read('./assets/green-face.png')),'9466d967b982d4c7208f99db001cc0276fac9c13');
  const html=read('../index.html').toString(),link='<a id="kartEntry" class="library-entry" href="kart/index.html">♛ PRINCESS KART · 공주 카트라이더 ↗</a>';
  assert.equal(html.split(link).length,2);assert.equal(hash(Buffer.from(html.replace(link,''))),'4c31dc563504ea9aa56841ff41dee6665f7d128f');
});
test('countdown starts everyone together; pause, cooldown, reset and invalid input are safe',()=>{
  const r=new Race(RACERS);assert.equal(r.boost('ruby'),false);assert.equal(r.start(),true);assert.equal(r.start(),false);run(r,2.5);assert.ok(r.racers.every(r=>r.distance===0));
  r.togglePause();const time=r.time;run(r,1);assert.equal(r.time,time);r.togglePause();run(r,.6);assert.equal(r.phase,'racing');assert.ok(r.racers.every(r=>r.distance>0));
  assert.equal(r.boost('unknown'),false);assert.equal(r.boost('clover'),true);assert.equal(r.boost('clover'),false);run(r,7.1);assert.equal(r.boost('clover'),true);
  r.advance(NaN);r.advance(-1);r.reset();assert.equal(r.phase,'ready');assert.deepEqual(r.stats,{collisions:0,overtakes:0});assert.ok(r.racers.every(r=>r.distance===0&&r.boostReady===0));
});
test('closed track is continuous across laps and keeps every lane on the road',()=>{
  for(const lane of [-1.9,0,1.9]){
    const a=trackPoint(0,lane),b=trackPoint(TRACK_LENGTH,lane),c=trackPoint(TRACK_LENGTH-.001,lane);
    assert.deepEqual(a,b);assert.ok(Math.hypot(a.x-c.x,a.z-c.z)<.002);
    for(let d=0;d<TRACK_LENGTH;d+=.1){const p=trackPoint(d,lane);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.x)<TRACK.rx+TRACK.halfWidth&&Math.abs(p.z)<TRACK.rz+TRACK.halfWidth);}
  }
});
test('nearby karts exchange impulses, separate and trigger paired reactions',()=>{
  const r=new Race(RACERS.slice(0,2));r.phase='racing';r.raceTime=2;r.racers.forEach((p,i)=>{p.distance=5+i*.1;p.lane=i*.2;p.speed=2;});
  r.step(1/60);const [a,b]=r.racers;assert.equal(r.stats.collisions,1);assert.ok(a.velocity<0&&b.velocity>0);assert.ok(Math.abs(a.lane-b.lane)>=1.01);assert.ok(a.bump>0&&b.bump>0);assert.ok(a.reactionUntil>r.raceTime&&b.reactionUntil>r.raceTime);
});
test('seeded races overtake, collide and finish every entrant with deterministic ranks',()=>{
  const winners=new Set();
  for(let seed=1;seed<=8;seed++){
    const r=new Race(RACERS,{seed});r.start();run(r,60);
    assert.equal(r.phase,'finished');assert.equal(new Set(r.finishOrder).size,5);assert.ok(r.stats.collisions>0&&r.stats.overtakes>0);assert.ok(r.raceTime<50);winners.add(r.finishOrder[0]);
    r.order.forEach((p,i)=>{assert.equal(p.rank,i+1);assert.ok(p.finished&&p.finishTime>0);assert.ok(Math.abs(p.lane)<=1.9);assert.ok(Number.isFinite(p.speed));if(i)assert.ok(p.finishTime>=r.order[i-1].finishTime);});
    assert.equal(r.boost('ruby'),false);
  }
  assert.ok(winners.size>=3,'No permanently scripted winner');
  const fine=new Race(RACERS,{seed:42}),coarse=new Race(RACERS,{seed:42});fine.start();coarse.start();run(fine,55);run(coarse,55,.5);assert.deepEqual(fine.finishOrder,coarse.finishOrder);assert.deepEqual(fine.stats,coarse.stats);
});
test('field size and custom ids extend without a four/five racer dependency',()=>{
  for(const count of [4,5,6]){const config=Array.from({length:count},(_,i)=>({...RACERS[i%5],id:'friend-'+i}));const r=new Race(config);r.start();run(r,60);assert.equal(r.finishOrder.length,count);assert.equal(r.phase,'finished');}
  assert.throws(()=>new Race([RACERS[0],RACERS[0]]));
});
for(const c of RACERS)test(`${c.id}: seated princess keeps original face, connected hierarchy and dress above the chassis`,()=>{
  const vehicle=createVehicle(T,c),scene=new T.Scene();scene.add(vehicle.root);const texture=new T.Texture(),d=createDriver(T,vehicle.seatRoot,c,texture);let minHem=Infinity;const point=new T.Vector3();
  for(let i=0;i<60;i++){
    const state={index:0,rank:i%5+1,speed:2,distance:i*.15,lean:Math.sin(i),bump:i%10===0?1:0,boost:0,finished:i>40};
    vehicle.root.position.set(Math.sin(i)*5,0,Math.cos(i)*3);vehicle.root.rotation.y=i*.2;
    vehicle.animate(state,i/12,true);d.pose(state,{time:i/12,winner:i%2===0,finished:state.finished});scene.updateMatrixWorld(true);
    assert.equal(d.rig.face.material.map,texture);assert.equal(d.rig.face.parent,d.rig.head);assert.equal(d.rig.face.visible,true);assert.equal(d.rig.face.material.depthTest,false);assert.ok(d.rig.head.matrixWorld.elements.every(Number.isFinite));
    d.rig.princessDress.skirts[c.profile].traverse(m=>{if(m.name==='dress-cloth'){const a=m.geometry.attributes.position;for(let j=0;j<a.count;j+=32){point.fromBufferAttribute(a,j).applyMatrix4(m.matrixWorld);minHem=Math.min(minHem,point.y);}}});
  }
  assert.ok(minHem>.35,`${c.id} hem clips chassis/floor: ${minHem}`);
  if(c.palette)assert.equal(d.rig.princessDress.materials.satin.color.getHex(),c.palette.color);
});
