import * as T from '../three.module.js';
import {createCharacterRig} from '../character-rig.js';
import {models} from './rules.js';

// Separate renderer and scene: no dependency on app.js or existing level state.
export async function createArena(container){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  let observer,frame=0,stopped=false;
  container.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x111827);
  scene.fog=new T.Fog(0x111827,13,32);
  const camera=new T.PerspectiveCamera(37,1,.1,60);
  scene.add(new T.HemisphereLight(0xffeed3,0x4a5980,2.6));
  const key=new T.DirectionalLight(0xffe2af,3);key.position.set(2,7,5);scene.add(key);
  const rim=new T.DirectionalLight(0x86abff,2);rim.position.set(-4,3,-3);scene.add(rim);
  const mesh=(geometry,color,parent=scene)=>{const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.55,metalness:.15}));parent.add(m);return m;};
  const floor=mesh(new T.CylinderGeometry(4.4,4.6,.32,8),0x34415d);floor.position.y=-.2;
  const mat=mesh(new T.CylinderGeometry(4.15,4.15,.04,8),0x748195);mat.position.y=-.02;
  const crest=mesh(new T.TorusGeometry(1.3,.018,8,80),0xd5bd86);crest.rotation.x=Math.PI/2;crest.position.y=.02;
  // Octagonal cage silhouette with broad open viewing lanes.
  for(let i=0;i<8;i++){
    const a=(i+.5)*Math.PI/4,b=(i+1.5)*Math.PI/4;
    const x=Math.cos(a)*4.12,z=Math.sin(a)*4.12;
    const post=mesh(new T.CylinderGeometry(.07,.07,1.8,12),i<4?0xd9ae57:0xb65070);post.position.set(x,.85,z);
    for(const y of [.4,1,1.65]){
      const points=[new T.Vector3(x,y,z),new T.Vector3(Math.cos(b)*4.12,y,Math.sin(b)*4.12)];
      const rope=mesh(new T.TubeGeometry(new T.LineCurve3(...points),1,.022,6,false),0xa7b4c8);
      // Front rails stay low-opacity so the players and held models remain visible.
      rope.material.transparent=true;rope.material.opacity=z>1?.18:.55;
    }
  }
  for(let i=0;i<32;i++){
    const a=i*Math.PI/16,r=7+(i%3)*.65;
    const spectator=mesh(new T.BoxGeometry(.24,.35+(i%4)*.12,.24),[0x39465e,0x6a4b68,0x8b785c][i%3]);
    spectator.position.set(Math.cos(a)*r,.12,Math.sin(a)*r);
  }
  const back=mesh(new T.CylinderGeometry(10,10,.4,48),0x1b2438);back.position.y=-.7;
  const loader=new T.TextureLoader();
  let rigs=[];
  try{
    const photos=await Promise.all(['assets/first-face.png','assets/third-face.png'].map(p=>loader.loadAsync(new URL(p,import.meta.url).href)));
    rigs=photos.map((texture,i)=>{
      texture.colorSpace=T.SRGBColorSpace;
      // Display-window UVs only. Original uploaded PNG bytes are preserved.
      if(i===0){texture.repeat.set(.9,.82);texture.offset.set(.02,.10);}
      else{texture.repeat.set(.50,.51);texture.offset.set(.25,.29);}
      const rig=createCharacterRig(T,scene);rig.setCharacter(i===0?'hood':'cat',texture);rig.reset();
      rig.face.scale.set(.76,.88,1);rig.root.position.x=i===0?-1.45:1.45;
      rig.root.rotation.y=i===0?.3:-.3;
      const held=new T.Group();scene.add(held);rig.held=held;rig.hand=rig.arms[1].glove;
      return rig;
    });
  }catch(error){dispose();throw error;}
  const target=new T.Group();target.position.set(0,2.45,-.75);scene.add(target);
  let elapsed=0,last=performance.now(),mode='select',winners=[],orbit=0;
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(m=>{m.geometry?.dispose();if(m.material){for(const material of Array.isArray(m.material)?m.material:[m.material])material.dispose();}});}}
  function show(group,id,color){
    clear(group);const kind=models[id].shape;let geometry;
    if(kind==='sphere'||kind==='egg')geometry=new T.SphereGeometry(.31,28,20);
    else if(kind==='torus'||kind==='ovalTorus')geometry=new T.TorusGeometry(.26,.105,14,48);
    else if(kind==='circle'||kind==='ellipse')geometry=new T.TorusGeometry(.30,.012,6,64);
    else{
      const curve=kind==='segment'?new T.LineCurve3(new T.Vector3(-.36,0,0),new T.Vector3(.36,0,0)):
        new T.QuadraticBezierCurve3(new T.Vector3(-.36,-.1,0),new T.Vector3(0,.48,0),new T.Vector3(.36,-.1,0));
      geometry=new T.TubeGeometry(curve,30,.012,6,false);
      for(const point of [curve.getPoint(0),curve.getPoint(1)]){const end=mesh(new T.SphereGeometry(.026,10,8),0xffffff,group);end.position.copy(point);}
    }
    const shape=mesh(geometry,color,group);
    if(kind==='egg')shape.scale.set(.8,1.35,.8);
    if(kind==='ovalTorus'||kind==='ellipse')shape.scale.x=1.4;
  }
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  observer=new ResizeObserver(resize);observer.observe(container);resize();
  function animate(now){
    if(stopped)return;
    const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
    const angle=orbit+(motion?Math.sin(elapsed*.17)*.14:0);
    const victory=mode!=='select'&&winners.length>0;
    const radius=victory?8.5:9.5;
    camera.position.set(Math.sin(angle)*radius,3.8,Math.cos(angle)*radius);camera.lookAt(0,1.1,0);
    rigs.forEach((rig,i)=>{
      rig.tick({dt,time:elapsed,moving:false,cameraPosition:camera.position,celebrating:motion&&victory&&winners.includes(i)});
      // Guard / presentation poses only. No strikes, hits or contact.
      if(!victory||!winners.includes(i))for(const a of rig.arms){a.shoulder.rotation.x=-.5;a.elbow.rotation.x=-1.1;}
      // Follow the hand in world space. Keeping props outside its nonuniformly
      // scaled hierarchy avoids shear (which would flatten a sphere or torus).
      rig.hand.updateWorldMatrix(true,false);
      rig.hand.localToWorld(rig.held.position.set(0,-.30,0));
      rig.held.quaternion.copy(camera.quaternion);
      rig.held.scale.setScalar(.85);
    });
    target.rotation.y=motion?Math.sin(elapsed*.35)*.35:0;
    renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  }
  frame=requestAnimationFrame(animate);
  function dispose(){
    stopped=true;cancelAnimationFrame(frame);observer?.disconnect();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(m=>{if(m.geometry)geometries.add(m.geometry);if(m.material)for(const mat of Array.isArray(m.material)?m.material:[m.material]){materials.add(mat);if(mat.map)textures.add(mat.map);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();
  }
  return {
    setRound(round,selections){mode='select';winners=[];show(target,round.target,0x8de1e0);rigs.forEach((r,i)=>{r.reset();r.root.position.set(i===0?-1.45:1.45,.02,0);r.root.rotation.y=i===0?.3:-.3;show(r.held,selections[i],i===0?0xff9ba5:0xffdc70);});},
    select(i,id){show(rigs[i].held,id,i===0?0xff9ba5:0xffdc70);},
    resolve(ids,complete=false){mode=complete?'complete':'result';winners=ids;},
    setMotion(value){motion=value;},get motion(){return motion;},
    changeView(){orbit=orbit===0?.55:0;},dispose
  };
}
