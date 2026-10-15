/** Costume-only layer for the existing explorer rig. No face textures or gameplay. */
export const DRESS_STYLES = Object.freeze({
  hood:  { name:'루비 리본 드레스', color:0xc82f4b, light:0xf47383, trim:0xf8d492, shoe:0x9e2944, kind:'royal' },
  smile: { name:'사파이어 레이스 드레스', color:0x4c82cf, light:0xb4d8f3, trim:0xf3f2eb, shoe:0x436ba6, kind:'lace' },
  cat:   { name:'햇살 꽃잎 드레스', color:0xf1bd36, light:0xffdf78, trim:0xfff2cc, shoe:0xc58d31, kind:'petal' },
  cap:   { name:'로즈 프릴 드레스', color:0xe77da7, light:0xf7b5cd, trim:0xffe9ee, shoe:0xc45b88, kind:'ruffle' }
});

export function createPrincessDress(T, {coat, arms, legs}) {
  const waistY=-.17, length=.82, depth=.88;
  const materials={
    satin:new T.MeshStandardMaterial({roughness:.62,metalness:.03,side:T.DoubleSide}),
    overlay:new T.MeshStandardMaterial({roughness:.74,side:T.DoubleSide}),
    trim:new T.MeshStandardMaterial({roughness:.57,metalness:.08,side:T.DoubleSide}),
    glove:new T.MeshStandardMaterial({color:0xfff1e4,roughness:.88}),
  };
  const add=(parent,geometry,material,pos=[0,0,0])=>{
    const m=new T.Mesh(geometry,material);m.position.set(...pos);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  };
  const orb=(parent,r,material,pos,scale=[1,1,1])=>{
    const m=add(parent,new T.SphereGeometry(r,16,12),material,pos);m.scale.set(...scale);return m;
  };
  const pipe=(parent,points,material,r=.009)=>add(parent,new T.TubeGeometry(
    new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,6,false),material);
  const lathe=(parent,profile,mat,z=.75)=>{
    const g=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40);g.scale(1,1,z);
    return add(parent,g,mat);
  };
  const bow=(parent,pos,size=1)=>{
    const b=new T.Group();parent.add(b);b.position.set(...pos);b.scale.setScalar(size);
    for(const side of [-1,1]){
      const loop=orb(b,.065,materials.overlay,[side*.066,0,0],[1.25,.70,.35]);loop.rotation.z=side*.28;
      const tail=orb(b,.06,materials.trim,[side*.035,-.066,-.006],[.36,1.16,.19]);tail.rotation.z=side*.23;
    }
    orb(b,.028,materials.trim,[0,0,.022],[.8,1,1]);return b;
  };
  const bodice=lathe(coat,[[0,waistY],[.205,waistY],[.215,-.08],[.245,.16],[.276,.28],
    [.265,.34],[.19,.40],[.118,.43],[0,.43]],materials.satin);
  bodice.name='princess-bodice';
  const belt=lathe(coat,[[.208,-.19],[.222,-.18],[.223,-.115],[.217,-.11]],materials.trim);
  const neckline=[];
  for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;neckline.push([Math.sin(a)*.14,.414-Math.max(0,Math.cos(a))*.018,Math.cos(a)*.106]);}
  pipe(coat,neckline,materials.trim,.013);
  // Puff sleeves follow the existing shoulder and elbow pivots.
  const puffs=[];
  for(const arm of arms){
    arm.sleeve.visible=false;
    const puff=orb(arm.shoulder,.139,materials.satin,[arm.side*.018,-.09,0],[1.02,1.18,1]);puffs.push(puff);
    const band=add(arm.shoulder,new T.CylinderGeometry(.112,.099,.045,20),materials.trim,[0,-.225,0]);
    pipe(arm.shoulder,[[0,.015,.10],[0,-.085,.145],[0,-.20,.105]],materials.overlay,.009);
    arm.forearm.material=materials.glove;arm.cuff.material=materials.trim;
    const cover=arm.elbow.getObjectByName('elbow-cover');if(cover)cover.material=materials.glove;
    arm.elbow.children.filter(m=>m.geometry?.type==='TubeGeometry').forEach(m=>m.visible=false);
    // The small connecting portion of the upper arm is a matching glove.
    const upper=add(arm.shoulder,new T.CylinderGeometry(.078,.074,.14,16),materials.glove,[0,-.295,0]);
  }
  // Short, rounded storybook Mary Janes with a single strap and tiny ribbon.
  for(const leg of legs){
    const foot=leg.foot;
    // Existing shoe meshes keep the same ankle pivot and ground-contact height.
    const [shoe,sole,heel,...laces]=foot.children;
    shoe.scale.set(.65,.48,1.22);sole.scale.set(.68,.18,1.27);heel.visible=false;
    laces.forEach(m=>m.visible=false);
    pipe(foot,[[-.078,.006,.025],[0,.044,.027],[.078,.006,.025]],materials.trim,.014);
    bow(foot,[0,.035,.15],.35);
  }

  const skirts={};const animated=[];
  // A radial cloth mesh with baked pleats, not a solid cone. Every panel uses
  // the same waist-anchored deformation, including hems, so trim cannot detach.
  function shell(parent,{top=0,bottom=1,extra=0,mat=materials.satin,scallop=0,start=0,arc=Math.PI*2,frill=0}={}){
    const rows=16,cols=64,positions=[],uv=[],indices=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const v=j/rows,a=start+i/cols*arc;
      const t=top+(bottom-top)*v;
      // Narrow edging follows the same entire scalloped hem, rather than
      // starting flat and leaving crescent gaps above the trim.
      const edgeBand=top>0&&(bottom-top)<.10;
      const hemWave=scallop*(edgeBand?1:Math.pow(v,4))*(1-Math.cos(a*6))*.5;
      const y=waistY-length*t+hemWave;
      const fullness=.215+.365*Math.sin(t*Math.PI*.48);
      const pleat=Math.cos(a*12)*.016*Math.sin(t*Math.PI/2);
      const r=fullness+extra+pleat+frill*Math.sin(a*24)*v;
      positions.push(Math.sin(a)*r,y,Math.cos(a)*r*depth);uv.push(i/cols,v);
      if(j<rows&&i<cols){const n=j*(cols+1)+i;indices.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
    const m=add(parent,g,mat);m.name='dress-cloth';
    m.userData.base=new Float32Array(positions);animated.push(m);return m;
  }
  for(const [id,style] of Object.entries(DRESS_STYLES)){
    const group=new T.Group();group.name='dress-'+style.kind;coat.add(group);skirts[id]=group;
    shell(group); // fully closed skirt circumference; no holes at the back
    shell(group,{top:.95,bottom:1.025,extra:.012,mat:materials.trim,frill:.009});
    const detail=new T.Group();group.add(detail);
    if(style.kind==='royal'){
      shell(group,{bottom:.77,extra:.018,start:.58,arc:Math.PI*2-1.16,mat:materials.overlay,scallop:.06});
      shell(group,{top:.74,bottom:.78,extra:.023,start:.58,arc:Math.PI*2-1.16,mat:materials.trim,scallop:.06});
      pipe(detail,[[-.18,.30,.165],[-.13,.10,.186],[0,-.09,.18],[.13,.10,.186],[.18,.30,.165]],materials.trim,.008);
      const jewel=add(detail,new T.OctahedronGeometry(.044),materials.overlay,[0,.28,.204]);jewel.scale.set(.72,1,.4);
      bow(detail,[0,-.145,-.20],1.45);
    }else if(style.kind==='lace'){
      shell(group,{bottom:.69,extra:.020,mat:materials.overlay,scallop:.08});
      shell(group,{top:.65,bottom:.70,extra:.028,mat:materials.trim,scallop:.08,frill:.008});
      for(let i=0;i<9;i++){const a=-1.2+i*.3;orb(detail,.015,materials.trim,[Math.sin(a)*.19,.37,Math.cos(a)*.146]);}
      pipe(detail,[[-.18,.28,.16],[0,.12,.19],[.18,.28,.16]],materials.overlay,.020);
      bow(detail,[.19,-.145,.08],.85);
    }else if(style.kind==='petal'){
      shell(group,{bottom:.62,extra:.025,mat:materials.overlay,scallop:.13});
      shell(group,{top:.57,bottom:.63,extra:.03,mat:materials.trim,scallop:.13});
      for(const x of [-.11,0,.11]){
        const flower=new T.Group();detail.add(flower);flower.position.set(x,-.115,.17);flower.scale.setScalar(x===0?1:.72);
        for(let i=0;i<5;i++)orb(flower,.025,materials.trim,[Math.sin(i*Math.PI*.4)*.029,Math.cos(i*Math.PI*.4)*.029,0],[.72,1,.42]);
        orb(flower,.017,materials.overlay,[0,0,.013]);
      }
      bow(detail,[0,-.14,-.19],1.1);
    }else{
      for(const edge of [.46,.72]){
        shell(group,{top:Math.max(0,edge-.35),bottom:edge,extra:.027,mat:materials.overlay,scallop:.045});
        shell(group,{top:edge-.05,bottom:edge+.015,extra:.035,mat:materials.trim,scallop:.045,frill:.012});
      }
      bow(detail,[0,-.12,.19],1.05);
      const heart=new T.Group();detail.add(heart);heart.position.set(0,.27,.203);
      for(const x of [-.014,.014])orb(heart,.022,materials.trim,[x,.01,0],[1,1,.32]);
      const tip=add(heart,new T.ConeGeometry(.032,.045,3),materials.trim,[0,-.02,0]);tip.rotation.z=Math.PI;tip.scale.z=.3;
    }
  }
  let current='hood',sway=0,flare=0;
  const clamp=T.MathUtils.clamp;
  function setStyle(id){
    current=DRESS_STYLES[id]?id:'hood';const style=DRESS_STYLES[current];
    materials.satin.color.setHex(style.color);materials.overlay.color.setHex(style.light);materials.trim.color.setHex(style.trim);
    for(const [key,g] of Object.entries(skirts))g.visible=key===current;
    puffs.forEach(p=>p.scale.set(current==='cat'?1.12:1.02,current==='smile'?1.03:1.18,current==='cap'?1.10:1));
    reset();
  }
  function deform(){
    for(const m of animated){
      if(!m.parent.visible)continue;
      const a=m.geometry.attributes.position,b=m.userData.base;
      for(let i=0;i<a.count;i++){
        const x=b[i*3],y=b[i*3+1],z=b[i*3+2],w=clamp((waistY-y)/length,0,1.05);
        // Zero displacement at the waist, bounded hem swing and radial breathing.
        const expansion=1+flare*w*w;
        a.setXYZ(i,x*expansion+sway*w*w,y+Math.abs(sway)*.12*w,z*expansion);
      }
      a.needsUpdate=true;m.geometry.computeVertexNormals();
      // Bounds include the small displacement; never frustum-cull a fluttering hem.
      m.geometry.boundingSphere.radius=1.35;
    }
  }
  function reset(){sway=0;flare=0;deform();}
  function tick({dt,time,blend,turn,jump}){
    const k=1-Math.exp(-Math.min(dt,.05)*8);
    const desired=clamp(Math.sin(time*7)*blend*.018-turn*.009,-.035,.035);
    sway+=(desired-sway)*k;flare+=(clamp(jump*.09+blend*.013,0,.045)-flare)*k;
    deform();
  }
  setStyle('hood');
  return {bodice,skirts,materials,tick,setStyle,reset,get style(){return current;}};
}
