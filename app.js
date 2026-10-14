import * as T from './three.module.js';
import {objects,Mission,levels} from './state.js';
import {setupLearning,unlockDiscovery} from './learning.js';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
let choice='hood',currentLevel=1,roomContent=[],forestGroup=null,oceanGroup=null,oceanBubbles=[],seaFish=[],celebrating=0,mission=new Mission(),running=false,selected=null,walking=null,walkTime=0,inspectModel=null,feedbackPending=false,completed=false;
let renderer,scene,camera,avatar,face,limbs=[],objectMeshes=new Map(),angle=.65,elevation=.84,zoom=12,viewRenderer,viewScene,viewCamera;
const clock=new T.Clock(),ray=new T.Raycaster(),pointer=new T.Vector2();
const mat=(color)=>new T.MeshStandardMaterial({color,roughness:.72});
const palette={square:0xe9a16d,oval:0x9cacd4,cup:0x93b8a1,ball:0xf0cd78,bowl:0xca9caa,double:0x88b6c2,fruit:0xb54d9e,stone:0x9dae90,egg:0x9de5ec,vine:0x52955a,flower:0xeaa0ba,log:0xb98758,rune:0xa99bea,basket:0xc89b6e,twinGate:0xb4cfba,coralCrown:0xee9cb6,ruinSlab:0x93d6d7,singlePortal:0xc0ae99,seaPearl:0xc9ebef,tripleRelic:0x9aa1d1,treasure:0xe1b46d,kelpRing:0x73b99b};
const activeObjects=()=>levels[currentLevel].objects;
const characterInfo={hood:{file:'hood.png',name:'후드 탐험가',color:0x66745d},smile:{file:'smile.png',name:'스마일 탐험가',color:0x384e57},cat:{file:'avatar-cat-head.png',name:'고양이 탐험가',color:0xb37666},cap:{file:'avatar-cap-head.png',name:'모자 탐험가',color:0x698c8d}};
let victoryTimer=null,fireflies=[],forestOrb=null;
let audio,master,musicOn=false,musicTimer,noteIndex=0;
function tone(freq,time=.15,vol=.05,type='sine',delay=0){if(!audio||!musicOn)return;const o=audio.createOscillator(),g=audio.createGain(),start=audio.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(vol,start+.018);g.gain.exponentialRampToValueAtTime(.0001,start+time);o.connect(g).connect(master);o.start(start);o.stop(start+time+.01);}
function music(){const notes=[261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,392,493.88,587.33,523.25,392,329.63,293.66];tone(notes[noteIndex%16],.5,.035,'sine');if(noteIndex%4===0)tone([130.81,110,98,130.81][Math.floor(noteIndex/4)%4],1.6,.025,'triangle');noteIndex++;}
$('#sound').onclick=async()=>{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.7;master.connect(audio.destination);}await audio.resume();musicOn=!musicOn;$('#sound').textContent=musicOn?'♫ 음악 끄기':'♫ 음악 켜기';$('#sound').setAttribute('aria-pressed',musicOn);clearInterval(musicTimer);if(musicOn){music();musicTimer=setInterval(music,420);}};
document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden)audio.suspend();else if(musicOn)audio.resume();});
all('[data-character]').forEach(b=>b.onclick=()=>{choice=b.dataset.character;all('[data-character]').forEach(c=>{let yes=c===b;c.classList.toggle('selected',yes);c.setAttribute('aria-pressed',yes);c.querySelector('b').textContent=yes?'선택됨 ✓':'선택하기';});});
try{if(localStorage.getItem('topology-level1'))$('#levelStatus').textContent='클리어 ✓';}catch{}
function mesh(geo,color,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,color){return mesh(new T.BoxGeometry(w,h,d),color,parent,x,y,z);}
function ringShape(kind){const s=new T.Shape();if(kind==='square'){const r=.78;s.moveTo(-r,-r);s.lineTo(r,-r);s.lineTo(r,r);s.lineTo(-r,r);s.closePath();const hole=new T.Path();hole.moveTo(-.43,-.43);hole.lineTo(-.43,.43);hole.lineTo(.43,.43);hole.lineTo(.43,-.43);hole.closePath();s.holes.push(hole);}else{s.moveTo(-1.1,-.65);s.lineTo(1.1,-.65);s.lineTo(1.1,.65);s.lineTo(-1.1,.65);s.closePath();for(const x of [-.53,.53]){const h=new T.Path();h.absarc(x,0,.33,0,Math.PI*2,true);s.holes.push(h);}}return new T.ExtrudeGeometry(s,{depth:.26,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.08,bevelThickness:.08,curveSegments:40});}

