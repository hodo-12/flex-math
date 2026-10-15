// Bonus-only pose adapter. The existing rig, dress geometry and portrait files
// are reused without changing any shared character code.
import * as T from '../three.module.js';
const point=new T.Vector3(),foot=new T.Vector3();
const lerp=(a,b,t)=>a+(b-a)*t;
export function poseDancer(rig,pose,{dt,time,cameraPosition,motion=true}){
  const mirror=rig.userDataSide||1;
  const f=pose.floor,beat=pose.beat,step=Math.sin(beat),activity=pose.active;
  const root=rig.root;
  root.position.set(pose.x,.02,pose.z);
  root.rotation.order='YXZ';root.rotation.set(0,0,0);
  rig.tick({dt,time,moving:false,cameraPosition,celebrating:motion&&pose.cheer>.5});
  const coat=rig.head.parent;
  const spin=motion?pose.spin:0;
  const yaw=lerp(-mirror*.22+Math.sin(beat*.5)*activity*.14,spin*mirror,f);
  const roll=mirror*f*1.09;
  root.rotation.set(0,yaw,roll);
  rig.face.material.rotation=roll*.9;
  coat.rotation.set(0,step*.08*activity*(1-f),step*.035*activity*(1-f));
  for(let i=0;i<2;i++){
    const a=rig.arms[i],l=rig.legs[i],s=a.side;
    const phase=step*(i===0?1:-1);
    if(pose.cheer>.5){
      if(!motion){a.shoulder.rotation.set(-.25,0,s*2.25);a.elbow.rotation.set(-.5,0,0);}
      continue;
    }
    // Cross-step / top-rock: opposite arms and knees, with a planted shoe.
    a.shoulder.rotation.set(-.2-phase*.55*activity,0,s*(.27+.45*activity)+step*.32*activity);
    a.elbow.rotation.set(-.35-.45*activity-Math.max(0,phase)*.55*activity,0,0);
    l.hip.rotation.set(-phase*.40*activity,0,s*.05+step*.22*activity);
    l.knee.rotation.set(Math.max(0,phase)*.65*activity,0,0);
    l.foot.rotation.set(-l.hip.rotation.x-l.knee.rotation.x,0,-l.hip.rotation.z);
    const support=s===-mirror;
    a.shoulder.rotation.x=lerp(a.shoulder.rotation.x,support?0:-.25,f);
    a.shoulder.rotation.z=lerp(a.shoulder.rotation.z,support?-roll:mirror*2.25,f);
    a.elbow.rotation.x=lerp(a.elbow.rotation.x,support?0:-.4,f);
    // Both legs point away from the supporting hand; the free leg sweeps.
    l.hip.rotation.set(lerp(l.hip.rotation.x,(i===0?.18:-.25)*(1-pose.freeze),f),0,lerp(l.hip.rotation.z,mirror*(i===0?1.05:1.67)+Math.sin(beat)*.16*(1-pose.freeze),f));
    l.knee.rotation.x=lerp(l.knee.rotation.x,i===0?.45:.18,f);
    l.foot.rotation.set(lerp(l.foot.rotation.x,-.25,f),0,0);
    if(pose.defeat){a.shoulder.rotation.x=.25*pose.defeat;a.shoulder.rotation.z=s*.15;a.elbow.rotation.x=-.15;}
  }
  // Gather the skirt for floorwork around the unchanged waist seam. No new
  // costume or face is created; standing silhouette returns exactly on exit.
  for(const skirt of Object.values(rig.princessDress.skirts)){
    skirt.scale.set(1-.25*f,1-.30*f,1-.25*f);
    skirt.position.y=-.17*(1-skirt.scale.y);
  }
  if(pose.cheer<=.5){
    root.position.y=0;root.updateMatrixWorld(true);
    let minFoot=Infinity;
    for(const l of rig.legs){foot.set(0,-.095,.06);l.foot.localToWorld(foot);minFoot=Math.min(minFoot,foot.y);}
    const standingY=.025-minFoot;
    const support=rig.arms[mirror===1?0:1];
    support.glove.getWorldPosition(point);
    const floorY=.115-point.y;
    root.position.y=Math.max(standingY,floorY,.25*Math.sin(Math.PI*f));
    // Hand stays on one spot while the body rotates around it in the finale.
    root.position.x-=point.x*f;root.position.x+=pose.x*f;
    root.position.z-=point.z*f;root.position.z+=pose.z*f;
    root.position.y+=Math.abs(step)*.035*activity*(1-f);
    root.rotation.x+=pose.defeat*.12;
  }
  root.updateMatrixWorld(true);
}
export function resetDancer(rig){
  rig.reset();rig.face.material.rotation=0;
  for(const skirt of Object.values(rig.princessDress.skirts)){skirt.scale.set(1,1,1);skirt.position.set(0,0,0);}
}
