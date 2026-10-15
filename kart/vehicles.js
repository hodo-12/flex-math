// Small original procedural toys. No remote assets, model licences or API keys.
export function createVehicle(T,config){
  const root=new T.Group(),body=new T.Group();root.add(body);root.name='kart-'+config.vehicle;
  const materials={paint:new T.MeshStandardMaterial({color:config.color,roughness:.46,metalness:.08}),light:new T.MeshStandardMaterial({color:config.light,roughness:.53}),gold:new T.MeshStandardMaterial({color:config.trim,roughness:.3,metalness:.32}),rubber:new T.MeshStandardMaterial({color:0x34475b,roughness:.8}),cream:new T.MeshStandardMaterial({color:0xfff7e4,roughness:.6})};
  function add(g,m,pos=[0,0,0],scale=[1,1,1],parent=body){const o=new T.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);parent.add(o);return o;}
  const ball=(r,m,p,s)=>add(new T.SphereGeometry(r,18,12),m,p,s);
  const box=(x,y,z,m,p)=>add(new T.BoxGeometry(x,y,z),m,p);
  const ring=(r,t,m,p)=>add(new T.TorusGeometry(r,t,10,40),m,p);
  const chassis=ball(.6,materials.paint,[0,.42,0],[1,.43,1.35]);
  const wheels=[];
  for(const x of [-.54,.54])for(const z of [-.43,.43]){
    const wheel=new T.Group();root.add(wheel);wheel.position.set(x,.25,z);
    const tyre=add(new T.CylinderGeometry(.24,.24,.17,20),materials.rubber,[0,0,0],[1,1,1],wheel);tyre.rotation.z=Math.PI/2;
    const hub=add(new T.CylinderGeometry(.14,.14,.19,12),materials.gold,[0,0,0],[1,1,1],wheel);hub.rotation.z=Math.PI/2;
    const spoke=add(new T.BoxGeometry(.20,.04,.29),materials.cream,[0,0,0],[1,1,1],wheel);wheels.push(wheel);
  }
  // A recessed seat leaves the bodice, sleeves and original face fully visible.
  const seat=ball(.33,materials.cream,[0,.52,-.14],[1,.5,1.18]);
  if(config.vehicle==='donut'){
    const dough=ring(.49,.18,new T.MeshStandardMaterial({color:0xdfa55d,roughness:.85}),[0,.58,0]);dough.rotation.x=Math.PI/2;dough.scale.y=1.22;
    const icing=ring(.49,.145,materials.light,[0,.66,0]);icing.rotation.x=Math.PI/2;icing.scale.y=1.22;
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2;const sprinkle=box(.09,.025,.025,i%2?materials.paint:materials.gold,[Math.sin(a)*.50,.793,Math.cos(a)*.59]);sprinkle.rotation.y=a*3;}
    ball(.12,materials.paint,[0,.67,.72]);
  }else if(config.vehicle==='cup'){
    const cup=add(new T.CylinderGeometry(.58,.43,.6,40,1,true),materials.light,[0,.62,0]);cup.material.side=T.DoubleSide;
    const rim=ring(.58,.038,materials.gold,[0,.92,0]);rim.rotation.x=Math.PI/2;
    const handle=ring(.29,.075,materials.gold,[.65,.65,0]);handle.rotation.y=Math.PI/2;
    const saucer=add(new T.CylinderGeometry(.72,.66,.08,40),materials.cream,[0,.37,0]);saucer.scale.z=1.13;
    ball(.12,materials.paint,[0,.68,.58],[1,1,.25]);
  }else if(config.vehicle==='crown'){
    box(1.02,.34,1.15,materials.paint,[0,.53,0]);
    for(const x of [-.46,0,.46]){const peak=add(new T.ConeGeometry(.19,.40,4),materials.gold,[x,.83,.56]);peak.rotation.y=Math.PI/4;ball(.055,materials.light,[x,1.06,.56]);}
    for(const x of [-.5,.5])box(.06,.30,.9,materials.gold,[x,.72,-.03]);
    const gem=add(new T.OctahedronGeometry(.13),materials.light,[0,.64,.60]);gem.scale.z=.4;
  }else if(config.vehicle==='ribbon'){
    chassis.scale.set(.85,.42,1.6);
    for(const side of [-1,1]){const loop=ball(.26,materials.light,[side*.30,.78,.58],[1.35,.65,.45]);loop.rotation.z=side*.35;const tail=box(.16,.035,.42,materials.gold,[side*.21,.61,.85]);tail.rotation.y=side*.35;}
    ball(.12,materials.paint,[0,.78,.61]);
    box(1.18,.10,.19,materials.light,[0,.66,-.70]);
  }else if(config.vehicle==='heart'){
    for(const side of [-1,1]){ball(.26,materials.light,[side*.20,.66,.58],[1,1,.35]);}
    const tip=add(new T.ConeGeometry(.37,.48,3),materials.light,[0,.44,.58]);tip.rotation.z=Math.PI;tip.scale.z=.24;
    const arch=ring(.60,.035,materials.gold,[0,.75,-.39]);arch.scale.y=1.25;
    // A little clover on the carriage, clear of the portrait at head height.
    for(const [x,y] of [[-.07,0],[.07,0],[0,.09]])ball(.075,materials.paint,[x,.98+y,-.41],[1,1,.35]);
  }else throw new Error('Unknown kart type: '+config.vehicle);
  const steering=ring(.18,.025,materials.rubber,[0,.96,.33]);steering.rotation.x=-.55;
  const shadow=new T.Mesh(new T.CircleGeometry(.82,28),new T.MeshBasicMaterial({color:0x3c696b,transparent:true,opacity:.17,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.scale.y=1.23;root.add(shadow);
  const seatRoot=new T.Group();seatRoot.position.set(0,.43,-.18);body.add(seatRoot);
  const exhaust=ball(.16,materials.light,[0,.30,-.92],[.7,.6,1.8]);exhaust.visible=false;
  function animate(state,time,motion){
    body.rotation.z=motion?-state.lean*.045+Math.sin(time*23)*state.bump*.08:0;
    body.rotation.x=motion?Math.sin(time*11+state.index)*.012*state.speed:0;
    for(const wheel of wheels)wheel.rotation.x=-state.distance/.24;
    steering.rotation.z=-state.lean*.3;exhaust.visible=state.boost>0&&!state.finished;
    exhaust.scale.z=motion?1.8+Math.sin(time*30)*.3:1.8;
  }
  return {root,body,seatRoot,animate};
}