/** Connected solid extrusions with 2 through-holes have genus-two boundaries.
 * The wrong triple-hole slab is the same construction with genus three. */
function underwaterRelicGeometry(id){
  const s=new T.Shape();
  if(id==='coralCrown'){
    for(let i=0;i<=64;i++){const a=i*Math.PI*2/64,r=1.13+.08*Math.cos(7*a);const x=Math.cos(a)*r,y=Math.sin(a)*r*.7;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}
    s.closePath();
  }else if(id==='twinGate'){
    s.absellipse(0,0,1.2,.79,0,Math.PI*2,false,0);
  }else{
    s.moveTo(-1.22,-.72);s.lineTo(1.22,-.72);s.lineTo(1.22,.72);s.lineTo(-1.22,.72);s.closePath();
  }
  const isTriple=id==='tripleRelic';
  const xs=isTriple?[-.69,0,.69]:[-.53,.53];
  for(const x of xs){
    const hole=new T.Path();
    hole.absellipse(x,0,isTriple?.22:.32,isTriple?.29:.36,0,Math.PI*2,true,0);
    s.holes.push(hole);
  }
  return new T.ExtrudeGeometry(s,{depth:.28,steps:1,bevelEnabled:true,bevelSegments:3,bevelThickness:.045,bevelSize:.045,curveSegments:32});
}

