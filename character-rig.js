import {createPrincessDress,DRESS_STYLES} from './character-dress.js';
/**
 * Procedural 3D explorer rig. All geometry belongs to one moving root.
 * The face stays as the user's ORIGINAL texture on a camera-facing head rig.
 * No facial image generation, re-drawing, or geometry projection occurs.
 */
export function createCharacterRig(T, scene) {
  const root = new T.Group();
  root.name = 'explorer-rig';
  scene.add(root);

  const cloth = new T.MeshStandardMaterial({ color: 0x556f61, roughness: .93 });
  const seams = new T.MeshStandardMaterial({ color: 0xece7d5, roughness: .88 });
  const inner = new T.MeshStandardMaterial({ color: 0xf0e6d6, roughness: .94 });
  const trousers = new T.MeshStandardMaterial({ color: 0x293c45, roughness: .96 });
  const shoes = new T.MeshStandardMaterial({ color: 0xe6dfc9, roughness: .78 });
  const rubber = new T.MeshStandardMaterial({ color: 0x343f40, roughness: .88 });
  const skin = new T.MeshStandardMaterial({ color: 0xd7aa8d, roughness: .94 });
  const metal = new T.MeshStandardMaterial({ color: 0xc0c7ba, metalness: .33, roughness: .45 });

  const add = (parent, geometry, material, position=[0,0,0]) => {
    const part = new T.Mesh(geometry, material);
    part.position.set(...position);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  };
  const box=(parent,w,h,d,material,x=0,y=0,z=0)=>
    add(parent,new T.BoxGeometry(w,h,d),material,[x,y,z]);
  const orb=(parent,r,material,x=0,y=0,z=0)=>
    add(parent,new T.SphereGeometry(r,14,12),material,[x,y,z]);
  // Elliptical lathed garment panels produce a continuous shoulder/waist silhouette.
  const garment=(parent,profile,material,depth=.72)=>{
    const g=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32);
    g.scale(1,1,depth);return add(parent,g,material);
  };
  const piping=(parent,points,material,r=.008)=>add(parent,
    new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,5,false),material);
  const smooth=(current,target,k)=>current+(target-current)*k;
  const ease=(dt,speed)=>1-Math.exp(-dt*speed);
  const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

  // Keep the existing root / pelvis / coat / shoulder / knee API, but attach
  // joints anatomically: shoulders follow the jacket and hips follow the pelvis.
  const pelvis=new T.Group();pelvis.position.y=.99;root.add(pelvis);
  const waist=garment(pelvis,[[0,-.14],[.23,-.13],[.255,-.04],[.235,.12],[0,.13]],trousers,.78);
  const coat=new T.Group();coat.position.y=.25;pelvis.add(coat);
  const torso=garment(coat,[[0,-.25],[.245,-.25],[.26,-.22],[.245,-.12],
    [.27,.10],[.325,.28],[.32,.34],[.25,.41],[.145,.44],[0,.44]],cloth);
  const hem=garment(coat,[[.247,-.255],[.26,-.25],[.26,-.20],[.248,-.195]],seams);
  const tee=box(coat,.13,.32,.018,inner,0,.22,.204);
  const zipper=box(coat,.013,.57,.016,metal,0,.065,.205);
  const pull=box(coat,.029,.045,.018,metal,.015,.31,.223);
  const collar=garment(coat,[[.14,.39],[.155,.40],[.155,.49],[.14,.49]],seams,.8);
  const hood=orb(coat,.25,cloth,0,.40,-.17);hood.scale.set(1,.68,.65);
  const hoodInset=orb(hood,.19,inner,0,.05,.04);hoodInset.scale.set(.85,.55,.65);
  const pocketL=orb(coat,.12,cloth,-.143,-.085,.163);pocketL.scale.set(1,.72,.26);
  const pocketR=orb(coat,.12,cloth,.143,-.085,.163);pocketR.scale.set(1,.72,.26);
  const pocketSeams=[];
  for(const side of [-1,1]){
    pocketSeams.push(piping(coat,[[side*.07,-.03,.202],[side*.17,-.055,.20],[side*.22,-.11,.17]],seams));
    piping(coat,[[side*.15,.40,.12],[side*.27,.34,.15],[side*.30,.25,.13]],seams,.006);
  }
  const cords=[];
  for(const side of [-1,1])cords.push(piping(coat,[[side*.10,.43,.16],[side*.12,.30,.23],[side*.11,.18,.22]],inner,.009));
  const backpack=orb(coat,.25,rubber,0,.04,-.23);backpack.scale.set(.94,1.22,.52);
  const strapL=box(coat,.037,.49,.028,rubber,-.23,.10,.14);
  const strapR=box(coat,.037,.49,.028,rubber,.23,.10,.14);
  const arms=[];
  for(const side of [-1,1]){
    const shoulder=new T.Group();shoulder.position.set(side*.295,.32,0);coat.add(shoulder);
    const cap=orb(shoulder,.107,cloth,side*.012,-.045,0);cap.scale.set(.94,1.13,.96);
    const sleeve=garment(shoulder,[[0,.015],[.12,0],[.125,-.08],[.103,-.28],[.10,-.34],[0,-.35]],cloth,.93);
    const elbow=new T.Group();elbow.position.set(0,-.34,0);shoulder.add(elbow);
    const elbowCover=orb(elbow,.084,cloth);elbowCover.scale.set(.92,1.1,.86);elbowCover.name='elbow-cover';
    const forearm=garment(elbow,[[.10,.025],[.105,-.04],[.085,-.23],[.077,-.30]],cloth,.95);
    const cuff=add(elbow,new T.CylinderGeometry(.082,.077,.065,20),seams,[0,-.285,0]);
    const glove=orb(elbow,.085,skin,0,-.38,.012);glove.scale.set(.78,1.25,.64);
    const thumb=orb(glove,.034,skin,-side*.05,.01,.03);thumb.scale.set(.7,1,.7);
    piping(elbow,[[0,-.07,.10],[.02,-.10,.105],[.05,-.13,.09]],cloth,.012);
    arms.push({side,shoulder,elbow,sleeve,cuff,forearm,glove});
  }
  const legs=[];
  for(const side of [-1,1]){
    const hip=new T.Group();hip.position.set(side*.145,-.035,0);pelvis.add(hip);
    const thigh=garment(hip,[[0,.06],[.135,.035],[.14,-.08],[.115,-.30],[.106,-.43]],trousers,.93);
    const knee=new T.Group();knee.position.y=-.43;hip.add(knee);
    const kneeCover=orb(knee,.091,trousers);kneeCover.scale.set(.98,1.07,.86);
    const shin=garment(knee,[[.105,.02],[.107,-.05],[.09,-.28],[.085,-.43]],trousers);
    const trouserCuff=add(knee,new T.CylinderGeometry(.087,.087,.045,20),trousers,[0,-.405,0]);
    const foot=new T.Group();foot.position.y=-.43;knee.add(foot);
    const shoe=orb(foot,.15,shoes,0,-.026,.065);shoe.scale.set(.70,.52,1.27);
    const sole=orb(foot,.15,rubber,0,-.067,.065);sole.scale.set(.74,.20,1.33);
    const heel=orb(foot,.10,seams,0,-.015,-.055);heel.scale.set(.9,.65,.65);
    for(let j=0;j<3;j++)piping(foot,[[-.052,.027-j*.005,.055+j*.033],[0,.037-j*.005,.06+j*.033],[.052,.027-j*.005,.055+j*.033]],inner,.006);
    legs.push({side,hip,knee,foot,thigh,shin,trouserCuff,anchor:new T.Vector3(),from:new T.Vector3(),to:new T.Vector3(),lastPhase:0,planted:true});
  }
  // Photo centre is over the neck, not offset in front of a freely spinning head.
  // A camera-facing portrait is an intentional 2.5D convention: no fake side/back face.
  const head=new T.Group();head.position.set(0,.73,0);coat.add(head);
  const neck=add(coat,new T.CylinderGeometry(.095,.115,.20,20),skin,[0,.48,0]);
  const face=new T.Sprite(new T.SpriteMaterial({color:0xffffff,transparent:true,
    alphaTest:.045,depthWrite:false,depthTest:false,toneMapped:false}));
  face.name='original-face-photo';face.scale.set(.78,.78,1);
  face.renderOrder=15;head.add(face);
  const princessDress=createPrincessDress(T,{coat,arms,legs});
  // Replace only the outer costume. Keep original limbs, body and photo hierarchy.
  [waist,torso,hem,tee,zipper,pull,collar,hood,pocketL,pocketR,backpack,strapL,strapR,
    ...pocketSeams,...cords].forEach(part=>part.visible=false);
  const themes={
    hood:{jacket:0x576e5b,seam:0xb5c8af,shirt:0xefece2,pants:0x35433e,shoe:0xe4e7e0,skin:0xd7af95,hood:true,pack:true},
    smile:{jacket:0x354950,seam:0xd9a46f,shirt:0xeae0d0,pants:0x283740,shoe:0xe1dcd6,skin:0xd5a68b,hood:false,pack:true},
    cat:{jacket:0x9d5e55,seam:0xf0b9a2,shirt:0xffebdb,pants:0x41505b,shoe:0xffe8dc,skin:0xcca080,hood:true,pack:false},
    cap:{jacket:0x527d82,seam:0xcee4dd,shirt:0xe5e9e4,pants:0x344251,shoe:0xf1eee3,skin:0xd6ac93,hood:false,pack:true}
  };
  let gait=0, blend=0, jumpClock=0, wasCelebrating=false, seeded=false, stopClock=0, wasMoving=false;
  let bodyWidth=1, legLength=1, bodyHeight=1;
  const previous=new T.Vector3(), local=new T.Vector3(), rest=new T.Vector3();
  const up=new T.Vector3(0,1,0);
  const smoothstep=x=>x*x*(3-2*x);
  const clamp=T.MathUtils.clamp;
  const profiles={hood:[1,1,1],smile:[1.08,1.04,1.02],cat:[1.04,.96,.97],cap:[.94,1.08,1.04]};
  const setCharacter=(id, texture)=>{
    const style=themes[id]||themes.hood;
    const dressStyle=DRESS_STYLES[id]||DRESS_STYLES.hood;
    cloth.color.setHex(dressStyle.color);
    seams.color.setHex(dressStyle.trim);
    inner.color.setHex(dressStyle.trim);
    trousers.color.setHex(0xfff1e5); // stockings under the hem
    shoes.color.setHex(dressStyle.shoe);
    skin.color.setHex(style.skin);
    rubber.color.setHex(0x795d63);
    princessDress.setStyle(id);
    [bodyWidth,legLength,bodyHeight]=profiles[id]||profiles.hood;
    coat.scale.set(bodyWidth,bodyHeight,1);waist.scale.x=bodyWidth;
    for(const leg of legs){leg.hip.position.x=leg.side*.145*bodyWidth;leg.hip.scale.setScalar(legLength);}
    if(texture){face.material.map=texture;face.material.needsUpdate=true;}
    seeded=false;
  };
  const reset=()=>{
    gait=.60;blend=0;jumpClock=0;wasCelebrating=false;seeded=false;stopClock=0;wasMoving=false;
    princessDress.reset();
    root.position.y=.02;root.rotation.set(0,0,0);
    coat.rotation.set(0,0,0);pelvis.rotation.set(0,0,0);
    pelvis.position.set(0,.035+.86*legLength+.095,0);
    coat.position.set(0,.25,0);head.rotation.set(0,0,0);
    for(const a of arms){a.shoulder.rotation.set(0,0,a.side*.22);a.elbow.rotation.set(-.16,0,0);}
    for(const l of legs){l.hip.rotation.set(0,0,0);l.knee.rotation.set(0,0,0);l.foot.rotation.set(0,0,0);l.planted=true;}
  };
  const footRest=(leg,out)=>{
    out.set(leg.side*.145*bodyWidth,0,.035).applyAxisAngle(up,root.rotation.y);
    out.x+=root.position.x;out.z+=root.position.z;out.y=.115;
    return out;
  };
  // Solve two-bone legs from fixed world-space foot contacts. This also cancels
  // pelvis sway and body turns at the ankle instead of dragging planted shoes.
  const solveLeg=(leg,target,pitch)=>{
    pelvis.updateWorldMatrix(true,false);
    local.copy(target);pelvis.worldToLocal(local);local.sub(leg.hip.position);
    local.divideScalar(legLength);
    const lateral=Math.atan2(local.x,-local.y);
    const down=Math.hypot(local.y,local.x),forward=local.z;
    const length=clamp(Math.hypot(down,forward),.08,.8598);
    const knee=2*Math.acos(length/.86);
    leg.hip.rotation.set(-Math.atan2(forward,down)-knee/2,0,lateral);
    leg.knee.rotation.x=knee;
    leg.foot.rotation.set(-leg.hip.rotation.x-knee+pitch,0,-lateral);
    // Shoe yaw follows root; foot contact centre stays planted during the stance.
    leg.planted=leg.planted && length<.8598;
  };
  const tick=({dt,time,moving,targetAngle,cameraPosition,celebrating})=>{
    const t=clamp(dt,0,.05);
    if(!seeded){
      previous.copy(root.position);
      legs.forEach(l=>{footRest(l,l.anchor);l.from.copy(l.anchor);l.to.copy(l.anchor);l.lastPhase=0;});
      seeded=true;
    }
    const distance=Math.hypot(root.position.x-previous.x,root.position.z-previous.z);
    previous.copy(root.position);
    const speed=distance/Math.max(t,.001);
    blend=smooth(blend,moving?clamp(speed/1.65,0,1):0,ease(t,10));
    const oldYaw=root.rotation.y;
    if(moving&&Number.isFinite(targetAngle)){
      const delta=angleDiff(targetAngle,root.rotation.y);
      root.rotation.y+=clamp(delta*ease(t,8),-t*4,t*4);
    }
    const turn=clamp(angleDiff(root.rotation.y,oldYaw)/Math.max(t,.001),-2,2);
    if(moving)gait+=distance/(.78*legLength);
    if(celebrating&&!wasCelebrating){jumpClock=0;}
    if(celebrating)jumpClock+=t;
    const jumpPhase=jumpClock%1.12;
    // Anticipation, ballistic flight, cushioned landing, then recovery.
    const crouch=celebrating&&jumpPhase<.16?-.075*Math.sin(Math.PI*jumpPhase/.16):0;
    const flight=celebrating&&jumpPhase>=.16&&jumpPhase<.78?(jumpPhase-.16)/.62:0;
    const jump=flight?4*.34*flight*(1-flight):0;
    const land=celebrating&&jumpPhase>=.78&&jumpPhase<1.02?-.06*Math.sin(Math.PI*(jumpPhase-.78)/.24):0;
    const step=Math.sin(gait*Math.PI*2);
    root.position.y=.02+jump;
    pelvis.position.y=.035+.86*legLength+.095-.025+crouch+land-Math.abs(step)*blend*.012;
    pelvis.position.x=step*blend*.012;
    pelvis.rotation.y=smooth(pelvis.rotation.y,step*blend*.055+turn*.035,ease(t,9));
    coat.rotation.y=smooth(coat.rotation.y,-step*blend*.075-turn*.045,ease(t,7));
    coat.rotation.z=smooth(coat.rotation.z,-turn*.025+step*blend*.012,ease(t,8));
    coat.rotation.x=smooth(coat.rotation.x,blend*.035-(crouch+land)*.6,ease(t,9));
    coat.position.y=.25+Math.sin(time*1.8)*.004*(1-blend);
    for(let i=0;i<2;i++){
      const a=arms[i],phase=Math.sin((gait+i*.5)*Math.PI*2);
      const cheer=celebrating?smoothstep(clamp(jumpClock/.22,0,1)):0;
      a.shoulder.rotation.x=smooth(a.shoulder.rotation.x,-phase*blend*.38-cheer*.35,ease(t,13));
      a.shoulder.rotation.z=smooth(a.shoulder.rotation.z,a.side*(.22+cheer*1.98),ease(t,12));
      a.elbow.rotation.x=smooth(a.elbow.rotation.x,-.18-Math.max(0,-phase)*blend*.27-cheer*.35,ease(t,12));
    }
    if(wasMoving&&!moving){stopClock=0;legs.forEach(l=>l.from.copy(l.anchor));}
    if(!moving)stopClock+=t;
    root.updateMatrixWorld(true);
    for(let i=0;i<legs.length;i++){
      const l=legs[i],phase=(gait+i*.5)%1;
      let pitch=0;
      if(celebrating){
        footRest(l,l.anchor);l.anchor.y+=jump;
        l.planted=jump===0;
      }else if(wasCelebrating){
        footRest(l,l.anchor);l.planted=true;
      }else if(moving){
        if(phase>=.60){
          if(l.lastPhase<.60){
            l.from.copy(l.anchor);footRest(l,l.to);
            const lead=.20*legLength+Math.min(speed,1.65)*.06;
            l.to.x+=Math.sin(root.rotation.y)*lead;l.to.z+=Math.cos(root.rotation.y)*lead;
          }
          const u=(phase-.60)/.40;
          l.anchor.lerpVectors(l.from,l.to,smoothstep(u));l.anchor.y=.115+Math.sin(Math.PI*u)*.13;
          pitch=-Math.sin(Math.PI*u)*.18;l.planted=false;
        }else{
          if(l.lastPhase>=.60)l.anchor.copy(l.to);
          l.anchor.y=.115;l.planted=true;
        }
      }else{
        // Finish a short recovery step, sequentially, instead of freezing mid-air.
        footRest(l,rest);
        const u=clamp((stopClock-i*.12)/.28,0,1);
        l.anchor.lerpVectors(l.from,rest,smoothstep(u));l.anchor.y+=Math.sin(Math.PI*u)*.06;
        l.planted=u===1;
      }
      solveLeg(l,l.anchor,pitch);l.lastPhase=phase;
    }
    wasMoving=moving;wasCelebrating=celebrating;
    if(cameraPosition){
      // Sprite itself faces camera. Move its entire parent with the torso, never
      // translate the face independently. Neck remains covered at all orbit angles.
      const desired=Math.atan2(cameraPosition.x-root.position.x,cameraPosition.z-root.position.z)-root.rotation.y-pelvis.rotation.y-coat.rotation.y;
      head.rotation.y+=angleDiff(desired,head.rotation.y)*ease(t,9);
    }
    head.rotation.z=smooth(head.rotation.z,-step*blend*.012,ease(t,8));
    princessDress.tick({dt:t,time,blend,turn,jump});
    root.updateMatrixWorld(true);
  };
  root.position.y=.02;
  return {root,face,head,arms,legs,torso,princessDress,setCharacter,reset,tick};
}
