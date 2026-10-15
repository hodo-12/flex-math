import {createCharacterRig} from '../character-rig.js';

// Kart-only seated adapter. Shared walking, dress and character-selection code
// stays unchanged. Head, torso and hands always remain inside the same rig root.
export function createDriver(T,parent,config,texture){
  const rig=createCharacterRig(T,parent);rig.setCharacter(config.profile,texture);rig.reset();
  const pelvis=rig.head.parent.parent,coat=rig.head.parent;
  if(config.palette){
    const p=config.palette,materials=new Set();
    rig.root.traverse(o=>{if(o.material&&!Array.isArray(o.material)&&o.material.color)materials.add(o.material);});
    // Recolour this instance only, including the small connecting sleeve caps.
    for(const m of materials){const color=m.color.getHex();if(color===0xc82f4b)m.color.setHex(p.color);else if(color===0xf47383)m.color.setHex(p.light);else if(color===0xf8d492)m.color.setHex(p.trim);else if(color===0x9e2944)m.color.setHex(p.shoe);}
  }
  rig.face.scale.set(config.faceWindow?1.02*config.faceWindow.width/config.faceWindow.height:1.02,1.02,1);
  const skirt=rig.princessDress.skirts[config.profile];skirt.scale.set(.91,.53,1.08);skirt.position.y=-.17*(1-.53);
  // Keep the skirt draped above the chassis instead of dragging a standing gown.
  function pose(state,{time=0,motion=true,winner=false,finished=false}={}){
    const bounce=motion?Math.sin(time*13+state.index)*.018*(state.speed>0?1:0):0;
    const wobble=motion?Math.sin(time*22)*state.bump*.12:0;
    rig.root.position.set(0,-.13+bounce,0);rig.root.scale.setScalar(.86);
    pelvis.position.set(0,.70,0);pelvis.rotation.set(0,0,0);
    coat.position.y=.25;coat.rotation.set(finished&&!winner?.11:-.06,0,-state.lean*.075+wobble);
    rig.head.rotation.set(0,0,0);rig.face.material.rotation=motion?-coat.rotation.z*.25:0;
    for(const leg of rig.legs){leg.hip.rotation.set(-1.22,0,leg.side*.08);leg.knee.rotation.x=1.35;leg.foot.rotation.x=-.13;}
    for(const arm of rig.arms){
      const cheer=finished&&winner;
      const clap=finished&&!winner&&state.rank===3;
      arm.shoulder.rotation.set(cheer?-.3:-.85,0,arm.side*(cheer?2.3:clap?.4:.20));
      arm.elbow.rotation.set(cheer?-.3:clap?-1.4+(motion?Math.sin(time*9)*.16:0):-.65,0,0);
    }
    if(finished&&winner&&motion)rig.root.position.y+=Math.abs(Math.sin(time*4))*.12;
    // Same bounded, waist-anchored cloth deformation as the original costume.
    rig.princessDress.tick({dt:1/30,time,blend:motion&&state.speed>0?.7:0,turn:motion?state.lean:0,jump:finished&&winner?.1:0});
    rig.root.updateMatrixWorld(true);
  }
  return {rig,pose};
}
