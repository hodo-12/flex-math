import * as T from '../three.module.js';
import {TRACK,TRACK_LENGTH,trackPoint} from './race.js';
import {createVehicle} from './vehicles.js';
import {createDriver} from './driver.js';

export async function createKartScene(container,configs){
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  renderer.domElement.setAttribute('aria-label','다섯 공주가 함께 달리는 3D 동화 서킷');container.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0xdceee9);
  const camera=new T.OrthographicCamera(-14,14,9,-9,.1,120);
  scene.add(new T.HemisphereLight(0xffffef,0x5f9b9c,3));
  const sun=new T.DirectionalLight(0xfff2d6,3.2);sun.position.set(-6,16,9);scene.add(sun);
  const fill=new T.DirectionalLight(0xcfe3ff,1.5);fill.position.set(8,7,-8);scene.add(fill);
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.76,...extra});
  const mats={grass:material(0xb7d59d),road:material(0xf3dfb6),cream:material(0xfff9e3),pink:material(0xe99bb5),gold:material(0xe5b650),dark:material(0x325b65),mint:material(0x8bcdb4)};
  const mesh=(g,m,p=[0,0,0],parent=scene)=>{const o=new T.Mesh(g,m);o.position.set(...p);parent.add(o);return o;};
  const ball=(r,m,p,s=[1,1,1])=>{const o=mesh(new T.SphereGeometry(r,14,10),m,p);o.scale.set(...s);return o;};
  const island=mesh(new T.CylinderGeometry(1,1,.65,96),mats.mint,[0,-.45,0]);island.scale.set(10.25,1,7.58);
  const lawn=mesh(new T.CylinderGeometry(1,1,.08,96),mats.grass,[0,-.09,0]);lawn.scale.set(10.15,1,7.48);
  function strip(offset,width,mat,y=.001){
    const verts=[],idx=[];for(let i=0;i<=256;i++){for(const lane of [offset-width/2,offset+width/2]){const p=trackPoint(i/256*TRACK_LENGTH,lane);verts.push(p.x,y,p.z);}if(i<256){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();return mesh(geo,mat);
  }
  strip(0,TRACK.halfWidth*2,mats.road);
  for(const side of [-1,1]){
    strip(side*TRACK.halfWidth,.16,mats.cream,.008);
    for(let i=0;i<64;i++){const p=trackPoint(i/64*TRACK_LENGTH,side*(TRACK.halfWidth+.04));const curb=mesh(new T.BoxGeometry(.35,.08,.17),i%2?mats.pink:mats.cream,[p.x,.035,p.z]);curb.rotation.y=p.yaw;}
  }
  for(let i=0;i<40;i++){const p=trackPoint(i/40*TRACK_LENGTH);const dash=mesh(new T.BoxGeometry(.06,.013,.35),mats.cream,[p.x,.015,p.z]);dash.rotation.y=p.yaw;}
  // The start/finish stripe and gate share exactly the simulation's zero point.
  const start=trackPoint(0);
  for(let lane=0;lane<10;lane++)for(let row=0;row<2;row++)mesh(new T.BoxGeometry(.47,.018,.19),(lane+row)%2?mats.dark:mats.cream,[start.x+(lane-4.5)*.47,.021,row*.19]);
  for(const side of [-1,1]){
    mesh(new T.CylinderGeometry(.06,.06,2.6,10),mats.gold,[start.x+side*2.60,1.3,0]);
    ball(.13,mats.pink,[start.x+side*2.60,2.65,0]);
  }
  const banner=mesh(new T.BoxGeometry(5.3,.35,.10),mats.cream,[start.x,2.48,0]);
  const textCanvas=document.createElement('canvas');textCanvas.width=1024;textCanvas.height=256;
  const ctx=textCanvas.getContext('2d');ctx.fillStyle='#fff9e3';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#355c61';ctx.textAlign='center';ctx.font='900 95px sans-serif';ctx.fillText('PRINCESS  GRAND  PRIX',512,150);
  const signTexture=new T.CanvasTexture(textCanvas);signTexture.colorSpace=T.SRGBColorSpace;
  const sign=mesh(new T.PlaneGeometry(5.05,.31),new T.MeshBasicMaterial({map:signTexture}),[start.x,2.48,.061]);
  // Tiny storybook castle, crown fountain, ribbon flags and a donut sculpture.
  mesh(new T.CylinderGeometry(2.3,2.5,.15,48),mats.cream,[0,.04,0]);
  mesh(new T.CylinderGeometry(1.95,1.95,.10,48),material(0x9bd9db),[0,.15,0]);
  for(const x of [-1.1,1.1]){
    mesh(new T.CylinderGeometry(.42,.46,1.8,20),mats.cream,[x,1.01,-.6]);
    mesh(new T.ConeGeometry(.59,.9,20),mats.pink,[x,2.35,-.6]);
    mesh(new T.CylinderGeometry(.018,.018,.65,6),mats.gold,[x,3,-.6]);
    mesh(new T.BoxGeometry(.35,.20,.015),mats.mint,[x+.16,3.15,-.6]);
  }
  mesh(new T.BoxGeometry(1.65,1.35,.8),mats.cream,[0,.85,-.7]);
  mesh(new T.BoxGeometry(.48,.9,.05),mats.pink,[0,.6,-.27]);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ball(.13,mats.gold,[Math.cos(a)*.75,.63,Math.sin(a)*.65+.45]);const point=mesh(new T.ConeGeometry(.17,.42,5),mats.gold,[Math.cos(a)*.75,.41,Math.sin(a)*.65+.45]);}
  const donut=mesh(new T.TorusGeometry(.7,.23,12,36),mats.pink,[3.4,1,-.2]);donut.rotation.z=.2;
  mesh(new T.CylinderGeometry(.08,.08,1.1,10),mats.gold,[3.4,.5,-.2]);
  const decorations=[];
  for(let i=0;i<14;i++){
    const p=trackPoint((i+.3)/14*TRACK_LENGTH,TRACK.halfWidth+.35);
    const pole=mesh(new T.CylinderGeometry(.02,.02,1.3,6),mats.gold,[p.x,.65,p.z]);
    const flag=mesh(new T.BoxGeometry(.42,.25,.018),i%2?mats.pink:mats.mint,[p.x+.20,1.23,p.z]);decorations.push(flag);
  }
  // Stands are behind the track and cannot conceal the racing faces.
  for(let row=0;row<2;row++)for(let i=0;i<15;i++){
    const x=(i-7)*.47,z=-6.8-row*.38;
    ball(.10,i%3===0?mats.pink:i%3===1?mats.gold:mats.mint,[x,.25+row*.18,z]);
    const spectator=mesh(new T.CapsuleGeometry(.075,.15,2,5),mats.cream,[x,.08+row*.18,z]);
  }
  let observer,disposed=false,drivers=[];
  const labels=document.createElement('div');labels.className='track-labels';labels.setAttribute('aria-hidden','true');container.append(labels);
  try{
    const loader=new T.TextureLoader();
    const textures=await Promise.all(configs.map(async c=>{
      const original=await loader.loadAsync(new URL(c.face,import.meta.url).href);original.colorSpace=T.SRGBColorSpace;
      if(!c.faceWindow)return original;
      // Runtime display clipping only. No generated face or altered source file.
      const w=c.faceWindow,canvas=document.createElement('canvas');canvas.width=w.width;canvas.height=w.height;const g=canvas.getContext('2d');
      g.beginPath();g.ellipse(w.width/2,w.height/2,w.width*.49,w.height*.50,0,0,Math.PI*2);g.clip();g.drawImage(original.image,w.x,w.y,w.width,w.height,0,0,w.width,w.height);
      original.dispose();const display=new T.CanvasTexture(canvas);display.colorSpace=T.SRGBColorSpace;return display;
    }));
    drivers=configs.map((config,i)=>{
      const vehicle=createVehicle(T,config);scene.add(vehicle.root);vehicle.root.scale.setScalar(.86);
      const driver=createDriver(T,vehicle.seatRoot,config,textures[i]);
      const label=document.createElement('span');label.className='kart-label';label.dataset.racer=config.id;label.style.setProperty('--racer',config.color);label.innerHTML='<b></b><em></em>';labels.append(label);
      return {config,vehicle,driver,label};
    });
  }catch(error){dispose();throw error;}
  // Reusable pooled confetti, visible only once everyone has crossed the line.
  const confetti=new T.InstancedMesh(new T.PlaneGeometry(.09,.18),material(0xffffff,{side:T.DoubleSide}),90);confetti.visible=false;scene.add(confetti);
  const matrix=new T.Matrix4(),color=new T.Color(),projected=new T.Vector3(),target=new T.Vector3(),cameraTarget=new T.Vector3();
  for(let i=0;i<90;i++)confetti.setColorAt(i,color.set(configs[i%configs.length].color));
  let aspect=1,close=false,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches,selected=configs[0].id;
  function resize(){const w=container.clientWidth,h=container.clientHeight;aspect=w/h;renderer.setSize(w,h,false);}
  observer=new ResizeObserver(resize);observer.observe(container);resize();
  function draw(race,time,dt){
    if(disposed)return;
    const chosen=race.racers.find(r=>r.id===selected)||race.racers[0];
    const result=race.phase==='finished';
    for(let i=0;i<drivers.length;i++){
      const d=drivers[i],state=race.racers[i],winner=state.rank===1;
      let p=trackPoint(state.distance,state.lane);
      if(result){const slot=state.rank-1,offset=slot===0?0:Math.ceil(slot/2)*(slot%2?-1:1);p={x:offset*2.15,z:slot===0?4.3:3.6,yaw:0};}
      // Cars stop at their exact crossing until the complete podium tableau.
      d.vehicle.root.position.set(p.x,.045,p.z);d.vehicle.root.rotation.y=p.yaw;
      d.vehicle.animate(state,time,motion);d.driver.pose(state,{time,motion,winner,finished:state.finished});
    }
    if(close&&!result){const p=trackPoint(chosen.distance,chosen.lane);target.set(p.x,.7,p.z);}
    else target.set(0,result?.65:0,result?3.6:0);
    cameraTarget.lerp(target,1-Math.exp(-Math.max(dt,.016)*5));
    const halfHeight=result?3.6:close?3.5:aspect<1.1?10.8:8.3;
    // Portrait devices look along the long axis so the complete circuit fits.
    const halfWidth=Math.max(halfHeight*aspect,result?drivers.length*1.17:close?3.6:aspect<1.1?7.8:12);
    camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfWidth/aspect;camera.bottom=-halfWidth/aspect;camera.updateProjectionMatrix();
    camera.position.copy(cameraTarget).add(result?new T.Vector3(0,5,12):close?new T.Vector3(2,6,10):aspect<1.1?new T.Vector3(23,25,2):new T.Vector3(0,24,27));camera.lookAt(cameraTarget);
    camera.updateMatrixWorld();
    const latest=race.events.at(-1);
    for(const d of drivers){
      const r=race.racers.find(r=>r.id===d.config.id);
      d.driver.rig.head.getWorldPosition(projected);projected.y+=.55;projected.project(camera);
      d.label.style.left=`${(projected.x*.5+.5)*100}%`;d.label.style.top=`${(-projected.y*.5+.5)*100}%`;
      d.label.hidden=Math.abs(projected.x)>1||Math.abs(projected.y)>1;
      d.label.firstElementChild.textContent=`${r.rank}`;d.label.classList.toggle('picked',r.id===selected);
      const bubble=d.label.lastElementChild;const speak=(result||latest?.racer===r.id)&&r.reactionUntil>race.raceTime;
      bubble.textContent=speak?r.reaction:'';bubble.hidden=!speak;
    }
    confetti.visible=result&&motion;
    if(confetti.visible){for(let i=0;i<90;i++){const x=Math.sin(i*41)*6,z=3+Math.cos(i*7)*2,y=4-((time*(.6+i%3*.15)+i*.19)%4);matrix.makeRotationFromEuler(new T.Euler(time+i,i,time*.3));matrix.setPosition(x,y,z);confetti.setMatrixAt(i,matrix);}confetti.instanceMatrix.needsUpdate=true;}
    for(let i=0;i<decorations.length;i++)decorations[i].rotation.y=motion?Math.sin(time*2+i)*.12:0;
    renderer.render(scene,camera);
  }
  function dispose(){
    if(disposed)return;disposed=true;observer?.disconnect();
    const geos=new Set(),mats=new Set(),tex=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)tex.add(m.map);}});
    geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());tex.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();labels.remove();
  }
  return {draw,dispose,setSelected(id){selected=id;},setClose(value){close=value;},get close(){return close;},setMotion(value){motion=value;},get motion(){return motion;}};
}