function createObject(id){const g=new T.Group(),color=palette[id];if(id==='square'||id==='double'){const m=mesh(ringShape(id),color,g);m.rotation.x=-Math.PI/2;m.position.y=.13;}if(id==='oval'){const m=mesh(new T.TorusGeometry(.64,.19,24,72),color,g);m.scale.x=1.55;m.rotation.x=-Math.PI/2;m.position.y=.2;}
if(id==='ball')mesh(new T.SphereGeometry(.64,32,24),color,g,0,.65,0);
if(['twinGate','coralCrown','ruinSlab','tripleRelic'].includes(id)){
  const relic=mesh(underwaterRelicGeometry(id),color,g,0,1.05,0);
  relic.rotation.y=id==='coralCrown'?-.14:.10;
  relic.material.metalness=id==='ruinSlab'?.36:.12;relic.material.roughness=.46;
}
if(id==='singlePortal'||id==='kelpRing'){
  const ring=mesh(new T.TorusGeometry(.63,.2,20,64),color,g,0,.83,0);
  ring.scale.y=id==='kelpRing'?1.14:.95;
}
if(id==='seaPearl'){const pearl=mesh(new T.SphereGeometry(.64,32,24),color,g,0,.74,0);pearl.material.metalness=.12;pearl.material.roughness=.22;}
if(id==='treasure'){const treasure=mesh(new T.BoxGeometry(1.13,.79,.85),color,g,0,.53,0);treasure.material.metalness=.18;}

if(id==='fruit'||id==='stone'||id==='egg'){const m=mesh(new T.SphereGeometry(.61,32,24),color,g,0,.65,0);m.scale.set(id==='stone'?1.2:.9,id==='egg'?1.55:id==='fruit'?1.1:.75,id==='fruit'?1.08:.88);if(id==='fruit')mesh(new T.ConeGeometry(.17,.35,8),0x3a9150,g,0,1.35,0);}
if(['vine','flower','log','rune','basket'].includes(id)){
const ring=mesh(new T.TorusGeometry(id==='flower'?.63:.55,id==='log'?.26:.18,18,48),color,g,0,.7,0);
ring.rotation.x=id==='log'?Math.PI/2:0;
if(id==='flower'){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(new T.SphereGeometry(.23,12,10),0xf4b4ce,g,Math.cos(a)*.64,.7+Math.sin(a)*.64,0);}}
if(id==='basket'){mesh(new T.CylinderGeometry(.43,.32,.7,24),color,g,0,.37,0);ring.position.y=1.02;ring.scale.set(.7,1.1,1);}
}
if(id==='cup'||id==='bowl'){const cup=id==='cup';const pts=cup?[[0,0],[.4,0],[.48,.08],[.51,.92],[.45,.96],[.39,.91],[.35,.16],[0,.16]]:[[0,0],[.34,0],[.6,.18],[.82,.55],[.75,.59],[.52,.27],[.29,.14],[0,.14]];const geo=new T.LatheGeometry(pts.map(p=>new T.Vector2(...p)),64);mesh(geo,color,g);if(cup){const handle=mesh(new T.TorusGeometry(.36,.11,20,48),color,g,.58,.54,0);handle.scale.x=.84;}}
g.userData.id=id;return g;}
function lights(s){s.add(new T.HemisphereLight(0xfffbeb,0x859782,2.6));const light=new T.DirectionalLight(0xfff1da,3);light.position.set(-4,10,6);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-10;light.shadow.camera.right=10;light.shadow.camera.top=10;light.shadow.camera.bottom=-10;light.shadow.normalBias=.04;s.add(light);}
function init(){renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xe9eddf);$('#world').append(renderer.domElement);scene=new T.Scene();scene.fog=new T.Fog(0xe9eddf,22,42);camera=new T.PerspectiveCamera(40,1,.1,80);lights(scene);
box(scene,0,-.2,0,11,.4,9,0xd4c8af);box(scene,0,2,-4.5,11,4.5,.16,0xdfe6d6);box(scene,-5.5,2,0,.16,4.5,9,0xd5dfce);box(scene,0,.08,-4.35,11,.18,.15,0xf8f4e7);box(scene,-5.35,.08,0,.15,.18,9,0xf8f4e7);
for(let i=-5;i<=5;i++)box(scene,i,-.002,0,.017,.012,9,0xbeb39c);
// Soft circular carpet and a small, furnished toy room.
const rug=mesh(new T.CylinderGeometry(3.5,3.5,.025,80),0xe5e6c9,scene,0,.015,.3);rug.receiveShadow=true;
box(scene,2,2.5,-4.33,2.6,1.7,.12,0xf5f2dc);box(scene,2,2.5,-4.23,2.32,1.43,.04,0xbad3d5);box(scene,2,2.5,-4.15,.07,1.5,.06,0xfff9e7);box(scene,2,2.5,-4.15,2.4,.07,.06,0xfff9e7);
box(scene,-3.6,1.15,-3.8,2.35,.12,.75,0xad9374);for(let x of [-4.55,-2.65])box(scene,x,.57,-3.8,.13,1.15,.6,0xad9374);
for(let i=0;i<7;i++)box(scene,-4.4+i*.2,1.48,-3.75,.15,.55+(i%3)*.07,.34,[0xa4b897,0xd3aa83,0xe4d5a4][i%3]);
box(scene,4.45,.42,-3.3,1.1,.84,.95,0xb1bca0);box(scene,4.45,.86,-3.3,1.17,.08,1.02,0xd3ddbc);
const pot=mesh(new T.CylinderGeometry(.28,.21,.48,24),0xbc8d72,scene,-4.4,.25,3.35);for(let i=0;i<6;i++){const leaf=mesh(new T.SphereGeometry(.25,16,12),0x739b71,scene,-4.4+Math.sin(i*2)*.22,.6+i*.1,3.35+Math.cos(i*2)*.17);leaf.scale.set(.65,1.7,.55);}
for(const o of objects){let g=createObject(o.id);g.position.set(o.x,.07,o.z);g.rotation.y=o.id==='oval'?.5:o.id==='square'?.25:0;scene.add(g);objectMeshes.set(o.id,g);}
const guide=mesh(new T.TorusGeometry(.4,.14,20,48),0xc6af6f,scene,-.6,2.9,-4.26);guide.rotation.z=.3;
roomContent=[...scene.children].filter(x=>!x.isLight);
createAvatar();setupInput();viewRenderer=new T.WebGLRenderer({antialias:true,alpha:true});viewRenderer.setPixelRatio(Math.min(devicePixelRatio,2));$('#modelView').append(viewRenderer.domElement);viewScene=new T.Scene();lights(viewScene);viewCamera=new T.PerspectiveCamera(38,1,.1,30);viewCamera.position.set(2,2.7,3.4);viewCamera.lookAt(0,.3,0);let vx=null;viewRenderer.domElement.onpointerdown=e=>{vx=e.clientX;viewRenderer.domElement.setPointerCapture(e.pointerId);};viewRenderer.domElement.onpointermove=e=>{if(vx!==null&&inspectModel){inspectModel.rotation.y+=(e.clientX-vx)*.015;vx=e.clientX;}};viewRenderer.domElement.onpointerup=()=>vx=null;viewRenderer.domElement.onpointercancel=()=>vx=null;
new ResizeObserver(resize).observe($('#world'));animate();}
const textures={};function createAvatar(){avatar=new T.Group();scene.add(avatar);const torso=mesh(new T.CapsuleGeometry(.28,.37,8,16),choice==='hood'||choice==='cap'?0x5f6251:0x303c3c,avatar,0,.84,0);avatar.userData.torso=torso;for(const side of [-1,1]){let arm=mesh(new T.CapsuleGeometry(.085,.34,6,12),0x626652,avatar,side*.38,.88,0);limbs.push(arm);mesh(new T.SphereGeometry(.105,12,12),0xe0b498,arm,0,-.25,0);let leg=mesh(new T.CapsuleGeometry(.105,.33,6,12),0x36443f,avatar,side*.16,.35,0);limbs.push(leg);mesh(new T.BoxGeometry(.23,.12,.34),0xf2f0de,leg,0,-.22,.07);}
for(const c of ['hood','smile','cat','cap']){textures[c]=new T.TextureLoader().load(characterInfo[c].file);textures[c].colorSpace=T.SRGBColorSpace;}
face=new T.Sprite(new T.SpriteMaterial({map:textures[choice],transparent:true,depthTest:true}));face.scale.set(1.14,1.05,1);face.position.y=1.58;avatar.add(face);avatar.position.set(-1.1,.02,2.4);}
function resize(){if(!renderer)return;const w=$('#world').clientWidth,h=$('#world').clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function updateCamera(){camera.position.set(Math.sin(angle)*zoom,zoom*elevation,Math.cos(angle)*zoom);camera.lookAt(0,.2,0);}
function setupInput(){const canvas=renderer.domElement;let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)down.moved=true;if(down.moved){angle-=(e.clientX-down.lx)*.006;elevation=T.MathUtils.clamp(elevation+(e.clientY-down.ly)*.003,.4,1.6);}down.lx=e.clientX;down.ly=e.clientY;}});canvas.addEventListener('pointerup',e=>{if(down&&!down.moved){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects([...objectMeshes.values()].filter(g=>g.visible),true);if(hits.length){let g=hits[0].object;while(!g.userData.id&&g.parent)g=g.parent;if(g.userData.id)choose(g.userData.id);}}down=null;});canvas.addEventListener('pointercancel',()=>down=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.01,8,20);},{passive:false});}
function speak(msg){$('#speech').textContent=msg;}
function choose(id){if(!running||walking||$('#inspect').open||completed)return;if(mission.found.has(id)){speak('이미 발견 노트에 모은 물건이에요!');return;}selected=activeObjects().find(o=>o.id===id);walking=new T.Vector3(selected.x,.02,selected.z+1);walkTime=0;speak(selected.name+' 쪽으로 가 볼까요?');}
function openInspect(){if(!selected)return;$('#objectTitle').textContent=selected.name;$('#inspectText').textContent='드래그해서 돌려 보세요. 이 물체의 전체 경계 표면은 '+levels[currentLevel].target+'의 표면과 위상동형일까요?';$('#feedback').textContent='';$('#inspectText').hidden=false;$('.choices').hidden=false;$('#continue').hidden=true;feedbackPending=false;if(inspectModel){viewScene.remove(inspectModel);disposeGroup(inspectModel);}inspectModel=createObject(selected.id);viewScene.add(inspectModel);$('#inspect').showModal();const w=$('#modelView').clientWidth,h=$('#modelView').clientHeight;viewRenderer.setSize(w,h,false);viewCamera.aspect=w/h;viewCamera.updateProjectionMatrix();}
function disposeGroup(g){g.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});}
function answer(guess){if(feedbackPending||!selected)return;const res=mission.answer(selected.id,guess);feedbackPending=true;$('.choices').hidden=true;$('#continue').hidden=false;$('#inspectText').hidden=true;$('#feedback').classList.toggle('incorrect',!res.right);if(!res.right){document.body.classList.remove('wrong-flash');void document.body.offsetWidth;document.body.classList.add('wrong-flash');setTimeout(()=>document.body.classList.remove('wrong-flash'),650);}$('#feedback').innerHTML='<b>'+(res.right?(res.collected?'맞아요! 발견 노트에 수집했어요.':'맞아요! 이 물건은 다른 구조예요.') :'아직 달라요. 한 번 더 살펴볼까요?')+'</b><br>'+selected.reason;
if(res.collected){const newCard=unlockDiscovery(currentLevel,selected.id);for(let i=0;i<3;i++)tone([523.25,659.25,783.99][i],.3,.07,'sine',i*.12);objectMeshes.get(selected.id).visible=false;updateProgress();speak(newCard?'오, 위상동형이다! 📖 새 개념 카드도 획득했어!':'오, 위상동형이다!');if(inspectModel){viewScene.remove(inspectModel);disposeGroup(inspectModel);}inspectModel=new T.Group();let revealed=currentLevel===2?mesh(new T.SphereGeometry(.72,32,24),palette[selected.id],inspectModel):mesh(new T.TorusGeometry(.65,.23,24,64),palette[selected.id],inspectModel);if(currentLevel===1)revealed.rotation.x=.8;viewScene.add(inspectModel);}else{tone(res.right?440:196,.25,.05);speak(res.right?'좋은 관찰이에요! 다른 물건도 살펴봐요.':'괜찮아요. 구조를 다시 살펴봐요.');}}
function updateProgress(){$('#progressFill').style.width=(mission.found.size/3*100)+'%';$('#count').textContent=mission.found.size+' / 3';const found=[...mission.found];all('.slots span').forEach((s,i)=>{s.textContent=found[i]?activeObjects().find(o=>o.id===found[i]).symbol:'?';s.classList.toggle('found',!!found[i]);s.title=found[i]?activeObjects().find(o=>o.id===found[i]).name:'아직 발견하지 않은 물건';});all('#objectList button').forEach(b=>{const done=mission.found.has(b.dataset.id);b.classList.toggle('done',done);b.disabled=done;const item=activeObjects().find(o=>o.id===b.dataset.id);b.innerHTML='<span class=object-symbol>'+item.symbol+'</span><span>'+item.name+'</span><i>'+(done?'✓':'↗')+'</i>';});}
function closeInspect(){$('#inspect').close();if(mission.found.size===3){completed=true;$('#resultStats').textContent='세 가지 발견 완료 · 총 '+mission.attempts+'번 관찰했어요';$('#complete').querySelector('.eyebrow').textContent='LEVEL 0'+currentLevel+' COMPLETE';$('#complete').querySelector('h2').textContent='성공했다!! 🎉';try{localStorage.setItem('topology-level'+currentLevel,'complete');}catch{}if(currentLevel===1)$('#levelStatus').textContent='클리어 ✓';if(currentLevel===2)$('#level2Status').textContent='클리어 ✓';celebrating=3;$('#celebrationOverlay').hidden=false;avatar.position.set(0,.02,1);victoryTimer=setTimeout(()=>{if(!running||!completed)return;$('#celebrationOverlay').hidden=true;$('#complete').showModal();$('#complete').classList.add('victory');setTimeout(()=>$('#complete').classList.remove('victory'),3500);},3000);}}
$('#yes').onclick=()=>answer(true);$('#no').onclick=()=>answer(false);$('#continue').onclick=closeInspect;$('#closeInspect').onclick=closeInspect;$('#inspect').addEventListener('cancel',e=>{e.preventDefault();closeInspect();});
function start(){clearTimeout(victoryTimer);document.body.classList.add('playing');document.body.dataset.level=currentLevel;$('#playerFace').src=characterInfo[choice].file;$('#playerName').textContent=characterInfo[choice].name;$('#celebrationOverlay').hidden=true;celebrating=0;limbs.forEach(l=>{l.rotation.x=0;l.rotation.z=0;});try{if(!renderer)init();}catch(e){document.body.classList.remove('playing');$('#error').hidden=false;$('#error').textContent='3D 화면을 시작하지 못했어요. WebGL을 지원하는 최신 브라우저에서 다시 열어 주세요.';console.error(e);return;}mission=new Mission(currentLevel);switchLevelWorld();running=true;completed=false;walking=null;selected=null;face.material.map=textures[choice];avatar.userData.torso.material.color.set(characterInfo[choice].color);[limbs[0],limbs[2]].forEach(l=>l.material.color.set(characterInfo[choice].color));avatar.position.set(-1.1,.02,2.4);for(const g of objectMeshes.values())g.visible=true;$('#lobby').hidden=true;$('#footer').hidden=true;$('#game').hidden=false;$('#objectList').replaceChildren();activeObjects().forEach(o=>{const b=document.createElement('button');b.textContent=o.name;b.dataset.id=o.id;b.onclick=()=>choose(o.id);$('#objectList').append(b);});updateProgress();resetView();resize();speak('물건을 눌러 함께 살펴봐요!');$('#start').blur();}
function resetView(){angle=currentLevel===2?.18:.65;elevation=.8;zoom=innerWidth<800?17:14;}
$('#zoomIn').onclick=()=>zoom=T.MathUtils.clamp(zoom-1,8,20);$('#zoomOut').onclick=()=>zoom=T.MathUtils.clamp(zoom+1,8,20);
$('#start').onclick=start;setupLearning();$('#level').onclick=()=>{currentLevel=1;updateLevelSelection();};$('#level2').onclick=()=>{currentLevel=2;updateLevelSelection();};$('#resetView').onclick=resetView;$('#hint').onclick=()=>speak(levels[currentLevel].hint);function home(){clearTimeout(victoryTimer);document.body.classList.remove('playing');$('#celebrationOverlay').hidden=true;celebrating=0;$('#complete').close();$('#inspect').close();running=false;walking=null;$('#game').hidden=true;$('#lobby').hidden=false;$('#footer').hidden=false;$('#start').focus();}$('#exit').onclick=home;$('#home').onclick=home;$('#replay').onclick=()=>{$('#complete').close();start();};$('#complete').addEventListener('cancel',e=>{e.preventDefault();home();});
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05);if(!running)return;updateCamera();if(walking){const delta=walking.clone().sub(avatar.position),dist=delta.length();if(dist<.06){avatar.position.copy(walking);walking=null;limbs.forEach(l=>l.rotation.x=0);openInspect();}else{avatar.position.addScaledVector(delta.normalize(),Math.min(dist,dt*2.8));walkTime+=dt*10;limbs.forEach((l,i)=>l.rotation.x=Math.sin(walkTime+(i%2)*Math.PI+(i>1?Math.PI:0))*.3);avatar.position.y=.02+Math.abs(Math.sin(walkTime))*.045;}}else{avatar.position.y=.02+Math.sin(clock.elapsedTime*2)*.016;}if(celebrating>0){celebrating-=dt;avatar.position.y=.02+Math.abs(Math.sin(celebrating*10))*.48;limbs.forEach((l,i)=>l.rotation.z=Math.sin(celebrating*10+i)*.32);}else{limbs.forEach(l=>l.rotation.z=0);}if(currentLevel===2){for(const mote of fireflies){mote.position.y=mote.userData.baseY+Math.sin(clock.elapsedTime*.9+mote.userData.phase)*.2;mote.material.opacity=.45+.4*Math.sin(clock.elapsedTime*1.5+mote.userData.phase);}if(forestOrb)forestOrb.position.y=1.9+Math.sin(clock.elapsedTime)*.12;}renderer.render(scene,camera);if($('#inspect').open&&inspectModel){inspectModel.rotation.y+=dt*.35;viewRenderer.render(viewScene,viewCamera);}}

