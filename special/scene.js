import * as T from '../three.module.js';
import {createCharacterRig} from '../character-rig.js';
import {models} from './rules.js';
import {combatFrame,FIGHT_DURATION} from './combat.js';

// The arena owns its renderer, poses, props and effects. Shared character and
// main-game modules stay untouched; combat overrides follow the normal rig tick.
export async function createArena(container,{onFrame=()=>{},onFinish=()=>{}}={}){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  container.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x101723);
  scene.fog=new T.Fog(0x101723,15,30);
  const camera=new T.PerspectiveCamera(36,1,.1,60);
  scene.add(new T.HemisphereLight(0xe8edff,0x35445b,2.5));
  const key=new T.DirectionalLight(0xffedd6,3.2);key.position.set(1,6,5);scene.add(key);
  const rim=new T.DirectionalLight(0x8ebeff,3);rim.position.set(-3,4,-3);scene.add(rim);
  const mesh=(geometry,color,parent=scene,opts={})=>{const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.6,metalness:.15,...opts}));parent.add(m);return m;};
  const floor=mesh(new T.CylinderGeometry(3.9,4.1,.34,8),0x263349);floor.position.y=-.22;
  const mat=mesh(new T.CylinderGeometry(3.8,3.8,.045,8),0x46576c);mat.position.y=-.025;
  for(const radius of [1.2,3.65]){const c=mesh(new T.TorusGeometry(radius,.016,6,80),0xc0a76b);c.rotation.x=Math.PI/2;c.position.y=.002;}
  for(let i=0;i<8;i++){
    const a=(i+.5)*Math.PI/4,b=(i+1.5)*Math.PI/4;
    const x=Math.cos(a)*3.72,z=Math.sin(a)*3.72;
    const post=mesh(new T.CylinderGeometry(.055,.07,1.55,10),i<4?0xffd164:0xf77673);post.position.set(x,.73,z);
    // Open sightline at the front; visible ropes around the rear of the ring.
    for(const y of [.4,.9,1.45]){
      const end=new T.Vector3(Math.cos(b)*3.72,y,Math.sin(b)*3.72);
      const rope=mesh(new T.TubeGeometry(new T.LineCurve3(new T.Vector3(x,y,z),end),1,.022,5,false),0xb8c7dd);
      rope.material.transparent=true;rope.material.opacity=z>0||end.z>0?.09:.65;
    }
  }
  const back=mesh(new T.CylinderGeometry(9,9,.3,48),0x182133);back.position.y=-.65;
  const crowd=new T.InstancedMesh(new T.CapsuleGeometry(.11,.25,2,6),new T.MeshStandardMaterial({color:0x7583a2,roughness:1}),60);
  const matrix=new T.Matrix4();for(let i=0;i<60;i++){const a=i*Math.PI/30,r=5.4+(i%3)*.5;matrix.makeTranslation(Math.cos(a)*r,.05+(i%3)*.16,Math.sin(a)*r);crowd.setMatrixAt(i,matrix);}scene.add(crowd);
  const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=200;
  const ctx=signCanvas.getContext('2d');ctx.fillStyle='#182234';ctx.fillRect(0,0,1024,200);ctx.textAlign='center';
  ctx.font='900 90px sans-serif';ctx.fillStyle='#f9cc69';ctx.fillText('FLEX  /  ARENA',512,109);
  ctx.font='500 24px sans-serif';ctx.fillStyle='#a0b1c9';ctx.fillText('TOPOLOGY CHAMPIONSHIP',512,159);
  const signTexture=new T.CanvasTexture(signCanvas);signTexture.colorSpace=T.SRGBColorSpace;
  const sign=new T.Mesh(new T.PlaneGeometry(4.9,.96),new T.MeshBasicMaterial({map:signTexture}));sign.position.set(0,2.6,-4);scene.add(sign);

  let observer,frame=0,stopped=false,rigs=[],mode='select',fightStart=0,won=false;
  let elapsed=0,last=performance.now(),orbit=0,hiddenAt=null;
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader=new T.TextureLoader();
  try{
    // Exactly the existing game portraits. No new face assets, crops or edits.
    const photos=await Promise.all(['../hood.png','../avatar-cat-head.png'].map(p=>loader.loadAsync(new URL(p,import.meta.url).href)));
    rigs=photos.map((texture,i)=>{
      texture.colorSpace=T.SRGBColorSpace;
      const rig=createCharacterRig(T,scene);rig.setCharacter(i===0?'hood':'cat',texture);rig.reset();
      rig.root.rotation.order='YXZ';
      for(const arm of rig.arms){
        const glove=mesh(new T.SphereGeometry(.135,14,10),i===0?0xe85560:0xffc44e,arm.elbow,{roughness:.42});
        glove.position.set(0,-.37,.018);glove.scale.set(1,1.1,1.1);
      }
      const held=new T.Group();scene.add(held);rig.held=held;
      const shadow=new T.Mesh(new T.CircleGeometry(.67,32),new T.MeshBasicMaterial({color:0x0c1220,transparent:true,opacity:.3,depthWrite:false}));
      shadow.rotation.x=-Math.PI/2;shadow.position.y=.004;scene.add(shadow);rig.shadow=shadow;
      return rig;
    });
  }catch(error){dispose();throw error;}
  // Reference appears above the centre of the ring; the opponent holds it too.
  const target=new T.Group();target.position.set(0,2.75,-1.2);scene.add(target);
  const effect=new T.Group();scene.add(effect);effect.visible=false;
  const burst=mesh(new T.TorusGeometry(.20,.025,6,40),0xffe8a5,effect,{emissive:0xffbd55,emissiveIntensity:2,transparent:true,depthWrite:false});
  const rays=[];
  for(let i=0;i<10;i++){const ray=mesh(new T.BoxGeometry(.055,.20,.035),0xffe6a2,effect,{emissive:0xffbb55,emissiveIntensity:1.5});ray.rotation.z=i*Math.PI/5;rays.push(ray);}
  const power=mesh(new T.TorusGeometry(.45,.018,6,48),0x8effdf,scene,{emissive:0x54efb9,emissiveIntensity:1.2,transparent:true,opacity:.7,depthWrite:false});power.visible=false;
  function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(m=>{m.geometry?.dispose();if(m.material)for(const material of Array.isArray(m.material)?m.material:[m.material])material.dispose();});}}
  function show(group,id,color){
    clear(group);if(!id)return;
    const kind=models[id].shape;let geometry;
    if(kind==='sphere'||kind==='egg')geometry=new T.SphereGeometry(.31,24,16);
    else if(kind==='torus'||kind==='ovalTorus')geometry=new T.TorusGeometry(.26,.105,12,40);
    else if(kind==='circle'||kind==='ellipse')geometry=new T.TorusGeometry(.30,.016,6,48);
    else{
      const curve=kind==='segment'?new T.LineCurve3(new T.Vector3(-.36,0,0),new T.Vector3(.36,0,0)):
        new T.QuadraticBezierCurve3(new T.Vector3(-.36,-.1,0),new T.Vector3(0,.48,0),new T.Vector3(.36,-.1,0));
      geometry=new T.TubeGeometry(curve,24,.016,6,false);
      for(const point of [curve.getPoint(0),curve.getPoint(1)]){const end=mesh(new T.SphereGeometry(.028,8,6),0xffffff,group);end.position.copy(point);}
    }
    const shape=mesh(geometry,color,group,{metalness:.25,roughness:.3,emissive:color,emissiveIntensity:.16});
    if(kind==='egg')shape.scale.set(.8,1.35,.8);
    if(kind==='ovalTorus'||kind==='ellipse')shape.scale.x=1.4;
  }
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  observer=new ResizeObserver(resize);observer.observe(container);resize();
  function pose(rig,i,p,dt){
    const direction=i===0?1:-1;
    rig.root.position.x=p.x;rig.root.position.z=i===0?.10:-.10;
    const yaw=direction*1.34;
    rig.root.rotation.set(0,yaw,0);
    rig.tick({dt,time:elapsed,moving:p.moving,targetAngle:yaw,cameraPosition:camera.position,celebrating:motion&&p.cheer>.2});
    rig.root.rotation.x=-p.lean+p.recoil*.16+p.defeat*.17;
    if(p.cheer<.2){
      rig.arms.forEach((arm,j)=>{
        const strike=j===p.arm?p.punch:0;
        arm.shoulder.rotation.set(-.55-strike*.96+p.defeat*.7,0,arm.side*(.17+strike*.02));
        arm.elbow.rotation.set(-1.42+strike*1.34+p.defeat*.9,0,0);
      });
    }
    // Original face and clothing remain in the same hierarchy during every pose.
    rig.root.updateMatrixWorld(true);
    rig.arms[0].elbow.localToWorld(rig.held.position.set(0,-.41,.17));
    rig.held.quaternion.copy(camera.quaternion);rig.held.scale.setScalar(mode==='select'?.82:.64);
    rig.shadow.position.x=p.x;rig.shadow.position.z=rig.root.position.z;
    rig.shadow.scale.setScalar(1-rig.root.position.y*.3);
  }
  function animate(now){
    if(stopped)return;
    const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
    const battle=mode==='fighting'?combatFrame((now-fightStart)/1000,won):mode==='result'?combatFrame(FIGHT_DURATION,won):null;
    const active=!!battle;
    const radius=(active?8.1:9.4)+(camera.aspect<1.15?1.2:0);
    const angle=orbit+(motion?Math.sin(elapsed*.2)*.025:0);
    camera.position.set(Math.sin(angle)*radius,3.5,Math.cos(angle)*radius);camera.lookAt(0,1.12,0);
    // Small impact jolt, not a flash/strobe. Disabled by reduced-motion setting.
    if(motion&&battle?.impact){camera.position.x+=Math.sin(battle.impact.progress*15)*.045*(1-battle.impact.progress);camera.lookAt(0,1.12,0);}
    rigs.forEach((rig,i)=>pose(rig,i,battle?.poses[i]||{x:i===0?-1.8:1.8,punch:0,arm:0,lean:0,recoil:0,defeat:0,cheer:0,moving:false},dt));
    target.rotation.y=motion?Math.sin(elapsed*.35)*.25:0;target.scale.setScalar(active?.72:1);
    effect.visible=!!battle?.impact;
    if(effect.visible){
      const {attacker,progress,final}=battle.impact;
      rigs[attacker].arms[battle.poses[attacker].arm].elbow.localToWorld(effect.position.set(0,-.43,.03));
      effect.quaternion.copy(camera.quaternion);effect.scale.setScalar((final?1.6:1)*(.65+progress*1.5));
      burst.material.opacity=1-progress;
      rays.forEach((ray,i)=>{const a=i*Math.PI/5;ray.position.set(Math.sin(a)*(.26+progress*.22),Math.cos(a)*(.26+progress*.22),0);ray.scale.y=1-progress;});
    }
    power.visible=!!battle&&battle.charge>.01;
    if(power.visible){power.position.copy(rigs[battle.winner].held.position);power.quaternion.copy(camera.quaternion);power.scale.setScalar(.5+battle.charge);}
    renderer.render(scene,camera);
    if(battle&&mode==='fighting'){
      onFrame(battle);
      if(battle.done){mode='result';onFinish();}
    }
    frame=requestAnimationFrame(animate);
  }
  function visibility(){
    if(document.hidden)hiddenAt=performance.now();
    else if(hiddenAt!==null){if(mode==='fighting')fightStart+=performance.now()-hiddenAt;hiddenAt=null;last=performance.now();}
  }
  document.addEventListener('visibilitychange',visibility);
  frame=requestAnimationFrame(animate);
  function dispose(){
    stopped=true;cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener('visibilitychange',visibility);
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(m=>{if(m.geometry)geometries.add(m.geometry);if(m.material)for(const material of Array.isArray(m.material)?m.material:[m.material]){materials.add(material);if(material.map)textures.add(material.map);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();
  }
  return {
    setRound(round){mode='select';show(target,round.target,0x89e5dd);rigs.forEach(r=>r.reset());clear(rigs[0].held);show(rigs[1].held,round.target,0xffd171);effect.visible=false;},
    select(id){show(rigs[0].held,id,0xffb5b5);},
    fight(result){won=result.won;fightStart=performance.now();mode='fighting';},
    setMotion(value){motion=value;},get motion(){return motion;},
    changeView(){orbit=orbit===0?.22:0;},dispose
  };
}
