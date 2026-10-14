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
  const smooth=(current,target,k)=>current+(target-current)*k;
  const ease=(dt,speed)=>1-Math.exp(-dt*speed);
  const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

  // Hips and jacket move separately: slight twisting removes the rigid capsule look.
  const pelvis=new T.Group();pelvis.position.y=.75;root.add(pelvis);
  const waist=add(pelvis,new T.CylinderGeometry(.235,.25,.22,16),trousers,[0,-.02,0]);
  const coat=new T.Group();coat.position.y=1.02;root.add(coat);
  const torso=add(coat,new T.CylinderGeometry(.318,.231,.72,16,1),cloth,[0,.03,0]);
  const chest=orb(coat,.295,cloth,0,.25,0);chest.scale.set(1.09,.61,.92);
  const tee=box(coat,.17,.46,.044,inner,0,.05,.284);
  const zipper=box(coat,.022,.42,.015,metal,.015,.05,.314);
  const collar=add(coat,new T.TorusGeometry(.205,.045,9,32,Math.PI),inner,[0,.44,.105]);
  collar.rotation.z=Math.PI;
  const pocketL=box(coat,.16,.16,.037,seams,-.145,-.13,.25);
  const pocketR=box(coat,.16,.16,.037,seams,.145,-.13,.25);
  const upperTrim=box(coat,.42,.027,.028,seams,0,.34,.225);
  const hood=add(coat,new T.TorusGeometry(.32,.105,12,36),cloth,[0,.53,-.16]);
  const backpack=box(coat,.52,.54,.20,rubber,0,.0,-.30);
  backpack.geometry.translate(0,0,-.02);
  const strapL=box(coat,.085,.58,.042,seams,-.24,.0,.17);
  const strapR=box(coat,.085,.58,.042,seams,.24,.0,.17);

  const arms=[];
  for(const side of [-1,1]){
    const shoulder=new T.Group();shoulder.position.set(side*.348,1.35,0);root.add(shoulder);
    const sleeve=add(shoulder,new T.CapsuleGeometry(.125,.25,6,10),cloth,[side*.025,-.24,0]);
    const cuff=add(shoulder,new T.CylinderGeometry(.115,.11,.105,12),seams,[side*.025,-.44,0]);
    const elbow=new T.Group();elbow.position.set(side*.027,-.46,0);shoulder.add(elbow);
    const forearm=add(elbow,new T.CapsuleGeometry(.091,.22,6,10),cloth,[0,-.19,0]);
    const glove=orb(elbow,.11,skin,0,-.40,.02);glove.scale.set(.82,1.22,.8);
    arms.push({side,shoulder,elbow,sleeve,cuff,forearm,glove});
  }

  const legs=[];
  for(const side of [-1,1]){
    const hip=new T.Group();hip.position.set(side*.165,.69,0);root.add(hip);
    const thigh=add(hip,new T.CapsuleGeometry(.136,.16,6,10),trousers,[0,-.18,0]);
    const knee=new T.Group();knee.position.set(0,-.36,0);hip.add(knee);
    const kneecap=orb(knee,.12,trousers,0,0,.02);
    const shin=add(knee,new T.CapsuleGeometry(.114,.17,6,10),trousers,[0,-.18,0]);
    const foot=new T.Group();foot.position.y=-.36;knee.add(foot);
    const shoe=box(foot,.267,.145,.40,shoes,0,.07,.105);
    const sole=box(foot,.283,.049,.42,rubber,0,.008,.107);
    const toe=box(foot,.23,.024,.13,seams,0,.13,.25);
    legs.push({side,hip,knee,foot});
  }

  // The whole head is parented to root. Billboard faces are never animated separately.
  const head=new T.Group();head.position.set(0,1.65,.005);root.add(head);
  const headBase=orb(head,.414,skin,0,0,-.075);headBase.scale.set(1.02,1.09,.79);
  const neck=add(root,new T.CylinderGeometry(.122,.14,.24,12),skin,[0,1.42,0]);
  const face=new T.Sprite(new T.SpriteMaterial({
    color:0xffffff,transparent:true,alphaTest:.045,depthWrite:false,depthTest:false
  }));
  face.name='original-face-photo';face.scale.set(1.05,1.00,1);
  face.position.set(0,.0,.325);
  face.renderOrder=15;
  head.add(face);

  const themes={
    hood:{jacket:0x576e5b,seam:0xb5c8af,shirt:0xefece2,pants:0x35433e,shoe:0xe4e7e0,skin:0xd7af95,hood:true,pack:true},
    smile:{jacket:0x354950,seam:0xd9a46f,shirt:0xeae0d0,pants:0x283740,shoe:0xe1dcd6,skin:0xd5a68b,hood:false,pack:true},
    cat:{jacket:0x9d5e55,seam:0xf0b9a2,shirt:0xffebdb,pants:0x41505b,shoe:0xffe8dc,skin:0xcca080,hood:true,pack:false},
    cap:{jacket:0x527d82,seam:0xcee4dd,shirt:0xe5e9e4,pants:0x344251,shoe:0xf1eee3,skin:0xd6ac93,hood:false,pack:true}
  };
  let gait=0, blend=0, yaw=0, jumpClock=0, wasCelebrating=false;
  const setCharacter=(id, texture)=>{
    const style=themes[id]||themes.hood;
    cloth.color.setHex(style.jacket);
    seams.color.setHex(style.seam);
    inner.color.setHex(style.shirt);
    trousers.color.setHex(style.pants);
    shoes.color.setHex(style.shoe);
    skin.color.setHex(style.skin);
    rubber.color.setHex(0x32444b);
    hood.visible=style.hood;
    backpack.visible=style.pack;strapL.visible=style.pack;strapR.visible=style.pack;
    if(texture){face.material.map=texture;face.material.needsUpdate=true;}
  };
  const reset=()=>{
    gait=0;blend=0;rotation=0;jumpClock=0;wasCelebrating=false;
    root.position.y=.02;root.rotation.y=0;
    coat.rotation.set(0,0,0);pelvis.rotation.set(0,0,0);
    for(const a of arms){a.shoulder.rotation.set(0,0,0);a.elbow.rotation.set(0,0,0);}
    for(const l of legs){l.hip.rotation.set(0,0,0);l.knee.rotation.set(0,0,0);l.foot.rotation.set(0,0,0);}
    head.rotation.set(0,0,0);
  };
  // We deliberately keep the photo on the same head rig throughout a turn and a jump.
  const tick=({dt,time,moving,targetAngle,cameraPosition,celebrating})=>{
    const t=Math.min(dt,.05);
    blend=smooth(blend,moving?1:0,ease(t,7));
    if(moving)gait+=t*10.2;
    let turn=0;
    if(moving&&Number.isFinite(targetAngle)){
      const delta=angleDiff(targetAngle,root.rotation.y);
      turn=Math.max(-1,Math.min(1,delta));
      root.rotation.y+=Math.max(-t*5.2,Math.min(t*5.2,delta));
    }
    if(celebrating&&!wasCelebrating)jumpClock=0;
    wasCelebrating=celebrating;
    if(celebrating)jumpClock+=t;
    const jump=celebrating?Math.max(0,Math.sin(jumpClock*Math.PI*2.5)):.0;
    const step=Math.sin(gait),opposite=Math.sin(gait+Math.PI);
    const bob=Math.abs(Math.sin(gait))*blend*.038;
    root.position.y=.02+jump*.43+bob+(1-blend)*(celebrating?0:Math.sin(time*1.8)*.009);
    // Weight shift, counter rotation and breath, not a rigid swinging cylinder.
    pelvis.rotation.y=smooth(pelvis.rotation.y,step*blend*.07,ease(t,9));
    coat.rotation.y=smooth(coat.rotation.y,-step*blend*.095,ease(t,9));
    coat.rotation.z=smooth(coat.rotation.z,-turn*.09+step*blend*.03,ease(t,8));
    coat.rotation.x=smooth(coat.rotation.x,blend*.045,ease(t,9));
    for(let i=0;i<2;i++){
      const arm=arms[i],leg=legs[i],phase=i===0?step:opposite;
      const armSwing=-phase*blend*.49;
      arm.shoulder.rotation.x=smooth(arm.shoulder.rotation.x,celebrating?-.37:armSwing,ease(t,12));
      arm.shoulder.rotation.z=smooth(arm.shoulder.rotation.z,celebrating?arm.side*2.24:arm.side*.11,ease(t,11));
      arm.elbow.rotation.x=smooth(arm.elbow.rotation.x,celebrating?-.45:-.14-Math.max(0,phase)*blend*.17,ease(t,12));
      leg.hip.rotation.x=smooth(leg.hip.rotation.x,celebrating?-.31:phase*blend*.53,ease(t,13));
      leg.knee.rotation.x=smooth(leg.knee.rotation.x,celebrating?.56:Math.max(0,-phase)*blend*.7,ease(t,13));
      leg.foot.rotation.x=smooth(leg.foot.rotation.x,celebrating?-.15:-leg.knee.rotation.x*.35+phase*blend*.14,ease(t,10));
    }
    // Face always looks towards the current orbit camera; torso looks towards the walk.
    if(cameraPosition){
      const cameraYaw=Math.atan2(cameraPosition.x-root.position.x,cameraPosition.z-root.position.z);
      const desired=angleDiff(cameraYaw,root.rotation.y);
      head.rotation.y+=angleDiff(desired,head.rotation.y)*ease(t,9);
    }
    head.rotation.z=smooth(head.rotation.z,-step*blend*.027+Math.sin(time*1.5)*.007,ease(t,7));
    head.rotation.x=smooth(head.rotation.x,(celebrating?-.07:.0)+blend*.025,ease(t,8));
  };
  // Init y position for the first render.
  root.position.y=.02;
  return {root,face,head,arms,legs,torso,setCharacter,reset,tick};
}
