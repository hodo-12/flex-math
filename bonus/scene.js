import * as T from '../three.module.js';
import {createCharacterRig} from '../character-rig.js';
import {models} from '../special/rules.js';
import {danceFrame,DANCE_DURATION} from './choreography.js';
import {poseDancer,resetDancer} from './dance-rig.js';

export async function createDanceStage(container,{onFrame=()=>{},onFinish=()=>{}}={}){
  const renderer=new T.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  container.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x111526);scene.fog=new T.Fog(0x111526,15,28);
  const camera=new T.PerspectiveCamera(36,1,.1,50);
  scene.add(new T.HemisphereLight(0xe3dcff,0x434b69,2.8));
  const key=new T.DirectionalLight(0xfff3dd,3);key.position.set(0,7,5);scene.add(key);
  const rim=new T.DirectionalLight(0xb1a6ff,2.7);rim.position.set(-3,4,-3);scene.add(rim);
  const mesh=(geo,color,parent=scene,opts={})=>{const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.5,metalness:.1,...opts}));parent.add(m);return m;};
  const floor=mesh(new T.CylinderGeometry(3.8,3.95,.26,64),0x28344d);floor.position.y=-.15;
  const danceFloor=mesh(new T.CircleGeometry(3.65,64),0x45516a);danceFloor.rotation.x=-Math.PI/2;danceFloor.position.y=-.012;
  const glow=[];
  for(const [radius,color] of [[3.68,0xab95ff],[3.48,0x7486a4],[1.15,0xb9efcf]]){
    const ring=mesh(new T.TorusGeometry(radius,.023,6,90),color,scene,{emissive:color,emissiveIntensity:.7});ring.rotation.x=Math.PI/2;ring.position.y=.006;glow.push(ring);
  }
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;const points=[new T.Vector3(Math.sin(a)*1.2,.001,Math.cos(a)*1.2),new T.Vector3(Math.sin(a)*3.4,.001,Math.cos(a)*3.4)];
    mesh(new T.TubeGeometry(new T.LineCurve3(...points),1,.006,4,false),0x72829a);
  }
  // Decorative speakers and a backdrop frame; this is a dance floor, not a cage.
  for(const side of [-1,1]){
    const speaker=mesh(new T.BoxGeometry(.8,1.65,.52),0x1c2134);speaker.position.set(side*3.55,.65,-2.2);speaker.rotation.y=-side*.2;
    for(const y of [-.37,.35]){const driver=mesh(new T.CylinderGeometry(.23,.23,.03,32),0x303950,speaker);driver.rotation.x=Math.PI/2;driver.position.set(0,y,.28);const inner=mesh(new T.SphereGeometry(.10,12,8),0x8494b8,speaker);inner.scale.z=.2;inner.position.set(0,y,.30);}
    const bar=mesh(new T.BoxGeometry(.055,3.6,.055),side<0?0xf48caa:0xffdc83,scene,{emissive:side<0?0xf48caa:0xffdc83,emissiveIntensity:.9});bar.position.set(side*3.7,1.7,-3.25);
  }
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#151b30';ctx.fillRect(0,0,1024,256);ctx.textAlign='center';ctx.font='900 95px sans-serif';ctx.fillStyle='#d3c6ff';ctx.fillText('BREAK / THE SHAPE',512,130);ctx.font='500 24px sans-serif';ctx.fillStyle='#a7b9cc';ctx.fillText('FLEX MATH     /     BONUS CYPHER',512,186);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(5.4,1.35),new T.MeshBasicMaterial({map:texture}));sign.position.set(0,2.6,-3.9);scene.add(sign);
  const audience=new T.InstancedMesh(new T.CapsuleGeometry(.10,.25,2,6),new T.MeshStandardMaterial({color:0x8892b8,roughness:1}),42);
  const mat=new T.Matrix4();for(let i=0;i<42;i++){const a=Math.PI*.15+i/41*Math.PI*1.7;mat.makeTranslation(Math.cos(a)*5.3,.02+(i%3)*.1,Math.sin(a)*5.3-1.4);audience.setMatrixAt(i,mat);}scene.add(audience);
  const darkFloor=mesh(new T.CylinderGeometry(9,9,.2,48),0x161d30);darkFloor.position.y=-.45;
  for(const side of [-1,1]){const plinth=mesh(new T.CylinderGeometry(.33,.38,.50,24),0x263049);plinth.position.set(side*2.85,.22,.30);const rim=mesh(new T.TorusGeometry(.31,.014,6,40),side<0?0xfb9fb3:0xffda80,scene,{emissive:side<0?0xfb9fb3:0xffda80,emissiveIntensity:.5});rim.rotation.x=Math.PI/2;rim.position.set(side*2.85,.48,.30);}
  let rigs=[],stopped=false,frame=0,observer,mode='select',start=0,won=false;
  let elapsed=0,last=performance.now(),hiddenAt=null,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader=new T.TextureLoader();
  try{
    const photos=await Promise.all(['../hood.png','../avatar-cat-head.png'].map(p=>loader.loadAsync(new URL(p,import.meta.url).href)));
    rigs=photos.map((photo,i)=>{
      photo.colorSpace=T.SRGBColorSpace;
      const rig=createCharacterRig(T,scene);rig.setCharacter(i===0?'hood':'cat',photo);resetDancer(rig);rig.userDataSide=i===0?1:-1;
      rig.prop=new T.Group();scene.add(rig.prop);
      rig.shadow=new T.Mesh(new T.CircleGeometry(.65,32),new T.MeshBasicMaterial({color:0x0c1425,transparent:true,opacity:.34,depthWrite:false}));rig.shadow.rotation.x=-Math.PI/2;rig.shadow.position.y=.012;scene.add(rig.shadow);
      return rig;
    });
  }catch(error){dispose();throw error;}
  const trail=mesh(new T.TorusGeometry(.8,.025,8,70),0xb4f1dd,scene,{emissive:0xa7ffe0,emissiveIntensity:1,transparent:true,opacity:.6});trail.rotation.x=-Math.PI/2;trail.position.y=.025;trail.visible=false;
  function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});}}
  function show(group,id,color){
    clear(group);if(!id)return;const kind=models[id].shape;let geometry;
    if(kind==='sphere'||kind==='egg')geometry=new T.SphereGeometry(.29,24,16);
    else if(kind==='torus'||kind==='ovalTorus')geometry=new T.TorusGeometry(.25,.10,12,40);
    else if(kind==='circle'||kind==='ellipse')geometry=new T.TorusGeometry(.29,.016,6,48);
    else{
      const curve=kind==='segment'?new T.LineCurve3(new T.Vector3(-.34,0,0),new T.Vector3(.34,0,0)):new T.QuadraticBezierCurve3(new T.Vector3(-.34,-.10,0),new T.Vector3(0,.45,0),new T.Vector3(.34,-.1,0));
      geometry=new T.TubeGeometry(curve,24,.016,6,false);
      for(const p of [curve.getPoint(0),curve.getPoint(1)]){const end=mesh(new T.SphereGeometry(.025,8,6),0xffffff,group);end.position.copy(p);}
    }
    const shape=mesh(geometry,color,group,{roughness:.3,emissive:color,emissiveIntensity:.15});
    if(kind==='egg')shape.scale.set(.8,1.35,.8);if(kind==='ovalTorus'||kind==='ellipse')shape.scale.x=1.4;
  }
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  observer=new ResizeObserver(resize);observer.observe(container);resize();
  function render(now){
    if(stopped)return;
    const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
    const state=mode==='dance'?danceFrame((now-start)/1000,won):mode==='result'?danceFrame(DANCE_DURATION,won):null;
    const radius=camera.aspect<1.15?11.5:9.8;
    const angle=motion?Math.sin(elapsed*.12)*.035:0;
    camera.position.set(Math.sin(angle)*radius,4.1,Math.cos(angle)*radius);camera.lookAt(0,1.05,0);
    rigs.forEach((rig,i)=>{
      const p=state?.poses[i]||{x:i===0?-1.65:1.65,z:0,active:.12,floor:0,spin:0,freeze:0,cheer:0,defeat:0,beat:elapsed*2+i*Math.PI};
      poseDancer(rig,p,{dt,time:elapsed,cameraPosition:camera.position,motion});
      if(mode==='select')rig.arms[1].elbow.localToWorld(rig.prop.position.set(0,-.38,.12));
      else rig.prop.position.set(i===0?-2.85:2.85,.89,.30);
      rig.prop.quaternion.copy(camera.quaternion);rig.prop.scale.setScalar(.8);
      rig.shadow.position.set(p.x,.012,p.z);rig.shadow.scale.set(1+p.floor*.35,1,1);
    });
    trail.visible=!!state&&state.stage==='finale';
    if(trail.visible){trail.position.set(state.poses[state.winner].x,.025,state.poses[state.winner].z);trail.scale.setScalar(1+state.poses[state.winner].floor*.7);}
    glow[0].material.emissiveIntensity=motion?.65+Math.sin(elapsed*2)*.12:.65;
    renderer.render(scene,camera);
    if(state&&mode==='dance'){onFrame(state);if(state.done){mode='result';onFinish();}}
    frame=requestAnimationFrame(render);
  }
  function visibility(){if(document.hidden)hiddenAt=performance.now();else if(hiddenAt!==null){if(mode==='dance')start+=performance.now()-hiddenAt;last=performance.now();hiddenAt=null;}}
  document.addEventListener('visibilitychange',visibility);frame=requestAnimationFrame(render);
  function dispose(){
    stopped=true;cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener('visibilitychange',visibility);
    const geos=new Set(),mats=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)textures.add(m.map);}});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();
  }
  return {
    setRound(round){mode='select';rigs.forEach(resetDancer);clear(rigs[0].prop);show(rigs[1].prop,round.target,0xffdc85);},
    select(id){show(rigs[0].prop,id,0xffa9c1);},
    start(result){won=result.won;start=performance.now();mode='dance';},
    setMotion(value){motion=value;},get motion(){return motion;},dispose
  };
}