function updateLevelSelection(){
$('#level').classList.toggle('active',currentLevel===1);$('#level').setAttribute('aria-pressed',currentLevel===1);$('#level2').setAttribute('aria-pressed',currentLevel===2);
$('#level2').classList.toggle('active',currentLevel===2);
$('#start').textContent='LEVEL 0'+currentLevel+' 탐험 시작하기';
}
function makeForest(){
forestGroup=new T.Group();scene.add(forestGroup);
// A raised moonlit clearing: scenery stays at the edge so targets remain visible.
const earth=mesh(new T.CylinderGeometry(6.5,6.1,.8,64),0x294e48,forestGroup,0,-.45,0);earth.scale.z=.83;
const moss=mesh(new T.CylinderGeometry(6.45,6.45,.09,64),0x4b7760,forestGroup,0,-.01,0);moss.scale.z=.83;
const clearing=mesh(new T.CylinderGeometry(4.65,4.8,.035,64),0x76927b,forestGroup,0,.045,0);clearing.scale.z=.83;
const tree=(x,z,size)=>{const trunk=mesh(new T.CylinderGeometry(.15*size,.27*size,2.5*size,9),0x496957,forestGroup,x,1.2*size,z);for(let j=0;j<3;j++){const leaf=mesh(new T.IcosahedronGeometry((1.05-j*.14)*size,1),[0x366e5b,0x46846b,0x609a77][j],forestGroup,x+Math.sin(j)*.15,2.3*size+j*.5,z);leaf.scale.y=.9;} };
for(const v of [[-5,-2.5,1.1],[-4,-4.1,1.2],[-1.7,-4.4,1],[1.5,-4.5,1.2],[4,-4.1,1],[5.5,-1.5,.9],[-5.6,1.1,.7],[5.4,2.4,.6]])tree(...v);
for(let i=0;i<11;i++){const z=3.6-i*.6,x=Math.sin(i*.8)*.35;const step=mesh(new T.CylinderGeometry(.42,.47,.075,7),0xb3bca0,forestGroup,x,.075,z);step.scale.z=.6;step.rotation.y=i*.8;}
const pond=mesh(new T.CylinderGeometry(1.2,1.3,.04,64),0x3a9e9d,forestGroup,-3.7,.065,1.45);pond.scale.z=.63;pond.material.metalness=.5;pond.material.roughness=.18;
for(let i=0;i<3;i++){const ripple=mesh(new T.TorusGeometry(.43+i*.24,.013,5,48),0x9cdbcb,forestGroup,-3.7,.09,1.45);ripple.rotation.x=Math.PI/2;ripple.scale.y=.63;}
for(let i=0;i<20;i++){const a=i*2.399,r=4.6+(i%3)*.32,x=Math.cos(a)*r,z=Math.sin(a)*r*.8;if(z>3)continue;const stone=mesh(new T.IcosahedronGeometry(.17+i%3*.07,0),0x91a88e,forestGroup,x,.13,z);stone.scale.y=.6;const mushroom=mesh(new T.SphereGeometry(.13,12,8),i%2?0xe4ac96:0x9fbbd5,forestGroup,x+.22,.28,z);mushroom.scale.y=.5;mesh(new T.CylinderGeometry(.035,.045,.22,6),0xd9d5b1,forestGroup,x+.22,.15,z);}
const altar=mesh(new T.CylinderGeometry(.65,.8,.4,8),0x7c9990,forestGroup,0,.25,-3.7);
forestOrb=mesh(new T.SphereGeometry(.42,32,24),0xa2f6d7,forestGroup,0,1.9,-3.7);forestOrb.material.emissive.set(0x59cfae);forestOrb.material.emissiveIntensity=1.2;
const halo=mesh(new T.TorusGeometry(.68,.02,8,64),0xa4e9cb,forestGroup,0,1.9,-3.7);halo.rotation.x=.8;const orbLight=new T.PointLight(0x87ffce,6,8);orbLight.position.set(0,2,-3);forestGroup.add(orbLight);
for(const o of activeObjects()){const g=createObject(o.id);g.position.set(o.x,.12,o.z);forestGroup.add(g);objectMeshes.set(o.id,g);const marker=mesh(new T.CylinderGeometry(.78,.82,.05,40),0x9daf91,forestGroup,o.x,.07,o.z);marker.material.roughness=1;}
for(let i=0;i<32;i++){const mote=mesh(new T.SphereGeometry(.025,6,6),0xc8f8a6,forestGroup,Math.sin(i*2.4)*5,.6+(i%7)*.32,Math.cos(i*1.7)*4);mote.material=new T.MeshBasicMaterial({color:0xd8ffb7,transparent:true,opacity:.75});mote.userData={baseY:mote.position.y,phase:i*.7};fireflies.push(mote);}
}
function switchLevelWorld(){
roomContent.forEach(x=>x.visible=currentLevel===1);
fireflies=[];forestOrb=null;if(forestGroup){scene.remove(forestGroup);disposeGroup(forestGroup);forestGroup=null;}
objectMeshes.clear();
if(currentLevel===1){for(const o of objects){const g=roomContent.find(x=>x.userData?.id===o.id);if(g)objectMeshes.set(o.id,g);}}
else makeForest();
$('#targetGlyph').textContent=currentLevel===2?'●':'◎';$('#targetName').textContent=currentLevel===2?'구슬의 표면':'도넛의 표면';scene.background=new T.Color(currentLevel===2?0x102f32:0xe9eddf);
scene.fog.color.set(currentLevel===2?0x102f32:0xe9eddf);scene.fog.near=currentLevel===2?20:22;scene.fog.far=currentLevel===2?36:42;
$('#game .mission small').textContent='LEVEL 0'+currentLevel+' / '+levels[currentLevel].place;
$('#game .mission h2').textContent=levels[currentLevel].description;
$('#game .mission p').textContent='물체의 전체 경계 표면을 비교해요. 세 가지를 모으면 성공!';$('.collection p').textContent=currentLevel===2?'잘린 곳 없이 구처럼 바꿀 수 있는 닫힌 표면을 찾으세요.':'자르거나 붙이지 않고 고리로 바꿀 수 있을까요?';
$('#complete .results').textContent=currentLevel===2?'숲 열매 · 마법 돌 · 수정 알 — 모두 구면과 위상동형':'사각 고리 · 길쭉한 고리 · 손잡이 컵 — 모두 도넛과 위상동형';
}
try{if(localStorage.getItem('topology-level2'))$('#level2Status').textContent='클리어 ✓';}catch{}
